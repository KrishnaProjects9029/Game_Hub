import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class CoinFlipGame(ServerSideGame):
    game_id = "coinflip"
    game_name = "Coin Flip Battle"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "round": 1,
            "totalRounds": 5,
            "guesses": {},
            "lastFlip": None,
            "scores": {p: 0 for p in player_ids},
            "phase": "guessing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "guessing":
            return False
        if player_id not in state["players"]:
            return False
        if player_id in state.get("guesses", {}):
            return False
        guess = move.get("guess")
        return guess in ["heads", "tails", "H", "T"]

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        guess = move.get("guess")
        state.setdefault("guesses", {})[player_id] = "heads" if guess in ["heads", "H"] else "tails"

        if len(state["guesses"]) >= len(state["players"]):
            flip = random.choice(["heads", "tails"])
            state["lastFlip"] = flip
            for pid, g in state["guesses"].items():
                if g == flip:
                    state["scores"][pid] = state["scores"].get(pid, 0) + 100

            if state["round"] >= state["totalRounds"]:
                state["phase"] = "finished"
            else:
                state["round"] += 1
                state["guesses"] = {}

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
