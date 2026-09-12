import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class MiniRacingGame(ServerSideGame):
    game_id = "miniracing"
    game_name = "Mini Racing"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "targetLaps": 3,
            "laps": {p: 0 for p in player_ids},
            "progress": {p: 0.0 for p in player_ids},
            "finished": [],
            "scores": {p: 0 for p in player_ids},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        return player_id in state["players"]

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        action = move.get("type")

        if action == "lap_completed" or move.get("lapDelta"):
            state["laps"][player_id] = state["laps"].get(player_id, 0) + 1
            if state["laps"][player_id] >= state["targetLaps"] and player_id not in state["finished"]:
                state["finished"].append(player_id)
                rank = len(state["finished"])
                pts = [100, 70, 50, 30, 20, 10][rank - 1] if rank <= 6 else 10
                state["scores"][player_id] = pts

        elif "progress" in move:
            state["progress"][player_id] = move["progress"]

        if len(state["finished"]) >= len(state["players"]) or len(state["finished"]) >= 1:
            state["phase"] = "finished"

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state["finished"] or state.get("phase") == "finished":
            scores = state["scores"]
            winner = state["finished"][0] if state["finished"] else max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
