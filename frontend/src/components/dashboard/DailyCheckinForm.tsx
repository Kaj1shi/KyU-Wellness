import { useEffect, useState } from 'react';

interface TodaysCheckin {
  energy_level: number;
  stress_level: number;
  sleep_quality: number | null;
}

interface DailyCheckinFormProps {
  onSubmit: (payload: {
    energy_level: number;
    stress_level: number;
    sleep_quality?: number;
  }) => Promise<void>;
  disabled?: boolean;
  alreadyLoggedToday?: boolean;
  todaysCheckin?: TodaysCheckin | null;
}

function SliderRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-calm-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

export default function DailyCheckinForm({
  onSubmit,
  disabled,
  alreadyLoggedToday = false,
  todaysCheckin = null,
}: DailyCheckinFormProps) {
  const [energy, setEnergy] = useState(todaysCheckin?.energy_level ?? 3);
  const [stress, setStress] = useState(todaysCheckin?.stress_level ?? 3);
  const [sleep, setSleep] = useState(todaysCheckin?.sleep_quality ?? 3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!todaysCheckin) return;
    setEnergy(todaysCheckin.energy_level);
    setStress(todaysCheckin.stress_level);
    setSleep(todaysCheckin.sleep_quality ?? 3);
  }, [todaysCheckin]);

  const locked = disabled || alreadyLoggedToday || saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setSaving(true);
    try {
      await onSubmit({ energy_level: energy, stress_level: stress, sleep_quality: sleep });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SliderRow label="Energy" value={energy} onChange={setEnergy} disabled={locked} />
      <SliderRow label="Stress" value={stress} onChange={setStress} disabled={locked} />
      <SliderRow label="Sleep quality" value={sleep} onChange={setSleep} disabled={locked} />
      {alreadyLoggedToday ? (
        <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-sm text-slate-600">
          Check-in saved for today. Come back tomorrow to log again.
        </p>
      ) : (
        <button
          type="submit"
          disabled={locked}
          className="w-full rounded-xl bg-green-400 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save check-in'}
        </button>
      )}
    </form>
  );
}
