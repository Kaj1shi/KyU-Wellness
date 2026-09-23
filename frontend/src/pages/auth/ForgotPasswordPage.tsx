import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { forgotPassword } from '../../services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    setMessage('');
    try {
      const res = await forgotPassword(data.email);
      setMessage(res.message);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full p-8"
      >
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Reset password</h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-green-400 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/auth/login" className="font-medium text-calm-400 hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
