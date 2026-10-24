import React, { useState, useEffect } from 'react';

export default function Settings({ onClose }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    window.api.getSettings().then(setSettings);
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await window.api.setSettings(settings);
    onClose();
  };

  if (!settings) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Einstellungen</h2>

        <label>
          ffmpeg-Pfad
          <input
            type="text"
            value={settings.ffmpegPath}
            onChange={(e) => handleChange('ffmpegPath', e.target.value)}
          />
        </label>

        <label>
          Frame-Position
          <div className="range-row">
            <input
              type="range"
              min="1"
              max="99"
              value={parseInt(settings.framePosition)}
              onChange={(e) => handleChange('framePosition', `${e.target.value}%`)}
            />
            <span>{settings.framePosition}</span>
          </div>
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
          <button className="btn-primary" onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
