import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

class BombPassGame(ServerSideGame):
    game_id = "bombpass"
    game_name = "Bomb Pass"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        pids = list(player_ids)
        holder = random.choice(pids)
        return {
            "players": pids,
            "holder": holder,
            "eliminated": [],
            "roundTimer": random.randint(15, 30),
            "scores": {p: 0 for p in pids},
            "phase": "passing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "passing":
            return False
        if player_id != state.get("holder"):
            return False
        to_pid = move.get("toPlayerId")
        if to_pid and (to_pid not in state["players"] or to_pid in state["eliminated"]):
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        action = move.get("type") or move.get("action")

        if action == "pass":
            to_pid = move.get("toPlayerId")
            if not to_pid:
                # pass to next active player
                active = [p for p in state["players"] if p not in state["eliminated"]]
                curr_idx = active.index(player_id) if player_id in active else 0
                to_pid = active[(curr_idx + 1) % len(active)]
            state["holder"] = to_pid

        elif action == "explode":
            state["eliminated"].append(state["holder"])
            active = [p for p in state["players"] if p not in state["eliminated"]]
            if len(active) <= 1:
                state["phase"] = "finished"
                if active:
                    state["scores"][active[0]] = 100
            else:
                state["holder"] = random.choice(active)

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        active = [p for p in state["players"] if p not in state["eliminated"]]
        if len(active) == 1 or state.get("phase") == "finished":
            winner = active[0] if active else "draw"
            scores = {p: (100 if p == winner else 0) for p in state["players"]}
            return {
                "winner": winner,
                "scores": scores,
            }
        return None
