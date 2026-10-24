import { useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';

interface Props {
  folderPath: string | null;
  disabled: boolean;
  onSelect: () => void;
  onDrop: (path: string) => void;
}
export default function DropZone({ folderPath, disabled, onSelect, onDrop }: Props) {
  const [hover, setHover] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    getCurrentWebview().onDragDropEvent(({ payload }) => {
      if (disposed || disabled) return;
      setHover(payload.type === 'enter' || payload.type === 'over');
      if (payload.type === 'drop' && payload.paths[0]) onDrop(payload.paths[0]);
    }).then((stop) => { if (disposed) stop(); else unlisten = stop; })
      .catch(() => { if (!disposed) setError('Drag & Drop nicht verfügbar. Bitte den Ordner per Klick auswählen.'); });
    return () => { disposed = true; unlisten?.(); };
  }, [disabled, onDrop]);

  return (
    <button type="button" className={`dropzone ${hover ? 'dropzone-hover' : ''}`} onClick={onSelect} disabled={disabled}>
      <span className={folderPath ? 'dropzone-selected' : 'dropzone-empty'}>
        <span className="dropzone-icon">{folderPath ? '📁' : '📂'}</span>
        <span className={folderPath ? 'dropzone-path' : 'dropzone-label'}>{folderPath || 'Ordner hierher ziehen'}</span>
        <span className="dropzone-hint">{folderPath ? 'Klicken oder neuen Ordner ablegen' : 'oder klicken zum Auswählen'}</span>
        {error && <span className="dropzone-hint">{error}</span>}
      </span>
    </button>
  );
}
