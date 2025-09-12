from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from noise.mainNoise import router as noise_router
from noise.simulator.websocket_manager import WebSocketManager
from maintenance.mainMaintenance import router as maintenance_router

# Import your weather routers
from weather_impact_backend.WindSpeed.wind_speed_router import router as wind_speed_router
from weather_impact_backend.WindDirection.wind_direction_router import router as wind_direction_router
from weather_impact_backend.Lightning.lightning_router import router as lightning_router
from weather_impact_backend.PowerForecast.powerforcast_router import router as real_time_router       
from weather_impact_backend.PowerForecast.multi_turbine_router import router as multi_turbine_router       


router = APIRouter()
csv_path = "noise/noiseData/wind_data.csv"  # adjust relative path from backend/
manager = WebSocketManager(csv_path=csv_path, delay=30)

app = FastAPI(
    title="Wind Turbine ML API",
    description="API for wind turbine failure prediction, maintenance analytics, and weather impact analysis",
    version="2.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Wind Turbine ML API",
        "status": "running",
        "version": "2.0.0",
        "modules": ["maintenance", "noise", "wind_speed", "wind_direction", "lightning", "real_time", "multi_turbine"]
    }

@app.get("/health")
async def overall_health():
    """Overall system health check"""
    return {
        "status": "healthy",
        "services": {
            "maintenance": "operational",
            "noise": "operational", 
            "wind_speed": "operational",
            "wind_direction": "operational",
            "lightning": "operational",
            "real_time": "operational",
            "multi_turbine": "operational"
        },
        "total_apis": 6,
        "version": "2.0.0"
    }

#####################################MAINTENANCE MODULE ############################
# Include with prefix for organized access
app.include_router(maintenance_router, prefix="/maintenance")
# Also include without prefix for backward compatibility
app.include_router(maintenance_router)

#####################################NOISE BACKEND ############################
app.include_router(noise_router, prefix="/noise")

#####################################WEATHER IMPACT APIS ############################
# Wind Speed Power Loss API
app.include_router(wind_speed_router, prefix="/api/wind-speed")

# Wind Direction Power Loss API  
app.include_router(wind_direction_router, prefix="/api/wind-direction")

# Lightning Risk Assessment API
app.include_router(lightning_router, prefix="/api/lightning")

# Real-Time Turbine Monitoring API
app.include_router(real_time_router, prefix="/api/real-time")

app.include_router(multi_turbine_router, prefix="/api/multi-turbine")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)