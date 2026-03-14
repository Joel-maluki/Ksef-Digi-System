import kenyaAdministrativeUnits from '../data/kenyaAdministrativeUnits.json';
import { ApiError } from '../utils/ApiError';

export type KenyaAdministrativeUnits = typeof kenyaAdministrativeUnits;
export type KenyaCountyUnit = KenyaAdministrativeUnits['counties'][number];

const normalizeLookupKey = (value: unknown) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[â€™]/g, "'")
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const countyAliases = new Map<string, string>([
  ['taita/taveta', 'Taita-Taveta'],
  ['elgeyo/marakwet', 'Elgeyo-Marakwet'],
  ['nairobi', 'Nairobi City'],
]);

const subCountyAliasesByCounty = new Map<string, Map<string, string>>([
  [
    'Nairobi City',
    new Map<string, string>([
      ['langata', "Lang'ata"],
      ['westlands', 'Westlan'],
    ]),
  ],
  [
    'Nyeri',
    new Map<string, string>([
      ['mukurweni', 'Mukurwe-ini'],
      ['nyeri town', 'Nyeri Central'],
    ]),
  ],
  [
    'Nakuru',
    new Map<string, string>([
      ['nakuru town east', 'Nakuru East'],
      ['nakuru town west', 'Nakuru West'],
    ]),
  ],
  [
    'Kericho',
    new Map<string, string>([['soin/ sigowet', 'Soin/Sigowet']]),
  ],
  [
    'Mandera',
    new Map<string, string>([['banisa', 'Banissa']]),
  ],
  [
    'Bungoma',
    new Map<string, string>([['elgon', 'Mt Elgon']]),
  ],
  [
    'Nyandarua',
    new Map<string, string>([['ol joro orok', 'Ol Jorok']]),
  ],
  [
    'Kiambu',
    new Map<string, string>([['kiambu', 'Kiambu Town']]),
  ],
]);

const countyByKey = new Map(
  kenyaAdministrativeUnits.counties.map((county) => [
    normalizeLookupKey(county.name),
    county,
  ])
);

for (const [alias, canonicalCountyName] of countyAliases.entries()) {
  const countyRecord = kenyaAdministrativeUnits.counties.find(
    (county) => county.name === canonicalCountyName
  );

  if (countyRecord) {
    countyByKey.set(normalizeLookupKey(alias), countyRecord);
  }
}

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

  const aliasMap = subCountyAliasesByCounty.get(countyRecord.name);
  const aliasTarget = aliasMap?.get(normalizeLookupKey(subCounty));
  const aliasMatchedSubCounty = aliasTarget
    ? countyRecord.subCounties.find(
        (value) => normalizeLookupKey(value) === normalizeLookupKey(aliasTarget)
      )
    : undefined;

  if (!matchedSubCounty && !aliasMatchedSubCounty) {
    throw new ApiError(
      400,
      `Sub-county must belong to ${countyRecord.name}`
    );
  }

  return {
    county: countyRecord.name,
    subCounty: matchedSubCounty || aliasMatchedSubCounty || '',
    region: countyRecord.region,
  };
};
