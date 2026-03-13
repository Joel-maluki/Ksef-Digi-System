'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { BackendProject, BackendSchool, getSchool, listProjects } from '@/lib/api';
import { formatCompetitionLevel, formatStatus } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function PatronDashboardPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [school, setSchool] = useState<BackendSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const projectsData = await listProjects();
        setProjects(projectsData);

        if (user.schoolId) {
          setSchool(await getSchool(user.schoolId));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user]);

  const studentCount = useMemo(
    () => projects.reduce((sum, project) => sum + (project.students?.length || 0), 0),
    [projects]
  );
  const qualifiedCount = useMemo(
    () =>
      projects.filter((project) =>
        ['qualified', 'published'].includes(project.submissionStatus || project.status || '')
      ).length,
    [projects]
  );
  const categoryCount = useMemo(() => {
    const categoryIds = projects.map((project) =>
      typeof project.categoryId === 'string' ? project.categoryId : project.categoryId?._id || ''
    );

    return new Set(categoryIds.filter(Boolean)).size;
  }, [projects]);
  const currentLevel = projects[0]?.currentLevel || 'sub_county';

  return (
    <DashboardLayout role="patron">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">{school?.name || 'Your School'}</p>
          <h1 className="section-title">Patron Dashboard</h1>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading your dashboard...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['Projects Submitted', projects.length],
                ['Students Represented', studentCount],
                ['Categories Entered', categoryCount],
                ['Qualified Projects', qualifiedCount],
              ].map(([label, value]) => (
                <div key={label} className="surface p-5">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="surface p-5">
                <p className="text-sm text-slate-300">Project Submission Deadline</p>
                <p className="mt-2 text-xl font-semibold text-white">15 March 2026</p>
              </div>
              <div className="surface p-5">
                <p className="text-sm text-slate-300">Current Competition Level</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {formatCompetitionLevel(String(currentLevel))}
                </p>
              </div>
            </div>
            <div className="surface p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">My Projects</h2>
                <Link
                  href="/patron/submit-project"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
                >
                  Submit Project
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {projects.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    You have not submitted any projects yet.
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-blue-200">{project.projectCode}</p>
                          <h3 className="font-semibold text-white">{project.title}</h3>
                        </div>
                        <span
                          className={`status-badge ${
                            project.submissionStatus === 'qualified'
                              ? 'bg-green-500/20 text-green-100'
                              : 'bg-blue-500/20 text-blue-100'
                          }`}
                        >
                          {formatStatus(project.submissionStatus || project.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
