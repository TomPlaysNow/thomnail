import type { FileProgress, FileStatus } from '../types';

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: 'Wartend',
  processing: 'Verarbeite...',
  done: 'Fertig',
  skipped: 'Übersprungen',
  error: 'Fehler',
};

const STATUS_CLASS: Record<FileStatus, string> = {
  pending: 'status-pending',
  processing: 'status-processing',
  done: 'status-done',
  skipped: 'status-pending',
  error: 'status-error',
};

export default function FileList({ files }: { files: FileProgress[] }) {
  return (
    <div className="file-list">
      {files.map((f) => (
        f.message ? <details key={f.filePath} className={`file-details ${STATUS_CLASS[f.status]}`}>
          <summary className="file-item" title="Meldung und vollständigen Dateipfad anzeigen">
            <span className="file-name" title={f.filePath}>{f.file}</span>
            <span className="file-status">{STATUS_LABEL[f.status] || f.status} · Details</span>
          </summary>
          <div className="file-detail-content">
            <p className="file-error">{f.message}</p>
            <p className="file-path">{f.filePath}</p>
          </div>
        </details> : <div key={f.filePath} className={`file-item ${STATUS_CLASS[f.status]}`}>
          <span className="file-name" title={f.filePath} aria-label={f.filePath}>{f.file}</span>
          <span className="file-status">{STATUS_LABEL[f.status] || f.status}</span>
        </div>
      ))}
    </div>
  );
}
