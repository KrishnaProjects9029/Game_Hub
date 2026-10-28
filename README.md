# 🎮 Game Hub  Premium Browser Gaming Platform

A modern, comprehensive browser gaming platform , featuring **40 real, playable browser games** across 12 categories, instant play with zero downloads or accounts, local save persistence, and **real-time serverless online multiplayer (WebRTC)**.

**Live Production Preview**: [https://game-hub-plum-theta.vercel.app/](https://game-hub-plum-theta.vercel.app/)

---

## 🌟 What's New in Version 3.0 (Poki Upgrade)

- **🕹️ 40 Verified Playable Browser Games**:
  - **16 New Self-Hosted HTML5 Classics**: Hextris (MIT), Cyber Pac-Man, Vector Asteroids, Cyber Pong (1P & 2P Couch Duel), Space Invaders 1980, Flappy Neon, Sudoku Master, Word Guess (Wordle), Klondike Solitaire, Cyber Dino Runner, Highway Racer, Tower Blocks Stacker, Simon Memory Matrix, 15-Puzzle Slider, Tank Trouble 2-Player, and Alien Invasion Arcade.
  - **24 Preserved Native Engine Games**: Snake Classic, 2048, Tetris Arcade, Minesweeper, Breakout Arcade, Checkers Classic, Tic-Tac-Toe, Memory Match, Connect 4, Number Battle, Quick Quiz, Reaction Rush, Color Clash, Fastest Finger, Target Tap, Rock Paper Scissors, Bomb Pass, Coin Flip, Lucky Card, Mini Racing, Obstacle Rush, Battle Arena, Ninja Dodge, and Space Dodge.
- **🚀 Unified Embedded Game Player (`EmbeddedGamePlayer.tsx`)**:
  - Sandboxed iframe with strict security: `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"`.
  - Native Fullscreen Mode toggle via the Fullscreen API.
  - Arrow key / Spacebar window scroll prevention.
  - Game reload action, isolated tab launcher, controls diagram, and license attribution.
  - Smooth loading spinners and error recovery states.
- **🔍 Poki-Inspired Discoverability & UX**:
  - Multi-category navigation pills: All, 2-Player, Puzzle & Brain, Classic Arcade, Racing & Driving, Action & Combat, Endless Runner, Casual, Simulation, and Party.
  - Instant search filtering by title, rules, keywords, tags, or publisher.
  - Sort by: Featured First, Alphabetical (A-Z), High Score, and Recently Played.
  - Visual Badges: "2-Player", "Mobile Ready", "Playable", "Offline Single Player".
- **💾 Accountless Persistence**:
  - Schema-versioned (`schemaVersion: 2`) local storage.
  - Persistent Favorites (★), Recently Played tracking, and High Score leaderboards.
  - User preferences (audio volume, reduced motion, dark console themes).
  - JSON Backup Export and Safe Schema-Validated Import.
- **🌐 Serverless Online Multiplayer (WebRTC)**:
  - 100% serverless WebRTC p2p matchmaking and authoritative host game loop.
  - Room code sharing and mobile QR code connection.

---

## 📚 Complete Game Library (40 Games)

| # | Game Title | Category | Type | Players | Controls | License / Publisher |
|---|---|---|---|---|---|---|
| 1 | **Snake Classic** | Reflex & Arcade | Local Engine | 1P | Arrow keys / D-Pad | Built-in Engine |
| 2 | **2048** | Brain & Puzzle | Local Engine | 1P | Arrows / Swipe / Undo | Built-in Engine |
| 3 | **Tetris Arcade** | Brain & Puzzle | Local Engine | 1P | Left/Right/Up/Space | Built-in Engine |
| 4 | **Minesweeper** | Brain & Logic | Local Engine | 1P | Click / Flag Mode | Built-in Engine |
| 5 | **Breakout Arcade** | Reflex & Arcade | Local Engine | 1P | Mouse / Touch Drag | Built-in Engine |
| 6 | **Checkers Classic** | Brain & Strategy | Local + WebRTC | 1P-2P | Tap / Drag Piece | Built-in Engine |
| 7 | **Tic-Tac-Toe** | Brain & Strategy | Local + WebRTC | 1P-2P | Tap / Click Cell | Built-in Engine |
| 8 | **Memory Match** | Brain & Memory | Local + WebRTC | 1P-4P | Flip Card | Built-in Engine |
| 9 | **Connect 4** | Brain & Strategy | Local + WebRTC | 1P-2P | Column Drop | Built-in Engine |
| 10 | **Hextris** | Puzzle & Brain | Self-Hosted HTML5 | 1P | Arrows / A,D / Swipe | MIT License (L. Engstrom & G. Finucane) |
| 11 | **Cyber Pac-Man** | Classic Arcade | Self-Hosted HTML5 | 1P | Arrows / D-Pad | MIT License (HTML5 Arcade Lab) |
| 12 | **Vector Asteroids** | Classic Arcade | Self-Hosted HTML5 | 1P | Arrows / Thrust / Fire | MIT License (Arcade Project) |
| 13 | **Cyber Pong** | 2-Player & Sports | Self-Hosted HTML5 | 1P-2P | W/S vs Up/Down / Touch | MIT License (Open Source) |
| 14 | **Space Invaders 1980** | Classic Arcade | Self-Hosted HTML5 | 1P | Arrows / Space / Fire | MIT License (Retro Arcade Lab) |
| 15 | **Flappy Neon** | Endless Runner | Self-Hosted HTML5 | 1P | Space / Tap to Jump | MIT License (Open Source) |
| 16 | **Sudoku Master** | Puzzle & Brain | Self-Hosted HTML5 | 1P | Click / Keypad 1-9 | MIT License (Logic Games Lab) |
| 17 | **Word Guess (Wordle)** | Brain & Word | Self-Hosted HTML5 | 1P | Keyboard / Virtual Keys | MIT License (Word Games Project) |
| 18 | **Klondike Solitaire** | Casual & Cards | Self-Hosted HTML5 | 1P | Tap / Drag Cards | MIT License (Card Games Lab) |
| 19 | **Cyber Dino Runner** | Endless Runner | Self-Hosted HTML5 | 1P | Space / Up Jump, Down Duck | BSD License (Chromium Project) |
| 20 | **Highway Racer** | Racing & Driving | Self-Hosted HTML5 | 1P | Arrows / Touch Steer | MIT License (Speedway Studios) |
| 21 | **Tower Blocks Stacker** | Simulation & Physics | Self-Hosted HTML5 | 1P | Space / Tap Drop | MIT License (Physics Games Lab) |
| 22 | **Simon Memory Matrix** | Brain & Memory | Self-Hosted HTML5 | 1P | Quadrant Pads | MIT License (Sound Games Lab) |
| 23 | **15-Puzzle Slider** | Puzzle & Logic | Self-Hosted HTML5 | 1P | Tap Adjacent Tile | MIT License (Classic Puzzle Works) |
| 24 | **Tank Trouble 2P** | 2-Player & Combat | Self-Hosted HTML5 | 1P-2P | WASD+Space vs Arrows+Enter | MIT License (Arena Battle Labs) |
| 25 | **Alien Invasion** | Action & Shooter | Self-Hosted HTML5 | 1P | Mouse / Touch Guide | MIT License (Galaxy Arcade Devs) |
| 26 | **Number Battle** | Brain & Math | Local + WebRTC | 1P-4P | Math Options | Built-in Engine |
| 27 | **Quick Quiz** | Brain & Trivia | Local + WebRTC | 1P-6P | Trivia Answers | Built-in Engine |
| 28 | **Reaction Rush** | Reflex & Speed | Local + WebRTC | 1P-4P | Space / Tap Screen | Built-in Engine |
| 29 | **Color Clash** | Reflex & Stroop | Local + WebRTC | 1P-4P | Match / Clash | Built-in Engine |
| 30 | **Fastest Finger** | Reflex & CPS | Local + WebRTC | 1P-4P | Rapid Click | Built-in Engine |
| 31 | **Target Tap** | Reflex & Aim | Local + WebRTC | 1P-4P | Tap Targets | Built-in Engine |
| 32 | **Rock Paper Scissors** | 2-Player & Party | Local + WebRTC | 2P | Rock/Paper/Scissors | Built-in Engine |
| 33 | **Bomb Pass** | Party & Social | Local + WebRTC | 2P-6P | Pass Button | Built-in Engine |
| 34 | **Coin Flip Duel** | Party & Casual | Local + WebRTC | 2P | Heads / Tails | Built-in Engine |
| 35 | **Lucky Card** | Party & Casual | Local + WebRTC | 2P-4P | Draw Card | Built-in Engine |
| 36 | **Mini Racing** | Racing & Driving | Local + WebRTC | 1P-2P | Steer Left / Right | Built-in Engine |
| 37 | **Obstacle Rush** | Running & Jump | Local + WebRTC | 1P-2P | Jump / Slide | Built-in Engine |
| 38 | **Battle Arena** | Action & Combat | Local + WebRTC | 1P-2P | WASD + Space Attack | Built-in Engine |
| 39 | **Ninja Dodge** | Action & Survival | Local + WebRTC | 1P-2P | Drag / Arrow Evade | Built-in Engine |
| 40 | **Space Dodge** | Action & Sci-Fi | Local + WebRTC | 1P-2P | Steer Starfighter | Built-in Engine |

---

## 🚀 Quick Start

### 1. Run the Frontend Locally

```powershell
cd frontend
npm install
npm run dev
```

The application runs on Vite (port 3002 or 5173).

### 2. Run Automated Unit Tests

```powershell
cd frontend
npm test
```

### 3. Build for Production

```powershell
cd frontend
npm run build
```

The output is bundled into `frontend/dist/` with all HTML5 games copied into `frontend/dist/games/`.

---

## ☁️ Deployment to Vercel

The project is fully configured for Vercel:

1. **Root Directory**: Set Root Directory to `frontend`.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`
5. Click **Deploy**.
