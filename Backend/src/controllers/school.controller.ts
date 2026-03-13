import { Request, Response } from 'express';
import { SchoolModel } from '../models/School';
import { ProjectModel } from '../models/Project';
import { UserModel } from '../models/User';
import {
  findKenyaCountyByName,
  validateKenyaSchoolLocation,
} from '../services/kenyaAdministrativeUnits.service';
import {
  buildUniqueSchoolCode,
  findExistingSchoolByIdentity,
  normalizeSchoolField,
} from '../services/schoolIdentity.service';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';

const normalizeString = (value: unknown) => normalizeSchoolField(value);

export const listSchools = async (_req: Request, res: Response) => {
  const schools = await SchoolModel.find().sort({ name: 1 });
  res.json(ok(schools));
};

export const getSchool = async (req: Request, res: Response) => {
  const school = await SchoolModel.findById(req.params.id);
  if (!school) throw new ApiError(404, 'School not found');
  res.json(ok(school));
};

export const createSchool = async (req: Request, res: Response) => {
  const payload = {
    name: normalizeString(req.body?.name),
    subCounty: normalizeString(req.body?.subCounty),
    county: normalizeString(req.body?.county),
    region: normalizeString(req.body?.region),
    active: req.body?.active !== undefined ? Boolean(req.body.active) : true,
  };

  if (!payload.name || !payload.subCounty || !payload.county) {
    throw new ApiError(400, 'School name, sub-county and county are required');
  }

  const location = validateKenyaSchoolLocation({
    county: payload.county,
    subCounty: payload.subCounty,
  });

  const existingSchool = await findExistingSchoolByIdentity({
    name: payload.name,
    county: location.county,
    subCounty: location.subCounty,
  });

  if (existingSchool) {
    throw new ApiError(409, 'This school is already registered');
  }

  const school = await SchoolModel.create({
    ...payload,
    ...location,
    code:
      normalizeString(req.body?.code).toUpperCase() ||
      (await buildUniqueSchoolCode(payload.name)),
  });

  res.status(201).json(ok(school, 'School created'));
};

export const updateSchool = async (req: Request, res: Response) => {
  const existing = await SchoolModel.findById(req.params.id);

  if (!existing) throw new ApiError(404, 'School not found');

  const updates: Record<string, unknown> = {};

  if (req.body?.name !== undefined) {
    const name = normalizeString(req.body.name);
    if (!name) throw new ApiError(400, 'School name cannot be empty');
    updates.name = name;
  }

  const locationTouched =
    req.body?.subCounty !== undefined ||
    req.body?.county !== undefined ||
    req.body?.region !== undefined;

  if (locationTouched) {
    const nextCounty = normalizeString(req.body?.county ?? existing.county);
    const nextSubCounty = normalizeString(req.body?.subCounty ?? existing.subCounty);

    if (!nextCounty) throw new ApiError(400, 'County cannot be empty');
    if (!nextSubCounty) throw new ApiError(400, 'Sub-county cannot be empty');

    const countyUnchanged =
      nextCounty === existing.county && nextSubCounty === existing.subCounty;

    if (countyUnchanged) {
      const countyRecord = findKenyaCountyByName(existing.county);
      const validatedSubCounty = countyRecord?.subCounties.find(
        (value) => value.toLowerCase() === existing.subCounty.toLowerCase()
      );

      updates.county = existing.county;
      updates.subCounty = existing.subCounty;
      updates.region = validatedSubCounty
        ? countyRecord?.region || existing.region
        : existing.region;
    } else {
      Object.assign(
        updates,
        validateKenyaSchoolLocation({
          county: nextCounty,
          subCounty: nextSubCounty,
        })
      );
    }
  }

  if (req.body?.code !== undefined) {
    const code = normalizeString(req.body.code).toUpperCase();
    if (!code) throw new ApiError(400, 'School code cannot be empty');
    updates.code = code;
  }

  if (req.body?.active !== undefined) {
    updates.active = Boolean(req.body.active);
  }

  const nextName = normalizeString(updates.name ?? existing.name);
  const nextCounty = normalizeString(updates.county ?? existing.county);
  const nextSubCounty = normalizeString(updates.subCounty ?? existing.subCounty);

  const duplicateSchool = await findExistingSchoolByIdentity({
    name: nextName,
    county: nextCounty,
    subCounty: nextSubCounty,
    excludeId: String(existing._id),
  });

  if (duplicateSchool) {
    throw new ApiError(409, 'This school is already registered');
  }

  const school = await SchoolModel.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!school) throw new ApiError(404, 'School not found');
  res.json(ok(school, 'School updated'));
};

export const deleteSchool = async (req: Request, res: Response) => {
  const [projectCount, userCount] = await Promise.all([
    ProjectModel.countDocuments({ schoolId: req.params.id }),
    UserModel.countDocuments({ schoolId: req.params.id }),
  ]);

  if (projectCount > 0 || userCount > 0) {
    throw new ApiError(
      409,
      'This school is linked to projects or users and cannot be deleted'
    );
  }

  const school = await SchoolModel.findByIdAndDelete(req.params.id);
  if (!school) throw new ApiError(404, 'School not found');
  res.json(ok(null, 'School deleted'));
};
