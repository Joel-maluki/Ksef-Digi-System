import { Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { ScoreModel } from '../models/Score';
import {
  buildPublicationScopeFilter,
  buildScopedProjectFilter,
  isCompetitionAreaLevel,
  resolveCompetitionScopeInput,
  type CompetitionAreaLevel,
  type CompetitionAreaScope,
} from '../services/adminScope.service';
import { listCompetitionGroupSummaries } from '../services/competitionGrouping.service';
import {
  MIN_JUDGES_PER_PROJECT,
  buildProjectScoreCountMap,
  projectHasMinimumJudgeScores,
} from '../services/judgingRules.service';
import { calculateCategoryRanking } from '../services/ranking.service';
import { getSystemSettings } from '../services/systemSettings.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

const resolveRequestedScope = (
  req: Request,
  payload: {
    competitionLevel?: unknown;
    region?: unknown;
    county?: unknown;
    subCounty?: unknown;
  }
): CompetitionAreaScope => {
  if (req.adminScope && !req.adminScope.isGlobal) {
    if (
      payload.competitionLevel &&
      String(payload.competitionLevel) !== req.adminScope.competitionLevel
    ) {
      throw new ApiError(
        403,
        'Area-scoped admins can only publish results for their assigned competition level'
      );
    }

    return {
      competitionLevel: req.adminScope.competitionLevel as CompetitionAreaLevel,
      region: req.adminScope.region,
      county: req.adminScope.county,
      subCounty: req.adminScope.subCounty,
    };
  }

  return resolveCompetitionScopeInput(payload);
};

const buildPublicationScopeMutation = (scope: CompetitionAreaScope) => {
  const setScopeFields = buildPublicationScopeFilter(scope);
  const unsetFields: Record<string, ''> = {};

  if (scope.competitionLevel === 'national') {
    unsetFields.region = '';
    unsetFields.county = '';
    unsetFields.subCounty = '';
  } else if (scope.competitionLevel === 'regional') {
    unsetFields.county = '';
    unsetFields.subCounty = '';
  } else if (scope.competitionLevel === 'county') {
    unsetFields.subCounty = '';
  }

  return {
    setScopeFields,
    unsetFields,
  };
};

export const publishCategoryResults = async (req: Request, res: Response) => {
  const { categoryId, force = false } = req.body;
  const scope = resolveRequestedScope(req, req.body);
  const settings = await getSystemSettings();
  const scopedProjectFilter = await buildScopedProjectFilter(scope, { categoryId });
  const projects = await ProjectModel.find(scopedProjectFilter).lean();
  const scores = await ScoreModel.find({
      projectId: { $in: projects.map((project) => project._id) },
      locked: true,
    }).lean();

  if (projects.length === 0) {
    throw new ApiError(400, 'No projects were found for this category and scope');
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

  const { setScopeFields, unsetFields } = buildPublicationScopeMutation(scope);
  const publication = await ResultPublicationModel.findOneAndUpdate(
    {
      categoryId,
      competitionLevel: scope.competitionLevel,
      ...setScopeFields,
    },
    {
      $set: {
        ...setScopeFields,
        published: true,
        forced: !!force,
        publishedAt: new Date(),
        publishedBy: req.user?.userId,
      },
      ...(Object.keys(unsetFields).length > 0 ? { $unset: unsetFields } : {}),
    },
    { upsert: true, new: true }
  );

  const rankings = await calculateCategoryRanking(categoryId, scope);
  const top4ProjectIds = rankings
    .filter((item) => item.rank <= 4)
    .map((item) => item.projectId);

  await ProjectModel.updateMany(
    {
      ...scopedProjectFilter,
      _id: { $in: top4ProjectIds },
    },
    {
      qualifiedForNextLevel: true,
      submissionStatus: 'qualified',
      published: true,
    }
  );
  await ProjectModel.updateMany(
    {
      ...scopedProjectFilter,
      _id: { $nin: top4ProjectIds },
    },
    {
      published: true,
      qualifiedForNextLevel: false,
      submissionStatus: 'published',
    }
  );

  res.json(ok(publication, 'Results published'));
};

export const hideCategoryResults = async (req: Request, res: Response) => {
  const { categoryId } = req.body;
  const scope = resolveRequestedScope(req, req.body);
  const publicationScopeFilter = buildPublicationScopeFilter(scope);
  const publication = await ResultPublicationModel.findOneAndUpdate(
    {
      categoryId,
      competitionLevel: scope.competitionLevel,
      ...publicationScopeFilter,
    },
    { published: false },
    { new: true }
  );

  const scopedProjectFilter = await buildScopedProjectFilter(scope, { categoryId });
  await ProjectModel.updateMany(scopedProjectFilter, { published: false });
  res.json(ok(publication, 'Results hidden'));
};

export const publicationOverview = async (req: Request, res: Response) => {
  const requestedLevel =
    typeof req.query.competitionLevel === 'string'
      ? req.query.competitionLevel
      : undefined;

  if (requestedLevel && !isCompetitionAreaLevel(requestedLevel)) {
    throw new ApiError(400, 'Invalid competition level');
  }

  if (
    req.adminScope &&
    !req.adminScope.isGlobal &&
    requestedLevel &&
    requestedLevel !== req.adminScope.competitionLevel
  ) {
    throw new ApiError(
      403,
      'Area-scoped admins can only view publication readiness for their assigned level'
    );
  }

  const rows = await listCompetitionGroupSummaries({
    adminScope: req.adminScope,
    competitionLevel: requestedLevel as CompetitionAreaLevel | undefined,
  });

  res.json(
    ok(
      rows.map(({ projectIds: _projectIds, ...row }) => row)
    )
  );
};
