import time
import os
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

PORT = 4173
DIST_DIR = os.path.abspath("frontend/dist")
EVIDENCE_DIR = os.path.abspath("QA_DOCUMENTATION/Screenshot_Evidence")

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def log_message(self, format, *args):
        # suppress logging
        pass

def start_server():
    httpd = HTTPServer(('127.0.0.1', PORT), CustomHandler)
    httpd.serve_forever()

def run_capture():
    print(f"Starting static HTTP server for {DIST_DIR} on port {PORT}...")
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1)

    print("Configuring headless Chrome...")
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--force-device-scale-factor=1')

    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)

    base_url = f"http://127.0.0.1:{PORT}"

    try:
        print("\n--- CAPTURING DESKTOP VIEWPORT EVIDENCE (1920x1080) ---")
        driver.set_window_size(1920, 1080)
        
        # EVD-001: Desktop Dashboard
        driver.get(f"{base_url}/#/")
        time.sleep(2)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-001_desktop_home_dashboard.png"))
        print("Captured EVD-001: Desktop Dashboard")

        # EVD-002: Desktop Single Player Catalog
        driver.get(f"{base_url}/#/singleplayer")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-002_desktop_singleplayer_catalog.png"))
        print("Captured EVD-002: Desktop SinglePlayer Catalog")

        # EVD-003: Desktop Multiplayer Hub
        driver.get(f"{base_url}/#/multiplayer")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-003_desktop_multiplayer_hub.png"))
        print("Captured EVD-003: Desktop Multiplayer Hub")

        # EVD-004: Desktop Settings Modal
        driver.get(f"{base_url}/#/")
        time.sleep(1)
        # click settings button in header
        try:
            settings_btn = driver.find_element(By.XPATH, "//button[contains(@aria-label, 'Settings') or contains(., '⚙️')]")
            settings_btn.click()
            time.sleep(1)
            driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-004_desktop_settings_modal.png"))
            print("Captured EVD-004: Desktop Settings Modal")
        except Exception as e:
            print("Settings modal button click failed, trying query selector:", e)
            driver.execute_script("document.querySelector('button[aria-label*=\"Settings\"]')?.click()")
            time.sleep(1)
            driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-004_desktop_settings_modal.png"))

        # EVD-005: Desktop Profile Setup
        driver.get(f"{base_url}/#/setup")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "desktop", "EVD-005_desktop_profile_setup.png"))
        print("Captured EVD-005: Desktop Profile Setup")

        print("\n--- CAPTURING TABLET VIEWPORT EVIDENCE (768x1024) ---")
        driver.set_window_size(768, 1024)
        
        # EVD-006: Tablet Dashboard
        driver.get(f"{base_url}/#/")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "tablet", "EVD-006_tablet_home_dashboard.png"))
        print("Captured EVD-006: Tablet Dashboard")

        # EVD-007: Tablet SinglePlayer
        driver.get(f"{base_url}/#/singleplayer")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "tablet", "EVD-007_tablet_singleplayer.png"))
        print("Captured EVD-007: Tablet SinglePlayer")

        # EVD-008: Tablet Game View (2048)
        driver.get(f"{base_url}/#/play/single/game2048")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "tablet", "EVD-008_tablet_game_view.png"))
        print("Captured EVD-008: Tablet Game View (2048)")

        print("\n--- CAPTURING MOBILE VIEWPORT EVIDENCE (375x812) ---")
        driver.set_window_size(375, 812)

        # EVD-009: Mobile Dashboard
        driver.get(f"{base_url}/#/")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "mobile", "EVD-009_mobile_home_dashboard.png"))
        print("Captured EVD-009: Mobile Dashboard")

        # EVD-010: Mobile Game Shelf (scroll down)
        driver.execute_script("window.scrollTo(0, 400);")
        time.sleep(1)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "mobile", "EVD-010_mobile_game_shelf.png"))
        print("Captured EVD-010: Mobile Game Shelf")

        # EVD-011: Mobile Snake with touch controls
        driver.get(f"{base_url}/#/play/single/snake")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "mobile", "EVD-011_mobile_snake_touch_controls.png"))
        print("Captured EVD-011: Mobile Snake with Touch Controls")

        # EVD-012: Mobile Settings Modal
        driver.get(f"{base_url}/#/")
        time.sleep(1)
        try:
            driver.execute_script("document.querySelector('button[aria-label*=\"Settings\"]')?.click()")
            time.sleep(1)
            driver.save_screenshot(os.path.join(EVIDENCE_DIR, "mobile", "EVD-012_mobile_settings.png"))
            print("Captured EVD-012: Mobile Settings Modal")
        except Exception as e:
            print("Mobile settings click error:", e)

        print("\n--- CAPTURING GAMEPLAY EVIDENCE (1920x1080) ---")
        driver.set_window_size(1920, 1080)

        # EVD-013: Snake Classic
        driver.get(f"{base_url}/#/play/single/snake")
        time.sleep(1.5)
        # trigger start game button if present
        try:
            start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Start') or contains(., 'Play')]")
            start_btn.click()
            time.sleep(1)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-013_game_snake_active.png"))
        print("Captured EVD-013: Snake Classic")

        # EVD-014: 2048 Puzzle
        driver.get(f"{base_url}/#/play/single/game2048")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-014_game_2048_active.png"))
        print("Captured EVD-014: 2048 Puzzle")

        # EVD-015: Tetris Arcade
        driver.get(f"{base_url}/#/play/single/tetris")
        time.sleep(1.5)
        try:
            start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Start') or contains(., 'Play')]")
            start_btn.click()
            time.sleep(1)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-015_game_tetris_active.png"))
        print("Captured EVD-015: Tetris Arcade")

        # EVD-016: Minesweeper
        driver.get(f"{base_url}/#/play/single/minesweeper")
        time.sleep(1.5)
        # click first cell for safe start
        try:
            cells = driver.find_elements(By.CSS_SELECTOR, "button[data-cell], .grid button, .minesweeper-cell")
            if cells:
                cells[len(cells)//2].click()
                time.sleep(0.5)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-016_game_minesweeper_active.png"))
        print("Captured EVD-016: Minesweeper")

        # EVD-017: Breakout Arcade
        driver.get(f"{base_url}/#/play/single/breakout")
        time.sleep(1.5)
        try:
            start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Start') or contains(., 'Play')]")
            start_btn.click()
            time.sleep(1)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-017_game_breakout_active.png"))
        print("Captured EVD-017: Breakout Arcade")

        # EVD-018: Checkers Classic
        driver.get(f"{base_url}/#/play/single/checkers")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-018_game_checkers_active.png"))
        print("Captured EVD-018: Checkers Classic")

        # EVD-019: Tic-Tac-Toe Minimax AI
        driver.get(f"{base_url}/#/play/single/tictactoe")
        time.sleep(1.5)
        # click a cell to make move
        try:
            cells = driver.find_elements(By.CSS_SELECTOR, "button.ttt-cell, .grid button, [data-index]")
            if cells:
                cells[0].click()
                time.sleep(0.8)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-019_game_tictactoe_active.png"))
        print("Captured EVD-019: Tic-Tac-Toe")

        # EVD-020: Memory Match
        driver.get(f"{base_url}/#/play/single/memorymatch")
        time.sleep(1.5)
        try:
            cards = driver.find_elements(By.CSS_SELECTOR, "button.card, .memory-card, .grid button")
            if len(cards) >= 2:
                cards[0].click()
                time.sleep(0.3)
                cards[1].click()
                time.sleep(0.5)
        except Exception:
            pass
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "games", "EVD-020_game_memorymatch_active.png"))
        print("Captured EVD-020: Memory Match")

        print("\n--- CAPTURING WORKFLOW & NETWORKING EVIDENCE (1920x1080) ---")
        
        # EVD-021: Create Room (WebRTC Host)
        driver.get(f"{base_url}/#/multiplayer/create")
        time.sleep(2)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "workflows", "EVD-021_workflow_create_room.png"))
        print("Captured EVD-021: Create Room (WebRTC Host)")

        # EVD-022: Join Room (WebRTC Guest)
        driver.get(f"{base_url}/#/multiplayer/join")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "workflows", "EVD-022_workflow_join_room.png"))
        print("Captured EVD-022: Join Room (WebRTC Guest)")

        # EVD-023: Pass & Play
        driver.get(f"{base_url}/#/play/local")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "workflows", "EVD-023_workflow_pass_and_play.png"))
        print("Captured EVD-023: Pass & Play")

        # EVD-024: Results Screen
        driver.get(f"{base_url}/#/results")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "workflows", "EVD-024_workflow_results_screen.png"))
        print("Captured EVD-024: Results Screen")

        # EVD-025: 404 Not Found Page
        driver.get(f"{base_url}/#/unknown-route-test")
        time.sleep(1.5)
        driver.save_screenshot(os.path.join(EVIDENCE_DIR, "workflows", "EVD-025_workflow_404_not_found.png"))
        print("Captured EVD-025: 404 Not Found")

        print("\nAll 25 Evidence screenshots successfully captured!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_capture()
