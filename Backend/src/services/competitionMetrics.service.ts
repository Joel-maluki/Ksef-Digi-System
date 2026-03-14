import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import type { AdminScopeContext } from './adminScope.service';
import {
  buildPublicationScopeFilter,
  buildScopedProjectFilter,
} from './adminScope.service';
import {
  CompetitionLevelKey,
  CompetitionScheduleEntry,
  filterCompetitionScheduleByLevel,
  getCompetitionScheduleStatus,
} from './competitionSchedule.service';
import { RankedProject, calculateCategoryRanking } from './ranking.service';

type LeaderboardBucket = {
  name: string;
  points: number;
  goldAwards: number;
  silverAwards: number;
  bronzeAwards: number;
  qualifiedProjects: number;
  projectCount: number;
  totalScore: number;
  topScore: number;
};

export type CompetitionLeaderboardRow = {
  name: string;
  points: number;
  goldAwards: number;
  silverAwards: number;
  bronzeAwards: number;
  qualifiedProjects: number;
  projectCount: number;
  averageScore: number;
  topScore: number;
};

export type CompetitionMetricsReport = {
  competitionLevel: CompetitionLevelKey;
  summary: {
    totalProjects: number;
    scoredProjects: number;
    categoriesWithProjects: number;
    readyCategories: number;
    publishedCategories: number;
    scheduledEvents: number;
    liveEvents: number;
    upcomingEvents: number;
  };
  schedule: Array<
    CompetitionScheduleEntry & {
      status: ReturnType<typeof getCompetitionScheduleStatus>;
    }
  >;
  leaderboards: {
    schools: CompetitionLeaderboardRow[];
    subCounties: CompetitionLeaderboardRow[];
    counties: CompetitionLeaderboardRow[];
    regions: CompetitionLeaderboardRow[];
  };
};

const awardPoints: Record<NonNullable<RankedProject['award']>, number> = {
  gold: 5,
  silver: 3,
  bronze: 2,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const createLeaderboardRow = (bucket: LeaderboardBucket): CompetitionLeaderboardRow => ({
  name: bucket.name,
  points: bucket.points,
  goldAwards: bucket.goldAwards,
  silverAwards: bucket.silverAwards,
  bronzeAwards: bucket.bronzeAwards,
  qualifiedProjects: bucket.qualifiedProjects,
  projectCount: bucket.projectCount,
  averageScore: bucket.projectCount ? round2(bucket.totalScore / bucket.projectCount) : 0,
  topScore: round2(bucket.topScore),
});

const sortLeaderboardRows = (rows: CompetitionLeaderboardRow[]) =>
  rows.sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.goldAwards !== left.goldAwards) {
      return right.goldAwards - left.goldAwards;
    }

    if (right.silverAwards !== left.silverAwards) {
      return right.silverAwards - left.silverAwards;
    }

    if (right.bronzeAwards !== left.bronzeAwards) {
      return right.bronzeAwards - left.bronzeAwards;
    }

    if (right.qualifiedProjects !== left.qualifiedProjects) {
      return right.qualifiedProjects - left.qualifiedProjects;
    }

    if (right.averageScore !== left.averageScore) {
      return right.averageScore - left.averageScore;
    }

    if (right.topScore !== left.topScore) {
      return right.topScore - left.topScore;
    }

    return left.name.localeCompare(right.name);
  });

const buildLeaderboard = (
  rankedProjects: RankedProject[],
  getKey: (project: RankedProject) => string
) => {
  const buckets = rankedProjects.reduce<Map<string, LeaderboardBucket>>((accumulator, project) => {
    const key = getKey(project).trim();

    if (!key) {
      return accumulator;
    }

    const current =
      accumulator.get(key) ||
      ({
        name: key,
        points: 0,
        goldAwards: 0,
        silverAwards: 0,
        bronzeAwards: 0,
        qualifiedProjects: 0,
        projectCount: 0,
        totalScore: 0,
        topScore: 0,
      } as LeaderboardBucket);

    current.projectCount += 1;
    current.totalScore += project.finalScore;
    current.topScore = Math.max(current.topScore, project.finalScore);

    if (project.award) {
      current.points += awardPoints[project.award];

      if (project.award === 'gold') current.goldAwards += 1;
      if (project.award === 'silver') current.silverAwards += 1;
      if (project.award === 'bronze') current.bronzeAwards += 1;
    }

    if (project.qualifiedForNextLevel) {
      current.points += 1;
      current.qualifiedProjects += 1;
    }

    accumulator.set(key, current);
    return accumulator;
  }, new Map<string, LeaderboardBucket>());

  return sortLeaderboardRows(Array.from(buckets.values()).map(createLeaderboardRow));
};

export const getCompetitionMetrics = async ({
  competitionLevel,
  scheduleEntries = [],
  scope,
}: {
  competitionLevel: CompetitionLevelKey;
  scheduleEntries?: CompetitionScheduleEntry[];
  scope?: AdminScopeContext;
}): Promise<CompetitionMetricsReport> => {
  const projectFilter =
    scope && !scope.isGlobal
      ? await buildScopedProjectFilter(scope, { currentLevel: competitionLevel })
      : { currentLevel: competitionLevel };
  const publicationFilter =
    scope && !scope.isGlobal
      ? {
          competitionLevel,
          published: true,
          ...buildPublicationScopeFilter(scope),
        }
      : { competitionLevel, published: true };
  const [categories, levelProjects, publications] = await Promise.all([
    CategoryModel.find({ active: true }).sort({ name: 1 }).lean(),
    ProjectModel.find(projectFilter).select('categoryId').lean(),
    ResultPublicationModel.find(publicationFilter).lean(),
  ]);

  const categoryIdsWithProjects = Array.from(
    new Set(levelProjects.map((project) => String(project.categoryId)))
  );

  const rankedGroups = await Promise.all(
    categories
      .filter((category) => categoryIdsWithProjects.includes(String(category._id)))
      .map(async (category) => {
        const rankings = await calculateCategoryRanking(String(category._id), {
          competitionLevel,
          region: scope?.region,
          county: scope?.county,
          subCounty: scope?.subCounty,
        });
        return {
          categoryId: String(category._id),
          rankings,
        };
      })
  );

  const allRankings = rankedGroups.flatMap((group) => group.rankings);
  const scoredRankings = allRankings.filter((project) => project.meetsMinimumJudgeThreshold);
  const readyCategories = rankedGroups.filter(
    (group) =>
      group.rankings.length > 0 &&
      group.rankings.every((project) => project.meetsMinimumJudgeThreshold)
  ).length;
  const schedule = filterCompetitionScheduleByLevel(scheduleEntries, competitionLevel).map(
    (entry) => ({
      ...entry,
      status: getCompetitionScheduleStatus(entry),
    })
  );

  return {
    competitionLevel,
    summary: {
      totalProjects: allRankings.length,
      scoredProjects: scoredRankings.length,
      categoriesWithProjects: rankedGroups.length,
      readyCategories,
      publishedCategories: publications.length,
      scheduledEvents: schedule.length,
      liveEvents: schedule.filter((entry) => entry.status === 'live').length,
      upcomingEvents: schedule.filter((entry) => entry.status === 'upcoming').length,
    },
    schedule,
    leaderboards: {
      schools: buildLeaderboard(scoredRankings, (project) => project.schoolName),
      subCounties: buildLeaderboard(scoredRankings, (project) => project.subCounty),
      counties: buildLeaderboard(scoredRankings, (project) => project.county),
      regions: buildLeaderboard(scoredRankings, (project) => project.region),
    },
  };
};
