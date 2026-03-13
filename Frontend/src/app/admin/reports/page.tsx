'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendAdminRankingGroup,
  BackendCategoryReportRow,
  BackendCompetitionLeaderboardRow,
  BackendCompetitionMetricsReport,
  BackendParticipationReport,
  BackendRegionReport,
  getCategoryReport,
  getCompetitionMetricsReport,
  getParticipationReport,
  getRegionReport,
  listRankings,
} from '@/lib/api';
import { competitionLevels, formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const emptyParticipation: BackendParticipationReport = {
  summary: {
    schools: 0,
    projects: 0,
    students: 0,
    maleStudents: 0,
    femaleStudents: 0,
    judges: 0,
    categories: 0,
  },
  projectsPerSchool: [],
};

const emptyRegions: BackendRegionReport = {
  regions: [],
  counties: [],
};

const emptyCompetitionMetrics: BackendCompetitionMetricsReport = {
  competitionLevel: 'sub_county',
  summary: {
    totalProjects: 0,
    scoredProjects: 0,
    categoriesWithProjects: 0,
    readyCategories: 0,
    publishedCategories: 0,
    scheduledEvents: 0,
    liveEvents: 0,
    upcomingEvents: 0,
  },
  schedule: [],
  leaderboards: {
    schools: [],
    subCounties: [],
    counties: [],
    regions: [],
  },
};

function LeaderboardTable({
  title,
  rows,
}: {
  title: string;
  rows: BackendCompetitionLeaderboardRow[];
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-slate-400">
          No scored projects yet for this leaderboard.
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {rows.map((row) => (
              <div
                key={row.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-white">{row.name}</p>
                  <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100">
                    {row.points} pts
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Gold / Silver
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      {row.goldAwards} / {row.silverAwards}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Bronze / Qualified
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      {row.bronzeAwards} / {row.qualifiedProjects}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] text-sm">
              <thead className="bg-white/5 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Gold</th>
                  <th className="px-4 py-3">Silver</th>
                  <th className="px-4 py-3">Bronze</th>
                  <th className="px-4 py-3">Qualified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">{row.name}</td>
                    <td className="px-4 py-3 text-slate-300">{row.points}</td>
                    <td className="px-4 py-3 text-slate-300">{row.goldAwards}</td>
                    <td className="px-4 py-3 text-slate-300">{row.silverAwards}</td>
                    <td className="px-4 py-3 text-slate-300">{row.bronzeAwards}</td>
                    <td className="px-4 py-3 text-slate-300">{row.qualifiedProjects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const formatScheduleStatus = (value?: string) =>
  (value || 'scheduled')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleString();
};

export default function AdminReportsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [participation, setParticipation] =
    useState<BackendParticipationReport>(emptyParticipation);
  const [categoryRows, setCategoryRows] = useState<BackendCategoryReportRow[]>([]);
  const [regionReport, setRegionReport] = useState<BackendRegionReport>(emptyRegions);
  const [rankingGroups, setRankingGroups] = useState<BackendAdminRankingGroup[]>([]);
  const [competitionMetrics, setCompetitionMetrics] =
    useState<BackendCompetitionMetricsReport>(emptyCompetitionMetrics);
  const [selectedCompetitionLevel, setSelectedCompetitionLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricsWarning, setMetricsWarning] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setMetricsWarning(null);

      try {
        const [participationData, categoryData, regionData, rankingData] = await Promise.all([
          getParticipationReport(),
          getCategoryReport(),
          getRegionReport(),
          listRankings(),
        ]);

        let metricsData = emptyCompetitionMetrics;

        try {
          metricsData = await getCompetitionMetricsReport(
            selectedCompetitionLevel
              ? { competitionLevel: selectedCompetitionLevel }
              : undefined
          );
        } catch (metricsError: unknown) {
          const message =
            metricsError instanceof Error ? metricsError.message : String(metricsError);

          setMetricsWarning(
            message === 'Route not found'
              ? 'Competition metrics are unavailable on the running backend right now. Restart the backend to load the new reports endpoint.'
              : `Competition metrics could not be loaded: ${message}`
          );
        }

        setParticipation(participationData);
        setCategoryRows(categoryData);
        setRegionReport(regionData);
        setRankingGroups(rankingData);
        setCompetitionMetrics(metricsData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, selectedCompetitionLevel]);

  const rankingSummary = useMemo(
    () => ({
      ready: rankingGroups.filter((group) => group.ready).length,
      published: rankingGroups.filter((group) => group.published).length,
    }),
    [rankingGroups]
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Reports</h1>
            <p className="section-copy mt-2">
              Participation statistics, category distribution, regional coverage, and
              active competition standings for schools, sub-counties, counties, and
              regions.
            </p>
          </div>
          <div className="surface px-4 py-3">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
              Competition Level
            </label>
            <select
              value={selectedCompetitionLevel}
              onChange={(event) => setSelectedCompetitionLevel(event.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                Active Level
              </option>
              {competitionLevels.map((level) => (
                <option key={level.value} value={level.value} className="bg-slate-900">
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading reports...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : (
          <>
            {metricsWarning ? (
              <div className="surface p-4 text-sm text-amber-200">{metricsWarning}</div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {[
                ['Schools', participation.summary.schools],
                ['Projects', participation.summary.projects],
                ['Students', participation.summary.students],
                ['Male', participation.summary.maleStudents],
                ['Female', participation.summary.femaleStudents],
                ['Judges', participation.summary.judges],
              ].map(([label, value]) => (
                <div key={String(label)} className="surface p-5">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Competition Metrics
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatCompetitionLevel(String(competitionMetrics.competitionLevel))}{' '}
                    standings and readiness snapshot.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                {[
                  ['Scheduled Events', competitionMetrics.summary.scheduledEvents],
                  ['Live Events', competitionMetrics.summary.liveEvents],
                  ['Upcoming Events', competitionMetrics.summary.upcomingEvents],
                  ['Projects at Level', competitionMetrics.summary.totalProjects],
                  ['Scored Projects', competitionMetrics.summary.scoredProjects],
                  ['Ready Categories', competitionMetrics.summary.readyCategories],
                  ['Published Categories', competitionMetrics.summary.publishedCategories],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="surface overflow-hidden">
                <div className="border-b border-white/10 px-4 py-4">
                  <h2 className="text-lg font-semibold text-white">Projects per Category</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Projects</th>
                        <th className="px-4 py-3">Qualified</th>
                        <th className="px-4 py-3">Published</th>
                        <th className="px-4 py-3">Top Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.map((row) => (
                        <tr key={row.categoryId} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">
                            {row.categoryName} ({row.categoryCode})
                          </td>
                          <td className="px-4 py-3 text-slate-300">{row.projectCount}</td>
                          <td className="px-4 py-3 text-slate-300">{row.qualifiedCount}</td>
                          <td className="px-4 py-3 text-slate-300">{row.publishedCount}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {formatCompetitionLevel(String(row.topLevelReached))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="surface overflow-hidden">
                <div className="border-b border-white/10 px-4 py-4">
                  <h2 className="text-lg font-semibold text-white">Projects per School</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">School</th>
                        <th className="px-4 py-3">County</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Projects</th>
                        <th className="px-4 py-3">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participation.projectsPerSchool.map((row) => (
                        <tr key={row._id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">{row.schoolName}</td>
                          <td className="px-4 py-3 text-slate-300">{row.county}</td>
                          <td className="px-4 py-3 text-slate-300">{row.region}</td>
                          <td className="px-4 py-3 text-slate-300">{row.projectCount}</td>
                          <td className="px-4 py-3 text-slate-300">{row.studentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="surface overflow-hidden">
                <div className="border-b border-white/10 px-4 py-4">
                  <h2 className="text-lg font-semibold text-white">Competition Schedule</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[780px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Area</th>
                        <th className="px-4 py-3">Host School</th>
                        <th className="px-4 py-3">Judging Window</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitionMetrics.schedule.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-slate-400">
                            No competition schedule has been configured for this level.
                          </td>
                        </tr>
                      ) : (
                        competitionMetrics.schedule.map((entry) => (
                          <tr
                            key={`${entry.competitionLevel}-${entry.scopeName}`}
                            className="border-t border-white/10"
                          >
                            <td className="px-4 py-3 text-white">{entry.scopeName}</td>
                            <td className="px-4 py-3 text-slate-300">{entry.hostSchoolName}</td>
                            <td className="px-4 py-3 text-slate-300">
                              {formatDateTime(entry.judgingStartDate)}
                              <br />
                              <span className="text-xs text-slate-500">
                                to {formatDateTime(entry.judgingEndDate)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {formatScheduleStatus(entry.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="surface p-6">
                  <h2 className="text-lg font-semibold text-white">Ranking Report</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Ready Categories</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {rankingSummary.ready}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Published Categories</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {rankingSummary.published}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="surface overflow-hidden">
                  <div className="border-b border-white/10 px-4 py-4">
                    <h2 className="text-lg font-semibold text-white">County Snapshot</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[520px] text-sm">
                      <thead className="bg-white/5 text-left text-slate-300">
                        <tr>
                          <th className="px-4 py-3">County</th>
                          <th className="px-4 py-3">Region</th>
                          <th className="px-4 py-3">Projects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regionReport.counties.map((row) => (
                          <tr key={row.county} className="border-t border-white/10">
                            <td className="px-4 py-3 text-white">{row.county}</td>
                            <td className="px-4 py-3 text-slate-300">{row.region}</td>
                            <td className="px-4 py-3 text-slate-300">{row.projectCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <LeaderboardTable
                title="Top Schools Overall"
                rows={competitionMetrics.leaderboards.schools}
              />
              <LeaderboardTable
                title="Top Sub-Counties"
                rows={competitionMetrics.leaderboards.subCounties}
              />
              <LeaderboardTable
                title="Top Counties"
                rows={competitionMetrics.leaderboards.counties}
              />
              <LeaderboardTable
                title="Top Regions"
                rows={competitionMetrics.leaderboards.regions}
              />
            </div>

            <div className="surface overflow-hidden">
              <div className="border-b border-white/10 px-4 py-4">
                <h2 className="text-lg font-semibold text-white">Regional Statistics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[760px] text-sm">
                  <thead className="bg-white/5 text-left text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Region</th>
                      <th className="px-4 py-3">Schools</th>
                      <th className="px-4 py-3">Counties</th>
                      <th className="px-4 py-3">Projects</th>
                      <th className="px-4 py-3">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionReport.regions.map((row) => (
                      <tr key={row.region} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{row.region}</td>
                        <td className="px-4 py-3 text-slate-300">{row.schoolCount}</td>
                        <td className="px-4 py-3 text-slate-300">{row.countyCount}</td>
                        <td className="px-4 py-3 text-slate-300">{row.projectCount}</td>
                        <td className="px-4 py-3 text-slate-300">{row.studentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
