import { useState, useEffect } from 'react';
import { api, errorMessage } from '../api';
import type { Settings as SettingsData } from '../types';

export default function Settings({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch((e) => setError(errorMessage(e)));
  }, []);

  const handleChange = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => prev ? ({ ...prev, [key]: value }) : prev);
  };

  const handleSave = async () => {
    if (!settings || saving) return;
    setSaving(true);
    try {
      await api.setSettings({
        ffmpegPath: settings.ffmpegPath,
        recursive: settings.recursive,
        skipProcessed: settings.skipProcessed,
      });
      onClose();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="settings-overlay"><div className="settings-panel"><p role="alert">{error || 'Einstellungen werden geladen…'}</p><button onClick={onClose}>Schließen</button></div></div>;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Einstellungen</h2>
        {error && <p role="alert">{error}</p>}

        <label>
          ffmpeg-Pfad
          <input
            type="text"
            value={settings.ffmpegPath}
            placeholder="Automatisch (Homebrew, MacPorts, PATH)"
            onChange={(e) => handleChange('ffmpegPath', e.target.value)}
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.recursive}
            onChange={(e) => handleChange('recursive', e.target.checked)}
          />
          Unterordner rekursiv verarbeiten
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.skipProcessed}
            onChange={(e) => handleChange('skipProcessed', e.target.checked)}
          />
          Bereits verarbeitete Dateien überspringen
        </label>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn-primary" disabled={saving} onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
