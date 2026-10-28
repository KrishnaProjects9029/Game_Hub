import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import { GAME_REGISTRY, getGameDefinition } from '../games/engine/GameRegistry';
import { EmbeddedGamePlayer } from '../components/game/EmbeddedGamePlayer';
import { Move, WinResult } from '../games/engine/GameEngine';
import { gameWS } from '../network/websocket';
import { Header } from '../components/layout/Header';

// Game UIs
import { TicTacToeUI } from '../games/tictactoe/TicTacToeUI';
import { Connect4UI } from '../games/connect4/Connect4UI';
import { MemoryMatchUI } from '../games/memorymatch/MemoryMatchUI';
import { NumberBattleUI } from '../games/numberbattle/NumberBattleUI';
import { QuickQuizUI } from '../games/quickquiz/QuickQuizUI';

import { ReactionRaceUI } from '../games/reactionrace/ReactionRaceUI';
import { ColorClashUI } from '../games/colorclash/ColorClashUI';
import { FastestFingerUI } from '../games/fastestfinger/FastestFingerUI';
import { TargetTapUI } from '../games/targettap/TargetTapUI';

import { RPSUI } from '../games/rps/RPSUI';
import { BombPassUI } from '../games/bombpass/BombPassUI';
import { CoinFlipUI } from '../games/coinflip/CoinFlipUI';
import { LuckyCardUI } from '../games/luckycard/LuckyCardUI';

import { MiniRacingUI } from '../games/miniracing/MiniRacingUI';
import { ObstacleRushUI } from '../games/obstaclerush/ObstacleRushUI';
import { BattleArenaUI } from '../games/battlearena/BattleArenaUI';
import { NinjaDodgeUI } from '../games/ninjadodge/NinjaDodgeUI';
import { SpaceDodgeUI } from '../games/spacedodge/SpaceDodgeUI';
import { SnakeUI } from '../games/snake/SnakeUI';
import { Game2048UI } from '../games/game2048/Game2048UI';
import { TetrisUI } from '../games/tetris/TetrisUI';
import { MinesweeperUI } from '../games/minesweeper/MinesweeperUI';
import { BreakoutUI } from '../games/breakout/BreakoutUI';
import { CheckersUI } from '../games/checkers/CheckersUI';


// State Types
import { TTTState } from '../games/tictactoe/TicTacToe';
import { C4State } from '../games/connect4/Connect4';
import { MemoryMatchState } from '../games/memorymatch/MemoryMatch';
import { NumberBattleState } from '../games/numberbattle/NumberBattle';
import { QuickQuizState } from '../games/quickquiz/QuickQuiz';

import { RRState } from '../games/reactionrace/ReactionRace';
import { ColorClashState } from '../games/colorclash/ColorClash';
import { FastestFingerState } from '../games/fastestfinger/FastestFinger';
import { TargetTapState } from '../games/targettap/TargetTap';

import { RPSState } from '../games/rps/RockPaperScissors';
import { BombPassState } from '../games/bombpass/BombPass';
import { CoinFlipState } from '../games/coinflip/CoinFlip';
import { LuckyCardState } from '../games/luckycard/LuckyCard';

import { MiniRacingState } from '../games/miniracing/MiniRacing';
import { ObstacleRushState } from '../games/obstaclerush/ObstacleRush';
import { BattleArenaState } from '../games/battlearena/BattleArena';
import { NinjaDodgeState } from '../games/ninjadodge/NinjaDodge';
import { SpaceDodgeState } from '../games/spacedodge/SpaceDodge';

type GameMode = 'single' | 'multi' | 'passplay';

