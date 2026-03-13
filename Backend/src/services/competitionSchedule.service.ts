import { ApiError } from '../utils/ApiError';

export const competitionLevels = [
  'sub_county',
  'county',
  'regional',
  'national',
] as const;

export type CompetitionLevelKey = (typeof competitionLevels)[number];

export type CompetitionScheduleStatus =
  | 'upcoming'
  | 'live'
  | 'awaiting_results'
  | 'completed';

export type CompetitionScheduleEntry = {
  competitionLevel: CompetitionLevelKey;
  scopeName: string;
  hostSchoolName: string;
  judgingStartDate: Date;
  judgingEndDate: Date;
  resultsAnnouncementDate?: Date | null;
  notes: string;
};

export type CompetitionScheduleEntryLike = {
  competitionLevel?: string | null;
  scopeName?: string | null;
  hostSchoolName?: string | null;
  judgingStartDate: Date | string;
  judgingEndDate: Date | string;
  resultsAnnouncementDate?: Date | string | null;
  notes?: string | null;
};

type RawCompetitionScheduleEntry = Partial<{
  competitionLevel: unknown;
  scopeName: unknown;
  hostSchoolName: unknown;
  judgingStartDate: unknown;
  judgingEndDate: unknown;
  resultsAnnouncementDate: unknown;
  notes: unknown;
}>;

type SchoolLocationSnapshot = {
  subCounty?: string | null;
  county?: string | null;
  region?: string | null;
};

const scopeNameForNational = 'National';

const normalizeText = (value: unknown, fieldName: string) => {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  return normalized;
};

const parseRequiredDate = (value: unknown, fieldName: string) => {
  if (value === null || value === undefined || value === '') {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return parsed;
};

const parseOptionalDate = (value: unknown, fieldName: string) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date`);
  }

  return parsed;
};

const normalizeCompetitionLevel = (value: unknown) => {
  const normalized = String(value || '').trim();

  if (!isCompetitionLevel(normalized)) {
    throw new ApiError(400, 'Competition level is invalid');
  }

  return normalized;
};

export const isCompetitionLevel = (value: string): value is CompetitionLevelKey =>
  competitionLevels.includes(value as CompetitionLevelKey);

const compareText = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base' });

export const normalizeCompetitionSchedule = (value: unknown): CompetitionScheduleEntry[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, 'Competition schedule must be an array');
  }

  const seenScopes = new Set<string>();

  const entries = value.map((rawEntry) => {
    const entry = (rawEntry || {}) as RawCompetitionScheduleEntry;
    const competitionLevel = normalizeCompetitionLevel(entry.competitionLevel);
    const scopeName =
      competitionLevel === 'national'
        ? scopeNameForNational
        : normalizeText(entry.scopeName, 'Schedule area');
    const hostSchoolName = normalizeText(entry.hostSchoolName, 'Host school');
    const judgingStartDate = parseRequiredDate(entry.judgingStartDate, 'Judging start date');
    const judgingEndDate = parseRequiredDate(entry.judgingEndDate, 'Judging end date');
    const resultsAnnouncementDate = parseOptionalDate(
      entry.resultsAnnouncementDate,
      'Results announcement date'
    );
    const notes = String(entry.notes || '').trim();

    if (judgingStartDate > judgingEndDate) {
      throw new ApiError(400, 'Judging end date must be after the start date');
    }

    if (resultsAnnouncementDate && resultsAnnouncementDate < judgingStartDate) {
      throw new ApiError(
        400,
        'Results announcement date must be on or after the judging start date'
      );
    }

    const scopeKey = `${competitionLevel}:${scopeName.toLowerCase()}`;

    if (seenScopes.has(scopeKey)) {
      throw new ApiError(
        400,
        `Duplicate schedule entry found for ${competitionLevel.replace('_', ' ')} ${scopeName}`
      );
    }

    seenScopes.add(scopeKey);

    return {
      competitionLevel,
      scopeName,
      hostSchoolName,
      judgingStartDate,
      judgingEndDate,
      resultsAnnouncementDate,
      notes,
    };
  });

  return entries.sort((left, right) => {
    const levelDifference =
      competitionLevels.indexOf(left.competitionLevel) -
      competitionLevels.indexOf(right.competitionLevel);

    if (levelDifference !== 0) {
      return levelDifference;
    }

    if (left.judgingStartDate.getTime() !== right.judgingStartDate.getTime()) {
      return left.judgingStartDate.getTime() - right.judgingStartDate.getTime();
    }

    return compareText(left.scopeName, right.scopeName);
  });
};

export const toCompetitionScheduleEntries = (
  entries?: ReadonlyArray<CompetitionScheduleEntryLike> | null
): CompetitionScheduleEntry[] =>
  (entries || []).map((entry) => ({
    competitionLevel: normalizeCompetitionLevel(entry.competitionLevel),
    scopeName:
      entry.competitionLevel === 'national'
        ? scopeNameForNational
        : String(entry.scopeName || '').trim(),
    hostSchoolName: String(entry.hostSchoolName || '').trim(),
    judgingStartDate: new Date(entry.judgingStartDate),
    judgingEndDate: new Date(entry.judgingEndDate),
    resultsAnnouncementDate: entry.resultsAnnouncementDate
      ? new Date(entry.resultsAnnouncementDate)
      : null,
    notes: String(entry.notes || '').trim(),
  }));

export const getCompetitionScopeName = (
  competitionLevel: string,
  school: SchoolLocationSnapshot
) => {
  if (competitionLevel === 'sub_county') {
    return String(school.subCounty || '').trim();
  }

  if (competitionLevel === 'county') {
    return String(school.county || '').trim();
  }

  if (competitionLevel === 'regional') {
    return String(school.region || '').trim();
  }

  if (competitionLevel === 'national') {
    return scopeNameForNational;
  }

  return '';
};

export const getCompetitionScheduleStatus = (
  entry: Pick<
    CompetitionScheduleEntry,
    'judgingStartDate' | 'judgingEndDate' | 'resultsAnnouncementDate'
  >,
  now = new Date()
): CompetitionScheduleStatus => {
  const currentTime = now.getTime();

  if (currentTime < new Date(entry.judgingStartDate).getTime()) {
    return 'upcoming';
  }

  if (currentTime <= new Date(entry.judgingEndDate).getTime()) {
    return 'live';
  }

  if (
    entry.resultsAnnouncementDate &&
    currentTime < new Date(entry.resultsAnnouncementDate).getTime()
  ) {
    return 'awaiting_results';
  }

  return 'completed';
};

export const filterCompetitionScheduleByLevel = (
  entries: ReadonlyArray<CompetitionScheduleEntryLike> = [],
  competitionLevel: string
) =>
  toCompetitionScheduleEntries(entries)
    .filter((entry) => entry.competitionLevel === competitionLevel)
    .sort(
      (left, right) =>
        new Date(left.judgingStartDate).getTime() - new Date(right.judgingStartDate).getTime()
    );

export const findCompetitionScheduleEntry = ({
  entries = [],
  competitionLevel,
  school,
}: {
  entries?: ReadonlyArray<CompetitionScheduleEntryLike>;
  competitionLevel: string;
  school: SchoolLocationSnapshot;
}) => {
  const scopeName = getCompetitionScopeName(competitionLevel, school);

  if (!scopeName) {
    return null;
  }

  return (
    toCompetitionScheduleEntries(entries).find(
      (entry) =>
        entry.competitionLevel === competitionLevel &&
        entry.scopeName.localeCompare(scopeName, undefined, {
          sensitivity: 'base',
        }) === 0
    ) || null
  );
};
