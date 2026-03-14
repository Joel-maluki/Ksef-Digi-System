import { Types } from 'mongoose';
import { AdminAssignmentModel } from '../models/AdminAssignment';
import { ProjectModel } from '../models/Project';
import { SchoolModel } from '../models/School';
import {
  findKenyaCountyByName,
  getKenyaAdministrativeUnits,
  validateKenyaSchoolLocation,
} from './kenyaAdministrativeUnits.service';
import { ApiError } from '../utils/ApiError';

export type AdminCompetitionLevel =
  | 'sub_county'
  | 'county'
  | 'regional'
  | 'national'
  | 'global';

export type CompetitionAreaLevel = Exclude<AdminCompetitionLevel, 'global'>;

export type AdminScopeContext = {
  competitionLevel: AdminCompetitionLevel;
  region?: string;
  county?: string;
  subCounty?: string;
  active: boolean;
  isGlobal: boolean;
};

export type CompetitionAreaScope = {
  competitionLevel: CompetitionAreaLevel;
  region?: string;
  county?: string;
  subCounty?: string;
};

type ScopeLike = {
  competitionLevel?: AdminCompetitionLevel;
  region?: string;
  county?: string;
  subCounty?: string;
  isGlobal?: boolean;
};

const GLOBAL_ADMIN_SCOPE: AdminScopeContext = {
  competitionLevel: 'global',
  active: true,
  isGlobal: true,
};

const normalizeText = (value: unknown) => String(value || '').trim();

const normalizeCompetitionLevel = (value: unknown): AdminCompetitionLevel => {
  const normalized = String(value || 'global').trim().toLowerCase();

  if (
    normalized !== 'sub_county' &&
    normalized !== 'county' &&
    normalized !== 'regional' &&
    normalized !== 'national' &&
    normalized !== 'global'
  ) {
    throw new ApiError(400, 'Invalid admin competition level');
  }

  return normalized;
};

export const isCompetitionAreaLevel = (
  value: unknown
): value is CompetitionAreaLevel => {
  const normalized = String(value || '').trim().toLowerCase();

  return (
    normalized === 'sub_county' ||
    normalized === 'county' ||
    normalized === 'regional' ||
    normalized === 'national'
  );
};

const normalizeCompetitionAreaLevel = (
  value: unknown
): CompetitionAreaLevel => {
  const normalized = normalizeCompetitionLevel(value);

  if (normalized === 'global') {
    throw new ApiError(400, 'Global is not a valid competition scope');
  }

  return normalized;
};

const findRegionByName = (value: unknown) => {
  const normalized = normalizeText(value).toLowerCase();

  return getKenyaAdministrativeUnits().regions.find(
    (region) => region.name.trim().toLowerCase() === normalized
  );
};

export const resolveCompetitionScopeInput = (payload: {
  competitionLevel?: unknown;
  region?: unknown;
  county?: unknown;
  subCounty?: unknown;
}): CompetitionAreaScope => {
  const competitionLevel = normalizeCompetitionAreaLevel(payload.competitionLevel);

  if (competitionLevel === 'national') {
    return {
      competitionLevel,
    };
  }

  if (competitionLevel === 'regional') {
    const region = findRegionByName(payload.region);

    if (!region) {
      throw new ApiError(400, 'Region must be one of the configured Kenya regions');
    }

    return {
      competitionLevel,
      region: region.name,
    };
  }

  if (competitionLevel === 'county') {
    const county = findKenyaCountyByName(payload.county);

    if (!county) {
      throw new ApiError(400, 'County must be one of Kenya\'s 47 counties');
    }

    return {
      competitionLevel,
      region: county.region,
      county: county.name,
    };
  }

  const location = validateKenyaSchoolLocation({
    county: payload.county,
    subCounty: payload.subCounty,
  });

  return {
    competitionLevel,
    region: location.region,
    county: location.county,
    subCounty: location.subCounty,
  };
};

export const resolveAdminAssignmentInput = (payload: {
  competitionLevel?: unknown;
  region?: unknown;
  county?: unknown;
  subCounty?: unknown;
}): Omit<AdminScopeContext, 'isGlobal'> => {
  const competitionLevel = normalizeCompetitionLevel(payload.competitionLevel);

  if (competitionLevel === 'global') {
    return {
      competitionLevel,
      active: true,
    };
  }

  const scope = resolveCompetitionScopeInput(payload);

  return {
    ...scope,
    active: true,
  };
};

export const getAdminScopeContext = async (
  userId: string
): Promise<AdminScopeContext> => {
  const assignment = await AdminAssignmentModel.findOne({ userId, active: true }).lean<{
    competitionLevel: AdminCompetitionLevel;
    region?: string;
    county?: string;
    subCounty?: string;
    active?: boolean;
  } | null>();

  if (!assignment) {
    return GLOBAL_ADMIN_SCOPE;
  }

  return {
    competitionLevel: assignment.competitionLevel,
    region: assignment.region || undefined,
    county: assignment.county || undefined,
    subCounty: assignment.subCounty || undefined,
    active: assignment.active ?? true,
    isGlobal: assignment.competitionLevel === 'global',
  };
};

