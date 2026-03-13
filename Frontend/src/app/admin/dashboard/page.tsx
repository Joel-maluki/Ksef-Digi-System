'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  FolderKanban,
  School,
  Shapes,
  UserCheck,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/ksef/StatCard';
import { DashboardLayout } from '@/components/layout';
import {
  BackendAdminDashboardStats,
  BackendCompetitionLeaderboardRow,
  getAdminDashboardStats,
} from '@/lib/api';
import { formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const emptyStats: BackendAdminDashboardStats = {
  schools: 0,
  projects: 0,
  students: 0,
  maleStudents: 0,
  femaleStudents: 0,
  judges: 0,
  categories: 0,
  activeCompetitionLevel: 'sub_county',
  projectsByCategory: [],
  projectsByRegion: [],
  activeLevelSchedule: [],
  activeLevelSummary: {
    totalProjects: 0,
    scoredProjects: 0,
    categoriesWithProjects: 0,
    readyCategories: 0,
    publishedCategories: 0,
    scheduledEvents: 0,
    liveEvents: 0,
    upcomingEvents: 0,
  },
  leaderboards: {
    schools: [],
    subCounties: [],
    counties: [],
    regions: [],
  },
};

function ChartList({
  title,
  copy,
  items,
}: {
  title: string;
  copy: string;
  items: Array<{ name: string; count: number }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="surface p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{copy}</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          No data has been recorded yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-200">{item.name}</span>
                <span className="font-medium text-white">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardList({
  title,
  copy,
  rows,
}: {
  title: string;
  copy: string;
  rows: BackendCompetitionLeaderboardRow[];
}) {
  return (
    <div className="surface p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{copy}</p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Rankings will appear here once the active level has enough scored projects.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Rank {index + 1}
                  </p>
                  <p className="mt-2 font-semibold text-white">{row.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-white">{row.points}</p>
                  <p className="text-xs text-slate-400">points</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Gold {row.goldAwards} | Silver {row.silverAwards} | Bronze {row.bronzeAwards}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Qualified {row.qualifiedProjects} | Projects {row.projectCount} | Avg Score{' '}
                {row.averageScore}
              </p>
            </div>
          ))}
        </div>
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

export default function AdminDashboardPage() {
  const { loading: authLoading } = useRequireAuth();
  const [stats, setStats] = useState<BackendAdminDashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        setStats(await getAdminDashboardStats());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading]);

  const quickLinks = useMemo(
    () => [
      {
        href: '/admin/projects',
        title: 'Projects',
        copy: 'Review submissions, promotions, and scoring controls.',
      },
      {
        href: '/admin/judges',
        title: 'Judges',
        copy: 'Manage trained judges and category assignments.',
      },
      {
        href: '/admin/rankings',
        title: 'Rankings',
        copy: 'Calculate top four qualifiers and publish ready categories.',
      },
      {
        href: '/admin/reports',
        title: 'Reports',
        copy: 'Open participation, region, and competition leaderboard reports.',
      },
    ],
    []
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="section-copy mt-2">
              Central oversight for schools, projects, judges, scores, rankings, reports,
              and event-day competition tracking.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-slate-200">
            Active level:{' '}
            <span className="font-medium text-white">
              {formatCompetitionLevel(stats.activeCompetitionLevel)}
            </span>
          </div>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading dashboard...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Total Schools Participating"
                value={String(stats.schools)}
                helper="Registered competition schools"
                icon={School}
              />
              <StatCard
                title="Total Projects Submitted"
                value={String(stats.projects)}
                helper="All projects in the system"
                icon={FolderKanban}
              />
              <StatCard
                title="Total Students"
                value={String(stats.students)}
                helper={`Male ${stats.maleStudents} | Female ${stats.femaleStudents}`}
                icon={Users}
              />
              <StatCard
                title="Total Judges Registered"
                value={String(stats.judges)}
                helper="Active judges on record"
                icon={UserCheck}
              />
              <StatCard
                title="Total Categories"
                value={String(stats.categories)}
                helper="Supported KSEF categories"
                icon={Shapes}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Scheduled Events', stats.activeLevelSummary?.scheduledEvents ?? 0],
                ['Live Events', stats.activeLevelSummary?.liveEvents ?? 0],
                ['Upcoming Events', stats.activeLevelSummary?.upcomingEvents ?? 0],
                ['Ready Categories', stats.activeLevelSummary?.readyCategories ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="surface p-5">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <ChartList
                title="Projects by Category"
                copy="Current submission load for every competition category."
                items={stats.projectsByCategory.map((item) => ({
                  name: `${item.name} (${item.code})`,
                  count: item.count,
                }))}
              />
              <ChartList
                title="Projects by Region"
                copy="Regional spread of project submissions."
                items={stats.projectsByRegion.map((item) => ({
                  name: item.name,
                  count: item.count,
                }))}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Active Level Event Windows
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Designated judging days for the active competition stage.
                    </p>
                  </div>
                  <Link
                    href="/admin/settings"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                  >
                    Manage Schedule
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {(stats.activeLevelSchedule || []).length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      No event windows have been configured yet.
                    </div>
                  ) : (
                    (stats.activeLevelSchedule || []).map((entry, index) => (
                      <div
                        key={`${entry.scopeName}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{entry.scopeName}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              Host school: {entry.hostSchoolName}
                            </p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.2em] text-blue-200">
                            {formatScheduleStatus(entry.status)}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Judging: {formatDateTime(entry.judgingStartDate)} to{' '}
                          {formatDateTime(entry.judgingEndDate)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Results: {formatDateTime(entry.resultsAnnouncementDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Quick Actions
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Jump directly into the admin workflows that still need attention.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                    >
                      <h3 className="font-semibold text-white">{link.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">{link.copy}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <LeaderboardList
                title="Top Schools Overall"
                copy="Active-level standings based on medals, qualifiers, and score strength."
                rows={stats.leaderboards?.schools || []}
              />
              <LeaderboardList
                title="Top Sub-Counties"
                copy="Sub-county standings for the current stage of competition."
                rows={stats.leaderboards?.subCounties || []}
              />
              <LeaderboardList
                title="Top Counties"
                copy="County standings built from current active-level results."
                rows={stats.leaderboards?.counties || []}
              />
              <LeaderboardList
                title="Top Regions"
                copy="Regional standings at the current KSEF stage."
                rows={stats.leaderboards?.regions || []}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
