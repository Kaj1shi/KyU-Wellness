import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AssessmentOverview from '../components/dashboard/AssessmentOverview';
import DailyCheckinForm from '../components/dashboard/DailyCheckinForm';
import MoodLogger from '../components/dashboard/MoodLogger';
import MoodTrendChart from '../components/dashboard/MoodTrendChart';
import { getDashboard, logCheckin, logMood } from '../services/dashboard';
import type { DashboardData } from '../types/dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const dashboard = await getDashboard();
      setData(dashboard);
    } catch {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!user) return null;

  if (user.role === 'counselor' || user.role === 'admin') {
    return <Navigate to="/counselor/dashboard" replace />;
  }

  const displayName = user.nickname || user.email || 'Guest';
  const isGuest = data?.is_guest ?? user.is_anonymous;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {displayName} 👋</h1>
          <p className="text-sm text-slate-500">
            {isGuest
              ? 'Guest mode — register to save mood history and assessments.'
              : 'Your wellness overview at a glance.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        ) : data ? (
          <div className="space-y-6">
            {isGuest && (
              <div className="card border border-green-200 bg-green-50/50 p-4 text-sm text-slate-700">
                Create an account to unlock mood tracking, assessments history, and personalized
                insights.{' '}
                <Link to="/auth/register" className="font-medium text-calm-500 hover:underline">
                  Register now
                </Link>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Assessments', value: data.stats.assessments_completed, to: '/assessments/results' },
                { label: 'Mood logs', value: data.stats.mood_entries_count },
                { label: 'Check-ins', value: data.stats.checkins_count, to: '/checkins' },
                { label: 'Chat sessions', value: data.stats.chat_sessions_count, to: '/chat' },
              ].map((stat) => {
                const body = (
                  <>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </>
                );
                return stat.to && !isGuest ? (
                  <Link
                    key={stat.label}
                    to={stat.to}
                    className="card block p-4 text-center transition hover:ring-1 hover:ring-calm-200"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={stat.label} className="card p-4 text-center">
                    {body}
                  </div>
                );
              })}
            </div>

            <div className="card p-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Wellness tip</h2>
              <p className="text-sm text-slate-600">{data.wellness_tip}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card p-5">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">How are you feeling?</h2>
                <MoodLogger
                  disabled={isGuest}
                  alreadyLoggedToday={!!data.mood_logged_today}
                  todaysMoodScore={
                    data.mood_logged_today ? data.latest_mood?.mood_score ?? null : null
                  }
                  onSubmit={async (score) => {
                    try {
                      await logMood(score);
                      await load();
                    } catch (err: unknown) {
                      const detail = (err as { response?: { data?: { detail?: string } } })
                        ?.response?.data?.detail;
                      setError(
                        typeof detail === 'string'
                          ? detail
                          : 'Could not save your mood. Please try again.'
                      );
                    }
                  }}
                />
                {!data.mood_logged_today && data.latest_mood && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Latest: {data.latest_mood.mood_label} on {data.latest_mood.date}
                  </p>
                )}
              </section>

              <section className="card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">Daily check-in</h2>
                  {!isGuest && (
                    <Link to="/checkins" className="text-sm text-calm-500 hover:underline">
                      View history
                    </Link>
                  )}
                </div>
                <DailyCheckinForm
                  disabled={isGuest}
                  alreadyLoggedToday={!!data.checkin_logged_today}
                  todaysCheckin={
                    data.checkin_logged_today ? data.latest_checkin : null
                  }
                  onSubmit={async (payload) => {
                    try {
                      await logCheckin(payload);
                      await load();
                    } catch (err: unknown) {
                      const detail = (err as { response?: { data?: { detail?: string } } })
                        ?.response?.data?.detail;
                      setError(
                        typeof detail === 'string'
                          ? detail
                          : 'Could not save your check-in. Please try again.'
                      );
                    }
                  }}
                />
                {!data.checkin_logged_today && data.latest_checkin && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Latest:{' '}
                    energy {data.latest_checkin.energy_level}/5 · stress{' '}
                    {data.latest_checkin.stress_level}/5
                    {data.latest_checkin.sleep_quality != null
                      ? ` · sleep ${data.latest_checkin.sleep_quality}/5`
                      : ''}{' '}
                    on {new Date(data.latest_checkin.created_at).toLocaleDateString()}
                  </p>
                )}
              </section>
            </div>

            <section className="card p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Mood trend (14 days)</h2>
              <MoodTrendChart data={data.mood_trend} />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Assessment overview</h2>
                <Link to="/assessments/results" className="text-sm text-calm-500 hover:underline">
                  View all results
                </Link>
              </div>
              <AssessmentOverview latest={data.latest_assessments} />
            </section>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/chat"
                className="rounded-xl bg-green-400 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-80"
              >
                Open chat
              </Link>
              <Link
                to="/assessments"
                className="rounded-xl bg-blue-400 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-blue-200 hover:opacity-80"
              >
                Take assessment
              </Link>
              <Link
                to="/emergency"
                className="rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                Emergency support
              </Link>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
