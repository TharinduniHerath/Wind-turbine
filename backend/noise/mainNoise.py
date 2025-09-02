# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from simulator.websocket_manager import WebSocketManager
# from pydantic import BaseModel
# from predict.prediction import predict_optimal_pitch_xgb
# import asyncio

# app = FastAPI()

# # ✅ Allow frontend connection
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],  # your frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ✅ Initialize manager
# csv_path = r"data/wind_data.csv"
# manager = WebSocketManager(csv_path=csv_path, delay=30)

# # ✅ Start background broadcast loop ONCE
# @app.on_event("startup")
# async def start_broadcast():
#     asyncio.create_task(manager.producer_loop())

# # ✅ WebSocket endpoint
# @app.websocket("/ws/stream")
# async def websocket_endpoint(websocket: WebSocket):
#     await manager.connect(websocket)
#     try:
#         # keep connection alive until client disconnects
#         while True:
#             await websocket.receive_text()
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)

# # ✅ Prediction endpoint
# class PredictionRequest(BaseModel):
#     wind_speed: float
#     wind_direction: float
#     target_noise_level: float = 35.0

# @app.post("/predict")
# def predict(request: PredictionRequest):
#     result = predict_optimal_pitch_xgb(
#         wind_speed=request.wind_speed,
#         wind_direction=request.wind_direction,
#         target_noise_level=request.target_noise_level
#     )
#     return result




from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
from noise.simulator.websocket_manager import WebSocketManager
from noise.predict.prediction import predict_optimal_pitch_xgb

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
