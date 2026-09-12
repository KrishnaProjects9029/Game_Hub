import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

COLORS = ["RED", "BLUE", "GREEN", "YELLOW"]
COLOR_HEXES = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"]

class ColorClashGame(ServerSideGame):
    game_id = "colorclash"
    game_name = "Color Clash"
    min_players = 2
    max_players = 6

    def _generate_card(self):
        w_idx = random.randint(0, len(COLORS) - 1)
        # 50% chance match
        c_idx = w_idx if random.random() < 0.5 else random.randint(0, len(COLORS) - 1)
        return {
            "word": COLORS[w_idx],
            "ink": COLOR_HEXES[c_idx],
            "isMatch": w_idx == c_idx,
        }

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "card": self._generate_card(),
            "round": 1,
            "totalRounds": 10,
            "scores": {p: 0 for p in player_ids},
            "answers": {},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        if player_id not in state["players"]:
            return False
        if player_id in state.get("answers", {}):
            return False
        if "isMatch" not in move and "match" not in move:
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        val = move.get("isMatch") if "isMatch" in move else move.get("match")
        state.setdefault("answers", {})[player_id] = val

        if len(state["answers"]) >= len(state["players"]):
            correct = state["card"]["isMatch"]
            for pid, ans in state["answers"].items():
                if ans == correct:
                    state["scores"][pid] = state["scores"].get(pid, 0) + 100
                else:
                    state["scores"][pid] = max(0, state["scores"].get(pid, 0) - 50)

            if state["round"] >= state["totalRounds"]:
                state["phase"] = "finished"
            else:
                state["round"] += 1
                state["card"] = self._generate_card()
                state["answers"] = {}

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state.get("phase") == "finished":
            scores = state["scores"]
            max_s = max(scores.values()) if scores else 0
            winners = [p for p, s in scores.items() if s == max_s]
            return {
                "winner": winners[0] if len(winners) == 1 else "draw",
                "scores": scores,
            }
        return None
