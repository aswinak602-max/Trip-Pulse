from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Set
from datetime import datetime
import json

from app.core.database import SessionLocal
from app.models.trip import TripMember

router = APIRouter(tags=["Real-Time Location Sharing"])

class ConnectionManager:
    def __init__(self):
        # Maps trip_id -> Set of active WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = set()
        self.active_connections[trip_id].add(websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket):
        if trip_id in self.active_connections:
            self.active_connections[trip_id].discard(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]

    async def broadcast(self, trip_id: int, message: dict):
        if trip_id in self.active_connections:
            for connection in list(self.active_connections[trip_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.active_connections[trip_id].discard(connection)

manager = ConnectionManager()

@router.websocket("/ws/trips/{trip_id}/location")
async def websocket_trip_location(websocket: WebSocket, trip_id: int):
    await manager.connect(trip_id, websocket)
    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            
            user_id = data.get("user_id")
            user_name = data.get("user_name", "Trip Member")
            latitude = data.get("latitude")
            longitude = data.get("longitude")
            is_sharing = data.get("is_sharing", True)

            # Update DB with location
            if latitude is not None and longitude is not None:
                db = SessionLocal()
                try:
                    member = None
                    if user_id:
                        member = db.query(TripMember).filter(TripMember.trip_id == trip_id, TripMember.user_id == user_id).first()
                    if not member and user_name:
                        member = db.query(TripMember).filter(TripMember.trip_id == trip_id, TripMember.name.ilike(f"%{user_name}%")).first()
                    
                    if member:
                        member.is_sharing_location = is_sharing
                        if is_sharing:
                            member.last_latitude = latitude
                            member.last_longitude = longitude
                            member.last_location_time = datetime.utcnow()
                        db.commit()
                except Exception as e:
                    print(f"Error persisting location update: {e}")
                finally:
                    db.close()

            # Broadcast to all connected trip members
            broadcast_payload = {
                "type": "location_update",
                "trip_id": trip_id,
                "user_id": user_id,
                "user_name": user_name,
                "latitude": latitude,
                "longitude": longitude,
                "is_sharing": is_sharing,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.broadcast(trip_id, broadcast_payload)
            
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)
    except Exception as e:
        manager.disconnect(trip_id, websocket)
