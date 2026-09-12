# Brain & Strategy
from .tictactoe import TicTacToeGame
from .connect4 import Connect4Game
from .memorymatch import MemoryMatchGame
from .numberbattle import NumberBattleGame
from .quickquiz import QuickQuizGame

# Quick & Reflex
from .reactionrace import ReactionRaceGame
from .colorclash import ColorClashGame
from .fastestfinger import FastestFingerGame
from .targettap import TargetTapGame

# Party & Social
from .rps import RPSGame
from .bombpass import BombPassGame
from .coinflip import CoinFlipGame
from .luckycard import LuckyCardGame

# Action & Arcade
from .miniracing import MiniRacingGame
from .obstaclerush import ObstacleRushGame
from .battlearena import BattleArenaGame
from .ninjadodge import NinjaDodgeGame
from .spacedodge import SpaceDodgeGame

_reaction_game = ReactionRaceGame()

GAME_REGISTRY = {
    # Brain & Strategy
    "tictactoe": TicTacToeGame(),
    "connect4": Connect4Game(),
    "memorymatch": MemoryMatchGame(),
    "numberbattle": NumberBattleGame(),
    "quickquiz": QuickQuizGame(),

    # Quick & Reflex
    "reactionrace": _reaction_game,
    "reactionrush": _reaction_game,
    "colorclash": ColorClashGame(),
    "fastestfinger": FastestFingerGame(),
    "targettap": TargetTapGame(),

    # Party & Social
    "rps": RPSGame(),
    "bombpass": BombPassGame(),
    "coinflip": CoinFlipGame(),
    "luckycard": LuckyCardGame(),

    # Action & Arcade
    "miniracing": MiniRacingGame(),
    "obstaclerush": ObstacleRushGame(),
    "battlearena": BattleArenaGame(),
    "ninjadodge": NinjaDodgeGame(),
    "spacedodge": SpaceDodgeGame(),
}
