from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
from noise.simulator.websocket_manager import WebSocketManager
from noise.predict.prediction import predict_optimal_pitch_xgb
from noise.weatherAPI.weatherPrediction import fetch_5day_forecast
from noise.weatherAPI.weatherPredictionFuture import predict_future_weather 

router = APIRouter()

# Initialize manager
csv_path = r"noise\noiseData\wind_data.csv"

manager = WebSocketManager(csv_path=csv_path, delay=30)

# Background task
@router.on_event("startup")
async def start_broadcast():
    asyncio.create_task(manager.producer_loop())

# WebSocket endpoint
@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Prediction endpoint
class PredictionRequest(BaseModel):
    wind_speed: float
    wind_direction: float
    target_noise_level: float = 35.0

@router.post("/predict")
def predict(request: PredictionRequest):
    return predict_optimal_pitch_xgb(
        wind_speed=request.wind_speed,
        wind_direction=request.wind_direction,
        target_noise_level=request.target_noise_level
    )
@router.get("/predict-future")
def predict_future(lat: float, lon: float, target_noise: float = 35.0):
    """
    Predict turbine performance for the next 5 days using weather forecast.
    Example: /predict-future?lat=6.9271&lon=79.8612&target_noise=35
    """
    predictions = predict_future_weather(lat, lon, target_noise_level=target_noise)
    return predictions