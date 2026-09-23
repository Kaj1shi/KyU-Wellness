import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  createJournal,
  deleteJournal,
  listJournal,
  updateJournal,
} from '../services/support';
import type { JournalEntry } from '../types/support';

export default function JournalPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      setEntries(await listJournal());
    } catch {
      setError(t('journal.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateJournal(editingId, {
          title: title.trim() || undefined,
          content: content.trim(),
        });
      } else {
        await createJournal({
          title: title.trim() || undefined,
          content: content.trim(),
        });
      }
      resetForm();
      await load();
    } catch {
      setError(t('journal.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title || '');
    setContent(entry.content);
  };

  const onDelete = async (id: string) => {
    if (!confirm(t('journal.confirmDelete'))) return;
    try {
      await deleteJournal(id);
      if (editingId === id) resetForm();
      await load();
    } catch {
      setError(t('journal.deleteError'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800">{t('journal.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('journal.subtitle')}</p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={onSave} className="card mt-6 space-y-3 p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('journal.titlePlaceholder')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('journal.contentPlaceholder')}
            rows={6}
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-calm-300 px-4 py-2 text-sm font-semibold text-white hover:bg-calm-200 disabled:opacity-60"
            >
              {editingId ? t('journal.update') : t('journal.save')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                {t('journal.cancel')}
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('journal.entries')}
          </h2>
          {loading ? (
            <p className="text-sm text-slate-500">{t('journal.loading')}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-500">{t('journal.empty')}</p>
          ) : (
            entries.map((entry) => (
              <article key={entry.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {entry.title || t('journal.untitled')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      className="text-sm font-medium text-calm-500 hover:underline"
                    >
                      {t('journal.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      {t('journal.delete')}
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{entry.content}</p>
              </article>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
