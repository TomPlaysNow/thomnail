import React, { useState, useEffect, useRef } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import Progress from './Progress';
import Settings from './Settings';

export default function App() {
  const [folderPath, setFolderPath] = useState(null);
  const [files, setFiles] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [framePosition, setFramePosition] = useState(50);
  const handlerRef = useRef(null);

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setFramePosition(parseInt(s.framePosition) || 50);
    });
  }, []);

  const applyFolder = (folder) => {
    setFolderPath(folder);
    setFiles([]);
    setSummary(null);
  };

  const handleSelectFolder = async () => {
    if (running) return;
    const folder = await window.api.openFolder();
    if (folder) applyFolder(folder);
  };

  const handleDropFolder = async (droppedPath) => {
    if (running) return;
    if (await window.api.isDirectory(droppedPath)) applyFolder(droppedPath);
  };

  const handleFrameChange = async (val) => {
    setFramePosition(val);
    await window.api.setSettings({ framePosition: `${val}%` });
  };

  const handleStart = async () => {
    if (!folderPath || running) return;

    setRunning(true);
    setFiles([]);
    setSummary(null);

    handlerRef.current = window.api.onProgress((data) => {
      setFiles((prev) => {
        const idx = prev.findIndex((f) => f.filePath === data.filePath);
        if (idx === -1) return [...prev, data];
        const next = [...prev];
        next[idx] = data;
        return next;
      });
    });

    try {
      const result = await window.api.processFolder(folderPath);
      setSummary(result);
    } finally {
      if (handlerRef.current) {
        window.api.removeProgressListener(handlerRef.current);
        handlerRef.current = null;
      }
      setRunning(false);
    }
  };

  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const totalCount = files.length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>VideoThumb</h1>
        <button className="btn-icon" onClick={() => setShowSettings(!showSettings)} title="Einstellungen">⚙</button>
      </header>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      <DropZone folderPath={folderPath} onSelect={handleSelectFolder} onDrop={handleDropFolder} />

      <div className="timepicker-row">
        <span className="timepicker-label">Zeitpunkt</span>
        <input
          type="range"
          min="1"
          max="99"
          value={framePosition}
          onChange={(e) => handleFrameChange(Number(e.target.value))}
          disabled={running}
          className="timepicker-slider"
        />
        <span className="timepicker-value">{framePosition}%</span>
      </div>

      {folderPath && !running && (
        <button className="btn-primary" onClick={handleStart}>
          Icons setzen
        </button>
      )}

      {(running || files.length > 0) && (
        <Progress done={doneCount} total={totalCount} running={running} />
      )}

      {files.length > 0 && <FileList files={files} />}

      {summary && (
        <div className={`summary ${summary.success + summary.skipped === summary.total ? 'success' : 'partial'}`}>
          {summary.total === 0
            ? 'Keine Videos gefunden.'
            : `${summary.success} von ${summary.total} erfolgreich verarbeitet` +
              (summary.skipped > 0 ? `, ${summary.skipped} übersprungen.` : '.')}
        </div>
      )}
    </div>
  );
}
