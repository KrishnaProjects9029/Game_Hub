import { describe, it, expect } from 'vitest';
import { SnakeEngine } from '../Snake';

describe('SnakeEngine Rules and State', () => {
  const engine = new SnakeEngine();

  it('initializes with default snake of length 3 and food', () => {
    const state = engine.getInitialState(['player1']);
    expect(state.snake.length).toBe(3);
    expect(state.score).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.direction).toBe('RIGHT');
    expect(state.food).toBeDefined();
  });

  it('rejects 180-degree instant reversal', () => {
    const state = engine.getInitialState(['player1']);
    // Moving RIGHT, cannot turn LEFT
    const invalid = engine.validateMove(state, { type: 'CHANGE_DIRECTION', direction: 'LEFT' });
    expect(invalid).toBe(false);

    // Can turn UP or DOWN
    const validUp = engine.validateMove(state, { type: 'CHANGE_DIRECTION', direction: 'UP' });
    expect(validUp).toBe(true);
  });

  it('advances head position on TICK move', () => {
    const state = engine.getInitialState(['player1']);
    const headX = state.snake[0].x;
    const next = engine.applyMove(state, { type: 'TICK' }, 'player1');
    expect(next.snake[0].x).toBe(headX + 1);
  });

  it('detects wall collision', () => {
    const state = engine.getInitialState(['player1']);
    state.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
    state.direction = 'RIGHT';
    state.nextDirection = 'RIGHT';

    const next = engine.applyMove(state, { type: 'TICK' }, 'player1');
    expect(next.isGameOver).toBe(true);
    const winResult = engine.checkWinner(next);
    expect(winResult).not.toBeNull();
  });

  it('grows and increases score when food is eaten', () => {
    const state = engine.getInitialState(['player1']);
    state.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    state.food = { x: 6, y: 5 };
    state.direction = 'RIGHT';
    state.nextDirection = 'RIGHT';

    const next = engine.applyMove(state, { type: 'TICK' }, 'player1');
    expect(next.score).toBe(10);
    expect(next.snake.length).toBe(4);
    expect(next.food).not.toEqual({ x: 6, y: 5 });
  });
});
