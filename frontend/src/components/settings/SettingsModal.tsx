import React, { useState, useEffect } from 'react';
import { storage, UserPreferences } from '../../db/storage';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange?: (prefs: UserPreferences) => void;
}

const AVATARS = ['🎮', '🕹️', '👾', '👑', '🚀', '⚡', '🐱', '🦊', '🐼', '🤖', '🎯', '🔥'];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onPreferencesChange }) => {
  const [prefs, setPrefs] = useState<UserPreferences>(() => storage.getPreferences());
  const [nickname, setNickname] = useState(prefs.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(prefs.avatar);
  const [importStatus, setImportStatus] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = storage.getPreferences();
      setPrefs(current);
      setNickname(current.nickname);
      setSelectedAvatar(current.avatar);
      setImportStatus('');
      setConfirmReset(false);
    }
  }, [isOpen]);

  const handleSavePreferences = () => {
    const updated = storage.setPreferences({
      ...prefs,
      nickname: nickname.trim() || 'Console Player',
      avatar: selectedAvatar,
    });
    setPrefs(updated);
    if (onPreferencesChange) onPreferencesChange(updated);
    onClose();
  };

  const handleExportData = () => {
    try {
      const dataStr = storage.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gamehub-save-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setImportStatus('Failed to generate export file.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storage.importData(content);
      if (res.success) {
        setImportStatus('✅ Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus(`❌ Import error: ${res.error || 'Invalid file format'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    storage.resetAllData();
    setConfirmReset(false);
    setImportStatus('All data has been reset to defaults.');
    setTimeout(() => window.location.reload(), 800);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Platform Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Profile Customization */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#f1f5f9' }}>👤 Local Player Profile</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" style={{ fontSize: '0.8rem', marginBottom: '0.35rem', display: 'block' }}>Display Name</label>
            <input
              className="input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your nickname"
              maxLength={20}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>Choose Avatar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  style={{
                    fontSize: '1.4rem',
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    border: selectedAvatar === av ? '2px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: selectedAvatar === av ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Experience & Accessibility Preferences */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#f1f5f9' }}>🎮 Experience & Motion</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.85rem' }}>Sound Effects</span>
              <input
                type="checkbox"
                checked={prefs.soundEnabled}
                onChange={(e) => setPrefs({ ...prefs, soundEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <span style={{ fontSize: '0.85rem', display: 'block' }}>Reduced Motion</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Minimizes rapid screen animations</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.reducedMotion}
                onChange={(e) => setPrefs({ ...prefs, reducedMotion: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
              />
            </label>
          </div>
        </div>

        {/* Local Data Backup & Portability */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '0.25rem', fontSize: '0.95rem', color: '#f1f5f9' }}>💾 Data Portability</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Your favorites, level progress, and high scores stay in this browser. Backup or transfer your save anytime.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportData}>
              📥 Export Save (.json)
            </button>

            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              📤 Import Save
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>

          {importStatus && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f59e0b' }}>
              {importStatus}
            </div>
          )}
        </div>

        {/* Reset Danger Zone */}
        <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '0.75rem' }}>
          {!confirmReset ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmReset(true)}
              style={{ color: '#ef4444', fontSize: '0.8rem' }}
            >
              ⚠️ Reset Local Platform Data
            </button>
          ) : (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.5rem', fontWeight: 600 }}>
                Are you sure? This will clear favorites, high scores, and stats from this device.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="danger" size="sm" onClick={handleResetData}>
                  Yes, Reset Everything
                </Button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-ghost btn-md" onClick={onClose}>
            Cancel
          </button>
          <Button variant="primary" size="md" onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </div>
      </div>
    </Modal>
  );
};
