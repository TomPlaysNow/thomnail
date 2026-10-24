import { describeError, useT } from '../i18n';
import type { FileProgress, FileStatus } from '../types';

const STATUS_CLASS: Record<FileStatus, string> = {
  pending: 'status-pending',
  processing: 'status-processing',
  done: 'status-done',
  skipped: 'status-pending',
  error: 'status-error',
};

export default function FileList({ files }: { files: FileProgress[] }) {
  const t = useT();
  return (
    <div className="file-list">
      {files.map((f) => (
        f.error ? <details key={f.filePath} className={`file-details ${STATUS_CLASS[f.status]}`}>
          <summary className="file-item" title={t.detailsTitle}>
            <span className="file-name" title={f.filePath}>{f.file}</span>
            <span className="file-status">{t.status[f.status] || f.status} · {t.details}</span>
          </summary>
          <div className="file-detail-content">
            <p className="file-error">{describeError(t, f.error)}</p>
            <p className="file-path">{f.filePath}</p>
          </div>
        </details> : <div key={f.filePath} className={`file-item ${STATUS_CLASS[f.status]}`}>
          <span className="file-name" title={f.filePath} aria-label={f.filePath}>{f.file}</span>
          <span className="file-status">{t.status[f.status] || f.status}</span>
        </div>
      ))}
    </div>
  );
}
