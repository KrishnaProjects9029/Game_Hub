import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class NumberBattleGame(ServerSideGame):
    game_id = "numberbattle"
    game_name = "Number Battle"
    min_players = 2
    max_players = 4

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "target": 50,
            "currentSum": 0,
            "current_player_index": 0,
            "scores": {p: 0 for p in player_ids},
            "history": [],
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        current_pid = state["players"][state["current_player_index"]]
        if player_id != current_pid:
            return False
        num = move.get("number")
        if not isinstance(num, int) or not (1 <= num <= 10):
            return False
        if state["currentSum"] + num > state["target"]:
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        num = move["number"]
        state["currentSum"] += num
        state["history"].append({"player": player_id, "added": num, "total": state["currentSum"]})

        if state["currentSum"] >= state["target"]:
            state["phase"] = "finished"
            state["scores"][player_id] = 100
        else:
            state["current_player_index"] = (state["current_player_index"] + 1) % len(state["players"])

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state["currentSum"] >= state["target"] or state.get("phase") == "finished":
            scores = state["scores"]
            winner = max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
