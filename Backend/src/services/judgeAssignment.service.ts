import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { JudgeCategoryAssignmentModel } from '../models/JudgeCategoryAssignment';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  ACTIVE_PROJECT_ASSIGNMENT_STATUSES,
  MAX_JUDGES_PER_PROJECT,
  getJudgeCoverageStatus,
} from './judgingRules.service';

export const autoAssignJudgesForProject = async (projectId: string) => {
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  const existing = await ProjectJudgeAssignmentModel.countDocuments({
    projectId,
    assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
  });
  if (existing >= MAX_JUDGES_PER_PROJECT) {
    return { projectId, assignedCount: existing, message: 'Project already has enough judges' };
  }

  const categoryAssignments = await JudgeCategoryAssignmentModel.find({
    categoryId: project.categoryId,
    active: true,
  }).lean();
  const judgeIds = categoryAssignments.map((assignment: any) => assignment.judgeId);
  const judges = await UserModel.find({
    _id: { $in: judgeIds },
    role: 'judge',
    active: true,
    trainedJudge: true,
    schoolId: { $ne: project.schoolId },
  }).lean();

  const workloadCounts = await Promise.all(
    judges.map(async (judge: any) => ({
      judgeId: String(judge._id),
      count: await ProjectJudgeAssignmentModel.countDocuments({
        judgeId: judge._id,
        assignmentStatus: 'assigned',
      }),
    }))
  );

  const alreadyAssigned = await ProjectJudgeAssignmentModel.find({
    projectId,
    assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
  }).lean();
  const alreadyAssignedJudgeIds = new Set(alreadyAssigned.map((assignment: any) => String(assignment.judgeId)));

  const sortedJudges = judges
    .filter((judge: any) => !alreadyAssignedJudgeIds.has(String(judge._id)))
    .sort((a: any, b: any) => {
      const aCount = workloadCounts.find((w: any) => w.judgeId === String(a._id))?.count || 0;
      const bCount = workloadCounts.find((w: any) => w.judgeId === String(b._id))?.count || 0;
      return aCount - bCount;
    });

  const toAssign = sortedJudges.slice(0, Math.max(0, MAX_JUDGES_PER_PROJECT - existing));

  await Promise.all(
    toAssign.map((judge) =>
      ProjectJudgeAssignmentModel.findOneAndUpdate(
        { projectId: project._id, judgeId: judge._id },
        {
          projectId: project._id,
          judgeId: judge._id,
          categoryId: project.categoryId,
          assignedBy: 'system',
          assignmentStatus: 'assigned',
          conflictFlag: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const assignedCount = existing + toAssign.length;
  const status = getJudgeCoverageStatus(assignedCount);
  return { projectId, assignedCount, status };
};

export const assignEligibleProjectsToJudge = async (
  judgeId: string,
  categoryIds?: string[]
) => {
  const judge = await UserModel.findOne({ _id: judgeId, role: 'judge' }).lean();
  if (!judge) {
    throw new ApiError(404, 'Judge not found');
  }

  if (!judge.active || !judge.trainedJudge) {
    return {
      judgeId,
      categoryCount: 0,
      projectCount: 0,
      assignedCount: 0,
      message: 'Judge is inactive or not yet trained',
    };
  }

  const requestedCategoryIds =
    Array.isArray(categoryIds) && categoryIds.length > 0
      ? categoryIds
      : (
          await JudgeCategoryAssignmentModel.find({
            judgeId,
            active: true,
          })
            .select('categoryId')
            .lean()
        ).map((assignment: any) => String(assignment.categoryId));

  const uniqueCategoryIds = Array.from(
    new Set(
      requestedCategoryIds
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  if (uniqueCategoryIds.length === 0) {
    return {
      judgeId,
      categoryCount: 0,
      projectCount: 0,
      assignedCount: 0,
      message: 'No categories assigned',
    };
  }

  const projects = await ProjectModel.find({
    categoryId: { $in: uniqueCategoryIds },
    schoolId: { $ne: judge.schoolId },
    submissionStatus: { $in: ['submitted', 'qualified'] },
  })
    .select('_id categoryId')
    .lean();

  let assignedCount = 0;

  for (const project of projects) {
    const [activeAssignmentCount, existingAssignment] = await Promise.all([
      ProjectJudgeAssignmentModel.countDocuments({
        projectId: project._id,
        assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
      }),
      ProjectJudgeAssignmentModel.findOne({
        projectId: project._id,
        judgeId,
        assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
      }).lean(),
    ]);

    if (activeAssignmentCount >= MAX_JUDGES_PER_PROJECT || existingAssignment) {
      continue;
    }

    await ProjectJudgeAssignmentModel.findOneAndUpdate(
      { projectId: project._id, judgeId },
      {
        projectId: project._id,
        judgeId,
        categoryId: project.categoryId,
        assignedBy: 'system',
        assignmentStatus: 'assigned',
        conflictFlag: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    assignedCount += 1;
  }

  return {
    judgeId,
    categoryCount: uniqueCategoryIds.length,
    projectCount: projects.length,
    assignedCount,
    message:
      assignedCount > 0
        ? 'Eligible projects assigned to judge'
        : 'No eligible projects needed assignment',
  };
};
