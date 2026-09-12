import copy
from typing import Any, Dict, List, Optional

from .base import ServerSideGame

VALID_CHOICES = {"rock", "paper", "scissors"}
# choice -> set of choices it beats
BEATS = {"rock": {"scissors"}, "paper": {"rock"}, "scissors": {"paper"}}


class RPSGame(ServerSideGame):
    """Server-side Rock Paper Scissors.  Best-of-5 for 2 players; best-of-3 for 3+.
    For 3+ players: if all same -> draw round; if all different -> draw round;
    otherwise the player(s) whose choice is beaten by another player's choice lose
    that round (they get no point). Players are NOT eliminated across rounds.
    """

    game_id = "rps"
    game_name = "Rock Paper Scissors"
    min_players = 2
    max_players = 4

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        rounds_to_win = 3 if len(player_ids) == 2 else 2
        return {
            "players": list(player_ids),
            "choices": {pid: None for pid in player_ids},
            "round": 1,
            "round_results": [],
            "roundHistory": [],
            "scores": {pid: 0 for pid in player_ids},
            "rounds_to_win": rounds_to_win,
            "totalRounds": rounds_to_win * 2 - 1,
            "phase": "choosing",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") not in ("playing", "choosing"):
            return False
        if player_id not in state["players"]:
            return False
        if state["choices"].get(player_id) is not None:
            # Already chose this round
            return False
        choice = move.get("choice", "")
        return choice in VALID_CHOICES

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        state["choices"][player_id] = move["choice"]

        # Check if all players have chosen
        if all(v is not None for v in state["choices"].values()):
            state = self._resolve_round(state)

        return state

    def _resolve_round(self, state: Dict[str, Any]) -> Dict[str, Any]:
        choices = state["choices"]
        players = state["players"]
        unique_choices = set(choices.values())

        round_winners: List[str] = []

        if len(unique_choices) == 1:
            # All the same -> draw round, nobody scores
            round_result = {
                "round": state["round"],
                "choices": dict(choices),
                "result": "draw",
                "round_winners": [],
            }
        elif len(players) == 2:
            p0, p1 = players
            c0, c1 = choices[p0], choices[p1]
            if c1 in BEATS[c0]:
                round_winners = [p0]
            elif c0 in BEATS[c1]:
                round_winners = [p1]
            else:
                round_winners = []  # draw (shouldn't happen in 2-player with diff choices)
            round_result = {
                "round": state["round"],
                "choices": dict(choices),
                "result": "winner" if round_winners else "draw",
                "round_winners": round_winners,
            }
        else:
            # 3+ players: find who beats whom
            # A player wins the round if at least one other player's choice loses to theirs
            # A player loses the round if at least one other player's choice beats theirs
            losers = set()
            for pid, choice in choices.items():
                for other_pid, other_choice in choices.items():
                    if pid != other_pid and choice in BEATS.get(other_choice, set()):
                        losers.add(pid)

            # Winners are non-losers when there are actual losers
            if not losers or len(losers) == len(players):
                # All eliminated or none -> draw
                round_winners = []
            else:
                round_winners = [p for p in players if p not in losers]

            round_result = {
                "round": state["round"],
                "choices": dict(choices),
                "result": "winner" if round_winners else "draw",
                "round_winners": round_winners,
            }

        # Award points
        for pid in round_winners:
            state["scores"][pid] += 1

        state["round_results"].append(round_result)
        state["roundHistory"] = [
            {
                "round": r["round"],
                "choices": r["choices"],
                "winner": r["round_winners"][0] if len(r["round_winners"]) == 1 else "draw",
            }
            for r in state["round_results"]
        ]

        # Check if someone reached rounds_to_win
        result = self.check_winner(state)
        if result is not None:
            state["phase"] = "finished"
        else:
            # Prepare next round
            state["round"] += 1
            state["choices"] = {pid: None for pid in players}
            state["phase"] = "choosing"

        return state

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if state.get("phase") == "finished":
            # Already resolved - find who has most points
            scores = state["scores"]
            max_score = max(scores.values())
            leaders = [p for p, s in scores.items() if s == max_score]
            winner = leaders[0] if len(leaders) == 1 else "draw"
            return {"winner": winner, "scores": {p: s * 50 for p, s in scores.items()}}

        scores = state["scores"]
        rtw = state["rounds_to_win"]

        for pid, wins in scores.items():
            if wins >= rtw:
                losers = [p for p in state["players"] if p != pid]
                result_scores = {pid: wins * 50}
                for lp in losers:
                    result_scores[lp] = scores[lp] * 50
                return {"winner": pid, "scores": result_scores}

        # Check if all rounds exhausted (max rounds = rounds_to_win * 2 - 1)
        max_rounds = state["rounds_to_win"] * 2 - 1
        if state["round"] > max_rounds and all(v is None for v in state["choices"].values()):
            max_score = max(scores.values())
            leaders = [p for p, s in scores.items() if s == max_score]
            winner = leaders[0] if len(leaders) == 1 else "draw"
            return {"winner": winner, "scores": {p: s * 50 for p, s in scores.items()}}

        return None
