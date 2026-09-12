from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class ServerSideGame(ABC):
    """Abstract base class that every server-side game must implement."""

    game_id: str
    game_name: str
    min_players: int
    max_players: int

    @abstractmethod
    def get_initial_state(self, player_ids: List[str]) -> Dict[str, Any]:
        """Return a fresh game state dict for the given player IDs."""
        ...

    @abstractmethod
    def validate_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> bool:
        """Return True if the move is legal in the current state, False otherwise."""
        ...

    @abstractmethod
    def apply_move(self, state: Dict[str, Any], move: Dict[str, Any], player_id: str) -> Dict[str, Any]:
        """Apply the move to a *copy* of the state and return the new state."""
        ...

    @abstractmethod
    def check_winner(self, state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Return None if the game is still ongoing.
        Otherwise return:
            {"winner": player_id | "draw", "scores": {player_id: int, ...}}
        """
        ...
