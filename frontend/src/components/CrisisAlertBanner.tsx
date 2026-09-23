import { Link } from 'react-router-dom';

interface CrisisAlertBannerProps {
  visible: boolean;
  onDismiss?: () => void;
}

export default function CrisisAlertBanner({ visible, onDismiss }: CrisisAlertBannerProps) {
  if (!visible) return null;

  return (
    <div
      className="shrink-0 border-b border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900 sm:px-4"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">We&apos;re concerned about your safety.</p>
          <p className="mt-0.5 text-xs leading-snug text-red-900/90 sm:text-sm">
            A counselor has been alerted. If you are in immediate danger, get help now.
          </p>
          <Link
            to="/emergency"
            className="mt-1 inline-block text-xs font-semibold text-red-800 underline hover:text-red-900 sm:text-sm"
          >
            Open emergency support
          </Link>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-red-800 hover:bg-red-100"
            aria-label="Dismiss crisis alert"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
