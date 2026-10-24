import { useState, useEffect, useRef, useCallback } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import Progress from './Progress';
import SettingsPanel from './Settings';
import { api, errorMessage } from '../api';
import type { AppInfo, FileProgress, Summary } from '../types';

export default function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [framePosition, setFramePosition] = useState(50);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState('');
  const runningRef = useRef(false);
  const pendingSave = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    Promise.all([api.getSettings(), api.getAppInfo()]).then(([settings, appInfo]) => {
      setFramePosition(parseInt(settings.framePosition, 10));
      setInfo(appInfo);
    }).catch((e) => setError(errorMessage(e)));
  }, []);

  const applyFolder = useCallback((folder: string) => {
    setFolderPath(folder);
    setFiles([]);
    setSummary(null);
    setError('');
  }, []);
  const handleSelectFolder = async () => {
    if (runningRef.current) return;
    try {
      const folder = await api.openFolder();
      if (folder && !runningRef.current) applyFolder(folder);
    } catch (e) { setError(errorMessage(e)); }
  };
  const handleDropFolder = useCallback(async (path: string) => {
    if (runningRef.current) return;
    try {
      if (await api.isDirectory(path)) {
        if (!runningRef.current) applyFolder(path);
      } else { setError('Bitte einen Ordner mit Videos ablegen.'); }
    } catch (e) { setError(errorMessage(e)); }
  }, [applyFolder]);
  const handleFrameChange = (value: number) => {
    setFramePosition(value);
    pendingSave.current = pendingSave.current.catch(() => {}).then(() => api.setSettings({ framePosition: `${value}%` }));
    void pendingSave.current.catch((e) => setError(errorMessage(e)));
  };
  const handleStart = async () => {
    if (!folderPath || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setFiles([]);
    setSummary(null);
    setError('');
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
    } catch (e) { setError(errorMessage(e)); }
    finally {
      unlisten?.();
      runningRef.current = false;
      setRunning(false);
    }
  };
  const completed = files.filter((file) => ['done', 'error', 'skipped'].includes(file.status)).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Thomnail</h1>
        <button className="btn-icon" disabled={running || !info} onClick={async () => {
          try { await pendingSave.current; setShowSettings(!showSettings); }
          catch (e) { setError(errorMessage(e)); }
        }} title="Einstellungen" aria-label="Einstellungen">⚙</button>
      </header>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {info && !info.supportsIcons && <div className="summary partial">Das Setzen von Datei-Icons ist bisher nur für macOS verfügbar. Windows und Linux sind in Vorbereitung.</div>}
      <DropZone folderPath={folderPath} onSelect={handleSelectFolder} onDrop={handleDropFolder} disabled={running} />
      <div className="timepicker-row">
        <label htmlFor="frame-position" className="timepicker-label">Frame bei <span className="timepicker-value">{framePosition} %</span></label>
        <input id="frame-position" type="range" min="1" max="99" value={framePosition} aria-valuetext={`${framePosition} Prozent der Videolänge`} title="Position des Vorschaubilds innerhalb jedes Videos" onChange={(e) => handleFrameChange(Number(e.target.value))} disabled={running || !info} className="timepicker-slider" />
      </div>
      {folderPath && !running && <button className="btn-primary" onClick={handleStart} disabled={!info?.supportsIcons}>Icons setzen</button>}
      {error && <div className="summary partial" role="alert">{error}</div>}
      {(running || files.length > 0) && <Progress done={completed} total={files.length} running={running} />}
      {files.length > 0 && <FileList files={files} />}
      {summary && <div className={`summary ${summary.success + summary.skipped === summary.total ? 'success' : 'partial'}`}>
        {summary.total === 0 ? 'Keine Videos gefunden.' : `${summary.success} von ${summary.total} erfolgreich verarbeitet` + (summary.skipped > 0 ? `, ${summary.skipped} übersprungen.` : '.')}
      </div>}
      {info && <footer className="app-footer">Thomnail {info.version} · {info.platform} · TomPlaysNow</footer>}
    </div>
  );
}
