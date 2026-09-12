import copy
import time
from typing import Any, Dict, List, Optional

from .base import ServerSideGame

TOTAL_ROUNDS = 5
TIMEOUT_MS = 3000  # 3 seconds to tap after "go"
DNF_MS = 9999      # Did Not Finish reaction time


class ReactionRaceGame(ServerSideGame):
    """
    Server-side Reaction Race.
    The actual asyncio signal timing and broadcasting is handled by room_manager /
    app.py.  This class manages the state transitions and scoring only.

    State shape:
    {
        "phase": "waiting" | "countdown" | "react" | "round_over" | "finished",
        "players": [...],
        "round": 1,
        "total_rounds": 5,
        "signal_sent_ms": int | None,       # server epoch ms when go signal fired
        "reactions": {pid: ms | None},      # None = not yet tapped
        "round_results": [                  # accumulated across rounds
            {"round": 1, "results": [{"player_id": pid, "reaction_ms": ms}, ...]}
        ],
        "scores": {pid: int},              # cumulative across rounds
    }
    """

    game_id = "reactionrace"
    game_name = "Reaction Race"
    min_players = 2
    max_players = 4

    # Points by finishing position within a round
    POSITION_POINTS = [100, 70, 50, 30]

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "phase": "waiting",
            "players": list(player_ids),
            "round": 1,
            "total_rounds": TOTAL_ROUNDS,
            "totalRounds": TOTAL_ROUNDS,
            "signal_sent_ms": None,
            "signalTime": None,
            "reactions": {pid: None for pid in player_ids},
            "reactionTimes": {pid: None for pid in player_ids},
            "round_results": [],
            "roundHistory": [],
            "scores": {pid: 0 for pid in player_ids},
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") not in ("react", "go"):
            return False
        if player_id not in state["players"]:
            return False
        reactions = state.get("reactions", {})
        reaction_times = state.get("reactionTimes", {})
        if reactions.get(player_id) is not None or reaction_times.get(player_id) is not None:
            # Already tapped this round
            return False
        if move.get("type") != "tap":
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        """Record a tap. Reaction time is computed from signal_sent_ms to server receipt time or passed reactionMs."""
        state = copy.deepcopy(state)
        now_ms = int(time.time() * 1000)
        signal_ms = state.get("signal_sent_ms") or state.get("signalTime") or now_ms
        reaction_ms = move.get("reactionMs")
        if reaction_ms is None:
            reaction_ms = max(0, now_ms - signal_ms)
        state["reactions"][player_id] = reaction_ms
        if "reactionTimes" not in state:
            state["reactionTimes"] = {}
        state["reactionTimes"][player_id] = reaction_ms
        return state

    def set_signal_sent(self, state: Dict[str, Any], signal_ms: int) -> Dict[str, Any]:
        """Called by the server when the go signal is dispatched."""
        state = copy.deepcopy(state)
        state["phase"] = "go"
        state["signal_sent_ms"] = signal_ms
        state["signalTime"] = signal_ms
        state["reactions"] = {pid: None for pid in state["players"]}
        state["reactionTimes"] = {pid: None for pid in state["players"]}
        return state

    def apply_timeout(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Mark any player who has not yet tapped as DNF."""
        state = copy.deepcopy(state)
        for pid in state["players"]:
            if state["reactions"].get(pid) is None:
                state["reactions"][pid] = DNF_MS
            if state.get("reactionTimes", {}).get(pid) is None:
                state["reactionTimes"][pid] = DNF_MS
        return state

    def resolve_round(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute per-round scores, append to round_results, and advance to next
        round or finished.  Call this only when all reactions are recorded.
        """
        state = copy.deepcopy(state)
        reactions = state.get("reactions") or state.get("reactionTimes") or {}

        # Sort by reaction time ascending (faster = better)
        sorted_players = sorted(state["players"], key=lambda p: reactions.get(p) if reactions.get(p) is not None else DNF_MS)

        round_results = []
        times_map = {}
        for pos, pid in enumerate(sorted_players):
            pts = self.POSITION_POINTS[pos] if pos < len(self.POSITION_POINTS) else 10
            state["scores"][pid] += pts
            round_results.append({"player_id": pid, "reaction_ms": reactions.get(pid, DNF_MS)})
            times_map[pid] = reactions.get(pid, DNF_MS)

        winner_id = sorted_players[0] if sorted_players and (reactions.get(sorted_players[0]) or DNF_MS) < DNF_MS else 'draw'
        state["round_results"].append({"round": state["round"], "results": round_results})
        if "roundHistory" not in state:
            state["roundHistory"] = []
        state["roundHistory"].append({
            "round": state["round"],
            "times": times_map,
            "winnerId": winner_id,
        })

        if state["round"] >= state.get("total_rounds", TOTAL_ROUNDS):
            state["phase"] = "finished"
        else:
            state["round"] += 1
            state["phase"] = "waiting"
            state["signal_sent_ms"] = None
            state["signalTime"] = None
            state["reactions"] = {pid: None for pid in state["players"]}
            state["reactionTimes"] = {pid: None for pid in state["players"]}

        return state

    def all_tapped(self, state: Dict[str, Any]) -> bool:
        """True when every player has a recorded reaction for the current round."""
        return all(v is not None for v in state["reactions"].values())

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state.get("phase") != "finished":
            return None
        scores = state["scores"]
        max_score = max(scores.values())
        leaders = [p for p, s in scores.items() if s == max_score]
        winner = leaders[0] if len(leaders) == 1 else "draw"
        return {"winner": winner, "scores": dict(scores)}
