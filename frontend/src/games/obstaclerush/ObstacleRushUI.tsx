import React, { useEffect, useRef } from 'react';
import { ObstacleRushState } from './ObstacleRush';
import { Move } from '../engine/GameEngine';

interface Props {
  state: ObstacleRushState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const ObstacleRushUI: React.FC<Props> = ({
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

  const playerY = useRef(200);
  const playerVy = useRef(0);
  const isJumping = useRef(false);
  const isDucking = useRef(false);
  const obstacles = useRef<Array<{ x: number; y: number; type: 'hurdle' | 'high_laser'; passed: boolean }>>([]);
  const distAccumulator = useRef(0);

  function triggerJump() {
    if (!isJumping.current && !isDucking.current) {
      playerVy.current = -11;
      isJumping.current = true;
    }
  }

  function triggerDuck() {
    if (!isJumping.current) {
      isDucking.current = true;
      setTimeout(() => {
        isDucking.current = false;
      }, 600);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w') triggerJump();
      if (e.key === 'ArrowDown' || e.key === 's') triggerDuck();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let spawnTimer = 0;

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      const groundY = 230;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, groundY, canvas.width, 4);

      if (state.phase === 'running') {
        // Runner gravity & jump physics
        playerVy.current += 0.65;
        playerY.current += playerVy.current;
        if (playerY.current >= groundY - (isDucking.current ? 22 : 44)) {
          playerY.current = groundY - (isDucking.current ? 22 : 44);
          playerVy.current = 0;
          isJumping.current = false;
        }

        // Distance progress
        distAccumulator.current += 0.35;
        if (distAccumulator.current >= 5) {
          onMoveRef.current({ type: 'update_progress', distanceDelta: 5 });
          distAccumulator.current = 0;
        }

        // Spawn obstacles
        spawnTimer++;
        if (spawnTimer > 110) {
          spawnTimer = 0;
          const type = Math.random() < 0.6 ? 'hurdle' : 'high_laser';
          obstacles.current.push({
            x: canvas.width + 20,
            y: type === 'hurdle' ? groundY - 32 : groundY - 58,
            type,
            passed: false,
          });
        }

        // Update obstacles
        const pX = 80;
        const pY = playerY.current;
        const pW = 30;
        const pH = isDucking.current ? 22 : 44;

        for (let i = obstacles.current.length - 1; i >= 0; i--) {
          const obs = obstacles.current[i];
          obs.x -= 4.2;

          // Collision detection
          const oW = 20;
          const oH = obs.type === 'hurdle' ? 32 : 18;

          if (
            pX < obs.x + oW &&
            pX + pW > obs.x &&
            pY < obs.y + oH &&
            pY + pH > obs.y &&
            !obs.passed
          ) {
            obs.passed = true;
            onMoveRef.current({ type: 'hit_obstacle' });
          }

          if (obs.x < -40) {
            obstacles.current.splice(i, 1);
          }
        }
      }

      // Draw Obstacles
      for (const obs of obstacles.current) {
        if (obs.type === 'hurdle') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(obs.x, obs.y, 20, 32);
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(obs.x + 4, obs.y + 4, 12, 6);
        } else {
          // High laser barrier
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(obs.x, obs.y, 35, 12);
          ctx.fillStyle = '#a5f3fc';
          ctx.fillRect(obs.x + 2, obs.y + 2, 31, 4);
        }
      }

      // Draw Player Runner
      const pH = isDucking.current ? 22 : 44;
      ctx.fillStyle = isDucking.current ? '#f59e0b' : '#7c3aed';
      ctx.fillRect(80, playerY.current, 30, pH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(92, playerY.current + 6, 12, 10); // visor/head

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.phase]);

  const currentDist = state.distances[currentPlayerId] || 0;
  const lives = state.lives[currentPlayerId] ?? 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 580 }}>
      {/* Top HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="badge badge-primary">
            🏁 {Math.floor(currentDist)}m / {state.targetDistance}m
          </span>
          <span className="badge badge-danger">
            {'❤️'.repeat(lives)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {state.players.map(pid => (
            <div key={pid} className="badge badge-secondary">
              <span>{playerNames[pid] ?? pid}: </span>
              <strong>{Math.floor(state.distances[pid] || 0)}m</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas view */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
        <canvas ref={canvasRef} width={560} height={280} style={{ display: 'block', width: '100%', maxWidth: 560 }} />
      </div>

      {/* Action Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: 440 }}>
        <button
          onClick={triggerJump}
          className="btn btn-primary btn-lg"
          style={{ padding: '1.25rem', fontSize: '1.25rem', fontWeight: 800, borderRadius: 14 }}
        >
          ⬆️ JUMP (Over Red)
        </button>
        <button
          onClick={triggerDuck}
          className="btn btn-secondary btn-lg"
          style={{ padding: '1.25rem', fontSize: '1.25rem', fontWeight: 800, borderRadius: 14 }}
        >
          ⬇️ DUCK (Under Cyan)
        </button>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Keyboard: <strong>Space / Up / W (Jump)</strong>, <strong>Down / S (Duck / Slide)</strong>
      </div>
    </div>
  );
};
