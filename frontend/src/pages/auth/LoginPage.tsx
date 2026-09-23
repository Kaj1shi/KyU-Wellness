import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const loggedIn = await login(data.email, data.password);
      const isStaff = loggedIn.role === 'counselor' || loggedIn.role === 'admin';
      let target: string;
      if (isStaff) {
        target = from.startsWith('/counselor') ? from : '/counselor/dashboard';
      } else {
        target = from.startsWith('/counselor') ? '/dashboard' : from || '/dashboard';
      }
      navigate(target, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Login failed. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Login failed.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full p-6 sm:p-8"
      >
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to continue your wellness journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-calm-200 bg-white px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-calm-200 bg-white px-4 py-3 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
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
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link to="/auth/forgot-password" className="text-calm-400 hover:underline">
            Forgot password?
          </Link>
          <p className="text-slate-500">
            No account?{' '}
            <Link to="/auth/register" className="font-medium text-calm-400 hover:underline">
              Register
            </Link>
          </p>
          <p className="text-slate-500">
            Prefer privacy?{' '}
            <Link to="/auth/guest" className="font-medium text-green-400 hover:underline">
              Continue as guest
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
