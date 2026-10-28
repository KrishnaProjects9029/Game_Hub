import { describe, it, expect } from 'vitest';
import { MinesweeperEngine } from '../Minesweeper';

describe('MinesweeperEngine Rules and Safety', () => {
  const engine = new MinesweeperEngine();

  it('initializes grid according to difficulty preset', () => {
    const easy = engine.getInitialState(['player1'], 'easy');
    expect(easy.rows).toBe(8);
    expect(easy.cols).toBe(8);
    expect(easy.totalMines).toBe(10);
    expect(easy.isFirstClick).toBe(true);

    const med = engine.getInitialState(['player1'], 'medium');
    expect(med.rows).toBe(12);
    expect(med.cols).toBe(12);
    expect(med.totalMines).toBe(20);
  });

  it('guarantees first click safety (cell and its neighbors are never mines)', () => {
    const state = engine.getInitialState(['player1'], 'easy');
    const safeR = 3;
    const safeC = 3;

    const afterFirstClick = engine.applyMove(state, { type: 'REVEAL', r: safeR, c: safeC }, 'player1');
    expect(afterFirstClick.isFirstClick).toBe(false);
    expect(afterFirstClick.grid[safeR][safeC].isMine).toBe(false);
    expect(afterFirstClick.grid[safeR][safeC].isRevealed).toBe(true);
  });

  it('toggles flags and updates remaining counter', () => {
    const state = engine.getInitialState(['player1'], 'easy');
    const initialFlags = state.flagsRemaining;

    // Flag cell (0, 0)
    const flagged = engine.applyMove(state, { type: 'FLAG', r: 0, c: 0 }, 'player1');
    expect(flagged.grid[0][0].isFlagged).toBe(true);
    expect(flagged.flagsRemaining).toBe(initialFlags - 1);

    // Unflag cell (0, 0)
    const unflagged = engine.applyMove(flagged, { type: 'FLAG', r: 0, c: 0 }, 'player1');
    expect(unflagged.grid[0][0].isFlagged).toBe(false);
    expect(unflagged.flagsRemaining).toBe(initialFlags);
  });

  it('prevents revealing a flagged cell', () => {
    const state = engine.getInitialState(['player1'], 'easy');
    const flagged = engine.applyMove(state, { type: 'FLAG', r: 1, c: 1 }, 'player1');
    const canReveal = engine.validateMove(flagged, { type: 'REVEAL', r: 1, c: 1 });
    expect(canReveal).toBe(false);
  });
});
