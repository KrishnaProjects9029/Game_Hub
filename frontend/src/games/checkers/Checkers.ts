import { GameConfig, GameEngine, Move, WinResult } from '../engine/GameEngine';

export type PieceColor = 'red' | 'black';

export interface CheckersPiece {
  id: string;
  color: PieceColor;
  isKing: boolean;
}

export type CheckersCell = CheckersPiece | null;

export interface CheckersMove {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
}

export interface CheckersState {
  board: CheckersCell[][]; // 8x8
  turn: PieceColor; // 'red' (player1) or 'black' (player2/AI)
  selectedPiece: { r: number; c: number } | null;
  validMoves: Array<{ toR: number; toC: number; isCapture: boolean }>;
  redPiecesCount: number;
  blackPiecesCount: number;
  isGameOver: boolean;
  winner: PieceColor | 'draw' | null;
  playerIds: string[];
}

export class CheckersEngine implements GameEngine<CheckersState> {
  config: GameConfig = {
    id: 'checkers',
    name: 'Checkers Classic',
    category: 'brain',
    description: 'Jump, crown your kings, and capture all opponent pieces on the 8x8 checkerboard showdown!',
    supportsSinglePlayer: true,
    supportsMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'medium',
    icon: '🏁',
    estimatedDuration: '5-12 min',
    controls: {
      desktop: 'Click a piece to see legal moves, then click highlighted target cell',
      touch: 'Tap piece then tap destination cell',
    },
    status: 'playable',
    phase: 1,
    isFeatured: true,
    popularityRank: 8,
  };

