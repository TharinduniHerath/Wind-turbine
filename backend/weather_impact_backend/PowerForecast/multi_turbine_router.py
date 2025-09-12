from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import warnings
import logging
from typing import Dict, List, Optional
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Global variables
model_package = None

class WeatherInput(BaseModel):
    WS10M: float  # Wind speed at 10m (m/s)
    WD50M: float  # Wind direction at 50m (degrees)
    WS50M: float  # Wind speed at 50m (m/s)
    RH2M: float   # Relative humidity (%)
    PRECTOTCORR: float  # Precipitation (mm)
    PS: float     # Surface pressure (kPa)
    T2M: float    # Temperature (°C)

class TurbineControlPrediction(BaseModel):
    turbine_id: str
    weather_conditions: WeatherInput
    predictions: Dict[str, float]
    status: str
    explanation: str
    confidence: float

class MultiTurbineRequest(BaseModel):
    weather_conditions: WeatherInput
    turbine_ids: Optional[List[str]] = None  # If None, predict for all turbines

def load_corrected_model():
    """Load the corrected multi-turbine model"""
    global model_package
    
    try:
        model_package = joblib.load('weather_impact_backend/PowerForecast/corrected_multi_turbine_model.pkl')
        logger.info("Corrected multi-turbine model loaded successfully")
        
        # Validate model package structure
        required_keys = ['model', 'label_encoder', 'feature_names', 'target_names', 'turbine_list']
        for key in required_keys:
            if key not in model_package:
                logger.error(f"Missing required key in model package: {key}")
                return False
        
        logger.info(f"Model supports turbines: {model_package['turbine_list']}")
        logger.info(f"Features: {model_package['feature_names']}")
        logger.info(f"Targets: {model_package['target_names']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load corrected multi-turbine model: {e}")
        return False

def validate_weather_input(weather: WeatherInput) -> Dict[str, str]:
    """Validate weather input parameters"""
    errors = []
    
    # Wind speed validation
    if not (0 <= weather.WS10M <= 30):
        errors.append("WS10M must be between 0-30 m/s")
    if not (0 <= weather.WS50M <= 40):
        errors.append("WS50M must be between 0-40 m/s")
    
    # Wind direction validation
    if not (0 <= weather.WD50M <= 360):
        errors.append("WD50M must be between 0-360 degrees")
    
    # Temperature validation
    if not (10 <= weather.T2M <= 50):
        errors.append("T2M must be between 10-50°C")
    
    # Humidity validation
    if not (0 <= weather.RH2M <= 100):
        errors.append("RH2M must be between 0-100%")
    
    # Pressure validation
    if not (95 <= weather.PS <= 105):
        errors.append("PS must be between 95-105 kPa")
    
    # Precipitation validation
    if not (0 <= weather.PRECTOTCORR <= 200):
        errors.append("PRECTOTCORR must be between 0-200 mm")
    
    return errors

def create_model_features(weather: WeatherInput, turbine_id: str) -> np.ndarray:
    """Create feature array for model prediction"""
    try:
        # Get turbine encoding
        if model_package and 'label_encoder' in model_package:
            try:
                turbine_encoded = model_package['label_encoder'].transform([turbine_id])[0]
            except ValueError:
                # Fallback if turbine not in encoder
                turbine_num = int(turbine_id.replace('WTG', '').lstrip('0') or '1') - 1
                turbine_encoded = min(turbine_num, 9)  # Cap at 9 for 10 turbines
        else:
            turbine_num = int(turbine_id.replace('WTG', '').lstrip('0') or '1') - 1
            turbine_encoded = min(turbine_num, 9)
        
        # Create feature array in exact order expected by model
        feature_array = np.array([
            weather.WS10M,
            weather.WD50M,
            weather.WS50M,
            weather.RH2M,
            weather.PRECTOTCORR,
            weather.PS,
            weather.T2M,
            turbine_encoded
        ])
        
        return feature_array.reshape(1, -1)
        
    except Exception as e:
        logger.error(f"Error creating features for {turbine_id}: {e}")
        raise

def predict_turbine_control(weather: WeatherInput, turbine_id: str) -> Dict[str, float]:
    """Predict optimal control parameters for a turbine"""
    try:
        if model_package is None:
            raise ValueError("Model not loaded")
        
        # Create features
        features = create_model_features(weather, turbine_id)
        
        # Make prediction
        model = model_package['model']
        predictions = model.predict(features)[0]
        
        # Map predictions to target names
        target_names = model_package['target_names']
        result = {}
        
        for i, target in enumerate(target_names):
            if i < len(predictions):
                value = float(predictions[i])
                
                # Apply realistic bounds
                if 'Active_Power' in target:
                    result['active_power'] = max(0, min(value, 3500))
                elif 'Pitch_Angle' in target:
                    result['pitch_angle'] = max(-5, min(value, 90))
                elif 'Nacelle_Position' in target:
                    result['nacelle_position'] = value % 360  # Ensure 0-360 range
                elif 'Rotor_Speed' in target:
                    result['rotor_speed'] = max(0, min(value, 15))
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error for {turbine_id}: {e}")
        raise

