from fastapi import WebSocket
from typing import List

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """It accepts the new connection and adds it to the list."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] New client connected. Total:{len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes the link from the list."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print("[WebSocket] Client disconnected.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """It sends a message to a specific client."""
        await websocket.send_text(message)

    async def send_json(self, data: dict, websocket: WebSocket):
        """It sends JSON to a specific client."""
        await websocket.send_json(data)

    async def broadcast(self, message: str):
        """It sends the same message to everyone (e.g., 'Lights turned on' notification)."""
        for connection in self.active_connections:
            await connection.send_text(message)

    async def broadcast_json(self, data: dict):
        """It sends JSON data to all connected users (for sensors)."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Broadcast Error: {e}")
                self.disconnect(connection)

manager = WebSocketManager()