"""
room_manager.py
---------------
In-memory room state (game state, asyncio tasks) with SQLite persistence via db.py.
All public functions are synchronous except start_reaction_race_round which is async.
"""
import asyncio
import logging
import time
import random
from typing import Any, Dict, List, Optional

from . import db
from games import GAME_REGISTRY
from games.reactionrace import ReactionRaceGame

logger = logging.getLogger(__name__)

# In-memory store of live room state (game state + housekeeping)
# Key: room_code, Value: dict with keys: room, game_state, reaction_task
_live: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_live(room_code: str):
    """Load room from DB into _live if not already there."""
    if room_code not in _live:
        room = db.get_room_by_code(room_code)
        if room:
            _live[room_code] = {"room": room, "game_state": None, "reaction_task": None}


def get_room_state(room_code: str) -> Optional[Dict[str, Any]]:
    """Return full room state including player list and game state."""
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        return None
    room = entry["room"]
    players = db.get_room_players(room["id"])
    return {
        "room": room,
        "players": players,
        "game_state": entry.get("game_state"),
    }


# ---------------------------------------------------------------------------
# Room lifecycle
# ---------------------------------------------------------------------------

def create_room(host_player_id: str, max_players: int = 4) -> Dict[str, Any]:
    room = db.create_room(host_player_id, max_players)
    _live[room["code"]] = {"room": room, "game_state": None, "reaction_task": None}
    return room


def join_room(room_code: str, player_id: str) -> Dict[str, Any]:
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        raise ValueError("Room not found")
    room = entry["room"]
    if room["phase"] != "lobby":
        raise ValueError("Room game already started")
    players = db.get_room_players(room["id"])
    if len(players) >= room["max_players"]:
        raise ValueError("Room is full")
    # Check already in room
    if not any(p["player_id"] == player_id for p in players):
        db.add_player_to_room(room["id"], player_id, is_host=False)
    return room


def leave_room(room_code: str, player_id: str) -> Optional[Dict[str, Any]]:
    """Remove player from room. Returns updated room or None if room dissolved."""
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        return None
    room = entry["room"]
    db.remove_player_from_room(room["id"], player_id)
    remaining = db.get_room_players(room["id"])

    if not remaining:
        # Last player left - dissolve room
        db.delete_room(room["id"])
        _live.pop(room_code, None)
        return None

    # If host left, migrate to next player
    if room["host_player_id"] == player_id and remaining:
        new_host = remaining[0]["player_id"]
        db.update_room_host(room["id"], new_host)
        room = db.get_room(room["id"])
        entry["room"] = room

    return room


def set_ready(room_code: str, player_id: str, ready: bool):
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        raise ValueError("Room not found")
    db.set_player_ready(entry["room"]["id"], player_id, ready)


def select_game(room_code: str, game_id: str, host_player_id: str):
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        raise ValueError("Room not found")
    room = entry["room"]
    if room["host_player_id"] != host_player_id:
        raise ValueError("Only the host can select the game")
    if game_id not in GAME_REGISTRY:
        raise ValueError(f"Unknown game: {game_id}")
    db.update_room_game(room["id"], game_id)
    room["game_id"] = game_id
    entry["room"] = room


def start_game(room_code: str, host_player_id: str) -> Dict[str, Any]:
    """Validate lobby, initialise game state and return it."""
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        raise ValueError("Room not found")
    room = entry["room"]
    if room["host_player_id"] != host_player_id:
        raise ValueError("Only the host can start the game")
    if not room.get("game_id"):
        raise ValueError("No game selected")
    players = db.get_room_players(room["id"])
    if len(players) < 2:
        raise ValueError("Need at least 2 players to start")
    game = GAME_REGISTRY[room["game_id"]]
    player_ids = [p["player_id"] for p in players]
    if len(player_ids) < game.min_players:
        raise ValueError(f"{game.game_name} needs at least {game.min_players} players")
    if len(player_ids) > game.max_players:
        raise ValueError(f"{game.game_name} supports at most {game.max_players} players")

    game_state = game.get_initial_state(player_ids)
    entry["game_state"] = game_state
    db.update_room_phase(room["id"], "playing")
    room = db.get_room(room["id"])
    entry["room"] = room
    return game_state


