import { useState } from 'react';
import { MOOD_OPTIONS } from '../../types/dashboard';

interface MoodLoggerProps {
  onSubmit: (score: number) => Promise<void>;
  disabled?: boolean;
  alreadyLoggedToday?: boolean;
  todaysMoodScore?: number | null;
}

export default function MoodLogger({
  onSubmit,
  disabled,
  alreadyLoggedToday = false,
  todaysMoodScore = null,
}: MoodLoggerProps) {
  const [saving, setSaving] = useState(false);
  const locked = disabled || alreadyLoggedToday || saving;

  const handleSelect = async (score: number) => {
    if (locked) return;
    setSaving(true);
    try {
      await onSubmit(score);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {MOOD_OPTIONS.map((m) => {
          const isToday = alreadyLoggedToday && todaysMoodScore === m.score;
          return (
            <button
              key={m.score}
              type="button"
              disabled={locked}
              onClick={() => handleSelect(m.score)}
              className={[
                'flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-2 text-sm transition',
                isToday
                  ? 'bg-calm-100 ring-2 ring-calm-300'
                  : 'bg-slate-50 hover:bg-calm-50',
                locked ? 'cursor-not-allowed opacity-60' : '',
              ].join(' ')}
            >
              <span className="text-2xl" aria-hidden="true">
                {m.emoji}
              </span>
              <span className="mt-1 text-xs font-medium text-slate-600">{m.label}</span>
            </button>
          );
        })}
      </div>
      {alreadyLoggedToday && (
        <p className="mt-3 text-center text-sm text-slate-600">
          Mood logged for today
          {todaysMoodScore
            ? (
                <>
                  :{' '}
                  <span className="font-medium text-slate-800">
                    {MOOD_OPTIONS.find((o) => o.score === todaysMoodScore)?.label}
                  </span>
                </>
              )
            : null}
          . Come back tomorrow to log again.
        </p>
      )}
    </div>
  );
}
