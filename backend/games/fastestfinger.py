import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class FastestFingerGame(ServerSideGame):
    game_id = "fastestfinger"
    game_name = "Fastest Finger"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "targetTaps": 50,
            "taps": {p: 0 for p in player_ids},
            "scores": {p: 0 for p in player_ids},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        return player_id in state["players"]

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        state["taps"][player_id] = state["taps"].get(player_id, 0) + 1
        if state["taps"][player_id] >= state["targetTaps"]:
            state["phase"] = "finished"
            state["scores"][player_id] = 100
        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for p, count in state["taps"].items():
            if count >= state["targetTaps"] or state.get("phase") == "finished":
                scores = state["taps"]
                winner = max(scores, key=scores.get)
                return {
                    "winner": winner,
                    "scores": scores,
                }
        return None
