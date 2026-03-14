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

export type AdminScopeContext = {
  competitionLevel: AdminCompetitionLevel;
  region?: string;
  county?: string;
  subCounty?: string;
  active: boolean;
  isGlobal: boolean;
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

const findRegionByName = (value: unknown) => {
  const normalized = normalizeText(value).toLowerCase();

  return getKenyaAdministrativeUnits().regions.find(
    (region) => region.name.trim().toLowerCase() === normalized
  );
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

  if (competitionLevel === 'national') {
    return {
      competitionLevel,
      active: true,
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
      active: true,
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
      active: true,
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

export const buildSchoolScopeFilter = (scope?: AdminScopeContext) => {
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

export const getScopedSchoolIds = async (scope?: AdminScopeContext) => {
  const schoolFilter = buildSchoolScopeFilter(scope);

  if (Object.keys(schoolFilter).length === 0) {
    return null;
  }

  const schools = await SchoolModel.find(schoolFilter).select('_id').lean();
  return schools.map((school) => school._id);
};

export const buildScopedProjectFilter = async (
  scope?: AdminScopeContext,
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
