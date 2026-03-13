import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ResultPublicationModel } from '../models/ResultPublication';
import { ScoreModel } from '../models/Score';
import { getSystemSettings } from '../services/systemSettings.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { calculateCategoryRanking } from '../services/ranking.service';
import {
  MAX_JUDGES_PER_PROJECT,
  MIN_JUDGES_PER_PROJECT,
  buildProjectScoreCountMap,
  projectHasMinimumJudgeScores,
} from '../services/judgingRules.service';

export const publishCategoryResults = async (req: Request, res: Response) => {
  const { categoryId, competitionLevel, force = false } = req.body;
  const settings = await getSystemSettings();
  const projects = await ProjectModel.find({ categoryId, currentLevel: competitionLevel });
  const scores = await ScoreModel.find({
    projectId: { $in: projects.map((p) => p._id) },
    locked: true,
  }).lean();

  if (projects.length === 0) {
    throw new ApiError(400, 'No projects were found for this category and level');
  }

  if (force && !settings.allowAdminRankingOverride) {
    throw new ApiError(400, 'Ranking override is disabled in settings');
  }

  const lockedScoreCountMap = buildProjectScoreCountMap(scores);
  const allScored = projects.every((project) =>
    projectHasMinimumJudgeScores(String(project._id), lockedScoreCountMap)
  );
  if (!allScored && !force) {
    throw new ApiError(
      400,
      `Every project in this category must have at least ${MIN_JUDGES_PER_PROJECT} locked judge scores before publication`
    );
  }

  const publication = await ResultPublicationModel.findOneAndUpdate(
    { categoryId, competitionLevel },
    { published: true, forced: !!force, publishedAt: new Date(), publishedBy: req.user?.userId },
    { upsert: true, new: true }
  );

  const rankings = await calculateCategoryRanking(categoryId, competitionLevel);
  const top4ProjectIds = rankings.filter((item) => item.rank <= 4).map((item) => item.projectId);
  await ProjectModel.updateMany({ _id: { $in: top4ProjectIds } }, { qualifiedForNextLevel: true, submissionStatus: 'qualified', published: true });
  await ProjectModel.updateMany({ categoryId, currentLevel: competitionLevel, _id: { $nin: top4ProjectIds } }, { published: true, qualifiedForNextLevel: false, submissionStatus: 'published' });

  res.json(ok(publication, 'Results published'));
};

export const hideCategoryResults = async (req: Request, res: Response) => {
  const { categoryId, competitionLevel } = req.body;
  const publication = await ResultPublicationModel.findOneAndUpdate(
    { categoryId, competitionLevel },
    { published: false },
    { new: true }
  );
  await ProjectModel.updateMany({ categoryId, currentLevel: competitionLevel }, { published: false });
  res.json(ok(publication, 'Results hidden'));
};

export const publicationOverview = async (_req: Request, res: Response) => {
  const [categories, projects, scores, publications, assignments] = await Promise.all([
    CategoryModel.find().sort({ name: 1 }).lean(),
    ProjectModel.find().select('categoryId currentLevel').lean(),
    ScoreModel.find().select('projectId locked').lean(),
    ResultPublicationModel.find().lean(),
    ProjectJudgeAssignmentModel.find({ assignmentStatus: { $in: ['assigned', 'completed'] } })
      .select('projectId categoryId judgeId')
      .lean(),
  ]);

  const lockedScoreCountMap = buildProjectScoreCountMap(scores);
  const lockedScoresByProject = scores.reduce<Record<string, number>>((acc, score) => {
    if (score.locked) {
      const key = String(score.projectId);
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
  const assignmentsByProject = assignments.reduce<Record<string, Set<string>>>((acc, assignment) => {
    const key = String(assignment.projectId);
    if (!acc[key]) acc[key] = new Set();
    acc[key].add(String(assignment.judgeId));
    return acc;
  }, {});
  const publicationMap = new Map(
    publications.map((publication) => [
      `${String(publication.categoryId)}:${publication.competitionLevel}`,
      publication,
    ])
  );

  const levels = ['sub_county', 'county', 'regional', 'national'];
  const rows = categories.flatMap((category) =>
    levels.map((competitionLevel) => {
      const categoryProjects = projects.filter(
        (project) =>
          String(project.categoryId) === String(category._id) &&
          project.currentLevel === competitionLevel
      );

      const projectIds = categoryProjects.map((project) => String(project._id));
      const key = `${String(category._id)}:${competitionLevel}`;
      const publication = publicationMap.get(key);
      const judgeIds = new Set(
        assignments
          .filter(
            (assignment) =>
              String(assignment.categoryId) === String(category._id) &&
              projectIds.includes(String(assignment.projectId))
          )
          .map((assignment) => String(assignment.judgeId))
      );

      const scoredProjects = projectIds.filter((projectId) =>
        projectHasMinimumJudgeScores(projectId, lockedScoreCountMap)
      ).length;
      const lockedScores = projectIds.reduce(
        (sum, projectId) => sum + (lockedScoresByProject[projectId] || 0),
        0
      );
      const ready = categoryProjects.length > 0 && scoredProjects === categoryProjects.length;
      const judgeCount = projectIds.reduce(
        (max, projectId) => Math.max(max, assignmentsByProject[projectId]?.size || 0),
        0
      );

      return {
        categoryId: String(category._id),
        categoryName: category.name,
        categoryCode: category.code,
        competitionLevel,
        projectCount: categoryProjects.length,
        scoredProjects,
        lockedScores,
        minimumJudgeCount: MIN_JUDGES_PER_PROJECT,
        maximumJudgeCount: MAX_JUDGES_PER_PROJECT,
        ready,
        published: publication?.published ?? false,
        judgeCount: judgeCount || judgeIds.size,
      };
    })
  );

  res.json(ok(rows.filter((row) => row.projectCount > 0 || row.published)));
};
