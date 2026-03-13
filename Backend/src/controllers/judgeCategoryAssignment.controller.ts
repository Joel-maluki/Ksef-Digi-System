import { Request, Response } from 'express';
import { JudgeCategoryAssignmentModel } from '../models/JudgeCategoryAssignment';
import { assignEligibleProjectsToJudge } from '../services/judgeAssignment.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const listJudgeCategoryAssignments = async (_req: Request, res: Response) => {
  const assignments = await JudgeCategoryAssignmentModel.find().populate('judgeId', 'fullName email').populate('categoryId', 'name code');
  res.json(ok(assignments));
};

export const createJudgeCategoryAssignment = async (req: Request, res: Response) => {
  const {
    judgeId,
    categoryId,
    categoryIds,
    active = true,
    replaceExisting = false,
  } = req.body;
  const targets = Array.isArray(categoryIds)
    ? categoryIds
    : categoryId
      ? [categoryId]
      : [];

  if (!judgeId) {
    throw new ApiError(400, 'judgeId is required');
  }

  if (targets.length === 0 && !replaceExisting) {
    throw new ApiError(400, 'judgeId and at least one category are required');
  }

  if (replaceExisting) {
    await JudgeCategoryAssignmentModel.deleteMany({
      judgeId,
      ...(targets.length > 0 ? { categoryId: { $nin: targets } } : {}),
    });
  }

  if (targets.length === 0) {
    return res.status(201).json(ok([], 'Judge category assignments updated'));
  }

  const assignments = await Promise.all(
    targets.map((targetCategoryId: string) =>
      JudgeCategoryAssignmentModel.findOneAndUpdate(
        { judgeId, categoryId: targetCategoryId },
        { judgeId, categoryId: targetCategoryId, active },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const projectAssignments = await assignEligibleProjectsToJudge(judgeId, targets);

  res.status(201).json(
    ok(
      {
        assignments,
        projectAssignments,
      },
      assignments.length === 1
        ? 'Judge category assignment created'
        : replaceExisting
          ? 'Judge category assignments updated'
          : 'Judge category assignments created'
    )
  );
};

export const deleteJudgeCategoryAssignment = async (req: Request, res: Response) => {
  const assignment = await JudgeCategoryAssignmentModel.findByIdAndDelete(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json(ok(null, 'Judge category assignment deleted'));
};