export const GamePlay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId: urlGameId, roomCode } = useParams<{ gameId?: string; roomCode?: string }>();
  const { currentPlayer, loadPlayers } = usePlayerStore();
  const { activeGame, difficulty, isSinglePlayer, setGameState, resetGame } = useGameStore();

  const [localState, setLocalState] = useState<unknown>(null);
  const localStateRef = useRef<unknown>(null);
  localStateRef.current = localState;
  const [isOver, setIsOver] = useState(false);
  const [winResult, setWinResult] = useState<WinResult | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiThinkingText, setAiThinkingText] = useState('Opponent is thinking...');
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continuousAiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rawGameId = urlGameId ?? activeGame ?? (location.state as { gameId?: string })?.gameId ?? '';
  const gameId = rawGameId === 'reactionrace' ? 'reactionrush' : rawGameId;
  const engine = GAME_REGISTRY[gameId] || GAME_REGISTRY[rawGameId];

  const mode: GameMode = roomCode ? 'multi' : isSinglePlayer ? 'single' : 'passplay';

  // Current player info
  const effectivePlayerId = currentPlayer?.id || 'player1';
  const effectivePlayerName = currentPlayer?.username || 'Player 1';

  // Pass-and-play players (from location state)
  const papPlayers: Array<{ id: string; name: string; avatar: string }> =
    (location.state as { players?: Array<{ id: string; name: string; avatar: string }> })?.players ?? [
      { id: effectivePlayerId, name: effectivePlayerName, avatar: currentPlayer?.avatar ?? '🎮' },
      { id: 'player2', name: 'Player 2', avatar: '🤖' },
    ];

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Helper to normalize multiplayer state from server
  const normalizeState = useCallback((raw: any, gid: string) => {
    if (!raw) return raw;
    if (gid === 'rps') {
      const history = (raw.roundHistory || raw.round_results || []).map((r: any) => ({
        round: r.round,
        choices: r.choices || {},
        winner: r.winner || (r.round_winners && r.round_winners.length === 1 ? r.round_winners[0] : 'draw'),
      }));
      const phase = raw.phase === 'playing' ? 'choosing' : (raw.phase || 'choosing');
      return {
        ...raw,
        players: raw.players || [],
        playerNames: raw.playerNames || {},
        choices: raw.choices || {},
        scores: raw.scores || {},
        round: raw.round || 1,
        totalRounds: raw.totalRounds || (raw.rounds_to_win ? raw.rounds_to_win * 2 - 1 : 5),
        phase,
        roundHistory: history,
        winner: raw.winner || null,
        lastRoundResult: raw.lastRoundResult || (history[history.length - 1]?.winner) || null,
      };
    }
    if (gid === 'reactionrace' || gid === 'reactionrush') {
      const reactions = raw.reactionTimes || raw.reactions || {};
      let phase = raw.phase;
      if (phase === 'react') phase = 'go';
      if (phase === 'round_over') phase = 'results';
      const history = (raw.roundHistory || raw.round_results || []).map((r: any) => {
        const times: Record<string, number | null> = {};
        if (r.times) Object.assign(times, r.times);
        if (r.results) {
          for (const res of r.results) {
            times[res.player_id] = res.reaction_ms;
          }
        }
        return {
          round: r.round,
          times,
          winnerId: r.winnerId || r.winner || 'draw',
        };
      });
      return {
        ...raw,
        players: raw.players || [],
        playerNames: raw.playerNames || {},
        phase: phase || 'waiting',
        scores: raw.scores || {},
        reactionTimes: reactions,
        round: raw.round || 1,
        totalRounds: raw.totalRounds || raw.total_rounds || 5,
        signalTime: raw.signalTime || raw.signal_sent_ms || null,
        countdownValue: raw.countdownValue ?? 3,
        roundHistory: history,
        winner: raw.winner || null,
        falseStart: raw.falseStart || {},
      };
    }
    return raw;
  }, []);

  // Initialize game
  useEffect(() => {
    if (!engine) return;
    let playerIds: string[];
    let playerNames: Record<string, string>;

    if (mode === 'single') {
      playerIds = [effectivePlayerId, '__ai__'];
      playerNames = { [effectivePlayerId]: effectivePlayerName, '__ai__': 'AI Opponent' };
    } else if (mode === 'passplay') {
      playerIds = papPlayers.map(p => p.id);
      playerNames = Object.fromEntries(papPlayers.map(p => [p.id, p.name]));
    } else {
      playerIds = [effectivePlayerId];
      playerNames = { [effectivePlayerId]: effectivePlayerName };
    }

    const initState = engine.getInitialState(playerIds, playerNames);
    setLocalState(initState);
    setGameState(initState);
    setIsOver(false);
    setWinResult(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, mode]);

  // WS message handling for multiplayer
  useEffect(() => {
    if (mode !== 'multi') return;

    gameWS.on('game_state', (data: unknown) => {
      const d = data as { state: unknown };
      const norm = normalizeState(d.state, gameId);
      setLocalState(norm);
      setGameState(norm);
    });

    gameWS.on('reaction_countdown', (data: unknown) => {
      const d = data as { seconds: number };
      setLocalState((prev: any) => ({
        ...prev,
        phase: 'countdown',
        countdownValue: d.seconds,
      }));
    });

    gameWS.on('reaction_go', (data: unknown) => {
      const d = data as { signal_timestamp: number };
      setLocalState((prev: any) => ({
        ...prev,
        phase: 'go',
        signalTime: d.signal_timestamp,
      }));
    });

    gameWS.on('reaction_round_result', (data: unknown) => {
      const d = data as { results: any[]; round: number; scores: any };
      setLocalState((prev: any) => {
        const times: Record<string, number | null> = {};
        for (const res of d.results || []) {
          times[res.player_id] = res.reaction_ms;
        }
        const history = [...(prev?.roundHistory || []), { round: d.round, times, winnerId: 'draw' }];
        return {
          ...prev,
          phase: 'results',
          scores: d.scores || prev?.scores || {},
          reactionTimes: times,
          roundHistory: history,
        };
      });
    });

    gameWS.on('game_over', (data: unknown) => {
      const d = data as { result?: WinResult; winner_id?: string; scores?: any; state?: unknown };
      const res: WinResult = d.result || {
        winner: d.winner_id || 'draw',
        scores: d.scores || {},
      };
      if (d.state) {
        const norm = normalizeState(d.state, gameId);
        setLocalState(norm);
      }
      setWinResult(res);
      setIsOver(true);
    });

    return () => {
      gameWS.off('game_state');
      gameWS.off('reaction_countdown');
      gameWS.off('reaction_go');
      gameWS.off('reaction_round_result');
      gameWS.off('game_over');
    };
  }, [mode, gameId, normalizeState, setGameState]);

  const applyMove = useCallback((move: Move, playerId: string) => {
    const currentState = (localStateRef.current || localState) as any;
    if (!engine || !currentState) return;
    if (!engine.validateMove(currentState, move, playerId)) return;

    const newState = engine.applyMove(currentState, move, playerId);
    localStateRef.current = newState;
    setLocalState(newState);
    setGameState(newState);

    const result = engine.checkWinner(newState);
    if (result || engine.isGameOver(newState)) {
      setIsOver(true);
      setWinResult(result);
    }
  }, [engine, localState, setGameState]);

  // Turn-based AI move trigger (TicTacToe, Connect4, LuckyCard, MemoryMatch, CoinFlip)
  const isTurnBased = ['tictactoe', 'connect4', 'luckycard', 'coinflip', 'memorymatch'].includes(gameId);
  useEffect(() => {
    if (mode !== 'single' || !localState || isOver || !engine || !isTurnBased) {
      setIsAiThinking(false);
      return;
    }

    const state = localState as { players?: string[]; currentPlayerIndex?: number; phase?: string };
    if (state.phase && state.phase !== 'playing') {
      setIsAiThinking(false);
      return;
    }
    const currentIdx = state.currentPlayerIndex ?? 0;
    const players = state.players ?? [];
    const currentTurnId = players[currentIdx];
    if (currentTurnId !== '__ai__') {
      setIsAiThinking(false);
      return;
    }

    // AI is actively deliberating like a human player
    setIsAiThinking(true);
    const thinkingPrompts = [
      'Opponent is thinking...',
      'Opponent is considering next move...',
      'Opponent is calculating...',
      'Opponent is weighing options...',
    ];
    setAiThinkingText(thinkingPrompts[Math.floor(Math.random() * thinkingPrompts.length)]);

    // Dynamic human hesitation delay based on game complexity & board state
    const baseJitter = Math.floor(Math.random() * 260 - 120);
    let delay = 950 + baseJitter;

    if (gameId === 'tictactoe') {
      const board = (state as any)?.board as (string | null)[][];
      const filledCount = board ? board.flat().filter(Boolean).length : 0;
      delay = filledCount <= 1 ? 850 + baseJitter : filledCount >= 5 ? 750 + baseJitter : 1250 + baseJitter;
    } else if (gameId === 'connect4') {
      const board = (state as any)?.board as (string | null)[][];
      const filledCount = board ? board.flat().filter(Boolean).length : 0;
      delay = filledCount <= 2 ? 1000 + baseJitter : 1550 + baseJitter;
    } else if (gameId === 'memorymatch') {
      const flipped = (state as any)?.flippedCardIds?.length || 0;
      delay = flipped === 0 ? 1050 + baseJitter : 800 + baseJitter;
    }

    aiTimerRef.current = setTimeout(() => {
      setIsAiThinking(false);
      const aiMove = engine.getAIMove(localState, '__ai__', difficulty);
      applyMove(aiMove, '__ai__');
    }, Math.max(450, delay));

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [localState, mode, isOver, engine, difficulty, gameId, isTurnBased, applyMove]);

  // Concurrent prompt-response AI trigger (Quick Quiz & Number Battle)
  // Real humans begin solving immediately when the question appears
  useEffect(() => {
    if (mode !== 'single' || !localState || isOver || !engine) return;
    if (gameId !== 'quickquiz' && gameId !== 'numberbattle') return;

    const state = localState as any;
    if (state.phase !== 'question' && state.phase !== 'answering') return;
    const humanId = state.players?.[0];
    const aiId = state.players?.find((p: string) => p !== humanId) || '__ai__';

    // If AI already answered this challenge, do nothing
    if (state.playerAnswers?.[aiId] !== null) return;

    // AI begins solving concurrently with human
    const aiMove = engine.getAIMove(state, aiId, difficulty);
    const solveDelay = Math.max(900, (aiMove as any).timeMs || 1800);

    const timer = setTimeout(() => {
      const cur = (localStateRef.current || localState) as any;
      if (!cur || isOver) return;
      if (cur.phase !== 'question' && cur.phase !== 'answering') return;
      if (cur.playerAnswers?.[aiId] === null) {
        applyMove(aiMove, aiId);
      }
    }, solveDelay);

    return () => clearTimeout(timer);
  }, [localState, mode, gameId, isOver, engine, difficulty, applyMove]);

  // Continuous / Real-time Action AI loop (Racing, Obstacle, Dodge, Arena, Clash, Finger, Tap)
  const isRealTimeAction = ['miniracing', 'obstaclerush', 'battlearena', 'ninjadodge', 'spacedodge', 'colorclash', 'fastestfinger', 'targettap'].includes(gameId);
  useEffect(() => {
    if (mode !== 'single' || !localState || isOver || !engine || !isRealTimeAction) return;

    continuousAiTimerRef.current = setInterval(() => {
      if (isOver) return;
      try {
        const aiMove = engine.getAIMove(localState, '__ai__', difficulty);
        if (aiMove && Object.keys(aiMove).length > 0) {
          applyMove(aiMove, '__ai__');
        }
      } catch (err) {
        console.error('AI step error:', err);
      }
    }, gameId === 'miniracing' ? 800 : gameId === 'obstaclerush' ? 900 : 1200);

    return () => {
      if (continuousAiTimerRef.current) clearInterval(continuousAiTimerRef.current);
    };
  }, [localState, mode, isOver, engine, difficulty, gameId, isRealTimeAction, applyMove]);

  // RPS Single Player: AI chooses after human makes choice with human hesitation
  useEffect(() => {
    if (mode !== 'single' || gameId !== 'rps' || !localState || isOver || !engine) return;
    const rpsState = localState as RPSState;
    if (rpsState.phase !== 'choosing') {
      setIsAiThinking(false);
      return;
    }
    const humanId = rpsState.players[0];
    const aiId = rpsState.players.find(p => p !== humanId) || '__ai__';

    if (rpsState.choices[humanId] === null) return;
    if (rpsState.choices[aiId] !== null) return;

    setIsAiThinking(true);
    setAiThinkingText('Opponent is revealing hand...');
    const delay = Math.floor(Math.random() * 320 + 620);

    const timer = setTimeout(() => {
      setIsAiThinking(false);
      const aiMove = engine.getAIMove(rpsState, aiId, difficulty);
      applyMove(aiMove, aiId);
    }, delay);

    return () => {
      clearTimeout(timer);
      setIsAiThinking(false);
    };
  }, [localState, mode, gameId, isOver, engine, difficulty, applyMove]);

  // RPS: Auto-advance from 'revealing' to 'choosing' for next round
  useEffect(() => {
    if (gameId !== 'rps' || !localState || isOver) return;
    const rpsState = localState as RPSState;
    if (rpsState.phase !== 'revealing') return;

    const timer = setTimeout(() => {
      setLocalState((prev: unknown) => {
        const s = prev as RPSState;
        if (!s || s.phase !== 'revealing') return s;
        const nextState: RPSState = {
          ...s,
          phase: 'choosing',
          choices: Object.fromEntries(s.players.map(p => [p, null])),
        };
        setGameState(nextState);
        return nextState;
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, [localState, gameId, isOver, setGameState]);

  const rrAiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reaction Race Single Player: AI taps when phase is 'go'
  useEffect(() => {
    if (mode !== 'single' || (gameId !== 'reactionrace' && gameId !== 'reactionrush') || !localState || isOver || !engine) return;
    const rrState = localState as RRState;
    if (rrState.phase !== 'go') {
      if (rrAiTimerRef.current) {
        clearTimeout(rrAiTimerRef.current);
        rrAiTimerRef.current = null;
      }
      return;
    }

    const aiId = rrState.players.find(p => p !== rrState.players[0]) || '__ai__';
    if (rrState.reactionTimes?.[aiId] !== null) return;
    if (rrAiTimerRef.current) return;

    const aiMove = engine.getAIMove(rrState, aiId, difficulty) as { type: 'tap'; reactionMs: number };
    const isFalseStart = (aiMove.reactionMs || 0) < 0;
    const delay = isFalseStart ? 80 : Math.max(195, aiMove.reactionMs || 300);

    rrAiTimerRef.current = setTimeout(() => {
      rrAiTimerRef.current = null;
      setLocalState((prev: unknown) => {
        const s = prev as RRState;
        if (!s || s.phase !== 'go' || s.reactionTimes?.[aiId] !== null) return s;
        const next = (engine.applyMove(s, aiMove, aiId) as unknown) as RRState;
        setGameState(next);
        const result = engine.checkWinner(next);
        if (result || engine.isGameOver(next)) {
          setIsOver(true);
          setWinResult(result);
        }
        return next;
      });
    }, delay);
  }, [localState, mode, gameId, isOver, engine, difficulty, setGameState]);

  function handleMove(move: Move) {
    if (mode === 'multi') {
      gameWS.send({ type: 'make_move', move, playerId: effectivePlayerId });
      return;
    }
    const cur = (localStateRef.current || localState) as any;
    const localPid = cur?.players?.[0] || effectivePlayerId;
    const targetPid = (move as any).playerId || localPid;
    applyMove(move, targetPid);
  }

  function handlePassPlayMove(move: Move) {
    const cur = (localStateRef.current || localState) as any;
    if (!cur || !engine) return;
    if (gameId === 'rps') {
      const s = cur as RPSState;
      const unchosen = s.players.find(p => s.choices[p] === null) || s.players[0];
      applyMove(move, unchosen);
      return;
    }
    if (gameId === 'numberbattle' || gameId === 'quickquiz') {
      const unchosen = (cur.players || []).find((p: string) => cur.playerAnswers?.[p] === null) || cur.players?.[0];
      const targetPid = (move as any).playerId || unchosen;
      applyMove(move, targetPid);
      return;
    }
    const currentIdx = cur.currentPlayerIndex ?? 0;
    const players = cur.players ?? [];
    const currentTurnId = players[currentIdx];
    applyMove(move, currentTurnId);
  }

  function handleResults() {
    navigate('/results', {
      state: {
        result: winResult,
        gameId,
        players: localState
          ? (localState as { players?: string[]; playerNames?: Record<string, string> }).players?.map(id => ({
              id,
              name: (localState as { playerNames?: Record<string, string> }).playerNames?.[id] ?? id,
            }))
          : [],
      },
    });
  }

  useEffect(() => {
    if (isOver) {
      const timer = setTimeout(handleResults, 2200);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);

  // If this is an HTML5-hosted or authorized embed game, render EmbeddedGamePlayer
  const gameDef = getGameDefinition(rawGameId) || getGameDefinition(gameId);
  if (gameDef && (gameDef.integrationType === 'html5_hosted' || gameDef.integrationType === 'authorized_embed')) {
    return (
      <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#070a12' }}>
        <Header />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <EmbeddedGamePlayer game={gameDef} onExit={() => navigate('/singleplayer')} />
        </main>
      </div>
    );
  }

  if (!engine) {
    return (
      <div className="page">
        <Header />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
            <h3>Game not found: {gameId}</h3>
            <button className="btn btn-primary btn-md" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!localState) {
    return (
      <div className="page">
        <Header />
        <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  const state = localState;
  const stateTyped = state as { players?: string[]; currentPlayerIndex?: number; playerNames?: Record<string, string> };
  const currentTurnId = (stateTyped.players ?? [])[stateTyped.currentPlayerIndex ?? 0] ?? effectivePlayerId;
  const isMyTurn = mode === 'multi' ? currentTurnId === effectivePlayerId : mode === 'single' ? currentTurnId === effectivePlayerId : true;
  const playerNames = stateTyped.playerNames ?? {};
  const localPlayerId = mode === 'single' && stateTyped.players?.[0] ? stateTyped.players[0] : effectivePlayerId;

  function renderGame() {
    // 🧠 Brain & Strategy
    if (gameId === 'tictactoe') {
      return (
        <TicTacToeUI
          state={state as TTTState}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={mode === 'passplay' ? currentTurnId : localPlayerId}
          isMyTurn={isMyTurn}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'connect4') {
      return (
        <Connect4UI
          state={state as C4State}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={mode === 'passplay' ? currentTurnId : localPlayerId}
          isMyTurn={isMyTurn}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'memorymatch') {
      return (
        <MemoryMatchUI
          state={state as MemoryMatchState}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={mode === 'passplay' ? currentTurnId : localPlayerId}
          isMyTurn={isMyTurn}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'numberbattle') {
      return (
        <NumberBattleUI
          state={state as NumberBattleState}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={mode === 'passplay' ? currentTurnId : localPlayerId}
          isMyTurn={isMyTurn}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'quickquiz') {
      return (
        <QuickQuizUI
          state={state as QuickQuizState}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={mode === 'passplay' ? currentTurnId : localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }

    // ⚡ Quick & Reflex
    if (gameId === 'reactionrush' || gameId === 'reactionrace') {
      return (
        <ReactionRaceUI
          state={state as RRState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
          isMultiplayer={mode === 'multi'}
        />
      );
    }
    if (gameId === 'colorclash') {
      return (
        <ColorClashUI
          state={state as ColorClashState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'fastestfinger') {
      return (
        <FastestFingerUI
          state={state as FastestFingerState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'targettap') {
      return (
        <TargetTapUI
          state={state as TargetTapState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }

    // 😂 Party & Social
    if (gameId === 'rps') {
      const rState = state as RPSState;
      const passPlayPid = mode === 'passplay' ? (rState.players.find(p => rState.choices[p] === null) || rState.players[0]) : localPlayerId;
      return (
        <RPSUI
          state={rState}
          onMove={mode === 'passplay' ? handlePassPlayMove : handleMove}
          currentPlayerId={passPlayPid}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'bombpass') {
      return (
        <BombPassUI
          state={state as BombPassState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'coinflip') {
      return (
        <CoinFlipUI
          state={state as CoinFlipState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'luckycard') {
      return (
        <LuckyCardUI
          state={state as LuckyCardState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={isMyTurn}
          playerNames={playerNames}
        />
      );
    }

    // 🏎️ Action & Arcade
    if (gameId === 'miniracing') {
      return (
        <MiniRacingUI
          state={state as MiniRacingState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'obstaclerush') {
      return (
        <ObstacleRushUI
          state={state as ObstacleRushState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'battlearena') {
      return (
        <BattleArenaUI
          state={state as BattleArenaState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'ninjadodge') {
      return (
        <NinjaDodgeUI
          state={state as NinjaDodgeState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }
    if (gameId === 'spacedodge') {
      return (
        <SpaceDodgeUI
          state={state as SpaceDodgeState}
          onMove={handleMove}
          currentPlayerId={localPlayerId}
          isMyTurn={true}
          playerNames={playerNames}
        />
      );
    }

        // 🕹️ Core Release Additions
    if (gameId === 'snake') {
      return <SnakeUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'game2048' || gameId === '2048') {
      return <Game2048UI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'tetris') {
      return <TetrisUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'minesweeper') {
      return <MinesweeperUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'breakout') {
      return <BreakoutUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'checkers') {
      return <CheckersUI mode={mode === 'single' ? 'single' : 'passplay'} difficulty={difficulty} onExit={() => navigate(-1)} onGameOver={(w) => { setIsOver(true); setWinResult({ winner: w === 'red' ? effectivePlayerId : 'player2', scores: { [effectivePlayerId]: 10 } }); }} />;
    }

    return <div>Unknown game: {gameId}</div>;
  }

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #161e38 0%, #090c15 70%, #05070c 100%)' }}>
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1.25rem', paddingBottom: '3rem' }}>
        <div className="in-game-cockpit">
          {/* Top Console Command Bar */}
          <div className="in-game-topbar">
            <div className="in-game-title-group">
              <div className="in-game-icon-orb">
                {engine.config.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                  {engine.config.name}
                </h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="in-game-mode-pill">
                    {mode === 'single' ? `vs AI (${difficulty.toUpperCase()})` : mode === 'passplay' ? 'Pass & Play' : 'Online P2P'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    • {engine.config.category}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { resetGame(); navigate(-1); }}
                style={{
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.9rem',
                }}
              >
                ◀ Exit to Hub
              </button>
            </div>
          </div>

        {/* Pass-and-play turn indicator */}
        {mode === 'passplay' && (
          <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
            📱 Pass device to: <span style={{ color: 'var(--accent)' }}>{playerNames[currentTurnId] ?? currentTurnId}</span>
          </div>
        )}

        {/* AI Deliberation status in Single Player */}
        {mode === 'single' && isAiThinking && !isOver && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <div className="ai-deliberating-banner">
              <span>🤖</span>
              <span>{aiThinkingText}</span>
              <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '2px' }}>
                <span className="ai-dot">.</span>
                <span className="ai-dot">.</span>
                <span className="ai-dot">.</span>
              </span>
            </div>
          </div>
        )}

        {isOver && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center', animation: 'cellPop 0.4s ease' }}>
            <span style={{ fontWeight: 800, color: 'var(--success)' }}>
              {winResult?.winner === 'draw' ? "🤝 It's a Draw!" : `🎉 ${playerNames[winResult?.winner ?? ''] ?? winResult?.winner} Wins!`}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Going to results...</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {renderGame()}
        </div>
      </div>
    </div>
    </div>
  );
};
