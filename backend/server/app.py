"""
app.py
------
FastAPI application: REST endpoints + WebSocket handler.
"""
import asyncio
import json
import logging
import socket
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import db
from .websocket_manager import manager
from . import room_manager
from games import GAME_REGISTRY
from games.reactionrace import ReactionRaceGame

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Game Hub Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    db.init_db()
    logger.info("Database initialised")


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _format_players(players_raw: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    formatted = []
    for p in players_raw:
        pid = str(p.get("player_id") or p.get("id", ""))
        pname = str(p.get("username") or p.get("name") or p.get("hostName") or "Player")
        pav = str(p.get("avatar") or "🎮")
        is_ready = bool(p.get("is_ready") or p.get("isReady", False))
        is_host = bool(p.get("is_host") or p.get("isHost", False))
        formatted.append({
            "id": pid,
            "player_id": pid,
            "name": pname,
            "username": pname,
            "avatar": pav,
            "isReady": is_ready,
            "is_ready": is_ready,
            "isHost": is_host,
            "is_host": is_host,
        })
    return formatted


def _player_not_found():
    raise HTTPException(status_code=404, detail="Player not found")


def _room_not_found():
    raise HTTPException(status_code=404, detail="Room not found")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class CreatePlayerRequest(BaseModel):
    id: Optional[str] = None
    username: str
    avatar: str = "robot1"


class CreateRoomRequest(BaseModel):
    host_player_id: Optional[str] = None
    hostId: Optional[str] = None
    hostName: Optional[str] = None
    avatar: Optional[str] = "🎮"
    max_players: Optional[int] = 4


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "server_ip": _get_local_ip()}


@app.post("/players")
async def create_player(req: CreatePlayerRequest):
    if not req.username or len(req.username.strip()) == 0:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if req.id:
        player = db.upsert_player(req.id, req.username.strip(), req.avatar)
    else:
        player = db.create_player(req.username.strip(), req.avatar)
    return player


@app.get("/players/{player_id}")
async def get_player(player_id: str):
    player = db.get_player(player_id)
    if not player:
        _player_not_found()
    return player


@app.get("/rooms")
async def list_rooms():
    active = db.list_active_rooms()
    local_ip = _get_local_ip()
    enriched = []
    for r in active:
        enriched.append({
            "id": r["id"],
            "code": r["code"],
            "roomCode": r["code"],
            "game_id": r["game_id"],
            "gameId": r["game_id"],
            "phase": r["phase"],
            "player_count": r["player_count"],
            "playerCount": r["player_count"],
            "max_players": r["max_players"],
            "maxPlayers": r["max_players"],
            "hostIp": local_ip,
            "port": 8000,
        })
    return enriched


@app.post("/rooms")
async def create_room(req: Dict[str, Any]):
    host_id = req.get("host_player_id") or req.get("hostId")
    if not host_id:
        raise HTTPException(status_code=400, detail="host_player_id or hostId required")
    host_name = req.get("hostName") or req.get("username") or "Host"
    avatar = req.get("avatar") or "🎮"
    max_p = int(req.get("max_players") or req.get("maxPlayers") or 4)

    # Ensure host exists in DB
    player = db.get_player(host_id)
    if not player:
        db.upsert_player(host_id, host_name, avatar)

    if not (2 <= max_p <= 4):
        raise HTTPException(status_code=400, detail="max_players must be between 2 and 4")
    room = room_manager.create_room(host_id, max_p)
    return {
        "id": room["id"],
        "code": room["code"],
        "roomCode": room["code"],
        "host_player_id": room["host_player_id"],
        "max_players": room["max_players"],
        "phase": room["phase"],
        "room": room,
    }


@app.get("/rooms/{code}")
async def get_room(code: str):
    state = room_manager.get_room_state(code.upper())
    if not state:
        _room_not_found()
    return state


# ---------------------------------------------------------------------------
# WebSocket helper: build room_state message
# ---------------------------------------------------------------------------

def _build_room_state_msg(room_code: str) -> dict:
    state = room_manager.get_room_state(room_code)
    if not state:
        return {"type": "error", "message": "Room not found"}
    formatted_players = _format_players(state["players"])
    return {
        "type": "room_state",
        "room": state["room"],
        "players": formatted_players,
        "game_state": state.get("game_state"),
        "state": state.get("game_state"),
    }



# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/{room_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_id: str):
    room_code = room_code.upper()

    # Validate or auto-create player
    player = db.get_player(player_id)
    if not player:
        player = db.upsert_player(player_id, f"Player_{player_id[:4]}", "🎮")

    # Ensure room exists
    room_state = room_manager.get_room_state(room_code)
    if not room_state:
        await websocket.close(code=4002, reason="Room not found")
        return

    # Accept connection
    await manager.connect(websocket, player_id, room_code)

    # Ensure player is in room DB record
    room = room_state["room"]
    try:
        room_manager.join_room(room_code, player_id)
    except ValueError:
        pass

    # Fetch updated player list
    updated_state = room_manager.get_room_state(room_code)
    formatted_players = _format_players(updated_state["players"]) if updated_state else []

    # Notify room of new player
    await manager.broadcast_to_room(
        room_code,
        {
            "type": "player_joined",
            "player": player,
            "players": formatted_players,
        },
        exclude_player_id=player_id,
    )

    # Send current room state to the connecting player
    await manager.send_to_player(player_id, _build_room_state_msg(room_code))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_to_player(player_id, {"type": "error", "message": "Invalid JSON"})
                continue

            await _handle_message(websocket, room_code, player_id, msg)

    except WebSocketDisconnect:
        await _handle_disconnect(room_code, player_id)
    except Exception as exc:
        logger.exception("Unexpected error in WS handler: %s", exc)
        await _handle_disconnect(room_code, player_id)


# ---------------------------------------------------------------------------
# Message handler
# ---------------------------------------------------------------------------

async def _handle_message(websocket: WebSocket, room_code: str, player_id: str, msg: dict):
    msg_type = msg.get("type", "")

    if msg_type == "ping":
        await manager.send_to_player(player_id, {"type": "pong"})

    elif msg_type == "join_room":
        p_id = msg.get("playerId") or player_id
        p_name = msg.get("playerName")
        p_avatar = msg.get("avatar")
        if p_name:
            db.upsert_player(p_id, p_name, p_avatar or "🎮")
        try:
            room_manager.join_room(room_code, p_id)
        except ValueError:
            pass
        updated_state = room_manager.get_room_state(room_code)
        if updated_state:
            formatted = _format_players(updated_state["players"])
            await manager.broadcast_to_room(room_code, {
                "type": "player_joined",
                "player": db.get_player(p_id),
                "players": formatted,
            })
            await manager.broadcast_to_room(room_code, _build_room_state_msg(room_code))

    elif msg_type in ("ready", "player_ready"):
        ready = bool(msg.get("ready", msg.get("isReady", True)))
        p_id = msg.get("playerId") or player_id
        try:
            room_manager.set_ready(room_code, p_id, ready)
            updated_state = room_manager.get_room_state(room_code)
            formatted = _format_players(updated_state["players"]) if updated_state else []
            await manager.broadcast_to_room(room_code, {
                "type": "player_ready",
                "player_id": p_id,
                "playerId": p_id,
                "ready": ready,
                "isReady": ready,
                "players": formatted,
            })
            await manager.broadcast_to_room(room_code, _build_room_state_msg(room_code))
        except ValueError as e:
            await manager.send_to_player(player_id, {"type": "error", "message": str(e)})

    elif msg_type == "select_game":
        game_id = msg.get("game_id") or msg.get("gameId", "")
        try:
            room_manager.select_game(room_code, game_id, player_id)
            await manager.broadcast_to_room(room_code, {
                "type": "game_selected",
                "game_id": game_id,
                "gameId": game_id,
            })
            await manager.broadcast_to_room(room_code, _build_room_state_msg(room_code))
        except ValueError as e:
            await manager.send_to_player(player_id, {"type": "error", "message": str(e)})

    elif msg_type == "start_game":
        try:
            game_id_override = msg.get("game_id") or msg.get("gameId")
            if game_id_override:
                try:
                    room_manager.select_game(room_code, game_id_override, player_id)
                except Exception:
                    pass
            game_state = room_manager.start_game(room_code, player_id)
            room_info = room_manager.get_room_state(room_code)
            game_id = room_info["room"]["game_id"]
            await manager.broadcast_to_room(room_code, {
                "type": "game_started",
                "game_id": game_id,
                "gameId": game_id,
                "state": game_state,
            })

            # Special handling: kick off Reaction Race timing loop
            if game_id == "reactionrace":
                await _start_reaction_race(room_code)

        except ValueError as e:
            await manager.send_to_player(player_id, {"type": "error", "message": str(e)})

    elif msg_type == "make_move":
        move = msg.get("move", {})
        p_id = msg.get("playerId") or player_id
        try:
            result = room_manager.process_move(room_code, p_id, move)
            new_state = result["state"]
            winner = result["winner"]

            room_info = room_manager.get_room_state(room_code)
            game_id = room_info["room"]["game_id"] if room_info else None

            if game_id != "reactionrace":
                await manager.broadcast_to_room(room_code, {
                    "type": "game_state",
                    "state": new_state,
                    "last_move": {"player_id": p_id, "move": move},
                })

            if winner:
                await manager.broadcast_to_room(room_code, {
                    "type": "game_over",
                    "winner_id": winner["winner"],
                    "winner": winner["winner"],
                    "scores": winner["scores"],
                    "result": winner,
                    "state": new_state,
                })

        except ValueError as e:
            await manager.send_to_player(player_id, {"type": "error", "message": str(e)})

    elif msg_type == "rematch":
        try:
            room_state = room_manager.get_room_state(room_code)
            if not room_state:
                raise ValueError("Room not found")
            if room_state["room"]["host_player_id"] != player_id:
                raise ValueError("Only the host can request a rematch")
            room_manager.cancel_reaction_task(room_code)
            room_manager.rematch(room_code)
            await manager.broadcast_to_room(room_code, _build_room_state_msg(room_code))
        except ValueError as e:
            await manager.send_to_player(player_id, {"type": "error", "message": str(e)})

    else:
        await manager.send_to_player(player_id, {
            "type": "error",
            "message": f"Unknown message type: {msg_type}",
        })


