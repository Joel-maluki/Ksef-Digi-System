import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { ScoreModel } from '../models/Score';
import { calculateCategoryRanking } from '../services/ranking.service';
import { ok } from '../utils/apiResponse';
import {
  MAX_JUDGES_PER_PROJECT,
  MIN_JUDGES_PER_PROJECT,
  buildProjectScoreCountMap,
  projectHasMinimumJudgeScores,
} from '../services/judgingRules.service';

export const listRankings = async (req: Request, res: Response) => {
  const { categoryId, competitionLevel } = req.query as {
    categoryId?: string;
    competitionLevel?: string;
  };

  const [categories, projects, scores, publications] = await Promise.all([
    CategoryModel.find(categoryId ? { _id: categoryId } : { active: true })
      .sort({ name: 1 })
      .lean(),
    ProjectModel.find(competitionLevel ? { currentLevel: competitionLevel } : {})
      .select('categoryId currentLevel')
      .lean(),
    ScoreModel.find({ locked: true }).select('projectId locked').lean(),
    ResultPublicationModel.find().lean(),
  ]);

  const levels = competitionLevel
    ? [competitionLevel]
    : Array.from(
        new Set([
          ...projects.map((project) => project.currentLevel),
          ...publications.map((publication) => publication.competitionLevel),
        ])
      );

  const lockedScoreCountMap = buildProjectScoreCountMap(scores);
  const publicationMap = new Map(
    publications.map((publication) => [
      `${String(publication.categoryId)}:${publication.competitionLevel}`,
      publication,
    ])
  );

  const rows = await Promise.all(
    categories.flatMap((category) =>
      levels.map(async (level) => {
        const categoryProjects = projects.filter(
          (project) =>
            String(project.categoryId) === String(category._id) &&
            project.currentLevel === level
        );
        const projectIds = categoryProjects.map((project) => String(project._id));
        const scoredProjects = projectIds.filter((projectId) =>
          projectHasMinimumJudgeScores(projectId, lockedScoreCountMap)
        ).length;
        const ready =
          categoryProjects.length > 0 && scoredProjects === categoryProjects.length;
        const publication = publicationMap.get(`${String(category._id)}:${level}`);

        return {
          categoryId: String(category._id),
          categoryName: category.name,
          categoryCode: category.code,
          competitionLevel: level,
          projectCount: categoryProjects.length,
          scoredProjects,
          minimumJudgeCount: MIN_JUDGES_PER_PROJECT,
          maximumJudgeCount: MAX_JUDGES_PER_PROJECT,
          ready,
          published: publication?.published ?? false,
          rankings:
            categoryProjects.length > 0
              ? await calculateCategoryRanking(String(category._id), level)
              : [],
        };
      })
    )
  );

  res.json(ok(rows.filter((row) => row.projectCount > 0 || row.published)));
};
