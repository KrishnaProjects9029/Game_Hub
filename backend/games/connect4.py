import copy
from typing import Any, Dict, List, Optional

from .base import ServerSideGame

ROWS = 6
COLS = 7


class Connect4Game(ServerSideGame):
    """Server-side Connect 4 (6x7).  Supports exactly 2 players."""

    game_id = "connect4"
    game_name = "Connect 4"
    min_players = 2
    max_players = 2

    def _empty_board(self) -> List[List[Optional[str]]]:
        return [[None] * COLS for _ in range(ROWS)]

    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        return {
            "board": self._empty_board(),
            "players": list(player_ids),
            "current_player_index": 0,
            "phase": "playing",
            "colors": {player_ids[0]: "R", player_ids[1]: "Y"},
        }

    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        if state.get("phase") != "playing":
            return False
        if player_id != state["players"][state["current_player_index"]]:
            return False
        col = move.get("col")
        if col is None or not isinstance(col, int):
            return False
        if not (0 <= col < COLS):
            return False
        # Column full if top row is occupied
        if state["board"][0][col] is not None:
            return False
        return True

    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        state = copy.deepcopy(state)
        col = move["col"]
        color = state["colors"][player_id]
        # Drop piece to lowest empty row
        for row in range(ROWS - 1, -1, -1):
            if state["board"][row][col] is None:
                state["board"][row][col] = color
                break
        state["current_player_index"] = (state["current_player_index"] + 1) % 2
        result = self.check_winner(state)
        if result is not None:
            state["phase"] = "finished"
        return state

    def _check_four(self, board, color) -> bool:
        """Return True if color has four in a row anywhere on the board."""
        # Horizontal
        for r in range(ROWS):
            for c in range(COLS - 3):
                if all(board[r][c + i] == color for i in range(4)):
                    return True
        # Vertical
        for c in range(COLS):
            for r in range(ROWS - 3):
                if all(board[r + i][c] == color for i in range(4)):
                    return True
        # Diagonal down-right
        for r in range(ROWS - 3):
            for c in range(COLS - 3):
                if all(board[r + i][c + i] == color for i in range(4)):
                    return True
        # Diagonal down-left
        for r in range(ROWS - 3):
            for c in range(3, COLS):
                if all(board[r + i][c - i] == color for i in range(4)):
                    return True
        return False

    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        board = state["board"]
        colors = state["colors"]
        color_to_pid = {v: k for k, v in colors.items()}

        for color, pid in color_to_pid.items():
            if self._check_four(board, color):
                loser = [p for p in state["players"] if p != pid][0]
                return {"winner": pid, "scores": {pid: 100, loser: 0}}

        # Draw: board completely full
        if all(board[0][c] is not None for c in range(COLS)):
            return {"winner": "draw", "scores": {p: 50 for p in state["players"]}}

        return None
