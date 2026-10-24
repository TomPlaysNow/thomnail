import { useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { describeError, useT } from '../i18n';
import { FolderIcon } from './Icons';

interface Props {
  folderPath: string | null;
  disabled: boolean;
  onSelect: () => void;
  onDrop: (path: string) => void;
}
export default function DropZone({ folderPath, disabled, onSelect, onDrop }: Props) {
  const t = useT();
  const [hover, setHover] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    // Drops land anywhere in the window, so "disabled" also covers an open dialog.
    getCurrentWebview().onDragDropEvent(({ payload }) => {
      if (disposed || disabled) return;
      setHover(payload.type === 'enter' || payload.type === 'over');
      if (payload.type === 'drop' && payload.paths[0]) onDrop(payload.paths[0]);
    }).then((stop) => { if (disposed) stop(); else unlisten = stop; })
      .catch(() => { if (!disposed) setUnavailable(true); });
    return () => { disposed = true; unlisten?.(); };
  }, [disabled, onDrop]);
  useEffect(() => { if (disabled) setHover(false); }, [disabled]);

  return (
    <button type="button" className={`dropzone ${hover ? 'dropzone-hover' : ''}`} onClick={onSelect} disabled={disabled} title={folderPath || undefined}>
      <span className="dropzone-content">
        <span className="dropzone-icon"><FolderIcon selected={!!folderPath} /></span>
        <span className={folderPath ? 'dropzone-path' : 'dropzone-label'}>{folderPath || t.dropLabel}</span>
        <span className="dropzone-hint">{folderPath ? t.dropHintSelected : t.dropHint}</span>
        {unavailable && <span className="dropzone-hint">{describeError(t, { code: 'dropUnavailable' })}</span>}
      </span>
    </button>
  );
}
