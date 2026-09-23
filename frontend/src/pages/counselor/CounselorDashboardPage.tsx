import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getCounselorDashboard } from '../../services/counselor';
import type { CounselorDashboardData } from '../../types/counselor';

const severityColors: Record<string, string> = {
  low: '#86efac',
  moderate: '#fcd34d',
  high: '#f87171',
  crisis: '#dc2626',
};

export default function CounselorDashboardPage() {
  const [data, setData] = useState<CounselorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      try {
        const dashboard = await getCounselorDashboard();
        setData(dashboard);
      } catch {
        setError('Could not load counselor dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const distressChart = data
    ? Object.entries(data.distress_breakdown).map(([name, value]) => ({ name, value }))
  : [];

  const assessmentChart = data
    ? Object.entries(data.assessment_severity).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Counselor dashboard</h1>
            <p className="text-sm text-slate-500">
              Platform overview, crisis trends, and student wellness signals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/counselor/alerts"
              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Crisis alerts
              {data && data.stats.open_escalations > 0 && (
                <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                  {data.stats.open_escalations}
                </span>
              )}
            </Link>
            <Link
              to="/counselor/students"
              className="rounded-xl bg-calm-100 px-4 py-2 text-sm font-medium text-calm-700 hover:bg-calm-200"
            >
              View students
            </Link>
            <Link
              to="/counselor/appointments"
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Appointments
            </Link>
            <Link
              to="/counselor/feedback"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Feedback
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Registered students', value: data.stats.total_students },
                { label: 'Guest sessions', value: data.stats.guest_sessions },
                {
                  label: 'Open escalations',
                  value: data.stats.open_escalations,
                  highlight: true,
                  to: '/counselor/alerts',
                },
                {
                  label: 'Unread alerts',
                  value: data.stats.unread_notifications,
                  to: '/counselor/alerts',
                },
              ].map((stat) => {
                const inner = (
                  <>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </>
                );
                const className = [
                  'card p-4 text-center',
                  'highlight' in stat && stat.highlight && stat.value > 0
                    ? 'border border-red-200 bg-red-50/40'
                    : '',
                  'to' in stat && stat.to ? 'transition hover:ring-2 hover:ring-calm-200' : '',
                ].join(' ');
                return 'to' in stat && stat.to ? (
                  <Link key={stat.label} to={stat.to} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <div key={stat.label} className={className}>
                    {inner}
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Acknowledged', value: data.stats.acknowledged_escalations },
                { label: 'Resolved', value: data.stats.resolved_escalations },
                { label: 'Total assessments', value: data.stats.total_assessments },
                { label: 'High-severity assessments', value: data.stats.high_severity_assessments },
              ].map((stat) => (
                <div key={stat.label} className="card p-4 text-center">
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">
                  Escalations (last 14 days)
                </h2>
                {data.escalation_trend.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No escalations yet.</p>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.escalation_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6b9bd1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">
                  Distress level breakdown
                </h2>
                {distressChart.every((d) => d.value === 0) ? (
                  <p className="py-8 text-center text-sm text-slate-500">No distress data yet.</p>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distressChart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {distressChart.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={severityColors[entry.name] || '#94a3b8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">
                Assessment severity distribution
              </h2>
              {assessmentChart.every((d) => d.value === 0) ? (
                <p className="py-4 text-center text-sm text-slate-500">No assessments yet.</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assessmentChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8f0fe" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Recent crisis alerts</h2>
                <Link
                  to="/counselor/alerts"
                  className="text-sm font-medium text-calm-500 hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.recent_escalations.length === 0 ? (
                <p className="text-sm text-slate-500">No recent escalations.</p>
              ) : (
                <div className="space-y-3">
                  {data.recent_escalations.map((item) => {
                    const student = item.student as
                      | {
                          id?: string;
                          nickname?: string;
                          email?: string;
                          is_anonymous?: boolean;
                        }
                      | undefined;
                    const name =
                      student?.nickname ||
                      student?.email ||
                      (student?.is_anonymous ? 'Anonymous guest' : 'Anonymous student');
                    const excerpt =
                      (item.distress_snapshot as { message_excerpt?: string } | undefined)
                        ?.message_excerpt || 'No excerpt';
                    const href = student?.id
                      ? `/counselor/students/${student.id}`
                      : '/counselor/alerts';
                    return (
                      <Link
                        key={String(item.id)}
                        to={href}
                        className="block rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-calm-200 hover:bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold uppercase text-slate-700">
                            {String(item.status)}
                          </span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">
                            {String(item.level)}
                          </span>
                          {student?.is_anonymous && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                              Guest
                            </span>
                          )}
                          <span className="text-slate-500">
                            {new Date(String(item.created_at)).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-800">{name}</p>
                        <p className="mt-1 text-sm text-slate-600">&ldquo;{excerpt}&rdquo;</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
