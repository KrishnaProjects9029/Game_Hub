import React, { useEffect, useRef, useState } from 'react';
import { MiniRacingState } from './MiniRacing';
import { Move } from '../engine/GameEngine';

interface Props {
  state: MiniRacingState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const MiniRacingUI: React.FC<Props> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  const [countdown, setCountdown] = useState(3);

  // Car physics state for current player
  const carState = useRef({
    x: 120,
    y: 280,
    angle: -Math.PI / 2,
    speed: 0,
    lap: 1,
    checkpoint: 0,
  });

  // AI car state
  const aiCar = useRef({
    x: 150,
    y: 280,
    angle: -Math.PI / 2,
    speed: 0,
    lap: 1,
    checkpoint: 0,
  });

  // Keys active
  const keys = useRef<{ left: boolean; right: boolean; up: boolean; down: boolean }>({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  // Countdown timer on start
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 800);
    const t2 = setTimeout(() => setCountdown(1), 1600);
    const t3 = setTimeout(() => {
      onMoveRef.current({ type: 'start_race' });
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state.phase]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') keys.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') keys.current.down = true;
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') keys.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') keys.current.down = false;
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Oval circuit checkpoints
    const checkpoints = [
      { x: 135, y: 100, radius: 60, id: 1 }, // Top Left
      { x: 445, y: 100, radius: 60, id: 2 }, // Top Right
      { x: 445, y: 280, radius: 60, id: 3 }, // Bottom Right
      { x: 135, y: 280, radius: 60, id: 0 }, // Finish Line / Bottom Left
    ];

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Race Track (Rounded Rect circuit)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track outline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 75;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(140, 100);
      ctx.lineTo(440, 100);
      ctx.arc(440, 190, 90, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(140, 280);
      ctx.arc(140, 190, 90, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.stroke();

      // Track inner lines
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(140, 100);
      ctx.lineTo(440, 100);
      ctx.arc(440, 190, 90, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(140, 280);
      ctx.arc(140, 190, 90, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start/Finish Line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(115, 245, 45, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(115, 251, 45, 6);

      // Boost Pad
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillRect(435, 160, 25, 40);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '14px sans-serif';
      ctx.fillText('⚡', 440, 185);

      if (state.phase === 'racing') {
        // Player car physics
        const car = carState.current;
        if (keys.current.up) car.speed = Math.min(car.speed + 0.18, 3.8);
        else car.speed = Math.max(0, car.speed - 0.08);

        if (keys.current.down) car.speed = Math.max(-1.2, car.speed - 0.15);

        if (keys.current.left) car.angle -= 0.065 * (car.speed / 2.5 || 0.5);
        if (keys.current.right) car.angle += 0.065 * (car.speed / 2.5 || 0.5);

        // Boost pad check
        if (Math.hypot(car.x - 445, car.y - 180) < 25) {
          car.speed = 5.2;
        }

        car.x += Math.cos(car.angle) * car.speed;
        car.y += Math.sin(car.angle) * car.speed;

        // Checkpoint trigger
        const nextCp = (car.checkpoint + 1) % 4;
        const targetPoint = checkpoints[nextCp];
        if (Math.hypot(car.x - targetPoint.x, car.y - targetPoint.y) < targetPoint.radius) {
          car.checkpoint = nextCp;
          onMoveRef.current({ type: 'cross_checkpoint', checkpoint: nextCp });
        }

        // AI Car auto-steering around track
        const ai = aiCar.current;
        const aiNextCp = (ai.checkpoint + 1) % 4;
        const aiTarget = checkpoints[aiNextCp];
        const targetAngle = Math.atan2(aiTarget.y - ai.y, aiTarget.x - ai.x);
        ai.angle += (targetAngle - ai.angle) * 0.06;
        ai.speed = 2.7;
        ai.x += Math.cos(ai.angle) * ai.speed;
        ai.y += Math.sin(ai.angle) * ai.speed;
        if (Math.hypot(ai.x - aiTarget.x, ai.y - aiTarget.y) < aiTarget.radius) {
          ai.checkpoint = aiNextCp;
        }
      }

      // Draw AI Car
      const ai = aiCar.current;
      ctx.save();
      ctx.translate(ai.x, ai.y);
      ctx.rotate(ai.angle);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -6, 12, 12);
      ctx.restore();

      // Draw Player Car
      const car = carState.current;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -6, 12, 12);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.phase]);

  const racer = state.racers[currentPlayerId];
  const lap = racer?.lap || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 600 }}>
      {/* Top HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-info" style={{ fontSize: '1rem' }}>
          Lap {Math.min(lap, state.totalLaps)} / {state.totalLaps}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {state.players.map(pid => (
            <div key={pid} className="badge badge-primary">
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>Lap {state.racers[pid]?.lap || 1}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)' }}>
        <canvas ref={canvasRef} width={580} height={360} style={{ display: 'block', width: '100%', maxWidth: 580 }} />

        {state.phase === 'countdown' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent)', animation: 'bounce 0.5s infinite' }}>
              {countdown > 0 ? countdown : 'GO!'}
            </div>
          </div>
        )}
      </div>

      {/* On-screen controls for mobile/touch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 440, gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onMouseDown={() => { keys.current.left = true; }}
            onMouseUp={() => { keys.current.left = false; }}
            onTouchStart={() => { keys.current.left = true; }}
            onTouchEnd={() => { keys.current.left = false; }}
            className="btn btn-secondary btn-lg"
            style={{ width: 64, height: 60, fontSize: '1.5rem', borderRadius: 12 }}
          >
            ◀
          </button>
          <button
            onMouseDown={() => { keys.current.right = true; }}
            onMouseUp={() => { keys.current.right = false; }}
            onTouchStart={() => { keys.current.right = true; }}
            onTouchEnd={() => { keys.current.right = false; }}
            className="btn btn-secondary btn-lg"
            style={{ width: 64, height: 60, fontSize: '1.5rem', borderRadius: 12 }}
          >
            ▶
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onMouseDown={() => { keys.current.down = true; }}
            onMouseUp={() => { keys.current.down = false; }}
            onTouchStart={() => { keys.current.down = true; }}
            onTouchEnd={() => { keys.current.down = false; }}
            className="btn btn-danger btn-lg"
            style={{ width: 64, height: 60, fontSize: '1.2rem', borderRadius: 12 }}
          >
            🛑
          </button>
          <button
            onMouseDown={() => { keys.current.up = true; }}
            onMouseUp={() => { keys.current.up = false; }}
            onTouchStart={() => { keys.current.up = true; }}
            onTouchEnd={() => { keys.current.up = false; }}
            className="btn btn-primary btn-lg"
            style={{ width: 80, height: 60, fontSize: '1.5rem', borderRadius: 12 }}
          >
            🏎️ GAS
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Keyboard: <strong>W/↑ (Accelerate)</strong>, <strong>A/D or ←/→ (Steer)</strong>, <strong>S/↓ (Brake)</strong>
      </div>
    </div>
  );
};
