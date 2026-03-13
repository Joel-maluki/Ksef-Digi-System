export const competitionLevels = [
  { value: 'sub_county', label: 'Sub-County' },
  { value: 'county', label: 'County' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
] as const;

export function formatCompetitionLevel(value?: string) {
  if (!value) return 'Unknown';

  const match = competitionLevels.find(
    (level) => level.value === value || level.label.toLowerCase() === value.toLowerCase()
  );

  if (match) return match.label;

  return value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toCompetitionLevelValue(value: string) {
  const match = competitionLevels.find(
    (level) => level.value === value || level.label.toLowerCase() === value.toLowerCase()
  );

  return match?.value || value;
}

export function formatStatus(value?: string) {
  if (!value) return 'Unknown';

  return value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
