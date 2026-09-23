import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CrisisAlertBanner from '../../components/CrisisAlertBanner';
import {
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
} from '../../services/api';
import type { ChatMessage, ChatSession } from '../../types/chat';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function PencilIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [crisisActive, setCrisisActive] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const sessionTitle = (s: ChatSession | null) =>
    s?.title?.trim() || t('chat.sessionFallback');

  const startNewChat = async () => {
    setError('');
    try {
      const s = await createChatSession('New chat');
      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(s.id);
      setMessages([]);
      setDraft('');
      setCrisisActive(false);
      setRenamingId(null);
    } catch {
      setError('Could not create a new chat.');
    }
  };

  const beginRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameDraft(session.title?.trim() || t('chat.sessionFallback'));
    setError('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const saveRename = async (sessionId: string) => {
    const title = renameDraft.trim();
    if (!title) return;
    setBusySessionId(sessionId);
    setError('');
    try {
      const updated = await renameChatSession(sessionId, title);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setRenamingId(null);
      setRenameDraft('');
    } catch {
      setError(t('chat.renameFailed'));
    } finally {
      setBusySessionId(null);
    }
  };

  const removeSession = async (sessionId: string) => {
    if (!window.confirm(t('chat.deleteConfirm'))) return;
    setBusySessionId(sessionId);
    setError('');
    try {
      await deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          const s = await createChatSession('New chat');
          setSessions([s]);
          setActiveSessionId(s.id);
          setMessages([]);
          setCrisisActive(false);
        }
      }
      if (renamingId === sessionId) cancelRename();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setError(typeof detail === 'string' ? detail : t('chat.deleteFailed'));
    } finally {
      setBusySessionId(null);
    }
  };

  useEffect(() => {
    setLoadingSessions(true);
    listChatSessions()
      .then(async (list) => {
        setSessions(list);
        const wantsNewChat = !!(location.state as { newChat?: boolean } | null)?.newChat;
        if (wantsNewChat || list.length === 0) {
          const s = await createChatSession('New chat');
          setSessions((prev) => [s, ...prev.filter((x) => x.id !== s.id)]);
          setActiveSessionId(s.id);
          setMessages([]);
          setDraft('');
          return;
        }
        setActiveSessionId(list[0].id);
      })
      .catch(() => setError('Could not load chat sessions.'))
      .finally(() => setLoadingSessions(false));
  }, [location.state]);

  useEffect(() => {
    if (!activeSessionId) return;
    setLoadingMessages(true);
    setError('');
    listChatMessages(activeSessionId)
      .then((msgs) => {
        setMessages(msgs);
        setCrisisActive(msgs.some((m) => m.requires_escalation));
      })
      .catch(() => setError('Could not load messages.'))
      .finally(() => setLoadingMessages(false));
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending, loadingMessages]);

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !activeSessionId || sending) return;
    setSending(true);
    setError('');
    setDraft('');

    const optimisticUser: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      session_id: activeSessionId,
      sender: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await sendChatMessage(activeSessionId, text);
      if (res.escalation_triggered) {
        setCrisisActive(true);
      }
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticUser.id);
        return [...withoutOptimistic, res.user_message, res.assistant_message];
      });
      setSessions((prev) => {
        const updated = prev.map((s) => (s.id === res.session.id ? res.session : s));
        return [res.session, ...updated.filter((s) => s.id !== res.session.id)];
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Message failed to send.';
      setError(typeof msg === 'string' ? msg : 'Message failed to send.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col px-3 py-3 sm:px-6 sm:py-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="mb-3 flex shrink-0 flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">{t('chat.title')}</h1>
            <p className="text-xs text-slate-500 sm:text-sm">{t('chat.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {t('account.newChat')}
          </button>
        </div>

        <div className="mb-3 shrink-0 rounded-xl border border-calm-100 bg-calm-50/70 px-3 py-2.5 text-xs text-calm-500 sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
          {t('chat.disclaimer')}
        </div>

        {error && (
          <div className="mb-3 shrink-0 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Mobile session picker + actions */}
        <div className="mb-3 shrink-0 md:hidden">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('chat.sessions')}
          </label>
          <div className="flex gap-2">
            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
              disabled={loadingSessions || sessions.length === 0}
            >
              {sessions.length === 0 ? (
                <option value="">{t('chat.noSessions')}</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sessionTitle(s)}
                  </option>
                ))
              )}
            </select>
            {activeSession && (
              <>
                <button
                  type="button"
                  onClick={() => beginRename(activeSession)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  aria-label={t('chat.rename')}
                  title={t('chat.rename')}
                  disabled={!!busySessionId}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(activeSession.id)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-100 bg-white text-red-600 hover:bg-red-50"
                  aria-label={t('chat.delete')}
                  title={t('chat.delete')}
                  disabled={!!busySessionId}
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[240px_1fr] md:gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="card hidden min-h-0 overflow-y-auto p-4 md:block">
            <div className="mb-3 text-sm font-semibold text-slate-700">{t('chat.sessions')}</div>
            {loadingSessions ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const active = s.id === activeSessionId;
                  const isRenaming = renamingId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={[
                        'rounded-xl px-2 py-2 text-sm transition',
                        active ? 'bg-calm-100 text-calm-500' : 'text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {isRenaming ? (
                        <form
                          className="space-y-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void saveRename(s.id);
                          }}
                        >
                          <input
                            ref={renameInputRef}
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            maxLength={255}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
                            placeholder={t('chat.renamePlaceholder')}
                            aria-label={t('chat.renameTitle')}
                            disabled={busySessionId === s.id}
                          />
                          <div className="flex gap-1">
                            <button
                              type="submit"
                              className="rounded-lg bg-green-400 px-2 py-1 text-xs font-semibold text-white hover:opacity-90"
                              disabled={!renameDraft.trim() || busySessionId === s.id}
                            >
                              {t('chat.save')}
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white"
                            >
                              {t('chat.cancel')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveSessionId(s.id)}
                            className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left"
                          >
                            <div className="truncate font-medium">{sessionTitle(s)}</div>
                            <div className="text-xs opacity-70">
                              Updated {new Date(s.updated_at).toLocaleDateString()}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => beginRename(s)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
                            aria-label={t('chat.rename')}
                            title={t('chat.rename')}
                            disabled={!!busySessionId}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSession(s.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-red-600"
                            aria-label={t('chat.delete')}
                            title={t('chat.delete')}
                            disabled={!!busySessionId}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="card flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
              {renamingId === activeSessionId && activeSession ? (
                <>
                  <form
                    className="flex flex-wrap items-center gap-2 md:hidden"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveRename(activeSession.id);
                    }}
                  >
                    <input
                      ref={renameInputRef}
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelRename();
                        }
                      }}
                      maxLength={255}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800"
                      placeholder={t('chat.renamePlaceholder')}
                      aria-label={t('chat.renameTitle')}
                      disabled={busySessionId === activeSession.id}
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-green-400 px-3 py-1.5 text-xs font-semibold text-white"
                      disabled={!renameDraft.trim() || busySessionId === activeSession.id}
                    >
                      {t('chat.save')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {t('chat.cancel')}
                    </button>
                  </form>
                  <div className="hidden md:block">
                    <div className="truncate text-sm font-semibold text-slate-700">
                      {sessionTitle(activeSession)}
                    </div>
                    <div className="text-xs text-slate-500">{t('chat.emergencyHint')}</div>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-700">
                      {sessionTitle(activeSession)}
                    </div>
                    <div className="text-xs text-slate-500">{t('chat.emergencyHint')}</div>
                  </div>
                  {activeSession && (
                    <div className="hidden shrink-0 gap-1 md:flex">
                      <button
                        type="button"
                        onClick={() => beginRename(activeSession)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        aria-label={t('chat.rename')}
                        title={t('chat.rename')}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSession(activeSession.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={t('chat.delete')}
                        title={t('chat.delete')}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <CrisisAlertBanner
              visible={crisisActive}
              onDismiss={() => setCrisisActive(false)}
            />

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
              {loadingMessages ? (
                <div className="text-sm text-slate-500">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Start by sharing what's been on your mind lately.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      'flex',
                      m.sender === 'user' ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed sm:max-w-[85%] sm:px-4 sm:py-3',
                        m.sender === 'user'
                          ? 'bg-green-400 text-white'
                          : 'bg-slate-50 text-slate-700 ring-1 ring-slate-100',
                      ].join(' ')}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      <div
                        className={[
                          'mt-2 text-xs opacity-70',
                          m.sender === 'user' ? 'text-white' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {formatTime(m.created_at)}
                        {m.requires_escalation ? ' • crisis support recommended' : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-slate-100 p-3 sm:p-4">
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message…"
                  rows={2}
                  className="min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-calm-300 focus:outline-none focus:ring-2 focus:ring-calm-200 sm:px-4 sm:py-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  disabled={!activeSessionId || sending}
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={!draft.trim() || sending || !activeSessionId}
                  className="shrink-0 rounded-xl bg-green-400 px-4 text-sm font-semibold text-white shadow-md transition hover:opacity-80 sm:px-5"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 hidden text-xs text-slate-500 sm:block">
                Press Enter to send • Shift+Enter for a new line
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
