import sqlite3
import uuid
import random
import string
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

DB_PATH = "game_hub.db"

def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _generate_room_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=5))

def init_db():
    """Create all tables if they do not already exist."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.executescript("""
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                avatar TEXT NOT NULL DEFAULT 'robot1',
                xp INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1,
                games_played INTEGER NOT NULL DEFAULT 0,
                wins INTEGER NOT NULL DEFAULT 0,
                losses INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                host_player_id TEXT NOT NULL,
                game_id TEXT,
                phase TEXT NOT NULL DEFAULT 'lobby',
                max_players INTEGER NOT NULL DEFAULT 4,
                created_at TEXT NOT NULL,
                FOREIGN KEY (host_player_id) REFERENCES players(id)
            );

            CREATE TABLE IF NOT EXISTS room_players (
                room_id TEXT NOT NULL,
                player_id TEXT NOT NULL,
                is_ready INTEGER NOT NULL DEFAULT 0,
                is_host INTEGER NOT NULL DEFAULT 0,
                joined_at TEXT NOT NULL,
                PRIMARY KEY (room_id, player_id),
                FOREIGN KEY (room_id) REFERENCES rooms(id),
                FOREIGN KEY (player_id) REFERENCES players(id)
            );

            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                game_id TEXT NOT NULL,
                winner_player_id TEXT,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                FOREIGN KEY (room_id) REFERENCES rooms(id)
            );

            CREATE TABLE IF NOT EXISTS match_scores (
                match_id TEXT NOT NULL,
                player_id TEXT NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (match_id, player_id),
                FOREIGN KEY (match_id) REFERENCES matches(id)
            );

            CREATE TABLE IF NOT EXISTS achievements (
                player_id TEXT NOT NULL,
                achievement_id TEXT NOT NULL,
                unlocked_at TEXT NOT NULL,
                PRIMARY KEY (player_id, achievement_id),
                FOREIGN KEY (player_id) REFERENCES players(id)
            );

            CREATE INDEX IF NOT EXISTS idx_matches_room ON matches(room_id);
            CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_player_id);
            CREATE INDEX IF NOT EXISTS idx_room_players_player ON room_players(player_id);
            CREATE INDEX IF NOT EXISTS idx_match_scores_player ON match_scores(player_id);
        """)
        conn.commit()
    finally:
        conn.close()

def _row_to_dict(row) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    return dict(row)

def create_player(username: str, avatar: str = "robot1") -> Dict[str, Any]:
    """Create a new player and return the player dict."""
    player_id = str(uuid.uuid4())
    return upsert_player(player_id, username, avatar)

def upsert_player(player_id: str, username: str, avatar: str = "robot1") -> Dict[str, Any]:
    """Insert or update player with a specific ID."""
    now = _now()
    conn = _get_conn()
    try:
        conn.execute(
            """INSERT INTO players (id, username, avatar, xp, level, games_played, wins, losses, created_at)
               VALUES (?, ?, ?, 0, 1, 0, 0, 0, ?)
               ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar""",
            (player_id, username, avatar, now)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM players WHERE id=?", (player_id,)).fetchone()
        return _row_to_dict(row)
    finally:
        conn.close()


def get_player(player_id: str) -> Optional[Dict[str, Any]]:
    """Return player dict or None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM players WHERE id=?", (player_id,)).fetchone()
        return _row_to_dict(row)
    finally:
        conn.close()

def update_player_stats(player_id: str, won: bool):
    """Increment games_played, wins or losses, and award XP. Recalculate level."""
    conn = _get_conn()
    try:
        xp_gain = 100 if won else 20
        if won:
            conn.execute(
                "UPDATE players SET games_played=games_played+1, wins=wins+1, xp=xp+? WHERE id=?",
                (xp_gain, player_id)
            )
        else:
            conn.execute(
                "UPDATE players SET games_played=games_played+1, losses=losses+1, xp=xp+? WHERE id=?",
                (xp_gain, player_id)
            )
        row = conn.execute("SELECT xp FROM players WHERE id=?", (player_id,)).fetchone()
        if row:
            new_level = 1 + row["xp"] // 200
            conn.execute("UPDATE players SET level=? WHERE id=?", (new_level, player_id))
        conn.commit()
    finally:
        conn.close()

def _unique_room_code(conn) -> str:
    for _ in range(20):
        code = _generate_room_code()
        existing = conn.execute("SELECT id FROM rooms WHERE code=?", (code,)).fetchone()
        if not existing:
            return code
    raise RuntimeError("Could not generate unique room code")

