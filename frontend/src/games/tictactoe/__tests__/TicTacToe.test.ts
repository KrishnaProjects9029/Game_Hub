import { describe, it, expect } from 'vitest';
import { TicTacToeEngine } from '../TicTacToe';

describe('TicTacToeEngine Rules and Win Detection', () => {
  const engine = new TicTacToeEngine();

  it('initializes with empty 3x3 board and assigns marks', () => {
    const state = engine.getInitialState(['p1', 'p2'], { p1: 'Alice', p2: 'Bob' });
    expect(state.board.length).toBe(3);
    expect(state.board[0].length).toBe(3);
    expect(state.marks['p1']).toBe('X');
    expect(state.marks['p2']).toBe('O');
    expect(state.phase).toBe('playing');
  });

  it('rejects moves on occupied cells', () => {
    const state = engine.getInitialState(['p1', 'p2'], { p1: 'Alice', p2: 'Bob' });
    const afterFirst = engine.applyMove(state, { row: 1, col: 1 }, 'p1');

    const canMoveSame = engine.validateMove(afterFirst, { row: 1, col: 1 }, 'p2');
    expect(canMoveSame).toBe(false);
  });

  it('detects horizontal win', () => {
    let state = engine.getInitialState(['p1', 'p2'], { p1: 'Alice', p2: 'Bob' });
    state = engine.applyMove(state, { row: 0, col: 0 }, 'p1');
    state = engine.applyMove(state, { row: 1, col: 0 }, 'p2');
    state = engine.applyMove(state, { row: 0, col: 1 }, 'p1');
    state = engine.applyMove(state, { row: 1, col: 1 }, 'p2');
    state = engine.applyMove(state, { row: 0, col: 2 }, 'p1');

    expect(state.phase).toBe('finished');
    expect(engine.isGameOver(state)).toBe(true);
    const winResult = engine.checkWinner(state);
    expect(winResult?.winner).toBe('p1');
  });

  it('detects draw when board is full and no three-in-a-row', () => {
    let state = engine.getInitialState(['p1', 'p2'], { p1: 'Alice', p2: 'Bob' });
    // Valid alternating draw sequence
    const moves: [number, number, string][] = [
      [0, 0, 'p1'],
      [0, 1, 'p2'],
      [0, 2, 'p1'],
      [1, 1, 'p2'],
      [1, 0, 'p1'],
      [2, 0, 'p2'],
      [1, 2, 'p1'],
      [2, 2, 'p2'],
      [2, 1, 'p1'],
    ];

    for (const [r, c, p] of moves) {
      expect(engine.validateMove(state, { row: r, col: c }, p)).toBe(true);
      state = engine.applyMove(state, { row: r, col: c }, p);
    }

    expect(state.phase).toBe('finished');
    const win = engine.checkWinner(state);
    expect(win?.winner).toBe('draw');
  });
});
