'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendAdminRankingGroup,
  BackendCategory,
  BackendSystemSettings,
  getSettings,
  hideRankings,
  listCategories,
  listRankings,
  publishRankings,
} from '@/lib/api';
import { competitionLevels, formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const emptySettings: BackendSystemSettings = {
  _id: '',
  key: 'system',
  activeCompetitionLevel: 'sub_county',
  projectSubmissionDeadline: null,
  scoreSubmissionDeadline: null,
  allowAdminRankingOverride: true,
  competitionSchedule: [],
};

export default function AdminRankingsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [groups, setGroups] = useState<BackendAdminRankingGroup[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [settings, setSettings] = useState<BackendSystemSettings>(emptySettings);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [rankingData, categoryData, settingsData] = await Promise.all([
        listRankings(),
        listCategories(),
        getSettings(),
      ]);

      setGroups(rankingData);
      setCategories(categoryData);
      setSettings(settingsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPageData();
    }
  }, [authLoading]);

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (selectedCategory !== 'all' && group.categoryId !== selectedCategory) {
          return false;
        }

        if (selectedLevel !== 'all' && group.competitionLevel !== selectedLevel) {
          return false;
        }

        return true;
      }),
    [groups, selectedCategory, selectedLevel]
  );

  const summary = useMemo(
    () => ({
      total: filteredGroups.length,
      ready: filteredGroups.filter((group) => group.ready).length,
      published: filteredGroups.filter((group) => group.published).length,
    }),
    [filteredGroups]
  );

  const handlePublish = async (
    group: BackendAdminRankingGroup,
    force = false
  ) => {
    const key = `${group.categoryId}-${group.competitionLevel}-${force ? 'force' : 'publish'}`;
    setSubmittingKey(key);
    setError(null);
    setSuccess(null);

    try {
      await publishRankings({
        categoryId: group.categoryId,
        competitionLevel: group.competitionLevel as
          | 'sub_county'
          | 'county'
          | 'regional'
          | 'national',
        force,
      });

      setSuccess(
        `${group.categoryName} rankings published for ${formatCompetitionLevel(
          String(group.competitionLevel)
        )}.`
      );
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingKey(null);
    }
  };

  const handleHide = async (group: BackendAdminRankingGroup) => {
    const key = `${group.categoryId}-${group.competitionLevel}-hide`;
    setSubmittingKey(key);
    setError(null);
    setSuccess(null);

    try {
      await hideRankings({
        categoryId: group.categoryId,
        competitionLevel: group.competitionLevel as
          | 'sub_county'
          | 'county'
          | 'regional'
          | 'national',
      });

      setSuccess(
        `${group.categoryName} rankings hidden for ${formatCompetitionLevel(
          String(group.competitionLevel)
        )}.`
      );
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Rankings</h1>
          <p className="section-copy mt-2">
            Rankings are calculated from locked Section A, B, and C scores. Each
            project must have at least 2 judges and can have up to 3 before a category
            is fully ready to publish.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,1fr,1fr]">
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Filtered Categories</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.total}</p>
          </div>
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Ready to Publish</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.ready}</p>
          </div>
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Published</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.published}</p>
          </div>
          <div className="surface p-5">
            <p className="text-sm text-slate-300">Override Rule</p>
            <p className="mt-2 text-sm font-medium text-white">
              {settings.allowAdminRankingOverride
                ? 'Admin override is enabled'
                : 'Only fully scored categories can be published'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-900">
                All Categories
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id} className="bg-slate-900">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={selectedLevel}
              onChange={(event) => setSelectedLevel(event.target.value)}
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-900">
                All Levels
              </option>
              {competitionLevels.map((level) => (
                <option key={level.value} value={level.value} className="bg-slate-900">
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}
        {success ? (
          <div className="surface p-4 text-sm text-emerald-300">{success}</div>
        ) : null}

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading rankings...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="surface p-6 text-slate-300">
            No ranking groups match the current filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => {
              const publishKey = `${group.categoryId}-${group.competitionLevel}-publish`;
              const overrideKey = `${group.categoryId}-${group.competitionLevel}-force`;
              const hideKey = `${group.categoryId}-${group.competitionLevel}-hide`;

              return (
                <div
                  key={`${group.categoryId}-${group.competitionLevel}`}
                  className="surface overflow-hidden"
                >
                  <div className="border-b border-white/10 px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {group.categoryName} ({group.categoryCode})
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatCompetitionLevel(String(group.competitionLevel))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`status-badge ${
                            group.ready
                              ? 'bg-green-500/20 text-green-100'
                              : 'bg-amber-500/20 text-amber-100'
                          }`}
                        >
                          {group.scoredProjects} / {group.projectCount} meet the {group.minimumJudgeCount}-judge minimum
                        </span>
                        <span
                          className={`status-badge ${
                            group.published
                              ? 'bg-blue-500/20 text-blue-100'
                              : 'bg-slate-700/60 text-slate-200'
                          }`}
                        >
                          {group.published ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {group.published ? (
                        <button
                          type="button"
                          onClick={() => handleHide(group)}
                          disabled={submittingKey === hideKey}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
                        >
                          {submittingKey === hideKey ? 'Updating...' : 'Hide Rankings'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePublish(group)}
                            disabled={!group.ready || submittingKey === publishKey}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {submittingKey === publishKey
                              ? 'Publishing...'
                              : 'Publish Rankings'}
                          </button>
                          {!group.ready && settings.allowAdminRankingOverride ? (
                            <button
                              type="button"
                              onClick={() => handlePublish(group, true)}
                              disabled={submittingKey === overrideKey}
                              className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 disabled:opacity-60"
                            >
                              {submittingKey === overrideKey
                                ? 'Publishing...'
                                : 'Publish With Override'}
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {group.rankings.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-300">
                      No projects have been ranked for this category yet.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 p-4 md:hidden">
                        {group.rankings.map((item) => (
                          <div
                            key={item.projectId}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-blue-200">Rank {item.rank}</p>
                                <p className="mt-1 font-semibold text-white">
                                  {item.projectCode} - {item.title}
                                </p>
                              </div>
                              <div className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-100">
                                {item.finalScore.toFixed(2)}
                              </div>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  School
                                </p>
                                <p className="mt-1 text-sm text-slate-200">{item.schoolName}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Judges
                                </p>
                                <p className="mt-1 text-sm text-slate-200">
                                  {item.judgesCount} / {group.maximumJudgeCount}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-400">
                              A {item.sectionAAverage.toFixed(2)} | B {item.sectionBAverage.toFixed(2)} | C{' '}
                              {item.sectionCAverage.toFixed(2)}
                            </p>
                            {!item.meetsMinimumJudgeThreshold ? (
                              <p className="mt-2 text-xs text-amber-300">
                                Needs at least {group.minimumJudgeCount} locked judge scores
                              </p>
                            ) : null}
                            <p className="mt-3 text-sm text-slate-200">
                              {item.award
                                ? item.award.toUpperCase()
                                : item.qualifiedForNextLevel
                                  ? 'Proceed to next level'
                                  : '-'}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-[900px] text-sm">
                          <thead className="bg-white/5 text-left text-slate-300">
                            <tr>
                              <th className="px-4 py-3">Rank</th>
                              <th className="px-4 py-3">Project</th>
                              <th className="px-4 py-3">School</th>
                              <th className="px-4 py-3">Final Score</th>
                              <th className="px-4 py-3">Judges</th>
                              <th className="px-4 py-3">Award / Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rankings.map((item) => (
                              <tr key={item.projectId} className="border-t border-white/10">
                                <td className="px-4 py-3 text-white">{item.rank}</td>
                                <td className="px-4 py-3 text-slate-300">
                                  <div className="text-white">
                                    {item.projectCode} - {item.title}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-400">
                                    A {item.sectionAAverage.toFixed(2)} | B {item.sectionBAverage.toFixed(2)} | C{' '}
                                    {item.sectionCAverage.toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-300">{item.schoolName}</td>
                                <td className="px-4 py-3 text-white">
                                  {item.finalScore.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                  <div>{item.judgesCount} / {group.maximumJudgeCount}</div>
                                  {!item.meetsMinimumJudgeThreshold ? (
                                    <div className="mt-1 text-xs text-amber-300">
                                      Needs at least {group.minimumJudgeCount} locked judge scores
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                  {item.award
                                    ? item.award.toUpperCase()
                                    : item.qualifiedForNextLevel
                                      ? 'Proceed to next level'
                                      : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
