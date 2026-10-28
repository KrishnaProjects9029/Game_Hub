import { describe, it, expect, beforeEach } from 'vitest';
import { storage, calcLevel } from '../storage';

describe('Storage Engine and XP calculations', () => {
  beforeEach(() => {
    storage.resetAllData();
  });

  it('calculates levels correctly based on XP thresholds', () => {
    expect(calcLevel(0)).toBe(1);
    expect(calcLevel(99)).toBe(1);
    expect(calcLevel(100)).toBe(2);
    expect(calcLevel(249)).toBe(2);
    expect(calcLevel(250)).toBe(3);
    expect(calcLevel(1000)).toBe(5);
  });

  it('manages favorites correctly', () => {
    expect(storage.getFavorites()).toEqual([]);
    expect(storage.isFavorite('tictactoe')).toBe(false);

    const added = storage.toggleFavorite('tictactoe');
    expect(added).toBe(true);
    expect(storage.isFavorite('tictactoe')).toBe(true);
    expect(storage.getFavorites()).toContain('tictactoe');

    const removed = storage.toggleFavorite('tictactoe');
    expect(removed).toBe(false);
    expect(storage.isFavorite('tictactoe')).toBe(false);
  });

  it('manages high scores correctly', () => {
    expect(storage.getHighScore('snake')).toBe(0);
    const saved = storage.saveHighScore('snake', 250);
    expect(saved).toBe(true);
    expect(storage.getHighScore('snake')).toBe(250);

    // Saving lower score does not overwrite
    const lower = storage.saveHighScore('snake', 150);
    expect(lower).toBe(false);
    expect(storage.getHighScore('snake')).toBe(250);

    // Saving higher score overwrites
    const higher = storage.saveHighScore('snake', 420);
    expect(higher).toBe(true);
    expect(storage.getHighScore('snake')).toBe(420);
  });

  it('manages preferences and defaults', () => {
    const prefs = storage.getPreferences();
    expect(prefs.soundEnabled).toBe(true);
    expect(prefs.theme).toBe('console-dark');

    storage.setPreferences({ soundEnabled: false, theme: 'cyber' });
    const updated = storage.getPreferences();
    expect(updated.soundEnabled).toBe(false);
    expect(updated.theme).toBe('cyber');
  });

  it('handles export and import of data safely', () => {
    storage.toggleFavorite('connect4');
    storage.saveHighScore('tetris', 9999);

    const json = storage.exportData();
    expect(typeof json).toBe('string');
    expect(json).toContain('connect4');
    expect(json).toContain('9999');

    storage.resetAllData();
    expect(storage.isFavorite('connect4')).toBe(false);
    expect(storage.getHighScore('tetris')).toBe(0);

    const res = storage.importData(json);
    expect(res.success).toBe(true);
    expect(storage.isFavorite('connect4')).toBe(true);
    expect(storage.getHighScore('tetris')).toBe(9999);
  });
});
