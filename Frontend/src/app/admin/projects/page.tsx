'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendCategory,
  BackendProject,
  BackendSchool,
  listCategories,
  listProjects,
  listSchools,
  promoteProject,
  reopenProjectScoring,
} from '@/lib/api';
import { competitionLevels, formatCompetitionLevel, formatStatus } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

type ProjectFilters = {
  categoryId: string;
  schoolId: string;
  subCounty: string;
  county: string;
  region: string;
  currentLevel: string;
};

const initialFilters: ProjectFilters = {
  categoryId: '',
  schoolId: '',
  subCounty: '',
  county: '',
  region: '',
  currentLevel: '',
};

const getCategoryName = (
  project: BackendProject,
  categories: BackendCategory[]
) => {
  if (typeof project.categoryId !== 'string') {
    return project.categoryId?.name || 'Unknown Category';
  }

  return (
    categories.find((category) => category._id === project.categoryId)?.name ||
    'Unknown Category'
  );
};

const getSchool = (
  project: BackendProject,
  schools: BackendSchool[]
): BackendSchool | undefined => {
  if (typeof project.schoolId !== 'string') {
    return project.schoolId;
  }

  return schools.find((school) => school._id === project.schoolId);
};

export default function AdminProjectsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [schools, setSchools] = useState<BackendSchool[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const loadLookupData = async () => {
      try {
        const [categoryData, schoolData] = await Promise.all([
          listCategories(),
          listSchools(),
        ]);

        setCategories(categoryData);
        setSchools(schoolData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    loadLookupData();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const projectData = await listProjects({
          categoryId: filters.categoryId || undefined,
          schoolId: filters.schoolId || undefined,
          subCounty: filters.subCounty || undefined,
          county: filters.county || undefined,
          region: filters.region || undefined,
          currentLevel: filters.currentLevel || undefined,
        });

        setProjects(projectData);
        setSelectedProjectId((current) => {
          if (current && projectData.some((project) => project._id === current)) {
            return current;
          }

          return projectData[0]?._id || null;
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [
    authLoading,
    filters.categoryId,
    filters.schoolId,
    filters.subCounty,
    filters.county,
    filters.region,
    filters.currentLevel,
  ]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const subCountyOptions = useMemo(
    () =>
      Array.from(
        new Set(schools.map((school) => school.subCounty).filter(Boolean) as string[])
      ).sort(),
    [schools]
  );

  const countyOptions = useMemo(
    () =>
      Array.from(
        new Set(schools.map((school) => school.county).filter(Boolean) as string[])
      ).sort(),
    [schools]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(
        new Set(schools.map((school) => school.region).filter(Boolean) as string[])
      ).sort(),
    [schools]
  );

  const handlePromote = async (project: BackendProject) => {
    if (project.currentLevel === 'national') return;

    setActingId(project._id);
    setError(null);
    setSuccess(null);

    try {
      await promoteProject(project._id);
      setSuccess(`${project.projectCode || 'Project'} promoted successfully.`);
      setProjects(await listProjects(filters));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  };

  const handleReopenScoring = async (project: BackendProject) => {
    setActingId(project._id);
    setError(null);
    setSuccess(null);

    try {
      await reopenProjectScoring(project._id);
      setSuccess(`Scoring reopened for ${project.projectCode || project.title}.`);
      setProjects(await listProjects(filters));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Projects</h1>
          <p className="section-copy mt-2">
            View submitted projects, filter by location or level, inspect details, and
            manage promotion or reopened scoring.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.categoryId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  categoryId: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Categories
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id} className="bg-slate-900">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.schoolId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  schoolId: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Schools
              </option>
              {schools.map((school) => (
                <option key={school._id} value={school._id} className="bg-slate-900">
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.subCounty}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  subCounty: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Sub Counties
              </option>
              {subCountyOptions.map((value) => (
                <option key={value} value={value} className="bg-slate-900">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.county}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  county: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Counties
              </option>
              {countyOptions.map((value) => (
                <option key={value} value={value} className="bg-slate-900">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.region}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  region: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Regions
              </option>
              {regionOptions.map((value) => (
                <option key={value} value={value} className="bg-slate-900">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={filters.currentLevel}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  currentLevel: event.target.value,
                }))
              }
              className="h-11 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="" className="bg-slate-900">
                All Levels
              </option>
              {competitionLevels.map((level) => (
                <option key={level.value} value={level.value} className="bg-slate-900">
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}
        {success ? (
          <div className="surface p-4 text-sm text-emerald-300">{success}</div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="surface overflow-hidden">
            {authLoading || loading ? (
              <div className="px-4 py-6 text-slate-300">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-6 text-slate-300">
                No projects match the current filters.
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {projects.map((project) => {
                    const school = getSchool(project, schools);
                    const selected = project._id === selectedProjectId;

                    return (
                      <div
                        key={project._id}
                        className={`rounded-2xl border p-4 ${
                          selected
                            ? 'border-blue-400/30 bg-blue-500/10'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-blue-200">{project.projectCode}</p>
                            <h3 className="mt-1 font-semibold text-white">{project.title}</h3>
                          </div>
                          <span className="status-badge bg-white/10 text-slate-200">
                            {formatStatus(project.submissionStatus || project.status)}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Category
                            </p>
                            <p className="mt-1 text-sm text-slate-200">
                              {getCategoryName(project, categories)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              School
                            </p>
                            <p className="mt-1 text-sm text-slate-200">{school?.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Level
                            </p>
                            <p className="mt-1 text-sm text-slate-200">
                              {formatCompetitionLevel(String(project.currentLevel || 'sub_county'))}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectId(project._id)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                          >
                            {selected ? 'Viewing' : 'View'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromote(project)}
                            disabled={actingId === project._id || project.currentLevel === 'national'}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                          >
                            {actingId === project._id ? 'Working...' : 'Promote'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReopenScoring(project)}
                            disabled={actingId === project._id}
                            className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-60"
                          >
                            Reopen Scoring
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[980px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Project Code</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">School</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => {
                        const school = getSchool(project, schools);
                        const selected = project._id === selectedProjectId;

                        return (
                          <tr
                            key={project._id}
                            className={`border-t border-white/10 ${
                              selected ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-blue-200">{project.projectCode}</td>
                            <td className="px-4 py-3 text-white">{project.title}</td>
                            <td className="px-4 py-3 text-slate-300">
                              {getCategoryName(project, categories)}
                            </td>
                            <td className="px-4 py-3 text-slate-300">{school?.name || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">
                              {formatCompetitionLevel(String(project.currentLevel || 'sub_county'))}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {formatStatus(project.submissionStatus || project.status)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedProjectId(project._id)}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromote(project)}
                                  disabled={
                                    actingId === project._id || project.currentLevel === 'national'
                                  }
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                                >
                                  {actingId === project._id ? 'Working...' : 'Promote'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReopenScoring(project)}
                                  disabled={actingId === project._id}
                                  className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-60"
                                >
                                  Reopen Scoring
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="surface p-6">
            <h2 className="text-lg font-semibold text-white">Project Details</h2>
            {!selectedProject ? (
              <p className="mt-4 text-sm text-slate-300">
                Select a project to review its full details.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm text-blue-200">{selectedProject.projectCode}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {selectedProject.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {getCategoryName(selectedProject, categories)}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      School
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {getSchool(selectedProject, schools)?.name || '-'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getSchool(selectedProject, schools)?.subCounty || '-'} |{' '}
                      {getSchool(selectedProject, schools)?.county || '-'} |{' '}
                      {getSchool(selectedProject, schools)?.region || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Competition Level
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {formatCompetitionLevel(
                        String(selectedProject.currentLevel || 'sub_county')
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Status:{' '}
                      {formatStatus(
                        selectedProject.submissionStatus || selectedProject.status
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Mentor
                  </p>
                  <p className="mt-2 text-sm text-white">{selectedProject.mentorName || 'Not provided'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Email: {selectedProject.mentorEmail || 'Not provided'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Phone: {selectedProject.mentorPhone || 'Not provided'}
                  </p>
                  <p className="mt-3 text-xs text-blue-200">
                    Project mentors can later be onboarded as judges after training.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Students
                  </p>
                  <div className="mt-3 space-y-3">
                    {(selectedProject.students || []).map((student) => (
                      <div
                        key={`${student.fullName}-${student.classForm}`}
                        className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                      >
                        <p className="text-sm font-medium text-white">{student.fullName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {student.gender} | {student.classForm}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
