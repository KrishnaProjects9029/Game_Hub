import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class BattleArenaGame(ServerSideGame):
    game_id = "battlearena"
    game_name = "Mini Battle Arena"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "hp": {p: 3 for p in player_ids},
            "knockouts": {p: 0 for p in player_ids},
            "scores": {p: 0 for p in player_ids},
            "matchTime": 45,
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        return player_id in state["players"]

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        action = move.get("type")

        if action == "knockout_scored" and "victimId" in move:
            victim = move["victimId"]
            state["hp"][victim] = max(0, state["hp"].get(victim, 3) - 1)
            state["knockouts"][player_id] = state["knockouts"].get(player_id, 0) + 1
            state["scores"][player_id] = state["scores"].get(player_id, 0) + 100

            alive = [p for p in state["players"] if state["hp"][p] > 0]
            if len(alive) <= 1:
                state["phase"] = "finished"

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        alive = [p for p in state["players"] if state["hp"][p] > 0]
        if len(alive) <= 1 or state.get("phase") == "finished":
            scores = state["scores"]
            winner = alive[0] if alive else max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
