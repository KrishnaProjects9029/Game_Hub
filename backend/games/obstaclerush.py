import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class ObstacleRushGame(ServerSideGame):
    game_id = "obstaclerush"
    game_name = "Obstacle Rush"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "distances": {p: 0 for p in player_ids},
            "lives": {p: 3 for p in player_ids},
            "finished": [],
            "targetDistance": 500,
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

        if action == "update_progress":
            delta = move.get("distanceDelta", 10)
            state["distances"][player_id] = min(state["targetDistance"], state["distances"].get(player_id, 0) + delta)
            if state["distances"][player_id] >= state["targetDistance"] and player_id not in state["finished"]:
                state["finished"].append(player_id)
                rank = len(state["finished"])
                pts = [100, 70, 50, 30, 20, 10][rank - 1] if rank <= 6 else 10
                state["scores"][player_id] = pts

        elif action == "hit_obstacle":
            state["lives"][player_id] = max(0, state["lives"].get(player_id, 3) - 1)

        alive_or_running = [p for p in state["players"] if state["lives"][p] > 0 and p not in state["finished"]]
        if not alive_or_running or len(state["finished"]) >= 1:
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