  getInitialState(playerIds: string[], _playerNames?: Record<string, string>): CheckersState {
    const board: CheckersCell[][] = Array.from({ length: 8 }, () => Array(8).fill(null));

    // Black pieces on rows 0, 1, 2 (dark squares where (r+c) % 2 === 1)
    let pCount = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = { id: `b_${pCount++}`, color: 'black', isKing: false };
        }
      }
    }

    // Red pieces on rows 5, 6, 7
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = { id: `r_${pCount++}`, color: 'red', isKing: false };
        }
      }
    }

    return {
      board,
      turn: 'red',
      selectedPiece: null,
      validMoves: [],
      redPiecesCount: 12,
      blackPiecesCount: 12,
      isGameOver: false,
      winner: null,
      playerIds: playerIds.length > 0 ? playerIds : ['player1', 'player2'],
    };
  }

  getLegalMovesForPiece(
    board: CheckersCell[][],
    r: number,
    c: number
  ): Array<{ toR: number; toC: number; isCapture: boolean; capturedR?: number; capturedC?: number }> {
    const piece = board[r][c];
    if (!piece) return [];

    const moves: Array<{ toR: number; toC: number; isCapture: boolean; capturedR?: number; capturedC?: number }> = [];
    const forwardDirs = piece.color === 'red' ? [-1] : [1];
    const rowDirs = piece.isKing ? [-1, 1] : forwardDirs;
    const colDirs = [-1, 1];

    // 1. Regular 1-step moves
    for (const dr of rowDirs) {
      for (const dc of colDirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === null) {
          moves.push({ toR: nr, toC: nc, isCapture: false });
        }
      }
    }

    // 2. Jump captures
    for (const dr of [-1, 1]) {
      for (const dc of colDirs) {
        if (!piece.isKing && !forwardDirs.includes(dr)) {
          // Normal pieces can only capture forward
          continue;
        }
        const midR = r + dr;
        const midC = c + dc;
        const landingR = r + dr * 2;
        const landingC = c + dc * 2;

        if (landingR >= 0 && landingR < 8 && landingC >= 0 && landingC < 8) {
          const midPiece = board[midR][midC];
          const landingCell = board[landingR][landingC];
          if (midPiece && midPiece.color !== piece.color && landingCell === null) {
            moves.push({ toR: landingR, toC: landingC, isCapture: true, capturedR: midR, capturedC: midC });
          }
        }
      }
    }

    return moves;
  }

  getAllLegalMoves(board: CheckersCell[][], color: PieceColor) {
    const allMoves: Array<{ fromR: number; fromC: number; toR: number; toC: number; isCapture: boolean; capturedR?: number; capturedC?: number }> = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]?.color === color) {
          const pieceMoves = this.getLegalMovesForPiece(board, r, c);
          pieceMoves.forEach((m) => allMoves.push({ fromR: r, fromC: c, ...m }));
        }
      }
    }
    return allMoves;
  }

  validateMove(state: CheckersState, move: Move, _playerId?: string): boolean {
    if (state.isGameOver) return false;
    if (move.type === 'SELECT_PIECE') {
      const r = move.r as number;
      const c = move.c as number;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
      const piece = state.board[r][c];
      return !!piece && piece.color === state.turn;
    }
    if (move.type === 'MAKE_MOVE') {
      const fromR = move.fromR as number;
      const fromC = move.fromC as number;
      const toR = move.toR as number;
      const toC = move.toC as number;

      const piece = state.board[fromR]?.[fromC];
      if (!piece || piece.color !== state.turn) return false;

      const legal = this.getLegalMovesForPiece(state.board, fromR, fromC);
      return legal.some((m) => m.toR === toR && m.toC === toC);
    }
    if (move.type === 'RESTART') return true;
    return false;
  }

  applyMove(state: CheckersState, move: Move, _playerId?: string): CheckersState {
    if (move.type === 'RESTART') {
      return this.getInitialState(state.playerIds);
    }

    if (move.type === 'SELECT_PIECE') {
      const r = move.r as number;
      const c = move.c as number;
      const valid = this.getLegalMovesForPiece(state.board, r, c);
      return {
        ...state,
        selectedPiece: { r, c },
        validMoves: valid.map((m) => ({ toR: m.toR, toC: m.toC, isCapture: m.isCapture })),
      };
    }

    if (move.type === 'MAKE_MOVE') {
      const fromR = move.fromR as number;
      const fromC = move.fromC as number;
      const toR = move.toR as number;
      const toC = move.toC as number;

      const newBoard = state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
      const piece = newBoard[fromR][fromC];
      if (!piece) return state;

      const legalMoves = this.getLegalMovesForPiece(state.board, fromR, fromC);
      const chosen = legalMoves.find((m) => m.toR === toR && m.toC === toC);
      if (!chosen) return state;

      newBoard[fromR][fromC] = null;

      // Handle king promotion: row 0 for red, row 7 for black
      if (piece.color === 'red' && toR === 0) piece.isKing = true;
      if (piece.color === 'black' && toR === 7) piece.isKing = true;

      newBoard[toR][toC] = piece;

      let redCount = state.redPiecesCount;
      let blackCount = state.blackPiecesCount;

      // Remove captured piece if it was a jump
      if (chosen.isCapture && chosen.capturedR !== undefined && chosen.capturedC !== undefined) {
        const captured = newBoard[chosen.capturedR][chosen.capturedC];
        if (captured?.color === 'red') redCount--;
        if (captured?.color === 'black') blackCount--;
        newBoard[chosen.capturedR][chosen.capturedC] = null;
      }

      // Next turn
      const nextTurn: PieceColor = state.turn === 'red' ? 'black' : 'red';

      // Check win/loss
      const nextPlayerMoves = this.getAllLegalMoves(newBoard, nextTurn);
      const isGameOver = redCount === 0 || blackCount === 0 || nextPlayerMoves.length === 0;
      let winner: PieceColor | 'draw' | null = null;
      if (isGameOver) {
        if (redCount === 0 || (nextTurn === 'red' && nextPlayerMoves.length === 0)) winner = 'black';
        else if (blackCount === 0 || (nextTurn === 'black' && nextPlayerMoves.length === 0)) winner = 'red';
        else winner = 'draw';
      }

      return {
        ...state,
        board: newBoard,
        turn: nextTurn,
        selectedPiece: null,
        validMoves: [],
        redPiecesCount: redCount,
        blackPiecesCount: blackCount,
        isGameOver,
        winner,
      };
    }

    return state;
  }

  checkWinner(state: CheckersState): WinResult | null {
    if (!state.isGameOver || !state.winner) return null;
    const p1 = state.playerIds[0] || 'player1';
    const p2 = state.playerIds[1] || 'player2';
    const winningId = state.winner === 'red' ? p1 : p2;

    return {
      winner: winningId,
      scores: {
        [p1]: state.redPiecesCount * 10,
        [p2]: state.blackPiecesCount * 10,
      },
      reason: `${state.winner.toUpperCase()} Wins!`,
    };
  }

  isGameOver(state: CheckersState): boolean {
    return state.isGameOver;
  }

  getAIMove(state: CheckersState, playerId: string, difficulty: 'easy' | 'medium' | 'hard'): Move {
    const allMoves = this.getAllLegalMoves(state.board, 'black');
    if (allMoves.length === 0) return { type: 'RESTART' };

    // Captures first
    const captureMoves = allMoves.filter((m) => m.isCapture);
    if (captureMoves.length > 0 && difficulty !== 'easy') {
      const chosen = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      return { type: 'MAKE_MOVE', fromR: chosen.fromR, fromC: chosen.fromC, toR: chosen.toR, toC: chosen.toC };
    }

    // Random legal move for easy, or king promotion / forward advancement for hard
    if (difficulty === 'hard') {
      const advanceMoves = allMoves.filter((m) => m.toR > m.fromR);
      if (advanceMoves.length > 0) {
        const chosen = advanceMoves[Math.floor(Math.random() * advanceMoves.length)];
        return { type: 'MAKE_MOVE', fromR: chosen.fromR, fromC: chosen.fromC, toR: chosen.toR, toC: chosen.toC };
      }
    }

    const chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
    return { type: 'MAKE_MOVE', fromR: chosen.fromR, fromC: chosen.fromC, toR: chosen.toR, toC: chosen.toC };
  }
}
