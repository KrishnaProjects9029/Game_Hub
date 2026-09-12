import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class NinjaDodgeGame(ServerSideGame):
    game_id = "ninjadodge"
    game_name = "Ninja Dodge"
    min_players = 2
    max_players = 4

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "survivalTimes": {p: 0 for p in player_ids},
            "lives": {p: 3 for p in player_ids},
            "isAlive": {p: True for p in player_ids},
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

        if action == "update_survival":
            t = move.get("time", 0)
            state["survivalTimes"][player_id] = t
            state["scores"][player_id] = t * 10

        elif action == "hit":
            state["lives"][player_id] = max(0, state["lives"].get(player_id, 3) - 1)
            if state["lives"][player_id] <= 0:
                state["isAlive"][player_id] = False

        alive = [p for p in state["players"] if state["isAlive"].get(p, True)]
        if len(alive) <= 1:
            state["phase"] = "finished"

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        alive = [p for p in state["players"] if state["isAlive"].get(p, True)]
        if len(alive) <= 1 or state.get("phase") == "finished":
            scores = state["scores"]
            winner = alive[0] if alive else max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
