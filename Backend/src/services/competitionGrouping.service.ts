import { CategoryModel } from '../models/Category';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import type { AdminScopeContext, CompetitionAreaLevel, CompetitionAreaScope } from './adminScope.service';
import {
  buildCompetitionScopeFromPublication,
  buildCompetitionScopeFromSchoolLocation,
  buildCompetitionScopeKey,
  buildPublicationScopeFilter,
  buildScopedProjectFilter,
  formatCompetitionScopeLabel,
  isCompetitionAreaLevel,
} from './adminScope.service';
import {
  MAX_JUDGES_PER_PROJECT,
  MIN_JUDGES_PER_PROJECT,
  buildProjectScoreCountMap,
  projectHasMinimumJudgeScores,
} from './judgingRules.service';

type GroupDescriptor = CompetitionAreaScope & {
  categoryId: string;
  scopeKey: string;
  areaLabel: string;
};

export type CompetitionGroupSummary = GroupDescriptor & {
  categoryName: string;
  categoryCode: string;
  projectCount: number;
  scoredProjects: number;
  lockedScores: number;
  minimumJudgeCount: number;
  maximumJudgeCount: number;
  ready: boolean;
  published: boolean;
  judgeCount: number;
  projectIds: string[];
};

const levelSortOrder: Record<CompetitionAreaLevel, number> = {
  sub_county: 0,
  county: 1,
  regional: 2,
  national: 3,
};