def process_move(room_code: str, player_id: str, move: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and apply a move.  Returns:
        {"state": new_state, "winner": result_dict | None}
    """
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        raise ValueError("Room not found")
    room = entry["room"]
    if room["phase"] != "playing":
        raise ValueError("Game not in playing phase")
    game_id = room.get("game_id")
    if not game_id:
        raise ValueError("No game active")
    game = GAME_REGISTRY[game_id]
    state = entry["game_state"]

    if not game.validate_move(state, move, player_id):
        raise ValueError("Invalid move")

    new_state = game.apply_move(state, move, player_id)
    entry["game_state"] = new_state

    winner = game.check_winner(new_state)
    if winner:
        _finish_game(room_code, room, winner)

    return {"state": new_state, "winner": winner}


def _finish_game(room_code: str, room: Dict, winner_result: Dict):
    """Persist match result and update DB state."""
    winner_id = winner_result["winner"] if winner_result["winner"] != "draw" else None
    scores = winner_result.get("scores", {})
    db.save_match(room["id"], room["game_id"], winner_id, scores)
    db.update_room_phase(room["id"], "finished")
    # Update individual player stats
    for pid, score in scores.items():
        won = (pid == winner_id)
        db.update_player_stats(pid, won)
    entry = _live.get(room_code)
    if entry:
        room_refreshed = db.get_room(room["id"])
        entry["room"] = room_refreshed


def rematch(room_code: str) -> bool:
    """Reset room to lobby phase for a rematch. Returns True on success."""
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        return False
    room = entry["room"]
    db.update_room_phase(room["id"], "lobby")
    # Reset ready states
    players = db.get_room_players(room["id"])
    for p in players:
        db.set_player_ready(room["id"], p["player_id"], False)
    room_refreshed = db.get_room(room["id"])
    entry["room"] = room_refreshed
    entry["game_state"] = None
    return True


# ---------------------------------------------------------------------------
# Reaction Race async helpers (called from app.py WebSocket handler)
# ---------------------------------------------------------------------------

async def run_reaction_round(room_code: str, broadcast_fn, timeout_fn):
    """
    Async task that manages one reaction race round:
    1. Countdown (3 seconds)
    2. Random delay 1-5 seconds
    3. Send go signal, record signal_sent_ms
    4. Wait up to 3 seconds for all taps; auto-advance on timeout
    Called by app.py with broadcast_fn(msg) and timeout_fn().
    """
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if not entry:
        return
    game: ReactionRaceGame = GAME_REGISTRY["reactionrace"]
    state = entry["game_state"]

    # Update phase to countdown
    state["phase"] = "countdown"
    entry["game_state"] = state
    await broadcast_fn({"type": "reaction_countdown", "seconds": 3})
    await asyncio.sleep(3)

    # Random delay before go signal
    delay = random.uniform(1.0, 5.0)
    await asyncio.sleep(delay)

    # Go!
    signal_ms = int(time.time() * 1000)
    state = game.set_signal_sent(entry["game_state"], signal_ms)
    entry["game_state"] = state
    await broadcast_fn({"type": "reaction_go", "signal_timestamp": signal_ms})

    # Wait for all taps or timeout
    deadline = time.time() + 3.0
    while time.time() < deadline:
        if game.all_tapped(entry["game_state"]):
            break
        await asyncio.sleep(0.05)

    # Timeout: mark remaining players as DNF
    state = game.apply_timeout(entry["game_state"])
    entry["game_state"] = state

    # Resolve round
    state = game.resolve_round(entry["game_state"])
    entry["game_state"] = state

    last_result = state["round_results"][-1] if state["round_results"] else {}
    await broadcast_fn({
        "type": "reaction_round_result",
        "results": last_result.get("results", []),
        "round": last_result.get("round", state["round"]),
        "scores": state["scores"],
        "state": state,
    })
    await broadcast_fn({
        "type": "game_state",
        "state": state,
    })

    # Check overall game over
    winner = game.check_winner(state)
    if winner:
        room = entry["room"]
        _finish_game(room_code, room, winner)
        await timeout_fn(winner)
    elif state["phase"] == "waiting":
        # Start next round after a short pause
        await asyncio.sleep(2)
        task = asyncio.create_task(run_reaction_round(room_code, broadcast_fn, timeout_fn))
        entry["reaction_task"] = task


def set_reaction_task(room_code: str, task):
    _ensure_live(room_code)
    entry = _live.get(room_code)
    if entry:
        entry["reaction_task"] = task


def cancel_reaction_task(room_code: str):
    entry = _live.get(room_code)
    if entry and entry.get("reaction_task"):
        entry["reaction_task"].cancel()
        entry["reaction_task"] = None


def get_live_game_state(room_code: str) -> Optional[Dict[str, Any]]:
    entry = _live.get(room_code)
    return entry["game_state"] if entry else None


def update_live_game_state(room_code: str, state: Dict[str, Any]):
    entry = _live.get(room_code)
    if entry:
        entry["game_state"] = state
