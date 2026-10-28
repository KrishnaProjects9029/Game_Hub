import { describe, it, expect } from 'vitest';
import { BreakoutEngine } from '../Breakout';

describe('BreakoutEngine Rules and Physics', () => {
  const engine = new BreakoutEngine();

  it('initializes with paddle, ball, bricks, and 3 lives', () => {
    const state = engine.getInitialState(['player1']);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.isBallLaunched).toBe(false);
    expect(state.bricks.length).toBe(40); // 5 rows x 8 cols
  });

  it('keeps paddle within arena boundaries', () => {
    const state = engine.getInitialState(['player1']);
    // Move left past 0
    const leftBound = engine.applyMove(state, { type: 'MOVE_PADDLE', x: -100 }, 'player1');
    expect(leftBound.paddleX).toBe(0);

    // Move right past max
    const rightBound = engine.applyMove(state, { type: 'MOVE_PADDLE', x: 9999 }, 'player1');
    expect(rightBound.paddleX).toBe(engine.BOARD_WIDTH - state.paddleWidth);
  });

  it('launches ball on LAUNCH_BALL move', () => {
    const state = engine.getInitialState(['player1']);
    expect(state.isBallLaunched).toBe(false);
    const launched = engine.applyMove(state, { type: 'LAUNCH_BALL' }, 'player1');
    expect(launched.isBallLaunched).toBe(true);
  });

  it('bounces ball when hitting walls', () => {
    const state = engine.getInitialState(['player1']);
    state.isBallLaunched = true;
    state.ballX = 2;
    state.ballVx = -4;

    const next = engine.applyMove(state, { type: 'TICK' }, 'player1');
    // Bounced off left wall => positive Vx
    expect(next.ballVx).toBeGreaterThan(0);
  });
});
