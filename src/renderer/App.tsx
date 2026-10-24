import { useState, useEffect, useRef, useCallback } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import Progress from './Progress';
import SettingsPanel from './Settings';
import { SettingsIcon } from './Icons';
import { api } from '../api';
import { I18n, MESSAGES, describeError, resolveLanguage, type Language } from '../i18n';
import type { AppInfo, FileItem, Settings, Summary } from '../types';

const PLATFORM_NAMES: Record<string, string> = { macos: 'macOS', windows: 'Windows', linux: 'Linux' };

export default function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [running, setRunning] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
      unlisten = await api.onProcessEvent((event) => {
        if (event.kind === 'files') {
          setFiles(event.files.map((file) => ({ ...file, status: 'pending' })));
        } else {
          setFiles((previous) => {
            const next = previous.slice();
            next[event.index] = { ...next[event.index], status: event.status, error: event.error };
            return next;
          });
        }
      });
      const result = await api.processFolder(folderPath);
      if (result.cancelled) {
        setFiles((previous) => previous.map((file) => file.status === 'pending' ? { ...file, status: 'cancelled' } : file));
      }
      setSummary(result);
    } catch (e) { setError(e); }
    finally {
      unlisten?.();
      runningRef.current = false;
      setRunning(false);
      setCancelling(false);
    }
  };
  const handleCancel = () => {
    setCancelling(true);
    api.cancelProcessing().catch(setError);
  };
  const completed = files.filter((file) => ['done', 'error', 'skipped'].includes(file.status)).length;
  const summaryClass = !summary ? '' : summary.total === 0 || summary.cancelled ? 'neutral'
    : summary.success + summary.skipped === summary.total ? 'success' : 'partial';

  return (
    <I18n value={t}>
      <div className="app">
        <header className="app-header">
          <h1>Thomnail</h1>
          <button className="btn-icon" disabled={running || !info} onClick={async () => {
            try { await pendingSave.current; setShowSettings(!showSettings); }
            catch (e) { setError(e); }
          }} title={t.settings} aria-label={t.settings}><SettingsIcon /></button>
        </header>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} onSaved={handleSettingsSaved} />}
        {info && !info.supportsIcons && <div className="notice">{t.notMacos}</div>}
        <DropZone folderPath={folderPath} onSelect={handleSelectFolder} onDrop={handleDropFolder} disabled={running || showSettings} />
        <div className="timepicker-row">
          <label htmlFor="frame-position" className="timepicker-label">{t.frameAt} <span className="timepicker-value">{t.percent(framePosition)}</span></label>
          <input id="frame-position" type="range" min="1" max="99" value={framePosition} aria-valuetext={t.frameValueText(framePosition)} title={t.frameTitle} onChange={(e) => handleFrameChange(Number(e.target.value))} disabled={running || !info} className="timepicker-slider" />
        </div>
        {/* One action slot, so the layout does not jump when a folder is chosen or a run starts. */}
        <div className="actions">
          {running
            ? <button className="btn-secondary" onClick={handleCancel} disabled={cancelling}>{cancelling ? t.cancelling : t.cancel}</button>
            : <button className="btn-primary" onClick={handleStart} disabled={!folderPath || !info?.supportsIcons} title={folderPath ? undefined : t.chooseFolderFirst}>{t.start}</button>}
        </div>
        {error != null && <div className="notice notice-error" role="alert">{describeError(t, error)}</div>}
        {(running || files.length > 0) && <Progress done={completed} total={files.length} running={running} />}
        {/* Above the list, so the result is visible without scrolling through long folders. */}
        {summary && <div className={`summary ${summaryClass}`} role="status">
          {summary.total === 0 ? t.noVideos
            : summary.cancelled ? t.summaryCancelled(summary.success, summary.total, summary.skipped)
            : t.summary(summary.success, summary.total, summary.skipped)}
        </div>}
        {files.length > 0 && <FileList files={files} />}
        {info && <footer className="app-footer">Thomnail {info.version} · {PLATFORM_NAMES[info.platform] ?? info.platform} · TomPlaysNow</footer>}
      </div>
    </I18n>
  );
}
