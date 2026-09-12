import React, { useEffect, useRef } from 'react';
import { BattleArenaState } from './BattleArena';
import { Move } from '../engine/GameEngine';

interface Props {
  state: BattleArenaState;
  onMove: (move: Move) => void;
  currentPlayerId: string;
  isMyTurn: boolean;
  playerNames: Record<string, string>;
}

export const BattleArenaUI: React.FC<Props> = ({
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

  const fightersRef = useRef(state.fighters);
  fightersRef.current = state.fighters;

  // Match countdown tick
  useEffect(() => {
    if (state.phase !== 'fighting') return;
    const interval = setInterval(() => {
      onMoveRef.current({ type: 'time_tick' });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  function handleDash(dirX: number, dirY: number) {
    if (state.phase !== 'fighting') return;
    onMoveRef.current({ type: 'dash', dx: dirX, dy: dirY });
  }

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w') handleDash(0, -1);
      if (e.key === 'ArrowDown' || e.key === 's') handleDash(0, 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') handleDash(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') handleDash(1, 0);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.phase]);

  // Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Arena Ring
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Hazard border
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Inner ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 120, 0, Math.PI * 2);
      ctx.stroke();

      const fighters = fightersRef.current;
      const fList = Object.values(fighters);

      if (state.phase === 'fighting') {
        // Friction & Position update
        for (const f of fList) {
          f.x += f.vx;
          f.y += f.vy;
          f.vx *= 0.92;
          f.vy *= 0.92;

          // Hazard Wall collision -> Knockout!
          if (f.x < 30 || f.x > canvas.width - 30 || f.y < 30 || f.y > canvas.height - 30) {
            f.x = canvas.width / 2;
            f.y = canvas.height / 2;
            f.vx = 0;
            f.vy = 0;
            // The other player scores a KO
            const attacker = fList.find(other => other.id !== f.id);
            if (attacker) {
              onMoveRef.current({ type: 'knockout_scored', victimId: f.id });
            }
          }
        }

        // Bumper collisions between fighters
        for (let i = 0; i < fList.length; i++) {
          for (let j = i + 1; j < fList.length; j++) {
            const f1 = fList[i];
            const f2 = fList[j];
            const dist = Math.hypot(f2.x - f1.x, f2.y - f1.y);
            if (dist < 36) {
              // Elastic bump!
              const angle = Math.atan2(f2.y - f1.y, f2.x - f1.x);
              f1.vx = -Math.cos(angle) * 7;
              f1.vy = -Math.sin(angle) * 7;
              f2.vx = Math.cos(angle) * 7;
              f2.vy = Math.sin(angle) * 7;
            }
          }
        }
      }

      // Draw Fighters
      for (const f of fList) {
        if (f.hp <= 0) continue;
        ctx.save();
        ctx.translate(f.x, f.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 10, 16, 0, Math.PI * 2);
        ctx.fill();

        // Fighter body
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 4, 4);
        ctx.fillRect(2, -6, 4, 4);

        // Name tag
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.name, 0, -24);

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 540 }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span className="badge badge-warning" style={{ fontSize: '1rem' }}>
          ⏱ {state.matchTimeLeft}s
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {state.players.map(pid => {
            const f = state.fighters[pid];
            return (
              <div key={pid} className="badge badge-primary">
                <span>{playerNames[pid] ?? pid}: </span>
                <span>{'❤️'.repeat(f?.hp || 0)} </span>
                <strong style={{ color: 'var(--accent)', marginLeft: 4 }}>{f?.knockouts || 0} KOs</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
        <canvas ref={canvasRef} width={500} height={320} style={{ display: 'block', width: '100%', maxWidth: 500 }} />
      </div>

      {/* On-screen D-pad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '0.4rem', justifyContent: 'center' }}>
        <div />
        <button onClick={() => handleDash(0, -1)} className="btn btn-primary" style={{ height: 55, fontSize: '1.4rem' }}>⬆️</button>
        <div />
        <button onClick={() => handleDash(-1, 0)} className="btn btn-primary" style={{ height: 55, fontSize: '1.4rem' }}>⬅️</button>
        <button onClick={() => handleDash(0, 1)} className="btn btn-primary" style={{ height: 55, fontSize: '1.4rem' }}>⬇️</button>
        <button onClick={() => handleDash(1, 0)} className="btn btn-primary" style={{ height: 55, fontSize: '1.4rem' }}>➡️</button>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Controls: <strong>W/A/S/D</strong> or <strong>Arrow Keys</strong> to dash and push opponents into red walls!
      </div>
    </div>
  );
};
