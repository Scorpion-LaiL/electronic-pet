type StatusBarProps = {
  label: string;
  value: number;
  hint: string;
};

function getTone(value: number): 'good' | 'normal' | 'warn' | 'critical' {
  if (value >= 80) {
    return 'good';
  }

  if (value >= 60) {
    return 'normal';
  }

  if (value >= 30) {
    return 'warn';
  }

  return 'critical';
}

export function StatusBar({ label, value, hint }: StatusBarProps) {
  const tone = getTone(value);

  return (
    <div className="status-card">
      <div className="status-row">
        <span className="status-label">{label}</span>
        <span className="status-value">{Math.round(value)}</span>
      </div>
      <div className="status-track" aria-hidden="true">
        <div
          className={`status-fill status-fill--${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="status-hint">{hint}</p>
    </div>
  );
}
