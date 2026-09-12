import React, { useEffect, useRef, useState } from 'react';
import { SpaceDodgeState } from './SpaceDodge';
import { Move } from '../engine/GameEngine';

interface SpaceDodgeUIProps {
  state: SpaceDodgeState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  rotSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface CrystalItem {
  id: number;
  x: number;
  y: number;
  vy: number;
  size: number;
}

export const SpaceDodgeUI: React.FC<SpaceDodgeUIProps> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shipX, setShipX] = useState(250);
  const [shipY, setShipY] = useState(300);

  const shipXRef = useRef(250);
  const shipYRef = useRef(300);
  const isDestroyedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const nextItemId = useRef(1);

  const asteroidsRef = useRef<Asteroid[]>([]);
  const crystalsRef = useRef<CrystalItem[]>([]);
  const starsRef = useRef<Star[]>([]);

  shipXRef.current = shipX;
  shipYRef.current = shipY;

  const myShield = state.shields[currentPlayerId] ?? 100;
  const myCrystals = state.crystals[currentPlayerId] ?? 0;
  const myDist = state.distance[currentPlayerId] ?? 0;
  const isMyDestroyed = state.isDestroyed[currentPlayerId] ?? false;
  isDestroyedRef.current = isMyDestroyed || state.phase === 'finished';

  // Initialize starfield
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 500,
        y: Math.random() * 380,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 120 + 60,
      });
    }
    starsRef.current = stars;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const keysPressed: Record<string, boolean> = {};

    const handleDown = (e: KeyboardEvent) => {
      keysPressed[e.key] = true;
    };
    const handleUp = (e: KeyboardEvent) => {
      keysPressed[e.key] = false;
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    const keyInterval = setInterval(() => {
      if (isDestroyedRef.current) return;
      let dx = 0;
      let dy = 0;
      if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) dx -= 14;
      if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) dx += 14;
      if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) dy -= 14;
      if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) dy += 14;

      if (dx !== 0 || dy !== 0) {
        setShipX(x => Math.max(25, Math.min(475, x + dx)));
        setShipY(y => Math.max(40, Math.min(340, y + dy)));
      }
    }, 30);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      clearInterval(keyInterval);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let telemetryAccumulator = 0;

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Telemetry distance tick
      if (!isDestroyedRef.current) {
        telemetryAccumulator += dt;
        if (telemetryAccumulator >= 0.5) {
          onMove({ type: 'update_telemetry', distDelta: 2 });
          telemetryAccumulator = 0;
        }
      }

      // Spawning asteroids & crystals
      if (!isDestroyedRef.current && time - lastSpawnTime.current > 480) {
        lastSpawnTime.current = time;
        if (Math.random() < 0.28) {
          // Spawn warp crystal
          crystalsRef.current.push({
            id: nextItemId.current++,
            x: 40 + Math.random() * 420,
            y: -20,
            vy: 130 + Math.random() * 60,
            size: 12,
          });
        } else {
          // Spawn asteroid
          asteroidsRef.current.push({
            id: nextItemId.current++,
            x: 30 + Math.random() * 440,
            y: -30,
            vx: (Math.random() - 0.5) * 50,
            vy: 160 + Math.random() * 110,
            radius: 14 + Math.random() * 16,
            angle: 0,
            rotSpeed: (Math.random() - 0.5) * 4,
          });
        }
      }

      // Update stars
      starsRef.current.forEach(s => {
        s.y += s.speed * dt;
        if (s.y > 380) {
          s.y = 0;
          s.x = Math.random() * 500;
        }
      });

      // Update asteroids & check collisions
      const curX = shipXRef.current;
      const curY = shipYRef.current;
      const shipHitRadius = 14;

      asteroidsRef.current.forEach(a => {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.angle += a.rotSpeed * dt;

        if (!isDestroyedRef.current) {
          const dist = Math.hypot(a.x - curX, a.y - curY);
          if (dist < a.radius + shipHitRadius) {
            a.y = 999;
            onMove({ type: 'hit_asteroid', damage: 25 });
          }
        }
      });

      // Update crystals
      crystalsRef.current.forEach(c => {
        c.y += c.vy * dt;

        if (!isDestroyedRef.current) {
          const dist = Math.hypot(c.x - curX, c.y - curY);
          if (dist < c.size + shipHitRadius) {
            c.y = 999;
            onMove({ type: 'collect_crystal', value: 1 });
          }
        }
      });

      // Filter out-of-bounds items
      asteroidsRef.current = asteroidsRef.current.filter(a => a.y < 420);
      crystalsRef.current = crystalsRef.current.filter(c => c.y < 420);

      // Render Scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space void
      ctx.fillStyle = '#040714';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size * 2); // motion streaks
      });

      // Draw Crystals
      crystalsRef.current.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -c.size);
        ctx.lineTo(c.size, 0);
        ctx.lineTo(0, c.size);
        ctx.lineTo(-c.size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Draw Asteroids
      asteroidsRef.current.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Jagged asteroid shape
        const pts = 7;
        for (let i = 0; i < pts; i++) {
          const angle = (i / pts) * Math.PI * 2;
          const r = a.radius * (0.8 + 0.2 * ((i % 3) / 2));
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Draw Starship
      if (!isMyDestroyed) {
        ctx.save();
        ctx.translate(curX, curY);

        // Thruster flame
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(0, 24 + Math.random() * 8);
        ctx.lineTo(6, 12);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ship hull
        ctx.fillStyle = '#e0e7ff';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(14, 12);
        ctx.lineTo(0, 7);
        ctx.lineTo(-14, 12);
        ctx.closePath();
        ctx.fill();

        // Cockpit canopy
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(0, -2, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shield aura
        if (myShield > 0) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0.15, myShield / 150)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [onMove, isMyDestroyed, myShield]);

  const handlePointerDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDestroyedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    const y = ((e.clientY - rect.top) / rect.height) * 380;
    setShipX(Math.max(25, Math.min(475, x)));
    setShipY(Math.max(40, Math.min(340, y)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '580px', margin: '0 auto' }}>
      {/* Flight Telemetry HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        padding: '12px 18px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
        border: '1px solid rgba(56, 189, 248, 0.2)',
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>WARP: </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>{myDist} LY</span>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SHIELDS: </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: myShield > 40 ? '#38bdf8' : '#ef4444' }}>
            {myShield}%
          </span>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>CRYSTALS: </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee' }}>💎 {myCrystals}</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', border: '2px solid #1e293b' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={380}
          onPointerDown={handlePointerDrag}
          onPointerMove={e => { if (e.buttons === 1) handlePointerDrag(e); }}
          style={{ display: 'block', touchAction: 'none', cursor: !isMyDestroyed ? 'crosshair' : 'default' }}
        />

        {isMyDestroyed && state.phase === 'flying' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>
            <h3 style={{ fontSize: '1.8rem', color: '#ef4444', marginBottom: '8px' }}>💥 SHIP DESTROYED!</h3>
            <p style={{ color: '#94a3b8' }}>Hull integrity compromised in asteroid field.</p>
          </div>
        )}
      </div>

      {/* D-Pad Directional Controls for touch/mobile */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setShipX(x => Math.max(25, x - 35))}
          disabled={isMyDestroyed}
          style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          ◀ LEFT
        </button>
        <button
          onClick={() => setShipY(y => Math.max(40, y - 35))}
          disabled={isMyDestroyed}
          style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          ▲ UP
        </button>
        <button
          onClick={() => setShipY(y => Math.min(340, y + 35))}
          disabled={isMyDestroyed}
          style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          ▼ DOWN
        </button>
        <button
          onClick={() => setShipX(x => Math.min(475, x + 35))}
          disabled={isMyDestroyed}
          style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
        >
          RIGHT ▶
        </button>
      </div>

      {/* Opponents telemetry */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
        {state.players.map(pid => (
          <div
            key={pid}
            style={{
              flex: '1 1 120px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: pid === currentPlayerId ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.4)',
              border: pid === currentPlayerId ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{playerNames[pid] || pid}</span>
            <span style={{ fontSize: '0.8rem', color: !state.isDestroyed[pid] ? '#22d3ee' : '#ef4444' }}>
              {!state.isDestroyed[pid] ? `${state.distance[pid] || 0} LY` : '💥'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
