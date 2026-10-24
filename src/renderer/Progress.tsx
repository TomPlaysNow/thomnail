import { useT } from '../i18n';

export default function Progress({ done, total, running }: { done: number; total: number; running: boolean }) {
  const t = useT();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="progress-wrapper">
      <div className="progress-bar-bg" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {running ? `${done} / ${total}` : t.progressDone(done, total)}
      </span>
    </div>
  );
}
