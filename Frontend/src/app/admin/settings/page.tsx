'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendAdminDashboardStats,
  BackendCompetitionScheduleEntry,
  BackendHealth,
  BackendKenyaAdministrativeUnits,
  BackendSchool,
  BackendSystemSettings,
  CompetitionLevelKey,
  getAdminDashboardStats,
  getBackendHealth,
  getKenyaAdministrativeUnits,
  getSettings,
  listSchools,
  updateSettings as saveSettings,
} from '@/lib/api';
import { competitionLevels, formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const emptySettings: BackendSystemSettings = {
  _id: '',
  key: 'system',
  activeCompetitionLevel: 'sub_county',
  projectSubmissionDeadline: null,
  scoreSubmissionDeadline: null,
  allowAdminRankingOverride: true,
  competitionSchedule: [],
};

const emptyHealth: BackendHealth = {
  success: false,
  message: 'Unknown',
};

const emptyStats: BackendAdminDashboardStats = {
  schools: 0,
  projects: 0,
  students: 0,
  maleStudents: 0,
  femaleStudents: 0,
  judges: 0,
  categories: 0,
  activeCompetitionLevel: 'sub_county',
  projectsByCategory: [],
  projectsByRegion: [],
  activeLevelSchedule: [],
  activeLevelSummary: {
    totalProjects: 0,
    scoredProjects: 0,
    categoriesWithProjects: 0,
    readyCategories: 0,
    publishedCategories: 0,
    scheduledEvents: 0,
    liveEvents: 0,
    upcomingEvents: 0,
  },
  leaderboards: {
    schools: [],
    subCounties: [],
    counties: [],
    regions: [],
  },
};

const emptyKenyaUnits: BackendKenyaAdministrativeUnits = {
  generatedAt: '',
  sources: [],
  regions: [],
  counties: [],
};

const createEmptyScheduleEntry = (
  competitionLevel: CompetitionLevelKey = 'sub_county'
): BackendCompetitionScheduleEntry => ({
  competitionLevel,
  scopeName: competitionLevel === 'national' ? 'National' : '',
  hostSchoolName: '',
  judgingStartDate: '',
  judgingEndDate: '',
  resultsAnnouncementDate: null,
  notes: '',
});

const toDateTimeInput = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatScheduleStatus = (value?: BackendCompetitionScheduleEntry['status']) => {
  if (!value) return 'Scheduled';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export default function AdminSettingsPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [settings, setSettings] = useState<BackendSystemSettings>(emptySettings);
  const [health, setHealth] = useState<BackendHealth>(emptyHealth);
  const [stats, setStats] = useState<BackendAdminDashboardStats>(emptyStats);
  const [kenyaUnits, setKenyaUnits] =
    useState<BackendKenyaAdministrativeUnits>(emptyKenyaUnits);
  const [schools, setSchools] = useState<BackendSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [settingsData, healthData, statsData, kenyaData, schoolData] =
          await Promise.all([
            getSettings(),
            getBackendHealth(),
            getAdminDashboardStats(),
            getKenyaAdministrativeUnits(),
            listSchools(),
          ]);

        setSettings({
          ...settingsData,
          competitionSchedule: settingsData.competitionSchedule || [],
        });
        setHealth(healthData);
        setStats(statsData);
        setKenyaUnits(kenyaData);
        setSchools(schoolData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading]);

  const areaOptionsByLevel = useMemo<Record<CompetitionLevelKey, string[]>>(() => {
    const subCountySet = new Set<string>();
    const countySet = new Set<string>();
    const regionSet = new Set<string>();

    kenyaUnits.counties.forEach((county) => {
      countySet.add(county.name);
      regionSet.add(county.region);
      county.subCounties.forEach((subCounty) => subCountySet.add(subCounty));
    });

    kenyaUnits.regions.forEach((region) => regionSet.add(region.name));

    return {
      sub_county: Array.from(subCountySet).sort((left, right) => left.localeCompare(right)),
      county: Array.from(countySet).sort((left, right) => left.localeCompare(right)),
      regional: Array.from(regionSet).sort((left, right) => left.localeCompare(right)),
      national: ['National'],
    };
  }, [kenyaUnits]);

  const updateScheduleEntry = (
    index: number,
    updater: (
      current: BackendCompetitionScheduleEntry
    ) => BackendCompetitionScheduleEntry
  ) => {
    setSettings((current) => ({
      ...current,
      competitionSchedule: current.competitionSchedule.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry
      ),
    }));
  };

  const addScheduleEntry = () => {
    setSettings((current) => ({
      ...current,
      competitionSchedule: [...current.competitionSchedule, createEmptyScheduleEntry()],
    }));
  };

  const removeScheduleEntry = (index: number) => {
    setSettings((current) => ({
      ...current,
      competitionSchedule: current.competitionSchedule.filter(
        (_entry, entryIndex) => entryIndex !== index
      ),
    }));
  };

  const getAreaOptions = (competitionLevel: CompetitionLevelKey) =>
    areaOptionsByLevel[competitionLevel] || [];

  const getHostSchoolSuggestions = (entry: BackendCompetitionScheduleEntry) =>
    schools
      .filter((school) => {
        if (!school.name) return false;

        if (entry.competitionLevel === 'sub_county') {
          return school.subCounty === entry.scopeName;
        }

        if (entry.competitionLevel === 'county') {
          return school.county === entry.scopeName;
        }

        if (entry.competitionLevel === 'regional') {
          return school.region === entry.scopeName;
        }

        return true;
      })
      .sort((left, right) => left.name.localeCompare(right.name));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveSettings({
        activeCompetitionLevel: settings.activeCompetitionLevel,
        projectSubmissionDeadline: settings.projectSubmissionDeadline || null,
        scoreSubmissionDeadline: settings.scoreSubmissionDeadline || null,
        allowAdminRankingOverride: settings.allowAdminRankingOverride,
        competitionSchedule: settings.competitionSchedule,
      });

      const [freshSettings, freshStats] = await Promise.all([
        getSettings(),
        getAdminDashboardStats(),
      ]);

      setSettings({
        ...freshSettings,
        competitionSchedule: freshSettings.competitionSchedule || [],
      });
      setStats(freshStats);
      setSuccess('Settings saved successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-copy mt-2">
            Configure competition level, deadlines, ranking publication rules, and the
            designated judging days for each KSEF stage.
          </p>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading settings...</div>
        ) : (
          <>
            {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}
            {success ? (
              <div className="surface p-4 text-sm text-emerald-300">{success}</div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="surface p-6">
                  <h2 className="text-lg font-semibold text-white">Competition Settings</h2>
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Active Competition Level
                      </label>
                      <select
                        value={settings.activeCompetitionLevel}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            activeCompetitionLevel: event.target
                              .value as BackendSystemSettings['activeCompetitionLevel'],
                          }))
                        }
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                      >
                        {competitionLevels.map((level) => (
                          <option key={level.value} value={level.value} className="bg-slate-900">
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-slate-300">
                          Project Submission Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={toDateTimeInput(settings.projectSubmissionDeadline)}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              projectSubmissionDeadline: event.target.value || null,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-slate-300">
                          Score Submission Deadline
                        </label>
                        <input
                          type="datetime-local"
                          value={toDateTimeInput(settings.scoreSubmissionDeadline)}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              scoreSubmissionDeadline: event.target.value || null,
                            }))
                          }
                          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={settings.allowAdminRankingOverride}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            allowAdminRankingOverride: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-white/20 bg-transparent"
                      />
                      Allow admin override when publishing rankings before all projects are
                      scored
                    </label>
                  </div>
                </div>

                <div className="surface p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Competition Schedule
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Set the judging window and host school for each sub-county,
                        county, regional, or national event. When an event exists for an
                        area, judges can only score during that window.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addScheduleEntry}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                      Add Event
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {settings.competitionSchedule.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                        No competition events have been scheduled yet.
                      </div>
                    ) : (
                      settings.competitionSchedule.map((entry, index) => {
                        const areaOptions = getAreaOptions(entry.competitionLevel);
                        const hostSchoolSuggestions = getHostSchoolSuggestions(entry);

                        return (
                          <div
                            key={`${entry.competitionLevel}-${entry.scopeName}-${index}`}
                            className="rounded-3xl border border-white/10 bg-white/5 p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  Event {index + 1}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {formatCompetitionLevel(entry.competitionLevel)} competition
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeScheduleEntry(index)}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Competition Level
                                </label>
                                <select
                                  value={entry.competitionLevel}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, () =>
                                      createEmptyScheduleEntry(
                                        event.target.value as CompetitionLevelKey
                                      )
                                    )
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                >
                                  {competitionLevels.map((level) => (
                                    <option
                                      key={level.value}
                                      value={level.value}
                                      className="bg-slate-900"
                                    >
                                      {level.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Competition Area
                                </label>
                                <select
                                  value={entry.scopeName}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, (current) => ({
                                      ...current,
                                      scopeName: event.target.value,
                                      hostSchoolName: '',
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                >
                                  <option value="" className="bg-slate-900">
                                    Select area
                                  </option>
                                  {areaOptions.map((option) => (
                                    <option key={option} value={option} className="bg-slate-900">
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Host School
                                </label>
                                <input
                                  type="text"
                                  list={`host-school-options-${index}`}
                                  value={entry.hostSchoolName}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, (current) => ({
                                      ...current,
                                      hostSchoolName: event.target.value,
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                  placeholder="Select or type host school"
                                />
                                <datalist id={`host-school-options-${index}`}>
                                  {hostSchoolSuggestions.map((school) => (
                                    <option key={school._id} value={school.name} />
                                  ))}
                                </datalist>
                              </div>

                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Judging Start
                                </label>
                                <input
                                  type="datetime-local"
                                  value={toDateTimeInput(entry.judgingStartDate)}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, (current) => ({
                                      ...current,
                                      judgingStartDate: event.target.value,
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Judging End
                                </label>
                                <input
                                  type="datetime-local"
                                  value={toDateTimeInput(entry.judgingEndDate)}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, (current) => ({
                                      ...current,
                                      judgingEndDate: event.target.value,
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                  Results Announcement
                                </label>
                                <input
                                  type="datetime-local"
                                  value={toDateTimeInput(entry.resultsAnnouncementDate)}
                                  onChange={(event) =>
                                    updateScheduleEntry(index, (current) => ({
                                      ...current,
                                      resultsAnnouncementDate: event.target.value || null,
                                    }))
                                  }
                                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none"
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="mb-2 block text-sm text-slate-300">Notes</label>
                              <textarea
                                value={entry.notes || ''}
                                onChange={(event) =>
                                  updateScheduleEntry(index, (current) => ({
                                    ...current,
                                    notes: event.target.value,
                                  }))
                                }
                                rows={3}
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none"
                                placeholder="Optional notes about venue, reporting time, or announcements."
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>

              <div className="space-y-6">
                <div className="surface p-6">
                  <h2 className="text-lg font-semibold text-white">System Health</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>
                      API Status:{' '}
                      <span className="text-white">
                        {health.success ? 'Connected' : 'Unavailable'}
                      </span>
                    </p>
                    <p>
                      API Message: <span className="text-white">{health.message}</span>
                    </p>
                    <p>
                      Signed-in Admin:{' '}
                      <span className="text-white">
                        {user?.fullName || 'Unknown'} ({user?.email || 'Unknown'})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="surface p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Active Level Snapshot
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatCompetitionLevel(stats.activeCompetitionLevel)} competition
                        coverage and event status.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Scheduled Events', stats.activeLevelSummary.scheduledEvents],
                      ['Live Events', stats.activeLevelSummary.liveEvents],
                      ['Upcoming Events', stats.activeLevelSummary.upcomingEvents],
                      ['Ready Categories', stats.activeLevelSummary.readyCategories],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-sm text-slate-400">{label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {stats.activeLevelSchedule.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        No events scheduled yet for the active level.
                      </div>
                    ) : (
                      stats.activeLevelSchedule.map((entry, index) => (
                        <div
                          key={`${entry.scopeName}-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-white">{entry.scopeName}</p>
                            <span className="text-xs uppercase tracking-[0.2em] text-blue-200">
                              {formatScheduleStatus(entry.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-300">
                            Host: {entry.hostSchoolName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {toDateTimeInput(entry.judgingStartDate).replace('T', ' ')} to{' '}
                            {toDateTimeInput(entry.judgingEndDate).replace('T', ' ')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="surface p-6">
                  <h2 className="text-lg font-semibold text-white">Enforced Rules</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>One patron per school.</p>
                    <p>Projects must have 1 to 2 students from the same school.</p>
                    <p>Every project must have a mentor from the same school.</p>
                    <p>Judges cannot score projects from their own school.</p>
                    <p>Blind judging hides school names from judges.</p>
                    <p>Scores lock after submission and only admin can unlock them.</p>
                    <p>Public rankings show only categories that admin has published.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
