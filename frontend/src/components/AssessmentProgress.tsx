interface AssessmentProgressProps {
  current: number;
  total: number;
}

export default function AssessmentProgress({ current, total }: AssessmentProgressProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-sm text-slate-500">
        <span>
          Question {current} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-calm-100">
        <div
          className="h-full rounded-full bg-green-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}
