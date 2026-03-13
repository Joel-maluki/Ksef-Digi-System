'use client';

import { useEffect, useMemo, useState } from 'react';
import { Medal, Search } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { BackendPublicRankingGroup, getPublicRankings } from '@/lib/api';
import { competitionLevels, formatCompetitionLevel } from '@/lib/ksef';

const levelSortOrder = {
  sub_county: 0,
  county: 1,
  regional: 2,
  national: 3,
} as const;

const toRankingGroups = (
  value: BackendPublicRankingGroup[] | BackendPublicRankingGroup
): BackendPublicRankingGroup[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (group): group is BackendPublicRankingGroup =>
      Boolean(group?.categoryId && Array.isArray(group?.rankings))
  );

export default function RankingsPage() {
  const [rankingGroups, setRankingGroups] = useState<BackendPublicRankingGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPublicRankings();
        const groups = toRankingGroups(result).sort((a, b) => {
          const levelA =
            levelSortOrder[a.competitionLevel as keyof typeof levelSortOrder] ?? 999;
          const levelB =
            levelSortOrder[b.competitionLevel as keyof typeof levelSortOrder] ?? 999;

          return levelA - levelB || a.categoryName.localeCompare(b.categoryName);
        });

        setRankingGroups(groups);
        setSelectedLevel((current) => current || String(groups[0]?.competitionLevel || ''));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setRankingGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  const publishedLevels = useMemo(
    () =>
      competitionLevels.filter((level) =>
        rankingGroups.some((group) => String(group.competitionLevel) === level.value)
      ),
    [rankingGroups]
  );

  const groupsForLevel = useMemo(
    () =>
      rankingGroups.filter(
        (group) => !selectedLevel || String(group.competitionLevel) === selectedLevel
      ),
    [rankingGroups, selectedLevel]
  );

  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>();

    groupsForLevel.forEach((group) => {
      if (!categoryMap.has(group.categoryId)) {
        categoryMap.set(group.categoryId, {
          id: group.categoryId,
          name: group.categoryName,
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [groupsForLevel]);

  useEffect(() => {
    if (groupsForLevel.length === 0) {
      setSelectedCategory('');
      setExpanded(null);
      return;
    }

    const currentExists = groupsForLevel.some((group) => group.categoryId === selectedCategory);

    if (!currentExists) {
      setSelectedCategory(groupsForLevel[0].categoryId);
      setExpanded(null);
    }
  }, [groupsForLevel, selectedCategory]);

  const rankingGroup = useMemo(
    () =>
      groupsForLevel.find((group) => group.categoryId === selectedCategory) ||
      groupsForLevel[0] ||
      null,
    [groupsForLevel, selectedCategory]
  );

  const ranked = useMemo(() => {
    const projects = rankingGroup?.rankings || [];
    const query = search.trim().toLowerCase();

    return projects.filter((item) => {
      if (!query) return true;

      return (
        item.projectCode.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.schoolName.toLowerCase().includes(query)
      );
    });
  }, [rankingGroup, search]);

  return (
    <div className="page-shell">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="section-title">Public Rankings</h1>
          <p className="section-copy mt-2">
            Published category results only. Top 4 qualify to the next level and top 3
            receive awards.
          </p>
        </div>

        {loading ? (
          <div className="surface mt-8 p-8 text-center text-slate-300">
            Loading published rankings...
          </div>
        ) : error ? (
          <div className="surface mt-8 p-8 text-center text-red-300">{error}</div>
        ) : rankingGroups.length === 0 ? (
          <div className="surface mt-8 p-8 text-center text-slate-300">
            No public rankings have been published yet. Once admin publishes category
            results, they will appear here.
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setExpanded(null);
                }}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                {publishedLevels.map((level) => (
                  <option key={level.value} value={level.value} className="bg-slate-900">
                    {level.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, title or school"
                  className="h-11 flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2">
              {availableCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setExpanded(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-slate-200">
              Showing published results for{' '}
              <span className="font-medium text-white">
                {formatCompetitionLevel(String(rankingGroup?.competitionLevel || selectedLevel))}
              </span>
              .
            </div>

            <div className="mt-8 space-y-4">
              {ranked.length === 0 ? (
                <div className="surface p-8 text-center text-slate-300">
                  No published projects found for this category at the selected level.
                </div>
              ) : (
                ranked.map((project) => {
                  const medal =
                    project.rank === 1
                      ? '1'
                      : project.rank === 2
                        ? '2'
                        : project.rank === 3
                          ? '3'
                          : String(project.rank);
                  const qualifies = project.qualifiedForNextLevel;

                  return (
                    <div key={project.projectId} className="surface p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl">
                            {medal}
                          </div>
                          <div>
                            <p className="text-sm text-blue-200">{project.projectCode}</p>
                            <h2 className="text-xl font-semibold text-white">{project.title}</h2>
                            <p className="text-sm text-slate-400">
                              {project.schoolName}
                              {project.county ? ` - ${project.county}` : ''}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {project.award ? (
                                <span className="status-badge bg-amber-500/20 text-amber-100">
                                  <Medal className="mr-1 h-3.5 w-3.5" /> Awarded
                                </span>
                              ) : null}
                              <span
                                className={`status-badge ${
                                  qualifies
                                    ? 'bg-green-500/20 text-green-100'
                                    : 'bg-slate-700/60 text-slate-200'
                                }`}
                              >
                                {qualifies ? 'Qualified for Next Level' : 'Not Qualified'}
                              </span>
                              <span className="status-badge bg-white/10 text-slate-200">
                                {formatCompetitionLevel(project.currentLevel)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                              Final Score
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-white">
                              {project.finalScore.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                            onClick={() =>
                              setExpanded(expanded === project.projectId ? null : project.projectId)
                            }
                          >
                            View Breakdown
                          </Button>
                        </div>
                      </div>
                      {expanded === project.projectId && (
                        <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            Section A: {project.sectionAAverage.toFixed(1)} / 30
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            Section B: {project.sectionBAverage.toFixed(1)} / 15
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            Section C: {project.sectionCAverage.toFixed(1)} / 35
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                            Judges Used: {project.judgesCount}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
