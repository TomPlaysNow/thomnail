import { useState, useEffect } from 'react';
import { api } from '../api';
import { LANGUAGE_NAMES, describeError, useT, type Language } from '../i18n';
import type { Settings as SettingsData } from '../types';

interface Props {
  onClose: () => void;
  onSaved: (settings: SettingsData) => void;
}

export default function Settings({ onClose, onSaved }: Props) {
  const t = useT();
  const [settings, setSettings] = useState<SettingsData | null>(null);

  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(setError);
  }, []);

  const handleChange = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => prev ? ({ ...prev, [key]: value }) : prev);
  };

  const handleSave = async () => {
    if (!settings || saving) return;
    setSaving(true);
    try {
      onSaved(await api.setSettings({
        ffmpegPath: settings.ffmpegPath,
        recursive: settings.recursive,
        skipProcessed: settings.skipProcessed,
        language: settings.language,
      }));
    } catch (e) { setError(e); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="settings-overlay"><div className="settings-panel"><p role="alert">{error != null ? describeError(t, error) : t.loading}</p><button onClick={onClose}>{t.close}</button></div></div>;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{t.settings}</h2>
        {error != null && <p role="alert">{describeError(t, error)}</p>}

        <label>
          {t.language}
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="auto">{t.languageAuto}</option>
            {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
              <option key={code} value={code} lang={code}>{LANGUAGE_NAMES[code]}</option>
            ))}
          </select>
        </label>

        <label>
          {t.ffmpegPath}
          <input
            type="text"
            value={settings.ffmpegPath}
            placeholder={t.ffmpegPlaceholder}
            onChange={(e) => handleChange('ffmpegPath', e.target.value)}
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.recursive}
            onChange={(e) => handleChange('recursive', e.target.checked)}
          />
          {t.recursive}
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.skipProcessed}
            onChange={(e) => handleChange('skipProcessed', e.target.checked)}
          />
          {t.skipProcessed}
        </label>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" disabled={saving} onClick={handleSave}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}
