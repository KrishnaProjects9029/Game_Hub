import asyncio
import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionInfo:
    """Holds a WebSocket connection and its associated identifiers."""

    def __init__(self, websocket: WebSocket, player_id: str, room_code: str):
        self.websocket = websocket
        self.player_id = player_id
        self.room_code = room_code


class WebSocketManager:
    """Manages all active WebSocket connections grouped by room code."""

    def __init__(self):
        # room_code -> list[ConnectionInfo]
        self._rooms: Dict[str, List[ConnectionInfo]] = {}
        # player_id -> ConnectionInfo  (one active connection per player)
        self._players: Dict[str, ConnectionInfo] = {}

    async def connect(self, websocket: WebSocket, player_id: str, room_code: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        info = ConnectionInfo(websocket, player_id, room_code)
        # Replace existing connection for same player if any
        if player_id in self._players:
            old = self._players[player_id]
            self._remove_from_room(old)
        self._players[player_id] = info
        if room_code not in self._rooms:
            self._rooms[room_code] = []
        self._rooms[room_code].append(info)
        logger.info("WS connected: player=%s room=%s", player_id, room_code)

    def _remove_from_room(self, info: ConnectionInfo):
        code = info.room_code
        if code in self._rooms:
            self._rooms[code] = [c for c in self._rooms[code] if c.player_id != info.player_id]
            if not self._rooms[code]:
                del self._rooms[code]

    def disconnect(self, player_id: str, room_code: str):
        """Unregister a connection."""
        info = self._players.pop(player_id, None)
        if info:
            self._remove_from_room(info)
        logger.info("WS disconnected: player=%s room=%s", player_id, room_code)

    async def send_to_player(self, player_id: str, message: dict):
        """Send a JSON message to a specific player. Silently ignores if disconnected."""
        info = self._players.get(player_id)
        if info:
            try:
                await info.websocket.send_text(json.dumps(message))
            except Exception as exc:
                logger.warning("Failed to send to player %s: %s", player_id, exc)

    async def broadcast_to_room(self, room_code: str, message: dict, exclude_player_id: Optional[str] = None):
        """Broadcast a JSON message to all players in a room."""
        conns = list(self._rooms.get(room_code, []))
        text = json.dumps(message)
        for info in conns:
            if info.player_id == exclude_player_id:
                continue
            try:
                await info.websocket.send_text(text)
            except Exception as exc:
                logger.warning("Failed to broadcast to player %s: %s", info.player_id, exc)

    def get_room_connections(self, room_code: str) -> List[str]:
        """Return list of player_ids currently connected to the room."""
        return [c.player_id for c in self._rooms.get(room_code, [])]

    def is_connected(self, player_id: str) -> bool:
        return player_id in self._players


# Module-level singleton used across the app
manager = WebSocketManager()
