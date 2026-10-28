with open('frontend/src/pages/GamePlay.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports if not present
imports_to_add = """import { SnakeUI } from '../games/snake/SnakeUI';
import { Game2048UI } from '../games/game2048/Game2048UI';
import { TetrisUI } from '../games/tetris/TetrisUI';
import { MinesweeperUI } from '../games/minesweeper/MinesweeperUI';
import { BreakoutUI } from '../games/breakout/BreakoutUI';
import { CheckersUI } from '../games/checkers/CheckersUI';
"""

if "import { SnakeUI }" not in content:
    target_import = "import { SpaceDodgeUI } from '../games/spacedodge/SpaceDodgeUI';"
    content = content.replace(target_import, target_import + "\n" + imports_to_add)

# 2. Add games in renderGame
games_code = """    // 🕹️ Core Release Additions
    if (gameId === 'snake') {
      return <SnakeUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'game2048' || gameId === '2048') {
      return <Game2048UI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'tetris') {
      return <TetrisUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'minesweeper') {
      return <MinesweeperUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'breakout') {
      return <BreakoutUI onExit={() => navigate(-1)} onGameOver={(sc) => { setIsOver(true); setWinResult({ winner: effectivePlayerId, scores: { [effectivePlayerId]: sc } }); }} />;
    }
    if (gameId === 'checkers') {
      return <CheckersUI mode={mode === 'single' ? 'single' : 'passplay'} difficulty={difficulty} onExit={() => navigate(-1)} onGameOver={(w) => { setIsOver(true); setWinResult({ winner: w === 'red' ? effectivePlayerId : 'player2', scores: { [effectivePlayerId]: 10 } }); }} />;
    }
"""

target_render = "return <div>Unknown game: {gameId}</div>;"
if "if (gameId === 'snake')" not in content:
    content = content.replace(target_render, games_code + "\n    " + target_render)

# 3. Upgrade Cockpit return layout
old_return = """  return (
    <div className="page">
      <Header />
      <div className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>{engine.config.icon}</span>
            <div>
              <h3 style={{ margin: 0 }}>{engine.config.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {mode === 'single' ? `vs AI (${difficulty})` : mode === 'passplay' ? 'Pass & Play' : 'Local Network'}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { resetGame(); navigate(-1); }}
          >
            Quit
          </button>
        </div>"""

new_return = """  return (
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
          </div>"""

content = content.replace(old_return, new_return)

# Close the extra div for in-game-cockpit
old_closing = """        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {renderGame()}
        </div>
      </div>
    </div>
  );"""

new_closing = """        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {renderGame()}
        </div>
      </div>
    </div>
    </div>
  );"""

content = content.replace(old_closing, new_closing)

with open('frontend/src/pages/GamePlay.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("GamePlay.tsx updated successfully!")
