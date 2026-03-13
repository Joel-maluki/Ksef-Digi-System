'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { BackendPublicRankingGroup, getPublicRankings } from '@/lib/api';
import { formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function AdminCertificatesPage() {
  const { loading: authLoading } = useRequireAuth();
  const [rankingGroups, setRankingGroups] = useState<BackendPublicRankingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublicRankings();
        setRankingGroups(Array.isArray(data) ? data : [data]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading]);

  const certificateRows = useMemo(
    () =>
      rankingGroups.flatMap((group) =>
        group.rankings
          .filter((item) => item.rank <= 4)
          .map((item) => ({
            categoryName: group.categoryName,
            competitionLevel: group.competitionLevel,
            projectCode: item.projectCode,
            projectTitle: item.title,
            schoolName: item.schoolName,
            rank: item.rank,
            award:
              item.rank === 1
                ? 'Gold Certificate'
                : item.rank === 2
                  ? 'Silver Certificate'
                  : item.rank === 3
                    ? 'Bronze Certificate'
                    : 'Qualification Certificate',
          }))
      ),
    [rankingGroups]
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Certificates</h1>
            <p className="section-copy mt-2">
              Generate award and qualification certificate lists from published rankings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Print List
          </button>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading certificate data...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : certificateRows.length === 0 ? (
          <div className="surface p-6 text-slate-300">
            No published rankings are available for certificate preparation yet.
          </div>
        ) : (
          <div className="surface overflow-hidden">
            <div className="space-y-3 p-4 md:hidden">
              {certificateRows.map((row) => (
                <div
                  key={`${row.categoryName}-${row.competitionLevel}-${row.projectCode}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{row.categoryName}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatCompetitionLevel(String(row.competitionLevel))}
                      </p>
                    </div>
                    <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100">
                      Rank {row.rank}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-200">
                    {row.projectCode} - {row.projectTitle}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{row.schoolName}</p>
                  <p className="mt-4 text-sm font-medium text-amber-200">{row.award}</p>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[900px] text-sm">
                <thead className="bg-white/5 text-left text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {certificateRows.map((row) => (
                    <tr
                      key={`${row.categoryName}-${row.competitionLevel}-${row.projectCode}`}
                      className="border-t border-white/10"
                    >
                      <td className="px-4 py-3 text-white">{row.categoryName}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {formatCompetitionLevel(String(row.competitionLevel))}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.projectCode} - {row.projectTitle}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.schoolName}</td>
                      <td className="px-4 py-3 text-slate-300">{row.rank}</td>
                      <td className="px-4 py-3 text-slate-300">{row.award}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
