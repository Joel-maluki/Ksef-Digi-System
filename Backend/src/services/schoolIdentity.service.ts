import { SchoolModel } from '../models/School';

const normalizeSchoolText = (value: unknown) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSchoolCodeBase = (name: string) => {
  const words = normalizeSchoolText(name)
    .split(/\s+/)
    .filter(Boolean);

  const initials =
    words.length > 1
      ? words.map((word) => word[0]).join('')
      : name.replace(/[^A-Za-z0-9]/g, '');

  return initials.toUpperCase().slice(0, 6) || 'SCH';
};

export const buildUniqueSchoolCode = async (name: string, excludeId?: string) => {
  const base = getSchoolCodeBase(name);
  let suffix = 0;

  while (true) {
    const candidate = `${base}${suffix === 0 ? '' : suffix}`;
    const existing = await SchoolModel.findOne({
      code: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();

    if (!existing) {
      return candidate;
    }

    suffix += 1;
  }
};

export const findExistingSchoolByIdentity = async ({
  name,
  county,
  subCounty,
  excludeId,
}: {
  name: unknown;
  county: unknown;
  subCounty: unknown;
  excludeId?: string;
}) => {
  const normalizedName = normalizeSchoolText(name);
  const normalizedCounty = normalizeSchoolText(county);
  const normalizedSubCounty = normalizeSchoolText(subCounty);

  if (!normalizedName || !normalizedCounty || !normalizedSubCounty) {
    return null;
  }

  return SchoolModel.findOne({
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' },
    county: { $regex: `^${escapeRegex(normalizedCounty)}$`, $options: 'i' },
    subCounty: { $regex: `^${escapeRegex(normalizedSubCounty)}$`, $options: 'i' },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
};

export const normalizeSchoolField = normalizeSchoolText;
