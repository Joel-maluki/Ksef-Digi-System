'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendPublicRankingGroup,
  BackendPublicRankingGroupSummary,
  getPublicRankings,
  listPublicRankingGroups,
} from '@/lib/api';
import { formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const getGroupKey = (
  group: BackendPublicRankingGroup | BackendPublicRankingGroupSummary
) =>
  group.scopeKey ||
  `${group.categoryId}-${group.competitionLevel}-${group.areaLabel || 'default'}`;

const buildRankingFilters = (group: BackendPublicRankingGroupSummary) => ({
  categoryId: group.categoryId,
  competitionLevel: String(group.competitionLevel),
  region: group.region,
  county: group.county,
  subCounty: group.subCounty,
});

export default function AdminCertificatesPage() {
  const { loading: authLoading } = useRequireAuth();
  const [publishedGroups, setPublishedGroups] = useState<BackendPublicRankingGroupSummary[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [rankingGroup, setRankingGroup] = useState<BackendPublicRankingGroup | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const loadPublishedGroups = async () => {
      setLoadingGroups(true);
      setError(null);

      try {
        const groups = await listPublicRankingGroups();
        setPublishedGroups(groups);
        setSelectedGroupKey((current) => current || (groups[0] ? getGroupKey(groups[0]) : ''));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setPublishedGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadPublishedGroups();
  }, [authLoading]);

  const selectedGroup = useMemo(
    () => publishedGroups.find((group) => getGroupKey(group) === selectedGroupKey) || null,
    [publishedGroups, selectedGroupKey]
  );

  useEffect(() => {
    if (authLoading || !selectedGroup) {
      setLoadingRankings(false);
      setRankingGroup(null);
      return;
    }

    const loadSelectedGroup = async () => {
      setLoadingRankings(true);
      setError(null);

      try {
        const data = await getPublicRankings(buildRankingFilters(selectedGroup));
        const groups = Array.isArray(data) ? data : [data];
        setRankingGroup(groups[0] || null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setRankingGroup(null);
      } finally {
        setLoadingRankings(false);
      }
    };

    loadSelectedGroup();
  }, [authLoading, selectedGroup]);

  const certificateRows = useMemo(
    () =>
      (rankingGroup?.rankings || []).filter((item) => item.rank <= 4).map((item) => ({
        categoryName: rankingGroup?.categoryName || '',
        competitionLevel: rankingGroup?.competitionLevel || '',
        areaLabel: rankingGroup?.areaLabel || '',
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
      })),
    [rankingGroup]
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Certificates</h1>
            <p className="section-copy mt-2">
              Generate award and qualification certificate lists from one published result group at a time.
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

        {publishedGroups.length > 0 ? (
          <div className="surface p-4">
            <label className="text-sm text-slate-300">Published result group</label>
            <select
              value={selectedGroupKey}
              onChange={(event) => setSelectedGroupKey(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              {publishedGroups.map((group) => (
                <option key={getGroupKey(group)} value={getGroupKey(group)} className="bg-slate-900">
                  {group.categoryName} - {formatCompetitionLevel(String(group.competitionLevel))}
                  {group.areaLabel ? ` - ${group.areaLabel}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {authLoading || loadingGroups || loadingRankings ? (
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
                        {row.areaLabel ? ` • ${row.areaLabel}` : ''}
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
                    <th className="px-4 py-3">Level / Area</th>
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
                        {row.areaLabel ? ` • ${row.areaLabel}` : ''}
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