export const listCompetitionGroupSummaries = async ({
  adminScope,
  categoryId,
  competitionLevel,
}: {
  adminScope?: AdminScopeContext;
  categoryId?: string;
  competitionLevel?: CompetitionAreaLevel;
}) => {
  const categoryFilter = categoryId ? { _id: categoryId } : { active: true };
  const baseProjectFilter: Record<string, unknown> = {};
  const publicationFilter: Record<string, unknown> = {};

  if (categoryId) {
    publicationFilter.categoryId = categoryId;
  }

  if (competitionLevel) {
    baseProjectFilter.currentLevel = competitionLevel;
    publicationFilter.competitionLevel = competitionLevel;
  }

  const effectiveProjectFilter =
    adminScope && !adminScope.isGlobal
      ? await buildScopedProjectFilter(adminScope, baseProjectFilter)
      : baseProjectFilter;

  if (adminScope && !adminScope.isGlobal) {
    publicationFilter.competitionLevel = adminScope.competitionLevel;
    Object.assign(publicationFilter, buildPublicationScopeFilter(adminScope));
  }

  const categories = await CategoryModel.find(categoryFilter).sort({ name: 1 }).lean();
  const projects = await ProjectModel.find(effectiveProjectFilter)
    .select('_id categoryId currentLevel schoolId')
    .lean();
  const projectIds = projects.map((project) => project._id);
  const schoolIds = Array.from(
    new Set(projects.map((project) => String(project.schoolId)))
  );

  const [schools, scores, publications, assignments] = await Promise.all([
    schoolIds.length > 0
      ? SchoolModel.find({ _id: { $in: schoolIds } })
          .select('_id region county subCounty')
          .lean()
      : Promise.resolve([]),
    projectIds.length > 0
      ? ScoreModel.find({
          projectId: { $in: projectIds },
          locked: true,
        })
          .select('projectId locked')
          .lean()
      : Promise.resolve([]),
    ResultPublicationModel.find(publicationFilter).lean(),
    projectIds.length > 0
      ? ProjectJudgeAssignmentModel.find({
          projectId: { $in: projectIds },
          assignmentStatus: { $in: ['assigned', 'completed'] },
        })
          .select('projectId judgeId')
          .lean()
      : Promise.resolve([]),
  ]);

  const categoryMap = new Map(
    categories.map((category) => [
      String(category._id),
      { name: category.name, code: category.code },
    ])
  );
  const schoolMap = new Map(
    schools.map((school) => [String(school._id), school])
  );
  const descriptorMap = new Map<string, GroupDescriptor>();
  const projectGroups = new Map<string, typeof projects>();

  for (const project of projects) {
    if (!isCompetitionAreaLevel(project.currentLevel)) {
      continue;
    }

    const school = schoolMap.get(String(project.schoolId));
    const scope = buildCompetitionScopeFromSchoolLocation(
      {
        region: school?.region,
        county: school?.county,
        subCounty: school?.subCounty,
      },
      project.currentLevel
    );
    const scopeKey = buildCompetitionScopeKey(scope);
    const groupKey = `${String(project.categoryId)}:${scopeKey}`;

    descriptorMap.set(groupKey, {
      categoryId: String(project.categoryId),
      ...scope,
      scopeKey,
      areaLabel: formatCompetitionScopeLabel(scope),
    });

    const currentProjects = projectGroups.get(groupKey) || [];
    currentProjects.push(project);
    projectGroups.set(groupKey, currentProjects);
  }

  for (const publication of publications) {
    const scope = buildCompetitionScopeFromPublication({
      competitionLevel: publication.competitionLevel,
      region: publication.region,
      county: publication.county,
      subCounty: publication.subCounty,
    });
    const scopeKey = buildCompetitionScopeKey(scope);
    const groupKey = `${String(publication.categoryId)}:${scopeKey}`;

    if (!descriptorMap.has(groupKey)) {
      descriptorMap.set(groupKey, {
        categoryId: String(publication.categoryId),
        ...scope,
        scopeKey,
        areaLabel: formatCompetitionScopeLabel(scope),
      });
    }
  }

  const lockedScoreCountMap = buildProjectScoreCountMap(scores);
  const lockedScoresByProject = scores.reduce<Record<string, number>>((accumulator, score) => {
    if (score.locked) {
      const key = String(score.projectId);
      accumulator[key] = (accumulator[key] || 0) + 1;
    }

    return accumulator;
  }, {});
  const assignmentsByProject = assignments.reduce<Record<string, Set<string>>>(
    (accumulator, assignment) => {
      const key = String(assignment.projectId);

      if (!accumulator[key]) {
        accumulator[key] = new Set();
      }

      accumulator[key].add(String(assignment.judgeId));
      return accumulator;
    },
    {}
  );
  const publicationMap = new Map<string, (typeof publications)[number]>();

  for (const publication of publications) {
    const scope = buildCompetitionScopeFromPublication({
      competitionLevel: publication.competitionLevel,
      region: publication.region,
      county: publication.county,
      subCounty: publication.subCounty,
    });
    publicationMap.set(
      `${String(publication.categoryId)}:${buildCompetitionScopeKey(scope)}`,
      publication
    );
  }

  const rows = Array.from(descriptorMap.entries())
    .map(([groupKey, descriptor]) => {
      const category = categoryMap.get(descriptor.categoryId);

      if (!category) {
        return null;
      }

      const categoryProjects = projectGroups.get(groupKey) || [];
      const projectIdValues = categoryProjects.map((project) => String(project._id));
      const scoredProjects = projectIdValues.filter((projectId) =>
        projectHasMinimumJudgeScores(projectId, lockedScoreCountMap)
      ).length;
      const lockedScores = projectIdValues.reduce(
        (sum, projectId) => sum + (lockedScoresByProject[projectId] || 0),
        0
      );
      const ready =
        categoryProjects.length > 0 && scoredProjects === categoryProjects.length;
      const publication = publicationMap.get(groupKey);
      const judgeCount = projectIdValues.reduce(
        (max, projectId) =>
          Math.max(max, assignmentsByProject[projectId]?.size || 0),
        0
      );

      return {
        ...descriptor,
        categoryName: category.name,
        categoryCode: category.code,
        projectCount: categoryProjects.length,
        scoredProjects,
        lockedScores,
        minimumJudgeCount: MIN_JUDGES_PER_PROJECT,
        maximumJudgeCount: MAX_JUDGES_PER_PROJECT,
        ready,
        published: publication?.published ?? false,
        judgeCount,
        projectIds: projectIdValues,
      } satisfies CompetitionGroupSummary;
    })
    .filter((row): row is CompetitionGroupSummary => row !== null)
    .filter((row) => row.projectCount > 0 || row.published)
    .sort((left, right) => {
      const levelDifference =
        levelSortOrder[left.competitionLevel] - levelSortOrder[right.competitionLevel];

      if (levelDifference !== 0) {
        return levelDifference;
      }

      const categoryDifference = left.categoryName.localeCompare(right.categoryName);

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      return left.areaLabel.localeCompare(right.areaLabel);
    });

  return rows;
};