# ---------------------------------------------------------------------------
# Disconnect handler
# ---------------------------------------------------------------------------

async def _handle_disconnect(room_code: str, player_id: str):
    manager.disconnect(player_id, room_code)
    remaining_room = room_manager.leave_room(room_code, player_id)

    if remaining_room is None:
        room_manager.cancel_reaction_task(room_code)
        return

    room_info = room_manager.get_room_state(room_code)
    formatted = _format_players(room_info["players"]) if room_info else []

    await manager.broadcast_to_room(room_code, {
        "type": "player_left",
        "player_id": player_id,
        "playerId": player_id,
        "players": formatted,
    })

    # Send updated room state
    state_msg = _build_room_state_msg(room_code)
    await manager.broadcast_to_room(room_code, state_msg)

    # If game is playing and not enough players, end it
    if room_info and room_info["room"]["phase"] == "playing":
        game_id = room_info["room"].get("game_id")
        if game_id:
            game = GAME_REGISTRY.get(game_id)
            remaining_players = room_info["players"]
            if game and len(remaining_players) < game.min_players:
                room_manager.cancel_reaction_task(room_code)
                await manager.broadcast_to_room(room_code, {
                    "type": "error",
                    "message": "Not enough players — game ended.",
                })
                db.update_room_phase(room_info["room"]["id"], "finished")


# ---------------------------------------------------------------------------
# Reaction Race async task launcher
# ---------------------------------------------------------------------------

async def _start_reaction_race(room_code: str):
    """Launch the Reaction Race timing loop as a background asyncio task."""

    async def broadcast_fn(msg: dict):
        await manager.broadcast_to_room(room_code, msg)

    async def game_over_fn(winner: dict):
        await manager.broadcast_to_room(room_code, {
            "type": "game_over",
            "winner_id": winner["winner"],
            "winner": winner["winner"],
            "scores": winner["scores"],
            "result": winner,
        })

    task = asyncio.create_task(
        room_manager.run_reaction_round(room_code, broadcast_fn, game_over_fn)
    )
    room_manager.set_reaction_task(room_code, task)


# ---------------------------------------------------------------------------
# Static frontend serving (SPA fallback)
# ---------------------------------------------------------------------------

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith(("health", "players", "rooms", "ws")):
            raise HTTPException(status_code=404)
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404)

