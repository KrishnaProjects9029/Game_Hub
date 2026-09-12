import copy
import random
from typing import Any, Dict, List, Optional
from .base import ServerSideGame

QUIZ_QUESTIONS = [
    {"q": "What is the capital of France?", "opts": ["Berlin", "Madrid", "Paris", "Rome"], "ans": 2},
    {"q": "Which planet is known as the Red Planet?", "opts": ["Venus", "Mars", "Jupiter", "Saturn"], "ans": 1},
    {"q": "How many legs does a spider have?", "opts": ["6", "8", "10", "12"], "ans": 1},
    {"q": "What is the chemical symbol for gold?", "opts": ["Ag", "Fe", "Au", "Pb"], "ans": 2},
    {"q": "Which gas do plants absorb from the atmosphere?", "opts": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], "ans": 1},
    {"q": "What is the largest ocean on Earth?", "opts": ["Atlantic", "Indian", "Arctic", "Pacific"], "ans": 3},
    {"q": "Who wrote 'Romeo and Juliet'?", "opts": ["Charles Dickens", "William Shakespeare", "Mark Twain", "Homer"], "ans": 1},
    {"q": "What is the square root of 144?", "opts": ["10", "11", "12", "14"], "ans": 2},
    {"q": "What is the primary currency of Japan?", "opts": ["Yuan", "Won", "Yen", "Baht"], "ans": 2},
    {"q": "Which animal is known as the King of the Jungle?", "opts": ["Tiger", "Elephant", "Lion", "Gorilla"], "ans": 2},
]

class QuickQuizGame(ServerSideGame):
    game_id = "quickquiz"
    game_name = "Quick Quiz"
    min_players = 2
    max_players = 6

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        questions = copy.deepcopy(QUIZ_QUESTIONS)
        random.shuffle(questions)
        q_pool = questions[:5]
        return {
            "players": list(player_ids),
            "questions": q_pool,
            "currentRound": 0,
            "totalRounds": len(q_pool),
            "answers": {},
            "scores": {p: 0 for p in player_ids},
            "phase": "question",
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "question":
            return False
        if player_id not in state["players"]:
            return False
        if player_id in state.get("answers", {}):
            return False
        idx = move.get("answerIndex") if "answerIndex" in move else move.get("selectedIndex")
        if idx is None or not (0 <= idx <= 3):
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        idx = move.get("answerIndex") if "answerIndex" in move else move.get("selectedIndex")
        state.setdefault("answers", {})[player_id] = idx

        # If all players submitted
        if len(state["answers"]) >= len(state["players"]):
            curr_q = state["questions"][state["currentRound"]]
            correct = curr_q["ans"]
            for pid, ans in state["answers"].items():
                if ans == correct:
                    state["scores"][pid] = state["scores"].get(pid, 0) + 100

            if state["currentRound"] + 1 >= state["totalRounds"]:
                state["phase"] = "finished"
            else:
                state["currentRound"] += 1
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
