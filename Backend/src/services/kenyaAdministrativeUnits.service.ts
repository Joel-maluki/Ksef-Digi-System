import kenyaAdministrativeUnits from '../data/kenyaAdministrativeUnits.json';
import { ApiError } from '../utils/ApiError';

export type KenyaAdministrativeUnits = typeof kenyaAdministrativeUnits;
export type KenyaCountyUnit = KenyaAdministrativeUnits['counties'][number];

const normalizeLookupKey = (value: unknown) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const countyByKey = new Map(
  kenyaAdministrativeUnits.counties.map((county) => [
    normalizeLookupKey(county.name),
    county,
  ])
);

export const getKenyaAdministrativeUnits = () => kenyaAdministrativeUnits;

export const findKenyaCountyByName = (
  countyName: unknown
): KenyaCountyUnit | undefined =>
  countyByKey.get(normalizeLookupKey(countyName));

export const validateKenyaSchoolLocation = ({
  county,
  subCounty,
}: {
  county: unknown;
  subCounty: unknown;
}) => {
  const countyRecord = findKenyaCountyByName(county);

  if (!countyRecord) {
    throw new ApiError(400, 'County must be one of Kenya\'s 47 counties');
  }

  const matchedSubCounty = countyRecord.subCounties.find(
    (value) => normalizeLookupKey(value) === normalizeLookupKey(subCounty)
  );

  if (!matchedSubCounty) {
    throw new ApiError(
      400,
      `Sub-county must belong to ${countyRecord.name}`
    );
  }

  return {
    county: countyRecord.name,
    subCounty: matchedSubCounty,
    region: countyRecord.region,
  };
};
