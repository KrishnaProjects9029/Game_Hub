import re

with open('frontend/src/pages/GamePlay.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace return ( ... ) block
pattern = re.compile(r'  return \(\s*<div className="page">.*?renderGame\(\)\}\s*</div>\s*</div>\s*</div>\s*\);', re.DOTALL)

replacement = """  return (
    <div className="page" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #161e38 0%, #090c15 70%, #05070c 100%)' }}>
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1.25rem', paddingBottom: '3rem' }}>
        <div className="in-game-cockpit">
          {/* Top Console Command Bar */}
          <div className="in-game-topbar">
            <div className="in-game-title-group">
              <div className="in-game-icon-orb">
                {engine.config.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                  {engine.config.name}
                </h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="in-game-mode-pill">
                    {mode === 'single' ? `vs AI (${difficulty.toUpperCase()})` : mode === 'passplay' ? 'Pass & Play' : 'Online P2P'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    • {engine.config.category}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { resetGame(); navigate(-1); }}
                style={{
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.9rem',
                }}
              >
                ◀ Exit to Hub
              </button>
            </div>
          </div>

          {/* Opponent Disconnect Alert */}
          {opponentDisconnected && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.9))',
              border: '1.5px solid #ef4444',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.25)',
              animation: 'fadeIn 0.3s ease',
            }}>
              <h4 style={{ color: '#ef4444', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 800 }}>
                ⚠️ Opponent Disconnected
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Your online opponent has disconnected from the room.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/multiplayer')}>
                Return to Multiplayer Hub
              </button>
            </div>
          )}

          {/* Pass-and-play turn indicator */}
          {mode === 'passplay' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              borderRadius: '14px',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.2)',
            }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <span>Pass Device to:</span>
              <span style={{ color: '#38bdf8', fontSize: '1.05rem', fontWeight: 900 }}>
                {playerNames[currentTurnId] ?? currentTurnId}
              </span>
            </div>
          )}

          {/* AI Deliberation status in Single Player */}
          {mode === 'single' && isAiThinking && !isOver && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="ai-deliberating-banner">
                <span style={{ fontSize: '1.1rem' }}>🤖</span>
                <span>{aiThinkingText}</span>
                <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '2px' }}>
                  <span className="ai-dot">.</span>
                  <span className="ai-dot">.</span>
                  <span className="ai-dot">.</span>
                </span>
              </div>
            </div>
          )}

          {/* Game Over Celebration / Finish Banner */}
          {isOver && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))',
              border: '1.5px solid #10b981',
              borderRadius: '16px',
              padding: '1rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
              animation: 'cellPop 0.4s ease',
            }}>
              <div style={{ fontWeight: 900, color: '#10b981', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                {winResult?.winner === 'draw' ? "🤝 MATCH DRAW!" : `🎉 ${playerNames[winResult?.winner ?? ''] ?? winResult?.winner} VICTORIOUS!`}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Transferring to match summary...
              </div>
            </div>
          )}

          {/* Main Game Component Rendering */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {renderGame()}
          </div>
        </div>
      </div>
    </div>
  );"""

new_code, count = pattern.subn(replacement, code)
if count > 0:
    with open('frontend/src/pages/GamePlay.tsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Successfully patched GamePlay.tsx!")
else:
    print("Pattern did not match!")
