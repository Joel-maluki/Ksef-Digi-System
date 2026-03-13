'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { BackendScore, listScoresByJudge } from '@/lib/api';
import { formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function JudgeSubmittedScoresPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [entries, setEntries] = useState<BackendScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        setEntries(await listScoresByJudge(user._id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user]);

  return (
    <DashboardLayout role="judge">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Submitted Scores</h1>
          <p className="section-copy mt-2">
            Review project scores you have already entered. Editing is disabled unless Admin unlocks the score.
          </p>
        </div>
        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading submitted scores...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : (
          <div className="surface overflow-hidden">
            <div className="space-y-3 p-4 md:hidden">
              {entries.map((entry) => {
                const project = typeof entry.projectId === 'string' ? null : entry.projectId;

                return (
                  <div
                    key={entry._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{project?.projectCode}</p>
                        <p className="mt-1 text-sm text-slate-300">{project?.title}</p>
                      </div>
                      <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100">
                        {entry.judgeTotal}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Level
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {formatCompetitionLevel(String(project?.currentLevel || 'sub_county'))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Section A
                        </p>
                        <p className="mt-1 text-sm text-slate-200">{entry.sectionA}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Section B
                        </p>
                        <p className="mt-1 text-sm text-slate-200">{entry.sectionB}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Section C
                        </p>
                        <p className="mt-1 text-sm text-slate-200">{entry.sectionC}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[760px] text-sm">
                <thead className="bg-white/5 text-left text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Project Code</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">A</th>
                    <th className="px-4 py-3">B</th>
                    <th className="px-4 py-3">C</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const project = typeof entry.projectId === 'string' ? null : entry.projectId;

                    return (
                      <tr key={entry._id} className="border-t border-white/10">
                        <td className="px-4 py-3 text-blue-200">{project?.projectCode}</td>
                        <td className="px-4 py-3 text-white">{project?.title}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatCompetitionLevel(String(project?.currentLevel || 'sub_county'))}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{entry.sectionA}</td>
                        <td className="px-4 py-3 text-slate-300">{entry.sectionB}</td>
                        <td className="px-4 py-3 text-slate-300">{entry.sectionC}</td>
                        <td className="px-4 py-3 text-white">{entry.judgeTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
