import React from 'react';

export default function Progress({ done, total, running }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="progress-wrapper">
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {running ? `${done} / ${total}` : `${done} / ${total} abgeschlossen`}
      </span>
    </div>
  );
}