def determine_operational_status(predictions: Dict[str, float], weather: WeatherInput) -> tuple:
    """Determine operational status and explanation"""
    try:
        active_power = predictions.get('active_power', 0)
        wind_speed = weather.WS10M
        
        # High wind shutdown check - Safety first
        if wind_speed > 25:
            return "SHUTDOWN", "High wind speed - safety shutdown (>25 m/s)"
        
        # Low wind shutdown check
        if wind_speed < 3:
            return "SHUTDOWN", "Insufficient wind for operation (<3 m/s)"
        
        # Power-based status determination
        if active_power < 50:
            return "MAINTENANCE", "Low power output - check turbine"
        elif active_power > 2500:
            return "OPTIMAL", "High power generation"
        elif active_power > 1500:
            return "GOOD", "Normal power generation"
        elif active_power > 500:
            return "MODERATE", "Moderate power generation"
        else:
            return "LOW", "Low power generation"
            
    except Exception as e:
        logger.error(f"Error determining status: {e}")
        return "UNKNOWN", "Unable to determine status"

def calculate_confidence(weather: WeatherInput, predictions: Dict[str, float]) -> float:
    """Calculate prediction confidence based on weather conditions"""
    try:
        confidence = 1.0
        
        # Reduce confidence for extreme conditions
        if weather.WS10M < 2 or weather.WS10M > 20:
            confidence *= 0.8
        
        if weather.T2M < 15 or weather.T2M > 40:
            confidence *= 0.9
        
        if weather.PRECTOTCORR > 10:
            confidence *= 0.85
        
        # Reduce confidence for very low or high predictions
        active_power = predictions.get('active_power', 0)
        if active_power < 100 or active_power > 3000:
            confidence *= 0.9
        
        return round(min(max(confidence, 0.6), 1.0), 3)
        
    except Exception:
        return 0.8

# Initialize model on import
model_loaded = load_corrected_model()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model_package is not None else "unhealthy",
        "service": "Multi-Turbine Control Prediction",
        "model_loaded": model_package is not None,
        "available_turbines": model_package['turbine_list'] if model_package else [],
        "model_type": "Corrected Multi-Output RandomForest"
    }

