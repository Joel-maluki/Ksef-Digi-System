import { Request, Response } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { CategoryModel } from '../models/Category';
import { DonationModel } from '../models/Donation';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { SchoolModel } from '../models/School';
import {
  buildCompetitionScopeFromPublication,
  buildCompetitionScopeKey,
  buildPublicationScopeFilter,
  formatCompetitionScopeLabel,
  isCompetitionAreaLevel,
  type CompetitionAreaLevel,
} from '../services/adminScope.service';
import { calculateCategoryRanking } from '../services/ranking.service';
import { ok } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';

const levelSortOrder = {
  sub_county: 0,
  county: 1,
  regional: 2,
  national: 3,
} as const;

const sortPublicRankingGroups = <
  T extends {
    competitionLevel: string;
    categoryName: string;
    areaLabel?: string;
  },
>(
  groups: T[]
) =>
  groups.sort((left, right) => {
    const levelDifference =
      (levelSortOrder[left.competitionLevel as keyof typeof levelSortOrder] ?? 999) -
      (levelSortOrder[right.competitionLevel as keyof typeof levelSortOrder] ?? 999);

    if (levelDifference !== 0) {
      return levelDifference;
    }

    const categoryDifference = left.categoryName.localeCompare(right.categoryName);

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    return (left.areaLabel || '').localeCompare(right.areaLabel || '');
  });

const buildPublicRankingGroupDescriptor = ({
  categoryId,
  categoryName,
  competitionLevel,
  region,
  county,
  subCounty,
}: {
  categoryId: string;
  categoryName: string;
  competitionLevel: string;
  region?: string;
  county?: string;
  subCounty?: string;
}) => {
  const scope = buildCompetitionScopeFromPublication({
    competitionLevel,
    region,
    county,
    subCounty,
  });

  return {
    categoryId,
    categoryName,
    competitionLevel: scope.competitionLevel,
    region: scope.region,
    county: scope.county,
    subCounty: scope.subCounty,
    scopeKey: buildCompetitionScopeKey(scope),
    areaLabel: formatCompetitionScopeLabel(scope),
  };
};

const listPublishedRankingGroupDescriptors = async ({
  categoryId,
  competitionLevel,
  region,
  county,
  subCounty,
}: {
  categoryId?: string;
  competitionLevel?: string;
  region?: string;
  county?: string;
  subCounty?: string;
}) => {
  const publicationFilter: Record<string, unknown> = { published: true };

  if (categoryId) {
    publicationFilter.categoryId = categoryId;
  }

  if (competitionLevel) {
    publicationFilter.competitionLevel = competitionLevel;
    Object.assign(
      publicationFilter,
      buildPublicationScopeFilter({
        competitionLevel: competitionLevel as CompetitionAreaLevel,
        region,
        county,
        subCounty,
      })
    );
  }

  const [publications, categories] = await Promise.all([
    ResultPublicationModel.find(publicationFilter).lean(),
    CategoryModel.find(categoryId ? { _id: categoryId } : {}).lean(),
  ]);

  const categoryMap = new Map(
    categories.map((category) => [String(category._id), category.name])
  );

  return sortPublicRankingGroups(
    publications
      .map((publication) =>
        buildPublicRankingGroupDescriptor({
          categoryId: String(publication.categoryId),
          categoryName: categoryMap.get(String(publication.categoryId)) || '',
          competitionLevel: publication.competitionLevel,
          region: publication.region,
          county: publication.county,
          subCounty: publication.subCounty,
        })
      )
      .filter((group) => Boolean(group.categoryName))
  );
};

export const publicRankings = async (req: Request, res: Response) => {
  const { categoryId, region, county, subCounty } = req.query as {
    categoryId?: string;
    competitionLevel?: string;
    region?: string;
    county?: string;
    subCounty?: string;
  };
  const competitionLevel =
    typeof req.query.competitionLevel === 'string'
      ? req.query.competitionLevel
      : undefined;

  if (competitionLevel && !isCompetitionAreaLevel(competitionLevel)) {
    throw new ApiError(400, 'Invalid competition level');
  }

  const publishedGroups = await listPublishedRankingGroupDescriptors({
    categoryId,
    competitionLevel,
    region,
    county,
    subCounty,
  });

  if (categoryId && publishedGroups.length === 0) {
    return res.json(ok([]));
  }

  const data = await Promise.all(
    publishedGroups.map(async (group) => ({
      ...group,
      rankings: await calculateCategoryRanking(group.categoryId, {
        competitionLevel: group.competitionLevel,
        region: group.region,
        county: group.county,
        subCounty: group.subCounty,
      })
    }))
  );

  const sortedData = sortPublicRankingGroups(data);

  if (categoryId) {
    return res.json(ok(sortedData.length === 1 ? sortedData[0] : sortedData));
  }

  res.json(ok(sortedData));
};

export const publicRankingGroups = async (req: Request, res: Response) => {
  const { categoryId, region, county, subCounty } = req.query as {
    categoryId?: string;
    competitionLevel?: string;
    region?: string;
    county?: string;
    subCounty?: string;
  };
  const competitionLevel =
    typeof req.query.competitionLevel === 'string'
      ? req.query.competitionLevel
      : undefined;

  if (competitionLevel && !isCompetitionAreaLevel(competitionLevel)) {
    throw new ApiError(400, 'Invalid competition level');
  }

  const groups = await listPublishedRankingGroupDescriptors({
    categoryId,
    competitionLevel,
    region,
    county,
    subCounty,
  });

  res.json(ok(groups));
};

export const publicScores = publicRankings;

export const publicAnnouncements = async (_req: Request, res: Response) => {
  const announcements = await AnnouncementModel.find({ published: true }).sort({ createdAt: -1 });
  res.json(ok(announcements));
};

export const publicResults = publicRankings;

export const publicCategoryResults = async (req: Request, res: Response) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) {
    return res.json(ok([]));
  }

  const publications = await ResultPublicationModel.find({
    categoryId: category._id,
    published: true,
  }).lean();
  const results = await Promise.all(
    publications.map((publication) =>
      (async () => {
        const group = buildPublicRankingGroupDescriptor({
          categoryId: String(category._id),
          categoryName: category.name,
          competitionLevel: publication.competitionLevel,
          region: publication.region,
          county: publication.county,
          subCounty: publication.subCounty,
        });

        return {
          ...group,
          rankings: await calculateCategoryRanking(String(category._id), {
            competitionLevel: group.competitionLevel,
            region: group.region,
            county: group.county,
            subCounty: group.subCounty,
          }),
        };
      })()
    )
  );

  res.json(ok({ category, results: sortPublicRankingGroups(results) }));
};

export const publicSummary = async (_req: Request, res: Response) => {
  const [schools, projects, categories, donations] = await Promise.all([
    SchoolModel.countDocuments({ active: true }),
    ProjectModel.countDocuments(),
    CategoryModel.countDocuments({ active: true }),
    DonationModel.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json(
    ok({
      schools,
      projects,
      categories,
      donationsTotal: donations[0]?.total || 0,
    })
  );
};
