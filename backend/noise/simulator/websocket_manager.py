# import json
# import asyncio
# import time
# import pandas as pd
# from fastapi import WebSocket, WebSocketDisconnect

# class WebSocketManager:
#     def __init__(self, csv_path, delay=30):
#         self.active_connections: list[WebSocket] = []
#         self.csv_path = csv_path
#         self.delay = delay
#         self.data_generator = self._create_data_generator()

#     def _create_data_generator(self):
#         df = pd.read_csv(self.csv_path)
#         required_cols = ['noise level', 'WindSpeed at 80m', 'Wind Direction', 'power out', 'Rotor Speed', 'pitch angle']
#         missing_cols = [col for col in required_cols if col not in df.columns]
#         if missing_cols:
#             raise ValueError(f"CSV missing required columns: {missing_cols}")

#         df = df[required_cols].dropna()

#         while True:
#             for _, row in df.iterrows():
#                 yield {
#                     "noise_level": round(float(row['noise level']), 2),
#                     "wind_speed": round(float(row['WindSpeed at 80m']), 2),
#                     "wind_direction": round(float(row['Wind Direction']), 2),
#                     "power_out": round(float(row['power out']), 2),
#                     "rotor_speed": round(float(row['Rotor Speed']), 2),
#                     "pitch_angle": round(float(row['pitch angle']), 2),
#                     "timestamp": time.time()
#                 }

#     async def connect(self, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections.append(websocket)
#         print(f"Client connected: {websocket.client}")

#     def disconnect(self, websocket: WebSocket):
#         self.active_connections.remove(websocket)
#         print(f"Client disconnected: {websocket.client}")

#     async def send_personal_message(self, message: dict, websocket: WebSocket):
#         await websocket.send_text(json.dumps(message))

#     async def broadcast(self):
#         for data_point in self.data_generator:
#             disconnected = []
#             for connection in self.active_connections:
#                 try:
#                     await connection.send_text(json.dumps(data_point))
#                 except WebSocketDisconnect:
#                     disconnected.append(connection)
#             for conn in disconnected:
#                 self.disconnect(conn)
#             await asyncio.sleep(self.delay)
######################################
# import asyncio
# import pandas as pd
# import time
# import json
# from fastapi import WebSocket, WebSocketDisconnect

# class WebSocketManager:
#     def __init__(self, csv_path, delay=30):
#         self.active_connections: list[WebSocket] = []
#         self.delay = delay
#         self.df = pd.read_csv(csv_path)
#         required_cols = ['noise level', 'WindSpeed at 80m', 'Wind Direction', 'power out', 'Rotor Speed', 'pitch angle']
#         missing_cols = [col for col in required_cols if col not in self.df.columns]
#         if missing_cols:
#             raise ValueError(f"CSV missing required columns: {missing_cols}")
#         self.df = self.df[required_cols].dropna()
#         self.row_index = 0  # keep track of the current row

#     async def connect(self, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections.append(websocket)
#         print(f"Client connected: {websocket.client}")

#     def disconnect(self, websocket: WebSocket):
#         if websocket in self.active_connections:
#             self.active_connections.remove(websocket)
#             print(f"Client disconnected: {websocket.client}")

#     async def broadcast(self):
#         while True:
#             if self.row_index >= len(self.df):
#                 self.row_index = 0  # loop back to start if needed

#             row = self.df.iloc[self.row_index]
#             data_point = {
#                 "noise_level": round(float(row['noise level']), 2),
#                 "wind_speed": round(float(row['WindSpeed at 80m']), 2),
#                 "wind_direction": round(float(row['Wind Direction']), 2),
#                 "power_out": round(float(row['power out']), 2),
#                 "rotor_speed": round(float(row['Rotor Speed']), 2),
#                 "pitch_angle": round(float(row['pitch angle']), 2),
#                 "timestamp": time.time()
#             }

#             # Send the same row to all connected clients
#             disconnected = []
#             for connection in self.active_connections:
#                 try:
#                     await connection.send_text(json.dumps(data_point))
#                 except WebSocketDisconnect:
#                     disconnected.append(connection)
#             for conn in disconnected:
#                 self.disconnect(conn)

#             self.row_index += 1
#             await asyncio.sleep(self.delay)  # wait exactly `delay` seconds



import asyncio
import pandas as pd
import time
import json
from fastapi import WebSocket

class WebSocketManager:
    def __init__(self, csv_path, delay=30):
        self.active_connections: list[WebSocket] = []
        self.delay = delay
        self.df = pd.read_csv(csv_path)

        # ✅ Check required columns
        required_cols = [
            'noise level', 'WindSpeed at 80m', 'Wind Direction',
            'power out', 'Rotor Speed', 'pitch angle'
        ]
        missing_cols = [col for col in required_cols if col not in self.df.columns]
        if missing_cols:
            raise ValueError(f"CSV missing required columns: {missing_cols}")

        self.df = self.df[required_cols].dropna()
        self.row_index = 0

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Client connected: {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"❌ Client disconnected: {websocket.client}")

    async def send_to_all(self, data_point: dict):
        """Send one data point to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(data_point))
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    async def producer_loop(self):
        """Background task that pushes a row every `delay` seconds."""
        while True:
            if self.row_index >= len(self.df):
                self.row_index = 0  # loop back to start

            row = self.df.iloc[self.row_index]
            data_point = {
                "noise_level": round(float(row['noise level']), 2),
                "wind_speed": round(float(row['WindSpeed at 80m']), 2),
                "wind_direction": round(float(row['Wind Direction']), 2),
                "power_out": round(float(row['power out']), 2),
                "rotor_speed": round(float(row['Rotor Speed']), 2),
                "pitch_angle": round(float(row['pitch angle']), 2),
                "timestamp": time.time()
            }

            await self.send_to_all(data_point)
            self.row_index += 1
            await asyncio.sleep(self.delay)
