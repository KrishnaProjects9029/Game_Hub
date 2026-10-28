# Game Hub — Quality Assurance (QA) Documentation & Runbook

This directory contains the complete testing suite, test case repository, defect register, visual screenshot evidence, architectural diagrams, and the formal Final QA Testing Report for **Game Hub**.

---

## Directory Hierarchy

```
QA_DOCUMENTATION/
├── Final_QA_Testing_Report.docx         # Formal Word Report with styled tables & embedded screenshots (2.3 MB)
├── Final_QA_Testing_Report.md           # Full Markdown version with embedded diagrams & evidence links
├── Detailed_Test_Cases.xlsx             # Complete Test Case Repository (53 cases, styled Excel)
├── Detailed_Test_Cases.csv              # Test Case Repository in CSV format
├── Bug_and_Defect_Register.xlsx         # Defect Register (9 logged, 9 resolved, styled Excel)
├── Bug_and_Defect_Register.csv          # Defect Register in CSV format
├── README_QA.md                         # This QA Runbook
│
├── Application_Flow_Diagrams/           # Mermaid Architectural & Workflow Source Diagrams
│   ├── System_Architecture_Flow.mmd
│   ├── Single_Player_Game_Loop.mmd
│   ├── WebRTC_Online_Multiplayer_Flow.mmd
│   └── Data_Persistence_Lifecycle.mmd
│
├── Screenshot_Evidence/                 # 25 Real Screenshots Captured from Live App Execution
│   ├── desktop/                         # Desktop Viewport (1920x1080)
│   │   ├── EVD-001_desktop_home_dashboard.png
│   │   ├── EVD-002_desktop_singleplayer_catalog.png
│   │   ├── EVD-003_desktop_multiplayer_hub.png
│   │   ├── EVD-004_desktop_settings_modal.png
│   │   └── EVD-005_desktop_profile_setup.png
│   ├── tablet/                          # Tablet Viewport (768x1024)
│   │   ├── EVD-006_tablet_home_dashboard.png
│   │   ├── EVD-007_tablet_singleplayer.png
│   │   └── EVD-008_tablet_game_view.png
│   ├── mobile/                          # Mobile Viewport (375x812)
│   │   ├── EVD-009_mobile_home_dashboard.png
│   │   ├── EVD-010_mobile_game_shelf.png
│   │   ├── EVD-011_mobile_snake_touch_controls.png
│   │   └── EVD-012_mobile_settings.png
│   ├── games/                           # Playable Games Active State (1920x1080)
│   │   ├── EVD-013_game_snake_active.png
│   │   ├── EVD-014_game_2048_active.png
│   │   ├── EVD-015_game_tetris_active.png
│   │   ├── EVD-016_game_minesweeper_active.png
│   │   ├── EVD-017_game_breakout_active.png
│   │   ├── EVD-018_game_checkers_active.png
│   │   ├── EVD-019_game_tictactoe_active.png
│   │   └── EVD-020_game_memorymatch_active.png
│   └── workflows/                       # Workflows & Error Handling (1920x1080)
│       ├── EVD-021_workflow_create_room.png
│       ├── EVD-022_workflow_join_room.png
│       ├── EVD-023_workflow_pass_and_play.png
│       ├── EVD-024_workflow_results_screen.png
│       └── EVD-025_workflow_404_not_found.png
│
└── scripts/                             # QA Automation & Generation Tooling
    ├── capture_evidence.py              # Automated Selenium Headless Chrome Screenshot Script
    ├── generate_test_data.py            # OpenPyXL Excel & CSV Generator for Test Cases and Defect Register
    └── generate_docx_report.py          # Python-Docx Generator for Final Word Report
```

---

## How to Execute the QA Test Suites

### 1. Run Automated Unit Tests (Vitest)
Executes all 9 unit test suites covering the pure functional game engines, WebRTC signaling logic, and StorageEngine v2:

```bash
cd frontend
npm test -- --run
```

**Expected Result:**
```
✓ src/games/game2048/__tests__/Game2048.test.ts (4 tests)
✓ src/games/checkers/__tests__/Checkers.test.ts (4 tests)
✓ src/games/minesweeper/__tests__/Minesweeper.test.ts (4 tests)
✓ src/games/tetris/__tests__/Tetris.test.ts (4 tests)
✓ src/games/tictactoe/__tests__/TicTacToe.test.ts (4 tests)
✓ src/games/snake/__tests__/Snake.test.ts (5 tests)
✓ src/games/breakout/__tests__/Breakout.test.ts (4 tests)
✓ src/db/__tests__/storage.test.ts (5 tests)
✓ src/network/__tests__/webrtc.test.ts (3 tests)

Test Files  9 passed (9)
     Tests  37 passed (37)
```

---

### 2. Verify Production Build & TypeScript Verification
Validates that TypeScript compiles without errors and Vite bundles the production assets:

```bash
cd frontend
npm run build
```

---

### 3. Re-capture Visual Screenshot Evidences
Spawns a local static server on port `4173` and automates headless Google Chrome across Desktop, Tablet, and Mobile viewports to record fresh PNGs into `QA_DOCUMENTATION/Screenshot_Evidence/`:

```bash
python QA_DOCUMENTATION/scripts/capture_evidence.py
```

---

### 4. Regenerate Excel & Word Deliverables
Regenerates `Detailed_Test_Cases.xlsx`, `Bug_and_Defect_Register.xlsx`, and `Final_QA_Testing_Report.docx`:

```bash
# Generate Excel & CSV data files
python QA_DOCUMENTATION/scripts/generate_test_data.py

# Generate DOCX Report with embedded screenshots
python QA_DOCUMENTATION/scripts/generate_docx_report.py
```
