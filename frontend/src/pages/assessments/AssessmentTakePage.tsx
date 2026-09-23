import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AssessmentProgress from '../../components/AssessmentProgress';
import { getQuestions, submitAssessment } from '../../services/assessment';
import type { AssessmentQuestions, AssessmentType } from '../../types/assessment';

const VALID_TYPES: AssessmentType[] = ['phq9', 'gad7', 'stress'];

export default function AssessmentTakePage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const assessmentType = type as AssessmentType;

  const [data, setData] = useState<AssessmentQuestions | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!type || !VALID_TYPES.includes(assessmentType)) {
      navigate('/assessments');
      return;
    }
    getQuestions(assessmentType)
      .then(setData)
      .catch(() => setError('Could not load assessment. Please try again.'));
  }, [type, assessmentType, navigate]);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-calm-200 border-t-calm-400" />
        )}
      </div>
    );
  }

  const question = data.questions[step];
  const isLast = step === data.questions.length - 1;
  const currentAnswer = answers[question.id];

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = async () => {
    if (currentAnswer === undefined) {
      setError('Please select an answer before continuing.');
      return;
    }
    setError('');

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAssessment(assessmentType, answers);
      navigate(`/assessments/results/${result.id}`);
    } catch {
      setError('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setError('');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to="/assessments" className="mb-6 inline-block text-sm text-calm-400 hover:underline">
        ← Back to assessments
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-bold text-slate-800">{data.title}</h1>
        <p className="mb-2 text-sm text-slate-500">{data.description}</p>
        <p className="mb-6 text-xs text-slate-400">{data.instructions}</p>

        <AssessmentProgress current={step + 1} total={data.questions.length} />

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-6 text-lg font-medium text-slate-800">{question.text}</h2>

            <div className="space-y-3" role="radiogroup" aria-label={question.text}>
              {data.options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    currentAnswer === opt.value
                      ? 'border-calm-300 bg-calm-50 ring-2 ring-calm-200'
                      : 'border-slate-200 hover:border-calm-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={opt.value}
                    checked={currentAnswer === opt.value}
                    onChange={() => handleSelect(opt.value)}
                    className="h-4 w-4 text-calm-400"
                  />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="rounded-xl bg-green-400 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : isLast ? 'See results' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
