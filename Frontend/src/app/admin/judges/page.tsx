'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendCategory,
  BackendJudgeCategoryAssignment,
  BackendProjectMentorCandidate,
  BackendSchool,
  BackendUser,
  assignCategoriesToJudge,
  createJudge,
  deleteJudge,
  listCategories,
  listJudgeCategoryAssignments,
  listJudges,
  listProjectMentorCandidates,
  listSchools,
  resetJudgeCredentials,
  updateJudge,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type JudgeForm = {
  fullName: string;
  email: string;
  phone: string;
  schoolId: string;
  trainedJudge: boolean;
};

const initialForm: JudgeForm = {
  fullName: '',
  email: '',
  phone: '',
  schoolId: '',
  trainedJudge: true,
};

const getAssignedCategoryIds = (
  judgeId: string,
  assignments: BackendJudgeCategoryAssignment[]
) =>
  assignments
    .filter((assignment) => {
      const assignmentJudgeId =
        typeof assignment.judgeId === 'string'
          ? assignment.judgeId
          : assignment.judgeId?._id;

      return assignmentJudgeId === judgeId;
    })
    .map((assignment) =>
      typeof assignment.categoryId === 'string'
        ? assignment.categoryId
        : assignment.categoryId?._id
    )
    .filter((value): value is string => Boolean(value));

const buildCredentialsMessage = ({
  intro,
  phone,
  loginEmail,
  temporaryPassword,
  smsDelivered,
  smsMessage,
  assignedCount,
}: {
  intro: string;
  phone: string;
  loginEmail?: string;
  temporaryPassword?: string;
  smsDelivered?: boolean;
  smsMessage?: string;
  assignedCount?: number;
}) => {
  const messages = [intro];

  if (loginEmail && temporaryPassword) {
    messages.push(
      `Login email ${loginEmail}, temporary password ${temporaryPassword}.`
    );
  }

  if (smsDelivered) {
    messages.push(`Login SMS sent to ${phone}.`);
  } else {
    messages.push(`SMS was not sent${smsMessage ? ` (${smsMessage})` : ''}.`);
  }

  if (typeof assignedCount === 'number') {
    messages.push(
      assignedCount > 0
        ? `${assignedCount} eligible project(s) assigned to this judge.`
        : 'No eligible projects needed assignment yet.'
    );
  }

  messages.push('The judge will be asked to change the password after first login.');

  return messages.join(' ');
};

