import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import LanguageSwitcher from '../components/LanguageSwitcher';

type IconName =
  | 'home'
  | 'chat'
  | 'clipboard'
  | 'logout'
  | 'plus'
  | 'users'
  | 'alert'
  | 'book'
  | 'lifebuoy'
  | 'external'
  | 'journal'
  | 'calendar'
  | 'feedback';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path
            d="M7 18.5 4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'clipboard':
      return (
        <svg {...common}>
          <path
            d="M9 4h6m-5 0a2 2 0 0 0-2 2v1h8V6a2 2 0 0 0-2-2m-8 3h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path
            d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 12H4m0 0 3-3m-3 3 3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path
            d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm11 9v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'lifebuoy':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="m9.88 9.88-2.12-2.12M14.12 9.88l2.12-2.12M9.88 14.12l-2.12 2.12M14.12 14.12l2.12 2.12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'journal':
      return (
        <svg {...common}>
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <path
            d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'feedback':
      return (
        <svg {...common}>
          <path
            d="M12 17.3 5.5 21l1.7-7.3L2 8.9l7.4-.6L12 1.5l2.6 6.8 7.4.6-5.2 4.8L18.5 21 12 17.3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'external':
      return (
        <svg {...common}>
          <path
            d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

type NavLinkItem = { to: string; labelKey: string; icon: IconName };

const studentLinks: NavLinkItem[] = [
  { to: '/dashboard', labelKey: 'account.dashboard', icon: 'home' },
  { to: '/chat', labelKey: 'account.chat', icon: 'chat' },
  { to: '/assessments', labelKey: 'account.assessments', icon: 'clipboard' },
  { to: '/journal', labelKey: 'account.journal', icon: 'journal' },
  { to: '/appointments', labelKey: 'account.appointments', icon: 'calendar' },
  { to: '/feedback', labelKey: 'account.feedback', icon: 'feedback' },
];

const counselorLinks: NavLinkItem[] = [
  { to: '/counselor/dashboard', labelKey: 'account.overview', icon: 'home' },
  { to: '/counselor/alerts', labelKey: 'account.alerts', icon: 'alert' },
  { to: '/counselor/students', labelKey: 'account.students', icon: 'users' },
  { to: '/counselor/appointments', labelKey: 'account.counselorAppointments', icon: 'calendar' },
  { to: '/counselor/feedback', labelKey: 'account.counselorFeedback', icon: 'feedback' },
];

const resourceLinks: Array<{ labelKey: string; href: string }> = [
  { labelKey: 'resources.who', href: 'https://www.who.int/health-topics/mental-health' },
  { labelKey: 'resources.unicef', href: 'https://www.unicef.org/parenting/mental-health' },
  { labelKey: 'resources.mindtools', href: 'https://www.mindtools.com/az4qv7r/stress-management' },
];

/** Hamburger when closed → X when open. All lines pivot from the same center. */
function SidebarToggleIcon({ open }: { open: boolean }) {
  const base =
    'absolute left-1/2 top-1/2 block h-0.5 w-[18px] rounded-full bg-current ' +
    'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]';

  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span
        className={base}
        style={{
          transform: open
            ? 'translate(-50%, -50%) rotate(45deg)'
            : 'translate(-50%, -50%) translateY(-6px)',
        }}
      />
      <span
        className={`${base} transition-[transform,opacity] duration-200`}
        style={{
          transform: 'translate(-50%, -50%)',
          opacity: open ? 0 : 1,
        }}
      />
      <span
        className={base}
        style={{
          transform: open
            ? 'translate(-50%, -50%) rotate(-45deg)'
            : 'translate(-50%, -50%) translateY(6px)',
        }}
      />
    </span>
  );
}

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div className={['space-y-1', collapsed ? 'flex w-full flex-col items-center' : 'w-full'].join(' ')}>
      {collapsed ? (
        <div className="my-2 h-px w-8 bg-slate-200" aria-hidden="true" />
      ) : (
        <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  collapsed,
}: {
  to: string;
  label: string;
  icon: IconName;
  collapsed: boolean;
}) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={[
        'flex items-center rounded-xl text-sm font-medium transition',
        collapsed ? 'h-9 w-9 shrink-0 justify-center' : 'w-full gap-3 px-3 py-2',
        active
          ? 'bg-calm-100 text-calm-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
      ].join(' ')}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={[
          'grid shrink-0 place-items-center rounded-xl',
          collapsed ? '' : 'h-9 w-9',
          active ? 'text-calm-600' : 'text-slate-500',
        ].join(' ')}
      >
        <Icon name={icon} />
      </span>
      <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
    </Link>
  );
}

function RailIconButton({
  onClick,
  title,
  ariaLabel,
  ariaExpanded,
  className = '',
  children,
}: {
  onClick?: () => void;
  title?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={[
        'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors duration-200',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return 'Account';
    return user.nickname || user.email || 'Guest';
  }, [user]);

  const accountStatus = useMemo(() => {
    if (!user) return '';
    if (user.is_anonymous) return t('account.guestSession');
    if (user.role === 'counselor' || user.role === 'admin') {
      return user.role === 'admin' ? t('account.administrator') : t('account.counselor');
    }
    return user.email_verified ? t('account.student') : t('account.verifyEmail');
  }, [user, t]);

  const isCounselor = user?.role === 'counselor' || user?.role === 'admin';
  const navLinks = isCounselor ? counselorLinks : studentLinks;
  const homePath = isCounselor ? '/counselor/dashboard' : '/dashboard';
  // Mobile drawer is always expanded; desktop uses collapse toggle
  const collapsed = mobileOpen ? false : !sidebarOpen;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const bottomLinks = isCounselor
    ? [
        { to: '/counselor/dashboard', label: t('account.overview'), icon: 'home' as const },
        { to: '/counselor/alerts', label: t('account.alerts'), icon: 'alert' as const },
        { to: '/counselor/students', label: t('account.students'), icon: 'users' as const },
        {
          to: '/counselor/appointments',
          label: t('account.counselorAppointments'),
          icon: 'calendar' as const,
        },
      ]
    : [
        { to: '/dashboard', label: t('account.dashboard'), icon: 'home' as const },
        { to: '/chat', label: t('account.chat'), icon: 'chat' as const },
        { to: '/assessments', label: t('account.assessments'), icon: 'clipboard' as const },
      ];

  return (
    <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-calm-50/60 via-white to-green-50/40">
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-slate-900/35 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'flex h-full shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md',
          'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] transition-transform duration-300 ease-out',
          'md:static md:z-auto md:bg-white/80 md:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          sidebarOpen ? 'md:w-[280px]' : 'md:w-[72px]',
        ].join(' ')}
      >
        {/* Brand / toggle */}
        <div
          className={[
            'flex border-b border-slate-100',
            collapsed
              ? 'items-center justify-center px-0 py-3'
              : 'items-center justify-between gap-2 px-4 py-4',
          ].join(' ')}
        >
          {!collapsed && (
            <Link to={homePath} className="flex min-w-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span className="text-2xl" aria-hidden="true">
                🌿
              </span>
              <span className="truncate text-base font-semibold text-calm-500">
                {t('common.brand')}
              </span>
            </Link>
          )}
          <div className={collapsed ? 'flex w-full justify-center' : 'flex shrink-0 items-center gap-1'}>
            {isCounselor && <NotificationBell compact={collapsed} />}
            <RailIconButton
              onClick={() => {
                if (window.matchMedia('(min-width: 768px)').matches) {
                  setSidebarOpen((s) => !s);
                } else {
                  setMobileOpen(false);
                }
              }}
              ariaLabel={
                mobileOpen || sidebarOpen ? t('account.closeSidebar') : t('account.openSidebar')
              }
              ariaExpanded={mobileOpen || sidebarOpen}
              className="text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <SidebarToggleIcon open={mobileOpen || sidebarOpen} />
            </RailIconButton>
          </div>
        </div>

        {/* Scrollable nav body */}
        <div
          className={[
            'flex min-h-0 flex-1 flex-col overflow-y-auto py-3',
            collapsed ? 'items-center px-0' : 'px-3',
          ].join(' ')}
        >
          {!isCounselor && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate('/chat', { state: { newChat: true } });
              }}
              className={[
                'mb-2 flex items-center rounded-2xl text-sm font-semibold text-white shadow-md transition',
                'bg-green-400 hover:opacity-90',
                collapsed ? 'h-9 w-9 shrink-0 justify-center' : 'w-full gap-3 px-3 py-2.5',
              ].join(' ')}
              title={collapsed ? t('account.newChat') : undefined}
            >
              <span
                className={[
                  'grid shrink-0 place-items-center rounded-xl',
                  collapsed ? '' : 'h-9 w-9 bg-white/15',
                ].join(' ')}
              >
                <Icon name="plus" className="h-5 w-5" />
              </span>
              <span className={collapsed ? 'sr-only' : 'truncate'}>{t('account.newChat')}</span>
            </button>
          )}

          <div className={collapsed ? 'flex w-full flex-col items-center' : 'w-full'}>
            <NavSection
              label={isCounselor ? t('account.workspace') : t('account.main')}
              collapsed={collapsed}
            >
              {navLinks.map((l) => (
                <NavItem
                  key={l.to}
                  to={l.to}
                  label={t(l.labelKey)}
                  icon={l.icon}
                  collapsed={collapsed}
                />
              ))}
            </NavSection>

            {!isCounselor && (
              <NavSection label={t('account.support')} collapsed={collapsed}>
                <NavItem
                  to="/emergency"
                  label={t('account.emergencyGuide')}
                  icon="lifebuoy"
                  collapsed={collapsed}
                />
                {!collapsed ? (
                  <div className="mt-1 space-y-0.5 px-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-400">
                      <Icon name="book" className="h-3.5 w-3.5" />
                      <span>{t('account.externalResources')}</span>
                    </div>
                    {resourceLinks.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      >
                        <span className="truncate">{t(l.labelKey)}</span>
                        <Icon name="external" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={resourceLinks[0].href}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-50"
                    title={t('common.resources')}
                  >
                    <Icon name="book" />
                  </a>
                )}
              </NavSection>
            )}
          </div>
        </div>

        {/* Account footer */}
        <div
          className={[
            'mt-auto border-t border-slate-100 py-3',
            collapsed ? 'flex flex-col items-center gap-1 px-0' : 'px-3',
          ].join(' ')}
        >
          {!collapsed ? (
            <>
              <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="truncate text-sm font-semibold text-slate-800">{displayName}</div>
                <div className="truncate text-xs text-slate-500">{accountStatus}</div>
              </div>
              <div className="mb-2 flex justify-center">
                <LanguageSwitcher compact />
              </div>
            </>
          ) : (
            <div
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600"
              title={displayName}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className={[
              'flex items-center rounded-xl text-sm font-medium text-slate-600 transition hover:bg-slate-50',
              collapsed ? 'h-9 w-9 shrink-0 justify-center' : 'w-full gap-3 px-3 py-2',
            ].join(' ')}
            title={collapsed ? t('common.signOut') : undefined}
          >
            <span
              className={[
                'grid shrink-0 place-items-center rounded-xl text-slate-500',
                collapsed ? '' : 'h-9 w-9',
              ].join(' ')}
            >
              <Icon name="logout" />
            </span>
            <span className={collapsed ? 'sr-only' : ''}>{t('common.signOut')}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 shrink-0 border-b border-white/40 bg-white/80 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-3 safe-top">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50"
              aria-label={t('account.openSidebar')}
            >
              <SidebarToggleIcon open={false} />
            </button>
            <Link to={homePath} className="flex min-w-0 items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                🌿
              </span>
              <span className="truncate text-base font-semibold text-calm-500">{t('common.brand')}</span>
            </Link>
            <div className="flex items-center gap-1">
              {isCounselor && <NotificationBell />}
              <LanguageSwitcher compact />
            </div>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={[
            'min-h-0 flex-1',
            location.pathname.startsWith('/chat')
              ? 'overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0'
              : 'overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0',
          ].join(' ')}
        >
          <Outlet />
        </motion.main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Primary"
        >
          <div className="mx-auto grid max-w-lg grid-cols-3 px-2 py-1.5">
            {bottomLinks.map((link) => {
              const active =
                location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={[
                    'flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition',
                    active ? 'text-calm-600' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid h-9 w-9 place-items-center rounded-xl',
                      active ? 'bg-calm-100 text-calm-600' : 'text-slate-500',
                    ].join(' ')}
                  >
                    <Icon name={link.icon} />
                  </span>
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
