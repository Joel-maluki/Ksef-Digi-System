import { Request, Response } from 'express';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import { getSystemSettings } from '../services/systemSettings.service';
import {
  isCompetitionLevel,
  normalizeCompetitionSchedule,
} from '../services/competitionSchedule.service';

const parseOptionalDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, 'Invalid date supplied');
  }

  return parsed;
};

export const getSettings = async (_req: Request, res: Response) => {
  const settings = await getSystemSettings();
  res.json(ok(settings));
};

export const updateSettings = async (req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const {
    activeCompetitionLevel,
    projectSubmissionDeadline,
    scoreSubmissionDeadline,
    allowAdminRankingOverride,
    competitionSchedule,
  } = req.body || {};
  const normalizedActiveCompetitionLevel =
    activeCompetitionLevel !== undefined ? String(activeCompetitionLevel) : undefined;

  if (
    normalizedActiveCompetitionLevel !== undefined &&
    !isCompetitionLevel(normalizedActiveCompetitionLevel)
  ) {
    throw new ApiError(400, 'Invalid competition level');
  }

  if (normalizedActiveCompetitionLevel !== undefined) {
    settings.set('activeCompetitionLevel', normalizedActiveCompetitionLevel);
  }

  if (projectSubmissionDeadline !== undefined) {
    settings.projectSubmissionDeadline = parseOptionalDate(projectSubmissionDeadline);
  }

  if (scoreSubmissionDeadline !== undefined) {
    settings.scoreSubmissionDeadline = parseOptionalDate(scoreSubmissionDeadline);
  }

  if (allowAdminRankingOverride !== undefined) {
    settings.allowAdminRankingOverride = Boolean(allowAdminRankingOverride);
  }

  if (competitionSchedule !== undefined) {
    settings.set('competitionSchedule', normalizeCompetitionSchedule(competitionSchedule));
  }

  await settings.save();
  res.json(ok(settings, 'Settings updated'));
};