@router.post("/predict")
async def predict_single_turbine(
    turbine_id: str,
    weather: WeatherInput
):
    """Predict optimal control parameters for a single turbine"""
    try:
        if model_package is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Validate turbine ID
        available_turbines = model_package['turbine_list']
        if turbine_id not in available_turbines:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid turbine ID. Available: {available_turbines}"
            )
        
        # Validate weather input
        errors = validate_weather_input(weather)
        if errors:
            raise HTTPException(status_code=400, detail=f"Invalid weather data: {errors}")
        
        # Check for shutdown conditions BEFORE making predictions
        wind_speed = weather.WS50M
        if wind_speed < 3:
            return {
                "turbine_id": turbine_id,
                "weather_conditions": weather.dict(),
                "predictions": {
                    "active_power": 0,
                    "pitch_angle": 90,  # Feathered position
                    "nacelle_position": 0,
                    "rotor_speed": 0
                },
                "status": "SHUTDOWN",
                "explanation": "Insufficient wind for operation (<3 m/s) - Turbine automatically shut down for safety",
                "confidence": 1.0,
                "error": True,
                "error_message": "Wind speed too low for safe operation",
                "timestamp": datetime.now().isoformat()
            }

        if wind_speed > 25:
            return {
                "turbine_id": turbine_id,
                "weather_conditions": weather.dict(),
                "predictions": {
                    "active_power": 0,
                    "pitch_angle": 90,  # Feathered position
                    "nacelle_position": 0,
                    "rotor_speed": 0
                },
                "status": "SHUTDOWN", 
                "explanation": "High wind speed safety shutdown (>25 m/s) - Turbine automatically shut down to prevent damage",
                "confidence": 1.0,
                "error": True,
                "error_message": "Wind speed too high for safe operation",
                "timestamp": datetime.now().isoformat()
            }

        # Make prediction
        predictions = predict_turbine_control(weather, turbine_id)
        
        # Determine status
        status, explanation = determine_operational_status(predictions, weather)
        
        # Calculate confidence
        confidence = calculate_confidence(weather, predictions)
        
        return {
            "turbine_id": turbine_id,
            "weather_conditions": weather.dict(),
            "predictions": predictions,
            "status": status,
            "explanation": explanation,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in single turbine prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/predict-multiple")
async def predict_multiple_turbines(request: MultiTurbineRequest):
    """Predict optimal control parameters for multiple turbines"""
    try:
        if model_package is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Validate weather input
        errors = validate_weather_input(request.weather_conditions)
        if errors:
            raise HTTPException(status_code=400, detail=f"Invalid weather data: {errors}")
        
        # Determine turbines to predict
        if request.turbine_ids is None:
            turbine_ids = model_package['turbine_list']
        else:
            available_turbines = model_package['turbine_list']
            invalid_turbines = [tid for tid in request.turbine_ids if tid not in available_turbines]
            if invalid_turbines:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid turbine IDs: {invalid_turbines}. Available: {available_turbines}"
                )
            turbine_ids = request.turbine_ids
        
        # Make predictions for all turbines
        results = []
        total_power = 0
        status_counts = {"OPTIMAL": 0, "GOOD": 0, "MODERATE": 0, "LOW": 0, "SHUTDOWN": 0, "MAINTENANCE": 0}
        
        for turbine_id in turbine_ids:
            try:
                wind_speed = request.weather_conditions.WS50M
                # Check shutdown conditions first
                if wind_speed < 3:
                    result = {
                        "turbine_id": turbine_id,
                        "predictions": {
                            "active_power": 0,
                            "pitch_angle": 90,
                            "nacelle_position": 0,
                            "rotor_speed": 3
                        },
                        "status": "SHUTDOWN",
                        "explanation": "Insufficient wind for operation (<3 m/s)",
                        "confidence": 1.0,
                        "error": True,
                        "error_message": "Wind speed too low"
                    }
                elif wind_speed > 25:
                    result = {
                        "turbine_id": turbine_id,
                        "predictions": {
                            "active_power": 0,
                            "pitch_angle": 90,
                            "nacelle_position": 0,
                            "rotor_speed": 0
                        },
                        "status": "SHUTDOWN",
                        "explanation": "High wind speed safety shutdown (>25 m/s)",
                        "confidence": 1.0,
                        "error": True,
                        "error_message": "Wind speed too high"
                    }
                else:

                    predictions = predict_turbine_control(request.weather_conditions, turbine_id)
                    status, explanation = determine_operational_status(predictions, request.weather_conditions)
                    confidence = calculate_confidence(request.weather_conditions, predictions)
                    
                    result = {
                        "turbine_id": turbine_id,
                        "predictions": predictions,
                        "status": status,
                        "explanation": explanation,
                        "confidence": confidence
                    }
                
                results.append(result)
                total_power += predictions.get('active_power', 0)
                status_counts[status] = status_counts.get(status, 0) + 1
                
            except Exception as e:
                logger.error(f"Error predicting for {turbine_id}: {e}")
                results.append({
                    "turbine_id": turbine_id,
                    "predictions": {},
                    "status": "ERROR",
                    "explanation": f"Prediction failed: {str(e)}",
                    "confidence": 0.0
                })
        
        # Calculate summary statistics
        avg_confidence = sum(r['confidence'] for r in results if r['confidence'] > 0) / len(results)
        
        return {
            "weather_conditions": request.weather_conditions.dict(),
            "turbine_count": len(results),
            "total_predicted_power": round(total_power, 1),
            "average_power_per_turbine": round(total_power / len(results), 1),
            "average_confidence": round(avg_confidence, 3),
            "status_summary": status_counts,
            "turbine_predictions": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in multiple turbine prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Multi-turbine prediction failed: {str(e)}")

@router.get("/turbines")
async def list_available_turbines():
    """List all available turbines"""
    if model_package is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "available_turbines": model_package['turbine_list'],
        "turbine_count": len(model_package['turbine_list']),
        "model_features": model_package['feature_names'],
        "prediction_targets": model_package['target_names']
    }

@router.get("/model-info")
async def get_model_info():
    """Get detailed model information"""
    if model_package is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": "Multi-Output RandomForest",
        "temporal_resolution": "10-minute intervals",
        "weather_interpolation": "Linear interpolation applied",
        "training_data": {
            "year": "2024",
            "turbine_count": len(model_package['turbine_list']),
            "records_per_turbine": "~52,420"
        },
        "features": model_package['feature_names'],
        "targets": model_package['target_names'],
        "supported_turbines": model_package['turbine_list'],
        "performance_note": "Model trained with realistic weather transitions (R² = 0.786)"
    }

@router.post("/validate-weather")
async def validate_weather_data(weather: WeatherInput):
    """Validate weather input parameters"""
    errors = validate_weather_input(weather)
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "weather_data": weather.dict(),
        "validation_rules": {
            "WS10M": "0-30 m/s",
            "WS50M": "0-40 m/s", 
            "WD50M": "0-360 degrees",
            "T2M": "10-50°C",
            "RH2M": "0-100%",
            "PS": "95-105 kPa",
            "PRECTOTCORR": "0-200 mm"
        }
    }