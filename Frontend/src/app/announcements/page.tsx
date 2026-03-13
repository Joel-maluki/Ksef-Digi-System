'use client';

import { useEffect, useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { BackendAnnouncement, listPublicAnnouncements } from '@/lib/api';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        setAnnouncements(await listPublicAnnouncements());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="page-shell">
      <PublicHeader />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="section-title">Announcements</h1>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="surface p-6 text-slate-300">Loading announcements...</div>
          ) : error ? (
            <div className="surface p-6 text-red-300">{error}</div>
          ) : announcements.length === 0 ? (
            <div className="surface p-6 text-slate-300">No announcements have been published yet.</div>
          ) : (
            announcements.map((item) => (
              <div key={item._id} className="surface p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-blue-200">
                  Public update
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm text-slate-300">{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
