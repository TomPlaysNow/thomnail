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
        <div key={f.filePath} className={`file-item ${STATUS_CLASS[f.status]}`}>
          <span className="file-name">{f.file}</span>
          <span className="file-status">{STATUS_LABEL[f.status] || f.status}</span>
          {f.message && <span className="file-error">{f.message}</span>}
        </div>
      ))}
    </div>
  );
}
