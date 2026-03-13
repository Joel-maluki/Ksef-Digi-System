import { Request, Response } from 'express';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { autoAssignJudgesForProject } from '../services/judgeAssignment.service';
import {
  ACTIVE_PROJECT_ASSIGNMENT_STATUSES,
  MAX_JUDGES_PER_PROJECT,
  hasSchoolConflict,
} from '../services/judgingRules.service';

type AssignmentProjectShape = {
  schoolId?: unknown;
};

export const listProjectJudgeAssignments = async (_req: Request, res: Response) => {
  const assignments = await ProjectJudgeAssignmentModel.find()
    .populate('projectId', 'projectCode title currentLevel')
    .populate('judgeId', 'fullName email')
    .populate('categoryId', 'name code')
    .sort({ createdAt: -1 });
  res.json(ok(assignments));
};

export const listMyProjectJudgeAssignments = async (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'judge') {
    throw new ApiError(403, 'Only judges can view their own assignments');
  }

  const judge = await UserModel.findOne({ _id: req.user.userId, role: 'judge' })
    .select('schoolId')
    .lean();

  if (!judge) {
    throw new ApiError(404, 'Judge not found');
  }

  const assignments = await ProjectJudgeAssignmentModel.find({
    judgeId: req.user.userId,
    assignmentStatus: { $in: ['assigned', 'completed'] },
  })
    .populate({
      path: 'projectId',
      select: 'projectCode title currentLevel submissionStatus schoolId',
    })
    .populate('judgeId', 'fullName email')
    .populate('categoryId', 'name code')
    .sort({ createdAt: -1 });

  const conflictingAssignmentIds = assignments
    .filter((assignment) => {
      const project =
        typeof assignment.projectId === 'string'
          ? null
          : (assignment.projectId as AssignmentProjectShape | null);

      return hasSchoolConflict(judge.schoolId, project?.schoolId);
    })
    .map((assignment) => assignment._id);

  if (conflictingAssignmentIds.length > 0) {
    await ProjectJudgeAssignmentModel.updateMany(
      { _id: { $in: conflictingAssignmentIds } },
      { assignmentStatus: 'removed', conflictFlag: true }
    );
  }

  const safeAssignments = assignments
    .filter((assignment) => !conflictingAssignmentIds.some((id) => String(id) === String(assignment._id)))
    .map((assignment) => {
      const payload = assignment.toObject() as {
        projectId?: AssignmentProjectShape | string | null;
      };

      if (payload.projectId && typeof payload.projectId === 'object') {
        delete payload.projectId.schoolId;
      }

      return payload;
    });

  res.json(ok(safeAssignments));
};

export const autoAssign = async (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (!projectId) throw new ApiError(400, 'projectId is required');
  const result = await autoAssignJudgesForProject(projectId);
  res.json(ok(result, 'Auto-assignment completed'));
};

export const manualAssign = async (req: Request, res: Response) => {
  const { projectId, judgeId } = req.body;
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  const judge = await UserModel.findOne({ _id: judgeId, role: 'judge' });
  if (!judge) throw new ApiError(404, 'Judge not found');
  if (!judge.active || !judge.trainedJudge) {
    throw new ApiError(400, 'Only active trained judges can be assigned to projects');
  }
  if (hasSchoolConflict(judge.schoolId, project.schoolId)) {
    throw new ApiError(400, 'Judge cannot assess a project from their own school');
  }
  const existingAssignment = await ProjectJudgeAssignmentModel.findOne({
    projectId,
    judgeId,
    assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
  });
  if (existingAssignment) {
    throw new ApiError(409, 'Judge is already assigned to this project');
  }
  const count = await ProjectJudgeAssignmentModel.countDocuments({
    projectId,
    assignmentStatus: { $in: ACTIVE_PROJECT_ASSIGNMENT_STATUSES },
  });
  if (count >= MAX_JUDGES_PER_PROJECT) {
    throw new ApiError(400, `Project already has ${MAX_JUDGES_PER_PROJECT} judges`);
  }
  const assignment = await ProjectJudgeAssignmentModel.findOneAndUpdate(
    { projectId, judgeId },
    {
      projectId,
      judgeId,
      categoryId: project.categoryId,
      assignedBy: 'admin',
      assignmentStatus: 'assigned',
      conflictFlag: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(ok(assignment, 'Judge assigned'));
};

export const removeProjectJudgeAssignment = async (req: Request, res: Response) => {
  const assignment = await ProjectJudgeAssignmentModel.findByIdAndDelete(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json(ok(null, 'Assignment removed'));
};
