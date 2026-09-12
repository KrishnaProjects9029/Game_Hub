import copy
from typing import Any, Dict, List, Optional

from .base import ServerSideGame


class TicTacToeGame(ServerSideGame):
    """Server-side Tic Tac Toe (3x3).  Supports exactly 2 players."""

    game_id = "tictactoe"
    game_name = "Tic Tac Toe"
    min_players = 2
    max_players = 2

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "board": [[None, None, None], [None, None, None], [None, None, None]],
            "players": list(player_ids),
            "current_player_index": 0,
            "turn_count": 0,
            "phase": "playing",
            "marks": {player_ids[0]: "X", player_ids[1]: "O"},
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        players = state["players"]
        if player_id != players[state["current_player_index"]]:
            return False
        row = move.get("row")
        col = move.get("col")
        if row is None or col is None:
            return False
        if not (0 <= row <= 2 and 0 <= col <= 2):
            return False
        if state["board"][row][col] is not None:
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        row, col = move["row"], move["col"]
        mark = state["marks"][player_id]
        state["board"][row][col] = mark
        state["turn_count"] += 1
        # Switch turn
        state["current_player_index"] = (state["current_player_index"] + 1) % 2
        # Check for terminal state
        result = self.check_winner(state)
        if result is not None:
            state["phase"] = "finished"
        return state

    def _lines(self, board) -> List[List]:
        lines = []
        # Rows
        for r in range(3):
            lines.append([board[r][c] for c in range(3)])
        # Cols
        for c in range(3):
            lines.append([board[r][c] for r in range(3)])
        # Diagonals
        lines.append([board[i][i] for i in range(3)])
        lines.append([board[i][2 - i] for i in range(3)])
        return lines

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        board = state["board"]
        marks = state["marks"]
        # Reverse lookup: mark -> player_id
        mark_to_pid = {v: k for k, v in marks.items()}

        for line in self._lines(board):
            if line[0] is not None and all(cell == line[0] for cell in line):
                winner_pid = mark_to_pid[line[0]]
                loser_pid = [p for p in state["players"] if p != winner_pid][0]
                return {
                    "winner": winner_pid,
                    "scores": {winner_pid: 100, loser_pid: 0},
                }
        # Check draw (board full)
        if all(state["board"][r][c] is not None for r in range(3) for c in range(3)):
            return {
                "winner": "draw",
                "scores": {p: 50 for p in state["players"]},
            }
        return None
