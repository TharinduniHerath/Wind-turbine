from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import asyncio
from contextlib import asynccontextmanager
import logging

# Import your enhanced forecasting pipeline
# from enhanced_forecasting_pipeline import EnhancedPowerLossForecastingPipeline, load_real_weather_forecast

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables to store the pipeline and cached predictions
pipeline = None
cached_predictions = None
cached_forecast_summary = None
last_update = None
CACHE_DURATION_MINUTES = 30  # Cache predictions for 30 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the ML pipeline on startup"""
    global pipeline
    logger.info("Initializing Enhanced Power Loss Forecasting Pipeline...")
    
    try:
        pipeline = EnhancedPowerLossForecastingPipeline(
            model_path="ml_training_data/hourly_power_loss_model_20250814_234606.pkl",
            scaler_path="ml_training_data/hourly_feature_scaler_20250814_234606.pkl",
            corrections_path="data/turbine_wind_corrections.json"
        )
        logger.info("✓ Pipeline initialized successfully")
        
        # Generate initial predictions
        await update_predictions()
        
    except Exception as e:
        logger.error(f"✗ Error initializing pipeline: {str(e)}")
        
    yield
    
    logger.info("Shutting down...")

# Initialize FastAPI app
app = FastAPI(
    title="Wind Farm Power Loss Forecasting API",
    description="Enhanced power loss predictions with turbine-specific wind direction corrections",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API responses
class HourlyForecast(BaseModel):
    time: str
    hour_display: str
    power_loss_kw: float
    wind_direction_from: float
    wind_direction_to: float

class PowerLossSummary(BaseModel):
    next_6h_kw: float
    next_12h_kw: float
    next_24h_kw: float

class ImpactAnalysis(BaseModel):
    avg_repositioning_time: str
    direction_changes: str
    revenue_impact: str

class SystemStatus(BaseModel):
    status: str
    last_update: str
    predictions_available: bool
    turbines_active: int
    model_performance: str

async def update_predictions():
    """Update predictions from weather forecast data"""
    global cached_predictions, cached_forecast_summary, last_update
    
    try:
        logger.info("Updating power loss predictions...")
        
        # Load latest weather forecast
        forecast_df = load_real_weather_forecast("data/weather_forcast_2025_processed.csv")
        
        # Generate predictions for all turbines
        all_predictions, timestamps, correction_summary = pipeline.predict_all_turbines(forecast_df)
        
        # Create forecast summary
        forecast_summary = pipeline.create_enhanced_forecast_summary(
            all_predictions, timestamps, correction_summary
        )
        
        # Cache the results
        cached_predictions = all_predictions
        cached_forecast_summary = forecast_summary
        last_update = datetime.now()
        
        logger.info(f"✓ Predictions updated successfully at {last_update}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Error updating predictions: {str(e)}")
        return False

def should_update_cache():
    """Check if cache should be updated"""
    if last_update is None:
        return True
    
    time_since_update = datetime.now() - last_update
    return time_since_update.total_seconds() > (CACHE_DURATION_MINUTES * 60)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "pipeline_loaded": pipeline is not None,
        "cache_age_minutes": (datetime.now() - last_update).total_seconds() / 60 if last_update else None
    }

@app.get("/api/system/status", response_model=SystemStatus)
async def get_system_status():
    """Get system status information"""
    if cached_forecast_summary is None or cached_forecast_summary['daily_summary'].empty:
        return SystemStatus(
            status="initializing",
            last_update="Not available",
            predictions_available=False,
            turbines_active=0,
            model_performance="Loading..."
        )
    
    return SystemStatus(
        status="operational",
        last_update=last_update.strftime("%Y-%m-%d %H:%M:%S") if last_update else "Unknown",
        predictions_available=True,
        turbines_active=len(cached_predictions) if cached_predictions else 0,
        model_performance="R² = 0.800"  # From your model training results
    )

@app.get("/api/forecast/next-6-hours", response_model=List[HourlyForecast])
async def get_6_hour_forecast():
    """Get next 6 hours power loss forecast"""
    
    # Update cache if needed
    if should_update_cache():
        await update_predictions()
    
    if cached_forecast_summary is None or cached_forecast_summary['hourly_predictions'].empty:
        raise HTTPException(status_code=503, detail="Predictions not available")
    
    try:
        hourly_df = cached_forecast_summary['hourly_predictions'].head(6)
        
        # Load weather forecast for wind direction data
        forecast_df = load_real_weather_forecast("weather_forcast_2025_processed.csv")
        weather_6h = forecast_df.head(6)
        
        forecasts = []
        for i, (idx, row) in enumerate(hourly_df.iterrows()):
            # Get wind direction transitions
            current_wind = weather_6h.iloc[i]['wind_direction'] if i < len(weather_6h) else 0
            next_wind = weather_6h.iloc[min(i+1, len(weather_6h)-1)]['wind_direction'] if i+1 < len(weather_6h) else current_wind
            
            forecasts.append(HourlyForecast(
                time=idx.strftime("%H:%M"),
                hour_display=f"{idx.strftime('%H:%M')} {idx.strftime('%A')[:3]}",
                power_loss_kw=round(row['Total_WindFarm_Loss_kWh'], 0),
                wind_direction_from=round(current_wind, 0),
                wind_direction_to=round(next_wind, 0)
            ))
        
        return forecasts
        
    except Exception as e:
        logger.error(f"Error generating 6-hour forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating forecast")

