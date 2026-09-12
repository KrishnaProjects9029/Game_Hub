import copy
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class SpaceDodgeGame(ServerSideGame):
    game_id = "spacedodge"
    game_name = "Space Dodge"
    min_players = 2
    max_players = 4

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "distance": {p: 0 for p in player_ids},
            "shields": {p: 100 for p in player_ids},
            "crystals": {p: 0 for p in player_ids},
            "isDestroyed": {p: False for p in player_ids},
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

        if action == "update_telemetry":
            d = move.get("distDelta", 2)
            state["distance"][player_id] = state["distance"].get(player_id, 0) + d
            state["scores"][player_id] = state["distance"][player_id] * 5 + state["crystals"][player_id] * 50

        elif action == "collect_crystal":
            v = move.get("value", 1)
            state["crystals"][player_id] = state["crystals"].get(player_id, 0) + v
            state["scores"][player_id] = state["distance"][player_id] * 5 + state["crystals"][player_id] * 50

        elif action == "hit_asteroid":
            dmg = move.get("damage", 25)
            state["shields"][player_id] = max(0, state["shields"].get(player_id, 100) - dmg)
            if state["shields"][player_id] <= 0:
                state["isDestroyed"][player_id] = True

        alive = [p for p in state["players"] if not state["isDestroyed"].get(p, False)]
        if len(alive) <= 1:
            state["phase"] = "finished"

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        alive = [p for p in state["players"] if not state["isDestroyed"].get(p, False)]
        if len(alive) <= 1 or state.get("phase") == "finished":
            scores = state["scores"]
            winner = alive[0] if alive else max(scores, key=scores.get)
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
