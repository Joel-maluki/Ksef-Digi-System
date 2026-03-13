import { Request, Response } from 'express';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ProjectModel } from '../models/Project';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { UserModel } from '../models/User';
import {
  findCompetitionScheduleEntry,
  getCompetitionScheduleStatus,
  toCompetitionScheduleEntries,
} from '../services/competitionSchedule.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { calculateCategoryRanking } from '../services/ranking.service';
import { hasSchoolConflict } from '../services/judgingRules.service';
import { getSystemSettings } from '../services/systemSettings.service';

export const listScores = async (req: Request, res: Response) => {
  const query: Record<string, string> = {};

  if (typeof req.query.projectId === 'string') {
    query.projectId = req.query.projectId;
  }

  if (typeof req.query.judgeId === 'string') {
    query.judgeId = req.query.judgeId;
  }

  const scores = await ScoreModel.find(query)
    .populate('projectId', 'projectCode title currentLevel')
    .populate('judgeId', 'fullName email')
    .sort({ submittedAt: -1, createdAt: -1 });

  res.json(ok(scores));
};

export const submitScore = async (req: Request, res: Response) => {
  const { projectId, sectionA, sectionB, sectionC } = req.body;
  if (!req.user || req.user.role !== 'judge') throw new ApiError(403, 'Only judges can submit scores');
  if ([sectionA, sectionB, sectionC].some((v) => typeof v !== 'number')) throw new ApiError(400, 'Sections A, B and C must be numeric');
  if (sectionA > 30 || sectionB > 15 || sectionC > 35) throw new ApiError(400, 'Section scores exceed allowed maximum');

  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  const school = await SchoolModel.findById(project.schoolId).select('subCounty county region').lean();
  if (!school) throw new ApiError(404, 'Project school not found');
  const judge = await UserModel.findById(req.user.userId);
  if (!judge) throw new ApiError(404, 'Judge not found');
  if (!judge.active || !judge.trainedJudge) {
    throw new ApiError(403, 'Only active trained judges can submit scores');
  }
  if (hasSchoolConflict(judge.schoolId, project.schoolId)) {
    await ProjectJudgeAssignmentModel.findOneAndUpdate(
      { projectId, judgeId: req.user.userId },
      { assignmentStatus: 'removed', conflictFlag: true }
    );
    throw new ApiError(400, 'Judge cannot score their own school project');
  }

  const assignment = await ProjectJudgeAssignmentModel.findOne({
    projectId,
    judgeId: req.user.userId,
    assignmentStatus: 'assigned',
    conflictFlag: { $ne: true },
  });
  if (!assignment) throw new ApiError(403, 'Project is not assigned to this judge');

  const settings = await getSystemSettings();
  const competitionEvent = findCompetitionScheduleEntry({
    entries: toCompetitionScheduleEntries(settings.competitionSchedule),
    competitionLevel: project.currentLevel,
    school,
  });

  if (competitionEvent) {
    const eventStatus = getCompetitionScheduleStatus(competitionEvent);

    if (eventStatus === 'upcoming') {
      throw new ApiError(
        403,
        `Judging for ${competitionEvent.scopeName} opens on ${competitionEvent.judgingStartDate.toISOString()}`
      );
    }

    if (eventStatus === 'awaiting_results' || eventStatus === 'completed') {
      throw new ApiError(
        403,
        `Judging for ${competitionEvent.scopeName} closed on ${competitionEvent.judgingEndDate.toISOString()}`
      );
    }
  }

  const existing = await ScoreModel.findOne({ projectId, judgeId: req.user.userId });
  if (existing && existing.locked) throw new ApiError(409, 'Score already submitted and locked');

  const judgeTotal = sectionA + sectionB + sectionC;
  const score = existing
    ? await ScoreModel.findByIdAndUpdate(existing._id, { sectionA, sectionB, sectionC, judgeTotal, locked: true, submittedAt: new Date() }, { new: true, runValidators: true })
    : await ScoreModel.create({ projectId, judgeId: req.user.userId, sectionA, sectionB, sectionC, judgeTotal, locked: true, submittedAt: new Date() });

  await ProjectJudgeAssignmentModel.findOneAndUpdate({ projectId, judgeId: req.user.userId }, { assignmentStatus: 'completed' });
  res.status(201).json(ok(score, 'Score submitted'));
};

export const getScoresByProject = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Only admin can view project score summaries');
  }

  const scores = await ScoreModel.find({ projectId: req.params.projectId }).populate('judgeId', 'fullName email');
  const project = await ProjectModel.findById(req.params.projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  const ranking = await calculateCategoryRanking(String(project.categoryId), project.currentLevel);
  const summary = ranking.find((r) => r.projectId === req.params.projectId);
  res.json(ok({ scores, summary }));
};

export const getScoresByJudge = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin' && req.user?.userId !== req.params.judgeId) {
    throw new ApiError(403, 'You can only view your own scores');
  }

  const scores = await ScoreModel.find({ judgeId: req.params.judgeId }).populate('projectId', 'projectCode title currentLevel');
  res.json(ok(scores));
};

export const unlockScore = async (req: Request, res: Response) => {
  const score = await ScoreModel.findByIdAndUpdate(req.params.id, { locked: false }, { new: true });
  if (!score) throw new ApiError(404, 'Score not found');

  await ProjectJudgeAssignmentModel.findOneAndUpdate(
    { projectId: score.projectId, judgeId: score.judgeId },
    { assignmentStatus: 'assigned' }
  );

  res.json(ok(score, 'Score unlocked'));
};

export const relockScore = async (req: Request, res: Response) => {
  const score = await ScoreModel.findByIdAndUpdate(req.params.id, { locked: true }, { new: true });
  if (!score) throw new ApiError(404, 'Score not found');

  await ProjectJudgeAssignmentModel.findOneAndUpdate(
    { projectId: score.projectId, judgeId: score.judgeId },
    { assignmentStatus: 'completed' }
  );

  res.json(ok(score, 'Score locked'));
};
