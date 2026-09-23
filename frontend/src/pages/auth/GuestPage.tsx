import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface GuestForm {
  nickname?: string;
}

export default function GuestPage() {
  const { guestLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<GuestForm>();

  const onSubmit = async (data: GuestForm) => {
    setError('');
    try {
      await guestLogin(data.nickname);
      navigate('/dashboard');
    } catch {
      setError('Could not start guest session. Please try again.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full p-8"
      >
        <span className="mb-4 block text-3xl" aria-hidden="true">
          🕊️
        </span>
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Anonymous access</h1>
        <p className="mb-6 text-sm text-slate-500">
          Chat without creating an account. Some features like saved mood history require
          registration.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium text-slate-700">
              Nickname (optional)
            </label>
            <input
              id="nickname"
              type="text"
              placeholder="Stay anonymous"
              className="w-full rounded-xl border border-calm-200 px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
              {...register('nickname')}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-green-400 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? 'Starting...' : 'Start anonymous session'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Want full access?{' '}
          <Link to="/auth/register" className="font-medium text-calm-400 hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
