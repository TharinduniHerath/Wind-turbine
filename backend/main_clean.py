from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from noise.mainNoise import router as noise_router
from noise.simulator.websocket_manager import WebSocketManager
from maintenance.main_maintenance import router as maintenance_router

router = APIRouter()
csv_path = "noise/noiseData/wind_data.csv"  # adjust relative path from backend/
manager = WebSocketManager(csv_path=csv_path, delay=30)

app = FastAPI(
    title="Wind Turbine ML API",
    description="API for wind turbine failure prediction and maintenance analytics",
    version="1.0.0"
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
        "version": "1.0.0",
        "modules": ["maintenance", "noise"]
    }

#####################################MAINTENANCE MODULE ############################
app.include_router(maintenance_router, prefix="/maintenance")

#####################################NOISE BACKEND ############################
app.include_router(noise_router, prefix="/noise")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
