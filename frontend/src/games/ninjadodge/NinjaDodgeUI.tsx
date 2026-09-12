import React, { useEffect, useRef, useState } from 'react';
import { NinjaDodgeState } from './NinjaDodge';
import { Move } from '../engine/GameEngine';

interface NinjaDodgeUIProps {
  state: NinjaDodgeState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  rotSpeed: number;
  type: 'shuriken' | 'kunai' | 'scroll';
}

export const NinjaDodgeUI: React.FC<NinjaDodgeUIProps> = ({
  state,
  onMove,
  currentPlayerId,
  playerNames,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ninjaX, setNinjaX] = useState(250);
  const [isShielded, setIsShielded] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const ninjaXRef = useRef(250);
  const isAliveRef = useRef(true);
  const projectilesRef = useRef<Projectile[]>([]);
  const nextProjId = useRef(1);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const isShieldedRef = useRef(false);

  ninjaXRef.current = ninjaX;
  const myLives = state.lives[currentPlayerId] ?? 3;
  const isMyAlive = state.isAlive[currentPlayerId] ?? true;
  isAliveRef.current = isMyAlive && state.phase === 'dodging';
  isShieldedRef.current = isShielded;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAliveRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setNinjaX(prev => Math.max(30, prev - 24));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setNinjaX(prev => Math.min(470, prev + 24));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timer loop for survival score
  useEffect(() => {
    if (state.phase !== 'dodging' || !isMyAlive) return;

    const timer = setInterval(() => {
      setElapsedSec(prev => {
        const next = prev + 1;
        onMove({ type: 'update_survival', time: next });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.phase, isMyAlive, onMove]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Spawn projectiles
      if (isAliveRef.current && time - lastSpawnTime.current > Math.max(350, 900 - elapsedSec * 15)) {
        lastSpawnTime.current = time;
        const isScroll = Math.random() < 0.15;
        const isKunai = !isScroll && Math.random() < 0.35;
        
        projectilesRef.current.push({
          id: nextProjId.current++,
          x: 30 + Math.random() * 440,
          y: -20,
          vx: (Math.random() - 0.5) * 40,
          vy: isKunai ? 240 + Math.random() * 80 : 150 + Math.random() * 90 + elapsedSec * 3,
          radius: isScroll ? 14 : isKunai ? 10 : 12,
          angle: 0,
          rotSpeed: isKunai ? 0 : (Math.random() > 0.5 ? 8 : -8),
          type: isScroll ? 'scroll' : isKunai ? 'kunai' : 'shuriken',
        });
      }

      // Update projectiles
      const currentNinjaX = ninjaXRef.current;
      const ninjaY = 320;
      const ninjaRadius = 18;

      projectilesRef.current.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.rotSpeed * dt;

        // Collision check
        if (isAliveRef.current) {
          const dx = p.x - currentNinjaX;
          const dy = p.y - ninjaY;
          const dist = Math.hypot(dx, dy);

          if (dist < p.radius + ninjaRadius) {
            if (p.type === 'scroll') {
              // Collected scroll
              p.y = 999;
              setIsShielded(true);
              setTimeout(() => setIsShielded(false), 3000);
              onMove({ type: 'bonus_scroll', bonus: 50 });
            } else {
              // Hit hazard
              p.y = 999;
              if (isShieldedRef.current) {
                setIsShielded(false);
              } else {
                onMove({ type: 'hit' });
              }
            }
          }
        }
      });

      // Filter offscreen projectiles
      projectilesRef.current = projectilesRef.current.filter(p => p.y < 420);

      // Render Scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background moonlight gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.7, '#151c2e');
      bgGrad.addColorStop(1, '#0e1320');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moon in background
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.arc(420, 70, 36, 0, Math.PI * 2);
      ctx.fill();

      // Bamboo silhouettes in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let bx = 20; bx < canvas.width; bx += 45) {
        ctx.fillRect(bx, 0, 8, canvas.height - 40);
      }

      // Ground bamboo floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 350, canvas.width, 30);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 348, canvas.width, 2);

      // Draw projectiles
      projectilesRef.current.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.type === 'shuriken') {
          // Metallic shuriken
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.lineTo(0, -p.radius);
            ctx.lineTo(p.radius * 0.35, -p.radius * 0.35);
          }
          ctx.closePath();
          ctx.fill();
          // Center hole
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'kunai') {
          // Kunai dagger pointing down
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(0, p.radius);
          ctx.lineTo(-4, -p.radius * 0.5);
          ctx.lineTo(0, -p.radius);
          ctx.lineTo(4, -p.radius * 0.5);
          ctx.closePath();
          ctx.fill();
          // Red ribbon
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -p.radius);
          ctx.lineTo(0, -p.radius - 6);
          ctx.stroke();
        } else {
          // Golden ancient scroll
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(-10, -6, 20, 12, 3);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-2, -6, 4, 12);
        }
        ctx.restore();
      });

      // Draw Ninja Player
      if (isMyAlive) {
        ctx.save();
        ctx.translate(currentNinjaX, ninjaY);

        // Shield aura if active
        if (isShieldedRef.current) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Ninja body (dark stealth suit)
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, -4, 14, 0, Math.PI * 2);
        ctx.fill();

        // Red Headband
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, -10, 24, 5);

        // Flowing headband ribbons
        ctx.beginPath();
        ctx.moveTo(-12, -8);
        ctx.quadraticCurveTo(-22, -6, -26, -2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        // Focused eyes slit
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-6, -4, 3, 2);
        ctx.fillRect(3, -4, 3, 2);

        // Shadow under ninja
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [onMove, elapsedSec, isMyAlive]);

  // Handle canvas mouse/touch dragging
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAliveRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    setNinjaX(Math.max(30, Math.min(470, x)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '580px', margin: '0 auto' }}>
      {/* Top Status HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px 18px',
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Survive: </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>{elapsedSec}s</span>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Lives: </span>
          <span style={{ fontSize: '1.2rem', letterSpacing: '2px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ color: i < myLives ? '#ef4444' : '#475569' }}>❤️</span>
            ))}
          </span>
        </div>
        {isShielded && (
          <div style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
            🛡️ SHIELD ACTIVE
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '2px solid #334155' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={380}
          onPointerDown={handleCanvasPointer}
          onPointerMove={e => { if (e.buttons === 1) handleCanvasPointer(e); }}
          style={{ display: 'block', touchAction: 'none', cursor: isMyAlive ? 'ew-resize' : 'default' }}
        />

        {!isMyAlive && state.phase === 'dodging' && (
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
            <h3 style={{ fontSize: '1.75rem', color: '#ef4444', marginBottom: '8px' }}>💀 KNOCKED OUT!</h3>
            <p style={{ color: '#cbd5e1' }}>You survived for {elapsedSec} seconds.</p>
          </div>
        )}
      </div>

      {/* Touch / Mobile Control buttons */}
      <div style={{ display: 'flex', gap: '14px', width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => setNinjaX(prev => Math.max(30, prev - 35))}
          disabled={!isMyAlive || state.phase !== 'dodging'}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #475569',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ◀ LEFT
        </button>
        <button
          onClick={() => setNinjaX(prev => Math.min(470, prev + 35))}
          disabled={!isMyAlive || state.phase !== 'dodging'}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #475569',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          RIGHT ▶
        </button>
      </div>

      {/* Players leaderboard */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
        {state.players.map(pid => (
          <div
            key={pid}
            style={{
              flex: '1 1 120px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: pid === currentPlayerId ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.4)',
              border: pid === currentPlayerId ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{playerNames[pid] || pid}</span>
            <span style={{ fontSize: '0.8rem', color: state.isAlive[pid] ? '#10b981' : '#ef4444' }}>
              {state.isAlive[pid] ? `${state.survivalTimes[pid] || 0}s` : '💀'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
