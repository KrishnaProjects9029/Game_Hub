import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class TargetTapGame(ServerSideGame):
    game_id = "targettap"
    game_name = "Target Tap"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "targetScore": 500,
            "scores": {p: 0 for p in player_ids},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        return player_id in state["players"]

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        pts = move.get("points", 25)
        state["scores"][player_id] = state["scores"].get(player_id, 0) + pts
        if state["scores"][player_id] >= state["targetScore"]:
            state["phase"] = "finished"
        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        scores = state["scores"]
        if any(s >= state["targetScore"] for s in scores.values()) or state.get("phase") == "finished":
            winner = max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
