import { Request, Response } from 'express';
import {
  isCompetitionAreaLevel,
  type CompetitionAreaLevel,
} from '../services/adminScope.service';
import { listCompetitionGroupSummaries } from '../services/competitionGrouping.service';
import { calculateCategoryRanking } from '../services/ranking.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

export const listRankings = async (req: Request, res: Response) => {
  const { categoryId } = req.query as {
    categoryId?: string;
    competitionLevel?: string;
  };
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
      'Area-scoped admins can only view rankings for their assigned competition level'
    );
  }

  const rows = await listCompetitionGroupSummaries({
    adminScope: req.adminScope,
    categoryId,
    competitionLevel:
      (req.adminScope && !req.adminScope.isGlobal
        ? (req.adminScope.competitionLevel as CompetitionAreaLevel)
        : (requestedLevel as CompetitionAreaLevel | undefined)) || undefined,
  });

  const data = await Promise.all(
    rows.map(async (row) => {
      const { projectIds: _projectIds, ...group } = row;

      return {
        ...group,
        rankings:
          row.projectCount > 0
            ? await calculateCategoryRanking(row.categoryId, {
                competitionLevel: row.competitionLevel,
                region: row.region,
                county: row.county,
                subCounty: row.subCounty,
              })
            : [],
      };
    })
  );

  res.json(ok(data));
};
