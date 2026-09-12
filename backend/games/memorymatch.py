import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

ICONS = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍑', '🍍']

class MemoryMatchGame(ServerSideGame):
    game_id = "memorymatch"
    game_name = "Memory Match"
    min_players = 2
    max_players = 4

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        deck = ICONS * 2
        random.shuffle(deck)
        cards = [{"id": i, "icon": icon, "isFlipped": False, "isMatched": False} for i, icon in enumerate(deck)]
        return {
            "players": list(player_ids),
            "cards": cards,
            "current_player_index": 0,
            "flippedIndices": [],
            "scores": {p: 0 for p in player_ids},
            "phase": "playing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        current_pid = state["players"][state["current_player_index"]]
        if player_id != current_pid:
            return False
        idx = move.get("cardIndex") if "cardIndex" in move else move.get("index")
        if idx is None or not (0 <= idx < len(state["cards"])):
            return False
        card = state["cards"][idx]
        if card.get("isMatched") or card.get("isFlipped"):
            return False
        if len(state.get("flippedIndices", [])) >= 2:
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        idx = move.get("cardIndex") if "cardIndex" in move else move.get("index")
        cards = state["cards"]
        flipped = state.get("flippedIndices", [])

        cards[idx]["isFlipped"] = True
        flipped.append(idx)
        state["flippedIndices"] = flipped

        if len(flipped) == 2:
            idx1, idx2 = flipped
            if cards[idx1]["icon"] == cards[idx2]["icon"]:
                cards[idx1]["isMatched"] = True
                cards[idx2]["isMatched"] = True
                state["scores"][player_id] = state["scores"].get(player_id, 0) + 100
                state["flippedIndices"] = []
                if all(c["isMatched"] for c in cards):
                    state["phase"] = "finished"
            else:
                cards[idx1]["isFlipped"] = False
                cards[idx2]["isFlipped"] = False
                state["flippedIndices"] = []
                state["current_player_index"] = (state["current_player_index"] + 1) % len(state["players"])

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if all(c["isMatched"] for c in state["cards"]) or state.get("phase") == "finished":
            scores = state["scores"]
            max_s = max(scores.values()) if scores else 0
            winners = [p for p, s in scores.items() if s == max_s]
            return {
                "winner": winners[0] if len(winners) == 1 else "draw",
                "scores": scores,
            }
        return None
