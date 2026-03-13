'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type AnnouncementForm = {
  title: string;
  content: string;
  published: boolean;
};

const initialForm: AnnouncementForm = {
  title: '',
  content: '',
  published: true,
};

export default function AdminAnnouncementsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [form, setForm] = useState<AnnouncementForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);

    try {
      setAnnouncements(await listAnnouncements());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAnnouncements();
    }
  }, [authLoading]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.title || !form.content) {
        throw new Error('Title and content are required.');
      }

      if (editingId) {
        await updateAnnouncement(editingId, form);
        setSuccess('Announcement updated.');
      } else {
        await createAnnouncement(form);
        setSuccess('Announcement created.');
      }

      resetForm();
      await loadAnnouncements();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement: BackendAnnouncement) => {
    setEditingId(announcement._id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      published: announcement.published,
    });
    setSuccess(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setSuccess(null);

    try {
      await deleteAnnouncement(id);
      if (editingId === id) resetForm();
      setSuccess('Announcement deleted.');
      await loadAnnouncements();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Announcements</h1>
          <p className="section-copy mt-2">
            Create, publish, update and remove announcements shown across the system.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
          <form className="surface p-5" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-white">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
                  className="min-h-36 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, published: e.target.checked }))
                  }
                />
                Publish immediately
              </label>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-70"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="surface overflow-hidden">
            <div className="border-b border-white/10 px-4 py-4">
              <h2 className="text-lg font-semibold text-white">Existing Announcements</h2>
              <p className="mt-1 text-sm text-slate-400">Newest first.</p>
            </div>

            {authLoading || loading ? (
              <div className="px-4 py-6 text-slate-300">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="px-4 py-6 text-slate-300">No announcements yet.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{announcement.title}</h3>
                          <span
                            className={`status-badge ${
                              announcement.published
                                ? 'bg-green-500/20 text-green-100'
                                : 'bg-slate-700/60 text-slate-200'
                            }`}
                          >
                            {announcement.published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{announcement.content}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(announcement.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(announcement)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(announcement._id)}
                          className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