export const upsertAdminAssignment = async (
  userId: string,
  payload: {
    competitionLevel?: unknown;
    region?: unknown;
    county?: unknown;
    subCounty?: unknown;
  }
) => {
  const assignment = resolveAdminAssignmentInput(payload);

  return AdminAssignmentModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      $set: {
        userId: new Types.ObjectId(userId),
        ...assignment,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

export const buildCompetitionScopeFromSchoolLocation = (
  location: {
    region?: unknown;
    county?: unknown;
    subCounty?: unknown;
  },
  competitionLevel: CompetitionAreaLevel
): CompetitionAreaScope => {
  const region = normalizeText(location.region) || undefined;
  const county = normalizeText(location.county) || undefined;
  const subCounty = normalizeText(location.subCounty) || undefined;

  if (competitionLevel === 'national') {
    return { competitionLevel };
  }

  if (competitionLevel === 'regional') {
    return {
      competitionLevel,
      region,
    };
  }

  if (competitionLevel === 'county') {
    return {
      competitionLevel,
      region,
      county,
    };
  }

  return {
    competitionLevel,
    region,
    county,
    subCounty,
  };
};

export const buildCompetitionScopeKey = (
  scope: Pick<CompetitionAreaScope, 'competitionLevel' | 'region' | 'county' | 'subCounty'>
) =>
  [
    scope.competitionLevel,
    scope.region || '-',
    scope.county || '-',
    scope.subCounty || '-',
  ].join('|');

export const formatCompetitionScopeLabel = (
  scope: Pick<CompetitionAreaScope, 'competitionLevel' | 'region' | 'county' | 'subCounty'>
) => {
  if (scope.competitionLevel === 'national') {
    return 'Kenya';
  }

  if (scope.competitionLevel === 'regional') {
    return scope.region || 'Regional';
  }

  if (scope.competitionLevel === 'county') {
    return scope.county || scope.region || 'County';
  }

  return [scope.subCounty, scope.county].filter(Boolean).join(', ') || 'Sub-County';
};

export const buildPublicationScopeFilter = (
  scope: Pick<ScopeLike, 'competitionLevel' | 'region' | 'county' | 'subCounty'>
) => {
  if (!scope.competitionLevel || scope.competitionLevel === 'global' || scope.competitionLevel === 'national') {
    return {};
  }

  if (scope.competitionLevel === 'regional') {
    return scope.region ? { region: scope.region } : {};
  }

  if (scope.competitionLevel === 'county') {
    return {
      ...(scope.region ? { region: scope.region } : {}),
      ...(scope.county ? { county: scope.county } : {}),
    };
  }

  return {
    ...(scope.region ? { region: scope.region } : {}),
    ...(scope.county ? { county: scope.county } : {}),
    ...(scope.subCounty ? { subCounty: scope.subCounty } : {}),
  };
};

export const buildCompetitionScopeFromPublication = (publication: {
  competitionLevel: unknown;
  region?: unknown;
  county?: unknown;
  subCounty?: unknown;
}): CompetitionAreaScope => {
  const competitionLevel = normalizeCompetitionAreaLevel(publication.competitionLevel);

  return buildCompetitionScopeFromSchoolLocation(
    {
      region: publication.region,
      county: publication.county,
      subCounty: publication.subCounty,
    },
    competitionLevel
  );
};

export const buildSchoolScopeFilter = (scope?: ScopeLike) => {
  if (!scope || scope.isGlobal || scope.competitionLevel === 'national') {
    return {};
  }

  if (scope.competitionLevel === 'regional') {
    return scope.region ? { region: scope.region } : {};
  }

  if (scope.competitionLevel === 'county') {
    return scope.county ? { county: scope.county } : {};
  }

  return {
    ...(scope.county ? { county: scope.county } : {}),
    ...(scope.subCounty ? { subCounty: scope.subCounty } : {}),
  };
};

export const getScopedSchoolIds = async (scope?: ScopeLike) => {
  const schoolFilter = buildSchoolScopeFilter(scope);

  if (Object.keys(schoolFilter).length === 0) {
    return null;
  }

  const schools = await SchoolModel.find(schoolFilter).select('_id').lean();
  return schools.map((school) => school._id);
};

export const buildScopedProjectFilter = async (
  scope?: ScopeLike,
  baseFilter: Record<string, unknown> = {}
) => {
  if (!scope || scope.isGlobal) {
    return baseFilter;
  }

  const filter: Record<string, unknown> = {
    ...baseFilter,
    currentLevel: scope.competitionLevel,
  };

  const schoolIds = await getScopedSchoolIds(scope);

  if (schoolIds) {
    const scopedSchoolIds = schoolIds.map((schoolId) => String(schoolId));
    const existingSchoolFilter = baseFilter.schoolId;

    if (typeof existingSchoolFilter === 'string') {
      filter.schoolId = scopedSchoolIds.includes(existingSchoolFilter)
        ? existingSchoolFilter
        : { $in: [] };
    } else if (
      existingSchoolFilter &&
      typeof existingSchoolFilter === 'object' &&
      '$in' in existingSchoolFilter &&
      Array.isArray((existingSchoolFilter as { $in?: unknown[] }).$in)
    ) {
      const requestedIds = (existingSchoolFilter as { $in?: unknown[] }).$in || [];
      filter.schoolId = {
        $in: requestedIds.filter((value) => scopedSchoolIds.includes(String(value))),
      };
    } else {
      filter.schoolId = { $in: schoolIds };
    }
  }

  return filter;
};

export const adminCanAccessProject = async (
  projectId: string,
  scope?: AdminScopeContext
) => {
  if (!scope || scope.isGlobal) {
    return true;
  }

  const scopedFilter = await buildScopedProjectFilter(scope, {
    _id: new Types.ObjectId(projectId),
  });

  const project = await ProjectModel.findOne(scopedFilter).select('_id').lean();
  return !!project;
};
