import { useState, useEffect, useRef, useCallback } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import Progress from './Progress';
import SettingsPanel from './Settings';
import { api } from '../api';
import { I18n, MESSAGES, describeError, resolveLanguage, type Language } from '../i18n';
import type { AppInfo, FileProgress, Settings, Summary } from '../types';

export default function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [framePosition, setFramePosition] = useState(50);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [language, setLanguage] = useState<Language>(() => resolveLanguage('auto'));
  const runningRef = useRef(false);
  const pendingSave = useRef<Promise<unknown>>(Promise.resolve());
  const t = MESSAGES[language];

  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    Promise.all([api.getSettings(), api.getAppInfo()]).then(([settings, appInfo]) => {
      setFramePosition(parseInt(settings.framePosition, 10));
      setLanguage(resolveLanguage(settings.language));
      setInfo(appInfo);
    }).catch(setError);
  }, []);

  const applyFolder = useCallback((folder: string) => {
    setFolderPath(folder);
    setFiles([]);
    setSummary(null);
    setError(null);
  }, []);
  const handleSelectFolder = async () => {
    if (runningRef.current) return;
    try {
      const folder = await api.openFolder(t.dialogTitle);
      if (folder && !runningRef.current) applyFolder(folder);
    } catch (e) { setError(e); }
  };
  const handleDropFolder = useCallback(async (path: string) => {
    if (runningRef.current) return;
    try {
      if (await api.isDirectory(path)) {
        if (!runningRef.current) applyFolder(path);
      } else { setError({ code: 'dropNotFolder' }); }
    } catch (e) { setError(e); }
  }, [applyFolder]);
  const handleFrameChange = (value: number) => {
    setFramePosition(value);
    pendingSave.current = pendingSave.current.catch(() => {}).then(() => api.setSettings({ framePosition: `${value}%` }));
    void pendingSave.current.catch(setError);
  };
  const handleSettingsSaved = (settings: Settings) => {
    setLanguage(resolveLanguage(settings.language));
    setShowSettings(false);
  };
  const handleStart = async () => {
    if (!folderPath || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setFiles([]);
    setSummary(null);
    setError(null);
    let unlisten: (() => void) | undefined;
    try {
      await pendingSave.current;
      unlisten = await api.onProgress((data) => {
        setFiles((previous) => {
          const index = previous.findIndex((file) => file.filePath === data.filePath);
          if (index === -1) return [...previous, data];
          const next = [...previous];
          next[index] = data;
          return next;
        });
      });
      setSummary(await api.processFolder(folderPath));
    } catch (e) { setError(e); }
    finally {
      unlisten?.();
      runningRef.current = false;
      setRunning(false);
    }
  };
  const completed = files.filter((file) => ['done', 'error', 'skipped'].includes(file.status)).length;

  return (
    <I18n value={t}>
      <div className="app">
        <header className="app-header">
          <h1>Thomnail</h1>
          <button className="btn-icon" disabled={running || !info} onClick={async () => {
            try { await pendingSave.current; setShowSettings(!showSettings); }
            catch (e) { setError(e); }
          }} title={t.settings} aria-label={t.settings}>⚙</button>
        </header>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} onSaved={handleSettingsSaved} />}
        {info && !info.supportsIcons && <div className="summary partial">{t.notMacos}</div>}
        <DropZone folderPath={folderPath} onSelect={handleSelectFolder} onDrop={handleDropFolder} disabled={running} />
        <div className="timepicker-row">
          <label htmlFor="frame-position" className="timepicker-label">{t.frameAt} <span className="timepicker-value">{t.percent(framePosition)}</span></label>
          <input id="frame-position" type="range" min="1" max="99" value={framePosition} aria-valuetext={t.frameValueText(framePosition)} title={t.frameTitle} onChange={(e) => handleFrameChange(Number(e.target.value))} disabled={running || !info} className="timepicker-slider" />
        </div>
        {folderPath && !running && <button className="btn-primary" onClick={handleStart} disabled={!info?.supportsIcons}>{t.start}</button>}
        {error != null && <div className="summary partial" role="alert">{describeError(t, error)}</div>}
        {(running || files.length > 0) && <Progress done={completed} total={files.length} running={running} />}
        {files.length > 0 && <FileList files={files} />}
        {summary && <div className={`summary ${summary.total === 0 ? 'neutral' : summary.success + summary.skipped === summary.total ? 'success' : 'partial'}`}>
          {summary.total === 0 ? t.noVideos : t.summary(summary.success, summary.total, summary.skipped)}
        </div>}
        {info && <footer className="app-footer">Thomnail {info.version} · {info.platform} · TomPlaysNow</footer>}
      </div>
    </I18n>
  );
}
