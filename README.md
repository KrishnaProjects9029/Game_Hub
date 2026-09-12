# 🎮 Game Hub — Offline-First Local Multiplayer

A fully offline-first game hub with single-player AI and real LAN multiplayer.  
**No internet required. No cloud. No accounts.**

---

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+

### Step 1 — Start the Backend (Host device only, for LAN multiplayer)

```powershell
.\start-server.ps1
```

This will print your LAN IP, e.g.:
```
  LAN IP: 192.168.1.10:8000
  Players can connect to: http://192.168.1.10:8000
```

### Step 2 — Start the Frontend

```powershell
.\start-frontend.ps1
```

Open **http://localhost:5173** on the host device.  
Other devices on the same Wi-Fi: open **http://192.168.1.10:5173**

---

## Features

### 👤 Single Player (100% Offline)
- Play vs AI on this device — no network needed
- 3 difficulty levels: Easy / Medium / Hard
- Games: Tic Tac Toe, Connect 4, Rock Paper Scissors, Reaction Race

### 👥 Multiplayer
- **Same Device** (Pass & Play): 2–4 players take turns on one screen
- **Local Network**: Real WebSocket multiplayer over LAN/hotspot

### Local Network Multiplayer Flow
1. Host runs backend server (`.\start-server.ps1`)
2. Host opens app → Multiplayer → Host Game → enters backend IP → creates room
3. Room code + QR code displayed
4. Other players on same Wi-Fi open the app → Join Game → enter host IP + room code
5. Everyone in lobby → host starts game
6. Real-time moves sync via WebSocket

---

## Games

| Game | Players | AI Difficulty | Multiplayer |
|------|---------|---------------|-------------|
| Tic Tac Toe | 2 | Easy/Medium/Hard (minimax) | ✅ 2 players |
| Connect 4 | 2 | Easy/Medium/Hard (minimax) | ✅ 2 players |
| Rock Paper Scissors | 2–4 | Easy/Medium/Hard | ✅ 2–4 players |
| Reaction Race | 2–4 | Easy/Medium/Hard | ✅ 2–4 players |

---

## Architecture

```
Multiplayer/
├── backend/          # Python FastAPI + WebSockets + SQLite
│   ├── main.py       # Startup — binds to 0.0.0.0:8000
│   ├── server/       # WebSocket manager, room manager, DB
│   └── games/        # Server-side game logic (all 4 games)
│
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── games/    # Client game engines + UIs (all 4 games)
│       ├── pages/    # Home, SinglePlayer, Multiplayer, Lobby, GamePlay, Results
│       ├── network/  # WebSocket client + room discovery
│       ├── store/    # Zustand: player, game, room state
│       └── db/       # LocalDB via localStorage (profiles, stats)
│
├── start-server.ps1  # One-click backend start
└── start-frontend.ps1 # One-click frontend start
```

---

## Offline Guarantee

- All game AI runs in the browser (no API calls)
- All fonts are system fonts (no Google Fonts)
- All assets are bundled (no CDN)
- Player profiles stored in localStorage
- Backend uses SQLite (no cloud DB)
- Works after `npm run build` with zero internet

---

## Manual Start (without scripts)

```powershell
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```
