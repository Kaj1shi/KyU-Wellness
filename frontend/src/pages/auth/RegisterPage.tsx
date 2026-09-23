import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import ConsentModal from '../../components/ConsentModal';
import { useAuth } from '../../context/AuthContext';
import { getFaculties } from '../../services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number({ error: 'Age is required' }).min(16, 'Must be at least 16').max(100),
  gender: z.string().min(1, 'Please select gender'),
  faculty: z.string().min(1, 'Please select faculty'),
  year_of_study: z.number({ error: 'Year is required' }).min(1).max(7),
  nickname: z.string().max(100).optional(),
  privacy_consent: z.boolean().refine((v) => v === true, {
    message: 'You must accept the privacy consent',
  }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<string[]>([]);
  const [showConsent, setShowConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { privacy_consent: false },
  });

  const privacyConsent = watch('privacy_consent');

  useEffect(() => {
    getFaculties().then(setFaculties).catch(() => setFaculties(['Other']));
  }, []);

  const onSubmit = async (data: FormData) => {
    setError('');
    setSuccess('');
    try {
      const message = await registerUser(data);
      setSuccess(message || 'Account created! Please verify your email.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
        ?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <>
      <ConsentModal
        open={showConsent}
        onAccept={() => {
          setValue('privacy_consent', true);
          setShowConsent(false);
        }}
        onDecline={() => {
          setValue('privacy_consent', false);
          setShowConsent(false);
        }}
      />

      <div className="mx-auto max-w-lg px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Create your account</h1>
          <p className="mb-6 text-sm text-slate-500">
            Join KyU Wellness — a safe space for Kyambogo students
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="age" className="mb-1 block text-sm font-medium text-slate-700">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min={16}
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('age', { valueAsNumber: true })}
                />
                {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
              </div>

              <div>
                <label htmlFor="gender" className="mb-1 block text-sm font-medium text-slate-700">
                  Gender
                </label>
                <select
                  id="gender"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('gender')}
                >
                  <option value="">Select...</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="faculty" className="mb-1 block text-sm font-medium text-slate-700">
                  Faculty
                </label>
                <select
                  id="faculty"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('faculty')}
                >
                  <option value="">Select...</option>
                  {faculties.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                {errors.faculty && (
                  <p className="mt-1 text-xs text-red-500">{errors.faculty.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="year" className="mb-1 block text-sm font-medium text-slate-700">
                  Year of study
                </label>
                <select
                  id="year"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('year_of_study', { valueAsNumber: true })}
                >
                  <option value="">Select...</option>
                  {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
                {errors.year_of_study && (
                  <p className="mt-1 text-xs text-red-500">{errors.year_of_study.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="nickname" className="mb-1 block text-sm font-medium text-slate-700">
                  Nickname (optional)
                </label>
                <input
                  id="nickname"
                  type="text"
                  placeholder="How should we address you?"
                  className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
                  {...register('nickname')}
                />
              </div>
            </div>

            <div className="rounded-xl border border-calm-100 bg-calm-50/50 p-4">
              <input type="hidden" {...register('privacy_consent')} />
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!privacyConsent}
                  onChange={() => setShowConsent(true)}
                  className="mt-1 h-4 w-4 rounded border-calm-300 text-calm-400"
                />
                <span className="text-sm text-slate-600">
                  I have read and agree to the privacy consent and understand this platform does not
                  replace professional mental health care.
                </span>
              </label>
              {errors.privacy_consent && (
                <p className="mt-2 text-xs text-red-500">{errors.privacy_consent.message}</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-500" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-green-400 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-medium text-calm-400 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
