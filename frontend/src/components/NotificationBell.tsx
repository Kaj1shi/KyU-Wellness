import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import type { AppNotification } from '../types/notification';

export default function NotificationBell({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = async () => {
    const [unread, notifications] = await Promise.all([
      getUnreadNotificationCount(),
      listNotifications(),
    ]);
    setCount(unread);
    setItems(notifications.slice(0, 8));
  };

  useEffect(() => {
    refresh().catch(() => undefined);
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const onOpen = async () => {
    setOpen((v) => !v);
    if (!open) await refresh().catch(() => undefined);
  };

  const onClickNotification = async (n: AppNotification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    const studentId = n.metadata?.student_id;
    if (studentId) {
      navigate(`/counselor/students/${studentId}`);
    } else {
      navigate('/counselor/alerts');
    }
    await refresh().catch(() => undefined);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={[
          'relative rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50',
          compact ? 'grid h-9 w-9 place-items-center px-0 py-0' : 'px-3 py-2',
        ].join(' ')}
        aria-label="Notifications"
        title="Notifications"
      >
        {compact ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Zm6 13a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          'Alerts'
        )}
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={[
            'absolute z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl',
            compact ? 'left-0' : 'right-0',
          ].join(' ')}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await markAllNotificationsRead();
                  await refresh();
                }}
                className="text-xs text-calm-500 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onClickNotification(n)}
                  className={[
                    'w-full rounded-xl px-3 py-2 text-left text-sm',
                    n.read ? 'bg-slate-50 text-slate-600' : 'bg-amber-50 text-amber-900',
                  ].join(' ')}
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="mt-1 text-xs opacity-80">{n.body}</div>
                </button>
              ))
            )}
          </div>
          <Link
            to="/counselor/alerts"
            onClick={() => setOpen(false)}
            className="mt-3 block text-center text-xs font-medium text-calm-500 hover:underline"
          >
            View all crisis alerts
          </Link>
        </div>
      )}
    </div>
  );
}
