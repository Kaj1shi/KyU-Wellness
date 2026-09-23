import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

function MenuIcon({ open }: { open: boolean }) {
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
        style={{ transform: 'translate(-50%, -50%)', opacity: open ? 0 : 1 }}
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

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const appHome =
    user?.role === 'counselor' || user?.role === 'admin'
      ? '/counselor/dashboard'
      : '/dashboard';

  const navLinks = [
    { to: '/', label: t('common.home'), end: true },
    { to: '/about', label: t('common.about') },
    { to: '/resources', label: t('common.resources') },
    { to: '/emergency', label: t('common.emergency') },
    { to: '/privacy', label: t('common.privacy') },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🌿
            </span>
            <span className="truncate text-base font-semibold text-calm-500 sm:text-lg">
              {t('common.brand')}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {navLinks
              .filter((l) => l.to !== '/privacy')
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    [
                      'text-sm font-medium transition-colors hover:text-green-400',
                      isActive ? 'text-green-500' : 'text-slate-600',
                    ].join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher compact className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <>
                <Link
                  to={appHome}
                  className="hidden rounded-xl bg-green-400 px-3 py-2 text-sm font-medium text-white shadow-md transition hover:opacity-80 sm:inline-flex"
                >
                  {t('account.dashboard')}
                </Link>
                <button
                  type="button"
                  className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-calm-100 sm:inline-flex"
                  onClick={() => void logout()}
                >
                  {t('common.signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-calm-100 sm:inline-flex"
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  to="/auth/register"
                  className="hidden rounded-xl bg-green-400 px-3 py-2 text-sm font-medium text-white shadow-md transition hover:opacity-80 sm:inline-flex"
                >
                  {t('common.getStarted')}
                </Link>
              </>
            )}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50 md:hidden"
              aria-label={menuOpen ? t('account.closeSidebar') : t('account.openSidebar')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-0 top-full z-50 border-b border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden"
                aria-label="Mobile navigation"
              >
                <div className="mx-auto flex max-w-6xl flex-col gap-1">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        [
                          'rounded-xl px-3 py-3 text-sm font-medium transition',
                          isActive
                            ? 'bg-calm-100 text-calm-600'
                            : 'text-slate-700 hover:bg-slate-50',
                        ].join(' ')
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <div className="my-2 h-px bg-slate-100" />
                  <div className="flex items-center justify-between gap-3 px-1 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t('common.language')}
                    </span>
                    <LanguageSwitcher compact />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {isAuthenticated ? (
                      <>
                        <Link
                          to={appHome}
                          className="rounded-xl bg-green-400 px-3 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
                        >
                          {t('account.dashboard')}
                        </Link>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                          onClick={() => void logout()}
                        >
                          {t('common.signOut')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/auth/login"
                          className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {t('common.signIn')}
                        </Link>
                        <Link
                          to="/auth/register"
                          className="rounded-xl bg-green-400 px-3 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
                        >
                          {t('common.getStarted')}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-w-0 flex-1"
      >
        <Outlet />
      </motion.main>

      <footer className="border-t border-white/40 bg-green-400 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-white sm:px-6">
          <p className="mb-2 font-medium">{t('footer.title')}</p>
          <p className="leading-relaxed">{t('footer.disclaimer')}</p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/emergency" className="underline hover:text-calm-100">
              {t('footer.emergencyLink')}
            </Link>
            <Link to="/privacy" className="underline hover:text-calm-100">
              {t('footer.privacyLink')}
            </Link>
            <LanguageSwitcher compact className="bg-white/20" />
          </p>
        </div>
      </footer>
    </div>
  );
}
