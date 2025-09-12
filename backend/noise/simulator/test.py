import asyncio
import websockets

async def test_ws():
    uri = "ws://localhost:8000/noise/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")
            await websocket.send("Hello")
            # Receive response if your backend echoes
            # msg = await websocket.recv()
            # print("Received:", msg)
    except Exception as e:
        print("❌ Connection failed:", e)

asyncio.run(test_ws())