def create_room(host_player_id: str, max_players: int = 4) -> Dict[str, Any]:
    """Create a new room and add the host as the first player."""
    room_id = str(uuid.uuid4())
    now = _now()
    conn = _get_conn()
    try:
        code = _unique_room_code(conn)
        conn.execute(
            "INSERT INTO rooms (id, code, host_player_id, game_id, phase, max_players, created_at) VALUES (?,?,?,NULL,'lobby',?,?)",
            (room_id, code, host_player_id, max_players, now)
        )
        conn.execute(
            "INSERT INTO room_players (room_id, player_id, is_ready, is_host, joined_at) VALUES (?,?,0,1,?)",
            (room_id, host_player_id, now)
        )
        conn.commit()
        return {
            "id": room_id, "code": code, "host_player_id": host_player_id,
            "game_id": None, "phase": "lobby", "max_players": max_players,
            "created_at": now
        }
    finally:
        conn.close()

def get_room(room_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM rooms WHERE id=?", (room_id,)).fetchone()
        return _row_to_dict(row)
    finally:
        conn.close()

def get_room_by_code(code: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM rooms WHERE code=?", (code.upper(),)).fetchone()
        return _row_to_dict(row)
    finally:
        conn.close()

def add_player_to_room(room_id: str, player_id: str, is_host: bool = False):
    """Add a player to a room. Idempotent if already present."""
    now = _now()
    conn = _get_conn()
    try:
        existing = conn.execute(
            "SELECT player_id FROM room_players WHERE room_id=? AND player_id=?",
            (room_id, player_id)
        ).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO room_players (room_id, player_id, is_ready, is_host, joined_at) VALUES (?,?,0,?,?)",
                (room_id, player_id, 1 if is_host else 0, now)
            )
            conn.commit()
    finally:
        conn.close()

def remove_player_from_room(room_id: str, player_id: str):
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM room_players WHERE room_id=? AND player_id=?", (room_id, player_id))
        conn.commit()
    finally:
        conn.close()

def get_room_players(room_id: str) -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            """SELECT rp.room_id, rp.player_id, rp.is_ready, rp.is_host, rp.joined_at,
                      p.username, p.avatar, p.xp, p.level, p.wins, p.losses, p.games_played
               FROM room_players rp
               JOIN players p ON p.id = rp.player_id
               WHERE rp.room_id=?
               ORDER BY rp.joined_at ASC""",
            (room_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def set_player_ready(room_id: str, player_id: str, ready: bool):
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE room_players SET is_ready=? WHERE room_id=? AND player_id=?",
            (1 if ready else 0, room_id, player_id)
        )
        conn.commit()
    finally:
        conn.close()

def update_room_phase(room_id: str, phase: str):
    conn = _get_conn()
    try:
        conn.execute("UPDATE rooms SET phase=? WHERE id=?", (phase, room_id))
        conn.commit()
    finally:
        conn.close()

def update_room_game(room_id: str, game_id: str):
    conn = _get_conn()
    try:
        conn.execute("UPDATE rooms SET game_id=? WHERE id=?", (game_id, room_id))
        conn.commit()
    finally:
        conn.close()

def update_room_host(room_id: str, new_host_player_id: str):
    conn = _get_conn()
    try:
        conn.execute("UPDATE rooms SET host_player_id=? WHERE id=?", (new_host_player_id, room_id))
        conn.execute("UPDATE room_players SET is_host=0 WHERE room_id=?", (room_id,))
        conn.execute("UPDATE room_players SET is_host=1 WHERE room_id=? AND player_id=?", (room_id, new_host_player_id))
        conn.commit()
    finally:
        conn.close()

def delete_room(room_id: str):
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM room_players WHERE room_id=?", (room_id,))
        conn.execute("DELETE FROM rooms WHERE id=?", (room_id,))
        conn.commit()
    finally:
        conn.close()

def list_active_rooms() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            """SELECT r.id, r.code, r.game_id, r.phase, r.max_players,
                      COUNT(rp.player_id) as player_count
               FROM rooms r
               LEFT JOIN room_players rp ON rp.room_id = r.id
               WHERE r.phase IN ('lobby','playing')
               GROUP BY r.id""",
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def save_match(room_id: str, game_id: str, winner_player_id: Optional[str], scores: Dict[str, int]) -> str:
    """Persist a finished match and its scores. Returns match_id."""
    match_id = str(uuid.uuid4())
    now = _now()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO matches (id, room_id, game_id, winner_player_id, started_at, finished_at) VALUES (?,?,?,?,?,?)",
            (match_id, room_id, game_id, winner_player_id, now, now)
        )
        for pid, score in scores.items():
            conn.execute(
                "INSERT INTO match_scores (match_id, player_id, score) VALUES (?,?,?)",
                (match_id, pid, score)
            )
        conn.commit()
    finally:
        conn.close()
    return match_id
