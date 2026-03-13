'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendProjectJudgeAssignment,
  BackendScore,
  listMyProjectAssignments,
  listScoresByJudge,
} from '@/lib/api';
import { formatStatus } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function JudgeDashboardPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [assignments, setAssignments] = useState<BackendProjectJudgeAssignment[]>([]);
  const [scores, setScores] = useState<BackendScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [assignmentData, scoreData] = await Promise.all([
          listMyProjectAssignments(),
          listScoresByJudge(user._id),
        ]);

        setAssignments(assignmentData);
        setScores(scoreData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authLoading, user]);

  const assignedProjects = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.assignmentStatus === 'assigned' ||
          assignment.assignmentStatus === 'completed'
      ),
    [assignments]
  );
  const remaining = useMemo(
    () =>
      assignedProjects.filter((assignment) => assignment.assignmentStatus !== 'completed').length,
    [assignedProjects]
  );
  const progress = assignedProjects.length
    ? Math.round((scores.length / assignedProjects.length) * 100)
    : 0;
  const categorySummary = useMemo(() => {
    const grouped = new Map<string, { name: string; projectCount: number; scoredCount: number }>();

    assignedProjects.forEach((assignment) => {
      const category =
        typeof assignment.categoryId === 'string'
          ? { _id: assignment.categoryId, name: assignment.categoryId }
          : assignment.categoryId;

      const project =
        typeof assignment.projectId === 'string' ? null : assignment.projectId;
      const key = category?._id || 'unknown';
      const current = grouped.get(key) || {
        name: category?.name || 'Unknown Category',
        projectCount: 0,
        scoredCount: 0,
      };

      current.projectCount += 1;

      const projectId = project?._id || '';
      if (
        scores.some((score) =>
          (typeof score.projectId === 'string' ? score.projectId : score.projectId?._id) ===
          projectId
        )
      ) {
        current.scoredCount += 1;
      }

      grouped.set(key, current);
    });

    return Array.from(grouped.values());
  }, [assignedProjects, scores]);

  return (
    <DashboardLayout role="judge">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Welcome, {user?.fullName || 'Judge'}</p>
          <h1 className="section-title">Manage and score your assigned projects</h1>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading judge dashboard...</div>
        ) : error ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Projects Assigned', assignedProjects.length],
                ['Projects Scored', scores.length],
                ['Projects Remaining', remaining],
              ].map(([label, value]) => (
                <div key={label} className="surface p-5">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="surface p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Judging Progress</h2>
                  <p className="text-sm text-slate-300">
                    {scores.length} of {assignedProjects.length} projects completed
                  </p>
                </div>
                <p className="text-xl font-semibold text-blue-200">{progress}%</p>
              </div>
              <div className="mt-4 h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="surface p-6">
                <h2 className="text-xl font-semibold text-white">Assigned Categories</h2>
                <div className="mt-4 space-y-3">
                  {categorySummary.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      No categories assigned yet.
                    </div>
                  ) : (
                    categorySummary.map((item) => (
                      <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-sm text-slate-300">{item.projectCount} Projects</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {item.scoredCount} / {item.projectCount} scored
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="surface overflow-hidden">
                <div className="border-b border-white/10 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Assigned Projects</h2>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {assignedProjects.map((assignment) => {
                    const project =
                      typeof assignment.projectId === 'string' ? null : assignment.projectId;
                    const category =
                      typeof assignment.categoryId === 'string'
                        ? assignment.categoryId
                        : assignment.categoryId?.name;
                    const scored = assignment.assignmentStatus === 'completed';

                    return (
                      <div
                        key={assignment._id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-blue-200">{project?.projectCode}</p>
                            <p className="mt-1 font-semibold text-white">{project?.title}</p>
                          </div>
                          <span
                            className={`status-badge ${
                              scored
                                ? 'bg-green-500/20 text-green-100'
                                : 'bg-amber-500/20 text-amber-100'
                            }`}
                          >
                            {formatStatus(assignment.assignmentStatus)}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Category
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{category}</p>
                        </div>
                        <Link
                          href={scored ? '/judge/submitted-scores' : '/judge/score'}
                          className="mt-4 inline-flex rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 hover:bg-blue-500/20 hover:text-white"
                        >
                          {scored ? 'View Score' : 'Score Project'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[760px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedProjects.map((assignment) => {
                        const project =
                          typeof assignment.projectId === 'string' ? null : assignment.projectId;
                        const category =
                          typeof assignment.categoryId === 'string'
                            ? assignment.categoryId
                            : assignment.categoryId?.name;
                        const scored = assignment.assignmentStatus === 'completed';

                        return (
                          <tr key={assignment._id} className="border-t border-white/10">
                            <td className="px-4 py-3 text-blue-200">{project?.projectCode}</td>
                            <td className="px-4 py-3 text-white">{project?.title}</td>
                            <td className="px-4 py-3 text-slate-300">{category}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`status-badge ${
                                  scored
                                    ? 'bg-green-500/20 text-green-100'
                                    : 'bg-amber-500/20 text-amber-100'
                                }`}
                              >
                                {formatStatus(assignment.assignmentStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={scored ? '/judge/submitted-scores' : '/judge/score'}
                                className="text-blue-200 hover:text-white"
                              >
                                {scored ? 'View Score' : 'Score Project'}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
