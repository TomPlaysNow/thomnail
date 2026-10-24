import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { api } from '../api';
import { LANGUAGE_NAMES, describeError, useT, type Language } from '../i18n';
import type { Settings as SettingsData } from '../types';

interface Props {
  onClose: () => void;
  onSaved: (settings: SettingsData) => void;
}

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled)';

export default function Settings({ onClose, onSaved }: Props) {
  const t = useT();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(setError);
  }, []);
  // Focus moves into the dialog and returns to the opening button afterwards.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus();
  }, []);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [settings === null]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) return;
    // Keep keyboard focus inside the dialog.
    const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

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

  // Clicking beside the dialog does nothing, so unsaved changes are never lost by accident.
  return (
    <div className="settings-overlay" onKeyDown={handleKeyDown}>
      <div className="settings-panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <h2 id="settings-title">{t.settings}</h2>
        {error != null && <p className="notice notice-error" role="alert">{describeError(t, error)}</p>}
        {!settings ? <>
          {error == null && <p>{t.loading}</p>}
          <div className="settings-actions"><button className="btn-secondary" onClick={onClose}>{t.close}</button></div>
        </> : <>
          <label>
            {t.language}
            <select value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
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
        </>}
      </div>
    </div>
  );
}
