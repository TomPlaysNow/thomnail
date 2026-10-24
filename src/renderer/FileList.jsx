import React from 'react';

const STATUS_LABEL = {
  pending: 'Wartend',
  processing: 'Verarbeite...',
  done: 'Fertig',
  error: 'Fehler',
};

const STATUS_CLASS = {
  pending: 'status-pending',
  processing: 'status-processing',
  done: 'status-done',
  error: 'status-error',
};

export default function FileList({ files }) {
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
