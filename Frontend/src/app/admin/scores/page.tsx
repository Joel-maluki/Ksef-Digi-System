'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendScore,
  listScores,
  relockScore,
  reopenProjectScoring,
  unlockScore,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function AdminScoresPage() {
  const { loading: authLoading } = useRequireAuth();
  const [scores, setScores] = useState<BackendScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reopeningProjectId, setReopeningProjectId] = useState<string | null>(null);
  const [lockFilter, setLockFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadScores = async () => {
    setLoading(true);
    setError(null);

    try {
      setScores(await listScores());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadScores();
    }
  }, [authLoading]);

  const filteredScores = useMemo(
    () =>
      scores.filter((score) => {
        if (lockFilter === 'locked') return score.locked;
        if (lockFilter === 'unlocked') return !score.locked;
        return true;
      }),
    [lockFilter, scores]
  );

  const handleToggleLock = async (score: BackendScore) => {
    setUpdatingId(score._id);
    setError(null);
    setSuccess(null);

    try {
      if (score.locked) {
        await unlockScore(score._id);
        setSuccess('Score unlocked. The judge can edit it again.');
      } else {
        await relockScore(score._id);
        setSuccess('Score locked again.');
      }

      await loadScores();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReopenProject = async (score: BackendScore) => {
    const projectId =
      typeof score.projectId === 'string' ? score.projectId : score.projectId?._id;

    if (!projectId) return;

    setReopeningProjectId(projectId);
    setError(null);
    setSuccess(null);

    try {
      await reopenProjectScoring(projectId);
      setSuccess('Scoring reopened for the entire project.');
      await loadScores();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReopeningProjectId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Scores</h1>
            <p className="section-copy mt-2">
              Monitor submitted scores, unlock them for edits, or reopen scoring for a
              full project.
            </p>
          </div>
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3">
            <select
              value={lockFilter}
              onChange={(event) =>
                setLockFilter(event.target.value as typeof lockFilter)
              }
              className="h-11 bg-transparent text-sm text-white outline-none"
            >
              <option value="all" className="bg-slate-900">
                All scores
              </option>
              <option value="locked" className="bg-slate-900">
                Locked only
              </option>
              <option value="unlocked" className="bg-slate-900">
                Unlocked only
              </option>
            </select>
          </div>
        </div>

        {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}
        {success ? (
          <div className="surface p-4 text-sm text-emerald-300">{success}</div>
        ) : null}

        <div className="surface overflow-hidden">
          {authLoading || loading ? (
            <div className="px-4 py-6 text-slate-300">Loading scores...</div>
          ) : filteredScores.length === 0 ? (
            <div className="px-4 py-6 text-slate-300">
              No scores match the current filter.
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredScores.map((score) => {
                  const project =
                    typeof score.projectId === 'string' ? null : score.projectId;
                  const judge =
                    typeof score.judgeId === 'string' ? null : score.judgeId;
                  const projectId =
                    typeof score.projectId === 'string'
                      ? score.projectId
                      : score.projectId?._id || '';

                  return (
                    <div
                      key={score._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {project?.projectCode || 'Project'}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {project?.title || projectId}
                          </p>
                        </div>
                        <span
                          className={`status-badge ${
                            score.locked
                              ? 'bg-blue-500/20 text-blue-100'
                              : 'bg-amber-500/20 text-amber-100'
                          }`}
                        >
                          {score.locked ? 'Locked' : 'Unlocked'}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Judge
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {judge?.fullName || 'Unknown Judge'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-sm text-white">{score.judgeTotal}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Section A
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{score.sectionA}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Section B
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{score.sectionB}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Section C
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{score.sectionC}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingId === score._id}
                          onClick={() => handleToggleLock(score)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                        >
                          {updatingId === score._id
                            ? 'Updating...'
                            : score.locked
                              ? 'Unlock'
                              : 'Relock'}
                        </button>
                        <button
                          type="button"
                          disabled={reopeningProjectId === projectId}
                          onClick={() => handleReopenProject(score)}
                          className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-60"
                        >
                          {reopeningProjectId === projectId
                            ? 'Reopening...'
                            : 'Reopen Scoring'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[920px] text-sm">
                  <thead className="bg-white/5 text-left text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Judge</th>
                      <th className="px-4 py-3">Section A</th>
                      <th className="px-4 py-3">Section B</th>
                      <th className="px-4 py-3">Section C</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScores.map((score) => {
                      const project =
                        typeof score.projectId === 'string' ? null : score.projectId;
                      const judge =
                        typeof score.judgeId === 'string' ? null : score.judgeId;
                      const projectId =
                        typeof score.projectId === 'string'
                          ? score.projectId
                          : score.projectId?._id || '';

                      return (
                        <tr key={score._id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">
                            <div>{project?.projectCode || 'Project'}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {project?.title || projectId}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {judge?.fullName || 'Unknown Judge'}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{score.sectionA}</td>
                          <td className="px-4 py-3 text-slate-300">{score.sectionB}</td>
                          <td className="px-4 py-3 text-slate-300">{score.sectionC}</td>
                          <td className="px-4 py-3 text-white">{score.judgeTotal}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`status-badge ${
                                score.locked
                                  ? 'bg-blue-500/20 text-blue-100'
                                  : 'bg-amber-500/20 text-amber-100'
                              }`}
                            >
                              {score.locked ? 'Locked' : 'Unlocked'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={updatingId === score._id}
                                onClick={() => handleToggleLock(score)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                              >
                                {updatingId === score._id
                                  ? 'Updating...'
                                  : score.locked
                                    ? 'Unlock'
                                    : 'Relock'}
                              </button>
                              <button
                                type="button"
                                disabled={reopeningProjectId === projectId}
                                onClick={() => handleReopenProject(score)}
                                className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 disabled:opacity-60"
                              >
                                {reopeningProjectId === projectId
                                  ? 'Reopening...'
                                  : 'Reopen Scoring'}
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
      </div>
    </DashboardLayout>
  );
}