export default function AdminJudgesPage() {
  const { loading: authLoading } = useRequireAuth();
  const [judges, setJudges] = useState<BackendUser[]>([]);
  const [schools, setSchools] = useState<BackendSchool[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [mentorCandidates, setMentorCandidates] = useState<BackendProjectMentorCandidate[]>([]);
  const [assignments, setAssignments] = useState<BackendJudgeCategoryAssignment[]>([]);
  const [form, setForm] = useState<JudgeForm>(initialForm);
  const [selectedMentorCandidate, setSelectedMentorCandidate] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [judgeData, schoolData, categoryData, assignmentData, mentorData] = await Promise.all([
        listJudges(),
        listSchools(),
        listCategories(),
        listJudgeCategoryAssignments(),
        listProjectMentorCandidates(),
      ]);

      setJudges(judgeData);
      setSchools(schoolData);
      setCategories(categoryData);
      setAssignments(assignmentData);
      setMentorCandidates(mentorData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPageData();
    }
  }, [authLoading]);

  const judgeCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>();

    judges.forEach((judge) => {
      const assignedIds = getAssignedCategoryIds(judge._id, assignments);
      map.set(
        judge._id,
        assignedIds
          .map((categoryId) => categories.find((category) => category._id === categoryId)?.name)
          .filter((value): value is string => Boolean(value))
      );
    });

    return map;
  }, [assignments, categories, judges]);

  const availableMentorCandidates = useMemo(
    () => mentorCandidates.filter((candidate) => !candidate.existingJudgeId),
    [mentorCandidates]
  );

  const mentorsForSelectedSchool = useMemo(() => {
    if (!form.schoolId) {
      return availableMentorCandidates;
    }

    return availableMentorCandidates.filter(
      (candidate) => candidate.schoolId === form.schoolId
    );
  }, [availableMentorCandidates, form.schoolId]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedMentorCandidate('');
    setSelectedCategoryIds([]);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.fullName || !form.email || !form.schoolId) {
      setError('Judge name, email, and school are required.');
      return;
    }

    if (!editingId && !form.phone.trim()) {
      setError('Judge phone number is required so login credentials can be sent by SMS.');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateJudge(editingId, form);
        await assignCategoriesToJudge(editingId, selectedCategoryIds, true);
        setSuccess('Judge updated successfully. Category changes were synced to project assignments.');
      } else {
        const result = await createJudge({
          ...form,
          phone: form.phone.trim(),
          categoryIds: selectedCategoryIds,
          sendCredentialsSms: true,
        });

        setSuccess(
          buildCredentialsMessage({
            intro: 'Judge added successfully.',
            phone: form.phone.trim(),
            loginEmail: result.loginEmail,
            temporaryPassword: result.temporaryPassword,
            smsDelivered: result.sms?.delivered,
            smsMessage: result.sms?.message,
            assignedCount: result.projectAssignments?.assignedCount,
          })
        );
      }

      resetForm();
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleResetCredentials = async (judge: BackendUser) => {
    setResettingId(judge._id);
    setError(null);
    setSuccess(null);

    try {
      const result = await resetJudgeCredentials(judge._id);

      setSuccess(
        buildCredentialsMessage({
          intro: `Login details refreshed for ${judge.fullName}.`,
          phone: judge.phone || '',
          loginEmail: result.loginEmail || judge.email,
          temporaryPassword: result.temporaryPassword,
          smsDelivered: result.sms?.delivered,
          smsMessage: result.sms?.message,
        })
      );
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResettingId(null);
    }
  };

  const handleDelete = async (judge: BackendUser) => {
    const confirmed = window.confirm(`Delete ${judge.fullName}?`);

    if (!confirmed) return;

    setDeletingId(judge._id);
    setError(null);
    setSuccess(null);

    try {
      await deleteJudge(judge._id);

      if (editingId === judge._id) {
        resetForm();
      }

      setSuccess('Judge deleted successfully.');
      await loadPageData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Judges</h1>
          <p className="section-copy mt-2">
            Register judges, assign categories, and keep school-conflict rules enforced.
            Every project should end up with 2 to 3 eligible judges, never from the
            same school as the project.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
          <div className="surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingId ? 'Edit Judge' : 'Add Judge'}
                </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Judges cannot score projects from their own school, and categories
                    should have enough trained judges to cover each project with 2-3
                    scorers.
                  </p>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                {!editingId ? (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm text-slate-300">School</label>
                    <select
                      value={form.schoolId}
                      onChange={(event) => {
                        const nextSchoolId = event.target.value;

                        setForm((current) => ({
                          ...current,
                          schoolId: nextSchoolId,
                        }));
                        setSelectedMentorCandidate('');
                      }}
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-slate-900">
                        Select school first
                      </option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id} className="bg-slate-900">
                          {school.name}
                        </option>
                      ))}
                    </select>

                    <label className="mb-2 mt-4 block text-sm text-slate-300">
                      Select School Mentor
                    </label>
                    <select
                      value={selectedMentorCandidate}
                      disabled={!form.schoolId}
                      onChange={(event) => {
                        const candidateKey = event.target.value;
                        setSelectedMentorCandidate(candidateKey);

                        const candidate = mentorsForSelectedSchool.find(
                          (item) => `${item.schoolId}:${item.email}` === candidateKey
                        );

                        if (!candidate) {
                          return;
                        }

                        setForm((current) => ({
                          ...current,
                          fullName: candidate.fullName,
                          email: candidate.email,
                          phone: candidate.phone,
                          schoolId: candidate.schoolId,
                        }));
                      }}
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-slate-900">
                        {form.schoolId
                          ? 'Select a mentor from this school'
                          : 'Choose a school before selecting mentor'}
                      </option>
                      {mentorsForSelectedSchool.map((candidate) => (
                        <option
                          key={`${candidate.schoolId}:${candidate.email}`}
                          value={`${candidate.schoolId}:${candidate.email}`}
                          className="bg-slate-900"
                        >
                          {candidate.fullName} - {candidate.schoolName} ({candidate.projectCount}{' '}
                          project{candidate.projectCount === 1 ? '' : 's'})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-400">
                      Mentors captured during project submission are grouped by school here,
                      so you can pick a trained teacher directly from the selected school.
                    </p>
                    {form.schoolId && mentorsForSelectedSchool.length === 0 ? (
                      <p className="mt-2 text-xs text-amber-200">
                        No mentor records have been captured yet for this school. You can
                        still enter the judge details manually below.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <label className="mb-2 block text-sm text-slate-300">Name</label>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="John Mwangi"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="john@gmail.com"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone (SMS)</label>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="0712345678"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
                {!editingId ? (
                  <p className="mt-2 text-xs text-slate-400">
                    The system sends the judge login email and temporary password to this number.
                  </p>
                ) : null}
              </div>

              {editingId ? (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">School</label>
                  <select
                    value={form.schoolId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, schoolId: event.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                  >
                    <option value="" className="bg-slate-900">
                      Select school
                    </option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id} className="bg-slate-900">
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.trainedJudge}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      trainedJudge: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                Judge has completed training
              </label>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Assigned Categories</label>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                  {categories.map((category) => {
                    const checked = selectedCategoryIds.includes(category._id);

                    return (
                      <label
                        key={category._id}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedCategoryIds((current) =>
                              event.target.checked
                                ? [...current, category._id]
                                : current.filter((value) => value !== category._id)
                            );
                          }}
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        <span>
                          {category.name} ({category.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update Judge'
                    : 'Add Judge'}
              </button>
            </form>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-white/10 px-4 py-4">
              <h2 className="text-lg font-semibold text-white">Registered Judges</h2>
              <p className="mt-1 text-sm text-slate-400">
                Judges are blind to school names during scoring, but admin can review
                assignments here and can regenerate login details whenever needed.
              </p>
            </div>

            {authLoading || loading ? (
              <div className="px-4 py-6 text-slate-300">Loading judges...</div>
            ) : judges.length === 0 ? (
              <div className="px-4 py-6 text-slate-300">No judges have been added yet.</div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {judges.map((judge) => {
                    const schoolName =
                      typeof judge.schoolId === 'string'
                        ? schools.find((school) => school._id === judge.schoolId)?.name
                        : judge.schoolId?.name;

                    return (
                      <div
                        key={judge._id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{judge.fullName}</p>
                            <p className="mt-1 text-sm text-slate-300">{judge.email}</p>
                          </div>
                          <span
                            className={`status-badge ${
                              judge.trainedJudge
                                ? 'bg-green-500/20 text-green-100'
                                : 'bg-amber-500/20 text-amber-100'
                            }`}
                          >
                            {judge.trainedJudge ? 'Trained' : 'Pending'}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              School
                            </p>
                            <p className="mt-1 text-sm text-slate-200">{schoolName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Phone
                            </p>
                            <p className="mt-1 text-sm text-slate-200">{judge.phone || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Categories
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {(judgeCategoryMap.get(judge._id) || []).join(', ') ||
                              'No categories assigned'}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleResetCredentials(judge)}
                            disabled={resettingId === judge._id}
                            className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 disabled:opacity-60"
                          >
                            {resettingId === judge._id ? 'Sending...' : 'Reset Login'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(judge._id);
                              setSelectedMentorCandidate('');
                              setForm({
                                fullName: judge.fullName,
                                email: judge.email,
                                phone: judge.phone || '',
                                schoolId:
                                  typeof judge.schoolId === 'string'
                                    ? judge.schoolId
                                    : judge.schoolId?._id || '',
                                trainedJudge: Boolean(judge.trainedJudge),
                              });
                              setSelectedCategoryIds(
                                getAssignedCategoryIds(judge._id, assignments)
                              );
                              setError(null);
                              setSuccess(null);
                            }}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(judge)}
                            disabled={deletingId === judge._id}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                          >
                            {deletingId === judge._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[960px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">School</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Trained</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {judges.map((judge) => {
                        const schoolName =
                          typeof judge.schoolId === 'string'
                            ? schools.find((school) => school._id === judge.schoolId)?.name
                            : judge.schoolId?.name;

                        return (
                          <tr key={judge._id} className="border-t border-white/10">
                            <td className="px-4 py-3 text-white">
                              <div>{judge.fullName}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                {(judgeCategoryMap.get(judge._id) || []).join(', ') ||
                                  'No categories assigned'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{schoolName || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{judge.email}</td>
                            <td className="px-4 py-3 text-slate-300">{judge.phone || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">
                              {judge.trainedJudge ? 'Yes' : 'No'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResetCredentials(judge)}
                                  disabled={resettingId === judge._id}
                                  className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 disabled:opacity-60"
                                >
                                  {resettingId === judge._id ? 'Sending...' : 'Reset Login'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(judge._id);
                                    setSelectedMentorCandidate('');
                                    setForm({
                                      fullName: judge.fullName,
                                      email: judge.email,
                                      phone: judge.phone || '',
                                      schoolId:
                                        typeof judge.schoolId === 'string'
                                          ? judge.schoolId
                                          : judge.schoolId?._id || '',
                                      trainedJudge: Boolean(judge.trainedJudge),
                                    });
                                    setSelectedCategoryIds(
                                      getAssignedCategoryIds(judge._id, assignments)
                                    );
                                    setError(null);
                                    setSuccess(null);
                                  }}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(judge)}
                                  disabled={deletingId === judge._id}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                                >
                                  {deletingId === judge._id ? 'Deleting...' : 'Delete'}
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
      </div>
    </DashboardLayout>
  );
}
