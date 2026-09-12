import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

CARD_TYPES = [
    {"type": "points", "val": 100, "label": "+100 Gold"},
    {"type": "points", "val": 200, "label": "+200 Jackpot"},
    {"type": "points", "val": 50, "label": "+50 Coins"},
    {"type": "bomb", "val": -50, "label": "💣 Bomb -50"},
    {"type": "shield", "val": 0, "label": "🛡️ Shield"},
]

class LuckyCardGame(ServerSideGame):
    game_id = "luckycard"
    game_name = "Lucky Card"
    min_players = 2
    max_players = 4

    def _deal_cards(self):
        return [random.choice(CARD_TYPES) for _ in range(3)]

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "players": list(player_ids),
            "round": 1,
            "totalRounds": 5,
            "current_player_index": 0,
            "cards": self._deal_cards(),
            "scores": {p: 0 for p in player_ids},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        current_pid = state["players"][state["current_player_index"]]
        if player_id != current_pid:
            return False
        card_idx = move.get("cardIndex")
        return card_idx is not None and 0 <= card_idx < len(state["cards"])

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        card_idx = move["cardIndex"]
        card = state["cards"][card_idx]

        val = card.get("val", 0)
        state["scores"][player_id] = max(0, state["scores"].get(player_id, 0) + val)

        next_idx = (state["current_player_index"] + 1) % len(state["players"])
        state["current_player_index"] = next_idx
        state["cards"] = self._deal_cards()

        if next_idx == 0:
            state["round"] += 1
            if state["round"] > state["totalRounds"]:
                state["phase"] = "finished"

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
