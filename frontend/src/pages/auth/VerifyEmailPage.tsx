import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { verifyEmail } from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
        setMessage(typeof detail === 'string' ? detail : 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full p-8 text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-calm-200 border-t-calm-400" />
            <p className="text-slate-600">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <span className="mb-4 block text-4xl" aria-hidden="true">
              ✅
            </span>
            <h1 className="mb-2 text-xl font-bold text-slate-800">Email verified</h1>
            <p className="text-slate-600">{message}</p>
            <Link
              to="/dashboard"
              className="mt-6 inline-block rounded-xl bg-green-400 px-6 py-2.5 text-sm font-semibold text-white"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="mb-4 block text-4xl" aria-hidden="true">
              ❌
            </span>
            <h1 className="mb-2 text-xl font-bold text-slate-800">Verification failed</h1>
            <p className="text-slate-600">{message}</p>
            <Link to="/auth/login" className="mt-6 inline-block text-calm-400 hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
