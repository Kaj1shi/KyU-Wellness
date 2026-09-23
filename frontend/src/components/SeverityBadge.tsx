import type { SeverityLevel } from '../types/assessment';

const styles: Record<SeverityLevel, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

const labels: Record<SeverityLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export default function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[severity]}`}
    >
      {labels[severity]}
    </span>
  );
}