@app.get("/api/summary/power-loss", response_model=PowerLossSummary)
async def get_power_loss_summary():
    """Get power loss summary for different time horizons"""
    
    # Update cache if needed
    if should_update_cache():
        await update_predictions()
    
    if cached_forecast_summary is None or cached_forecast_summary['hourly_predictions'].empty:
        raise HTTPException(status_code=503, detail="Predictions not available")
    
    try:
        hourly_df = cached_forecast_summary['hourly_predictions']
        
        # Calculate totals for different periods
        next_6h = hourly_df['Total_WindFarm_Loss_kWh'].head(6).sum()
        next_12h = hourly_df['Total_WindFarm_Loss_kWh'].head(12).sum()
        next_24h = hourly_df['Total_WindFarm_Loss_kWh'].head(24).sum()
        
        return PowerLossSummary(
            next_6h_kw=round(next_6h, 0),
            next_12h_kw=round(next_12h, 0),
            next_24h_kw=round(next_24h, 0)
        )
        
    except Exception as e:
        logger.error(f"Error generating power loss summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating summary")

@app.get("/api/analysis/impact", response_model=ImpactAnalysis)
async def get_impact_analysis():
    """Get operational impact analysis"""
    
    # Update cache if needed
    if should_update_cache():
        await update_predictions()
    
    if cached_forecast_summary is None or cached_forecast_summary['hourly_predictions'].empty:
        raise HTTPException(status_code=503, detail="Predictions not available")
    
    try:
        hourly_df = cached_forecast_summary['hourly_predictions'].head(24)  # Next 24 hours
        
        # Calculate metrics based on your research findings
        hours_with_loss = (hourly_df['Total_WindFarm_Loss_kWh'] > 0).sum()
        total_loss_24h = hourly_df['Total_WindFarm_Loss_kWh'].sum()
        
        # Estimate repositioning events (simplified)
        estimated_events = max(1, int(hours_with_loss * 0.7))  # Conservative estimate
        
        # Calculate revenue impact (assuming $50/MWh electricity price)
        revenue_impact = total_loss_24h * 0.001 * 50  # Convert kWh to MWh, multiply by price
        
        return ImpactAnalysis(
            avg_repositioning_time="8.5 min",  # Based on research average
            direction_changes=f"{estimated_events} events",
            revenue_impact=f"-${revenue_impact:.2f}"
        )
        
    except Exception as e:
        logger.error(f"Error generating impact analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating analysis")

@app.get("/api/forecast/48-hours")
async def get_48_hour_forecast():
    """Get detailed 48-hour forecast for download"""
    
    # Update cache if needed
    if should_update_cache():
        await update_predictions()
    
    if cached_forecast_summary is None or cached_forecast_summary['hourly_predictions'].empty:
        raise HTTPException(status_code=503, detail="Predictions not available")
    
    try:
        # Get 48 hours of predictions
        forecast_48h = load_real_weather_forecast("weather_forcast_2025_processed.csv").head(48)
        predictions_48h, timestamps_48h, corrections = pipeline.predict_all_turbines(forecast_48h)
        
        # Format for download
        detailed_forecast = []
        for i, timestamp in enumerate(timestamps_48h):
            total_loss = sum(pred[i] for pred in predictions_48h.values())
            
            detailed_forecast.append({
                "timestamp": timestamp.isoformat(),
                "date": timestamp.strftime("%Y-%m-%d"),
                "time": timestamp.strftime("%H:%M"),
                "day": timestamp.strftime("%A"),
                "total_power_loss_kw": round(total_loss, 2),
                "wind_direction": round(forecast_48h.iloc[i]['wind_direction'], 1),
                "wind_speed": round(forecast_48h.iloc[i]['wind_speed'], 1),
                "turbine_predictions": {
                    turbine: round(pred[i], 2) for turbine, pred in predictions_48h.items()
                }
            })
        
        return {
            "forecast_period": "48_hours",
            "generated_at": datetime.now().isoformat(),
            "total_turbines": len(predictions_48h),
            "wind_corrections_applied": len(corrections),
            "predictions": detailed_forecast
        }
        
    except Exception as e:
        logger.error(f"Error generating 48-hour forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating forecast")

@app.post("/api/forecast/refresh")
async def refresh_predictions(background_tasks: BackgroundTasks):
    """Manually refresh predictions"""
    
    # Update predictions in background
    background_tasks.add_task(update_predictions)
    
    return {
        "message": "Predictions refresh initiated",
        "status": "processing",
        "estimated_completion": "30 seconds"
    }

@app.get("/api/corrections/summary")
async def get_wind_corrections_summary():
    """Get summary of applied wind direction corrections"""
    
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not initialized")
    
    corrections = pipeline.wind_corrections
    
    if not corrections:
        return {"message": "No wind corrections available"}
    
    # Create summary
    correction_values = [data['offset_degrees'] for data in corrections.values()]
    
    return {
        "total_turbines": len(corrections),
        "largest_correction": max(abs(c) for c in correction_values),
        "average_correction": np.mean([abs(c) for c in correction_values]),
        "corrections": {
            turbine: {
                "offset_degrees": data['offset_degrees'],
                "confidence": data.get('confidence', 'medium')
            }
            for turbine, data in corrections.items()
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    print("Starting Wind Farm Power Loss Forecasting API...")
    print("API will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )