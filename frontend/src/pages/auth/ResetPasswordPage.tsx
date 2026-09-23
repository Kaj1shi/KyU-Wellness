import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { resetPassword } from '../../services/api';

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }
    setError('');
    try {
      const res = await resetPassword(token, data.new_password);
      setSuccess(res.message);
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(typeof detail === 'string' ? detail : 'Reset failed. The link may have expired.');
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="card p-8">
          <p className="text-slate-600">Invalid reset link.</p>
          <Link to="/auth/forgot-password" className="mt-4 inline-block text-calm-400 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full p-8"
      >
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Set new password</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="new_password" className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="new_password"
              type="password"
              className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
              {...register('new_password')}
            />
            {errors.new_password && (
              <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
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
            {isSubmitting ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
