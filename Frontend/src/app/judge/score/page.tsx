'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BackendProjectJudgeAssignment,
  listMyProjectAssignments,
  submitScore,
} from '@/lib/api';
import { formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

const sectionLimits = {
  sectionA: 30,
  sectionB: 15,
  sectionC: 35,
} as const;

export default function JudgeScorePage() {
  const { loading: authLoading } = useRequireAuth();
  const [assignments, setAssignments] = useState<BackendProjectJudgeAssignment[]>([]);
  const [index, setIndex] = useState(0);
  const [sectionA, setSectionA] = useState('');
  const [sectionB, setSectionB] = useState('');
  const [sectionC, setSectionC] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);

    try {
      const assignmentData = await listMyProjectAssignments();
      const pendingAssignments = assignmentData.filter(
        (assignment) => assignment.assignmentStatus === 'assigned'
      );
      setAssignments(pendingAssignments);
      setIndex((current) => Math.min(current, Math.max(pendingAssignments.length - 1, 0)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadAssignments();
    }
  }, [authLoading]);

  const current = assignments[index];
  const currentProject = current && typeof current.projectId !== 'string' ? current.projectId : null;
  const currentCategory =
    current && typeof current.categoryId !== 'string' ? current.categoryId : null;
  const total = (Number(sectionA) || 0) + (Number(sectionB) || 0) + (Number(sectionC) || 0);

  const validationError = useMemo(() => {
    const values = {
      sectionA: Number(sectionA),
      sectionB: Number(sectionB),
      sectionC: Number(sectionC),
    };

    for (const [key, value] of Object.entries(values)) {
      const sectionKey = key as keyof typeof sectionLimits;

      if (Number.isNaN(value) || value < 0 || value > sectionLimits[sectionKey]) {
        return `${sectionKey} must be between 0 and ${sectionLimits[sectionKey]}.`;
      }
    }

    return null;
  }, [sectionA, sectionB, sectionC]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!currentProject) {
      setError('No project selected for scoring.');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await submitScore({
        projectId: currentProject._id,
        sectionA: Number(sectionA),
        sectionB: Number(sectionB),
        sectionC: Number(sectionC),
      });

      setSuccess(`Score submitted for ${currentProject.projectCode}.`);
      setSectionA('');
      setSectionB('');
      setSectionC('');
      await loadAssignments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="judge">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Quick Score Lane</h1>
          <p className="section-copy mt-2">
            Fast section entry for judges handling many projects in sequence.
          </p>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading assigned projects...</div>
        ) : error && !current ? (
          <div className="surface p-6 text-red-300">{error}</div>
        ) : !current || !currentProject ? (
          <div className="surface p-6 text-slate-300">
            All assigned projects have already been scored.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Blind judging</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{currentProject.projectCode}</h2>
              <p className="mt-2 text-lg text-white">{currentProject.title}</p>
              <p className="mt-2 text-sm text-slate-300">{currentCategory?.name}</p>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>
                  Competition level:{' '}
                  <span className="text-white">
                    {formatCompetitionLevel(String(currentProject.currentLevel))}
                  </span>
                </p>
                <p>
                  Project status:{' '}
                  <span className="text-white">{current.assignmentStatus}</span>
                </p>
                <p>
                  Queue position: <span className="text-white">{index + 1}</span> / {assignments.length}
                </p>
              </div>
            </div>
            <div className="surface p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Section A /30</label>
                  <Input
                    value={sectionA}
                    onChange={(e) => setSectionA(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Section B /15</label>
                  <Input
                    value={sectionB}
                    onChange={(e) => setSectionB(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Section C /35</label>
                  <Input
                    value={sectionC}
                    onChange={(e) => setSectionC(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-200">Judge Total</p>
                <p className="mt-2 text-3xl font-semibold text-white">{total} / 80</p>
              </div>
              {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
              {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="rounded-xl bg-blue-600 hover:bg-blue-500"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Submitting...' : 'Submit Score'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setSectionA('');
                    setSectionB('');
                    setSectionC('');
                    setIndex((prev) => Math.min(prev + 1, Math.max(assignments.length - 1, 0)));
                  }}
                >
                  Skip to Next Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
