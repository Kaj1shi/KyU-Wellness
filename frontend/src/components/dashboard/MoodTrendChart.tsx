import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MoodTrendPoint } from '../../types/dashboard';
import { MOOD_OPTIONS } from '../../types/dashboard';

function formatTick(date: string) {
  try {
    const d = new Date(`${date}T12:00:00`);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
}

function hasLoggedMood(data: MoodTrendPoint[]) {
  return data.some((point) => point.mood_score != null);
}

export default function MoodTrendChart({ data }: { data: MoodTrendPoint[] }) {
  if (!hasLoggedMood(data)) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Log your mood to see trends over time.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={formatTick}
            minTickGap={16}
          />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(label) => formatTick(String(label))}
            formatter={(value) => {
              const score = typeof value === 'number' ? value : Number(value);
              const label = MOOD_OPTIONS.find((o) => o.score === score)?.label;
              return [label ? `${score} · ${label}` : score, 'Mood'];
            }}
          />
          <Line
            type="monotone"
            dataKey="mood_score"
            stroke="#236bbd"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
