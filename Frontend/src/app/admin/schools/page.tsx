'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendKenyaAdministrativeUnits,
  BackendSchool,
  createSchool,
  getKenyaAdministrativeUnits,
  deleteSchool,
  listSchools,
  updateSchool,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type SchoolForm = {
  name: string;
  subCounty: string;
  county: string;
  region: string;
};

const initialForm: SchoolForm = {
  name: '',
  subCounty: '',
  county: '',
  region: '',
};

const toSchoolForm = (school: BackendSchool): SchoolForm => ({
  name: school.name,
  subCounty: school.subCounty || '',
  county: school.county || '',
  region: school.region || '',
});

export default function AdminSchoolsPage() {
  const { loading: authLoading } = useRequireAuth();
  const [schools, setSchools] = useState<BackendSchool[]>([]);
  const [locations, setLocations] = useState<BackendKenyaAdministrativeUnits | null>(null);
  const [form, setForm] = useState<SchoolForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSchools = async () => {
    setLoading(true);
    setError(null);

    try {
      const [schoolData, locationData] = await Promise.all([
        listSchools(),
        getKenyaAdministrativeUnits(),
      ]);

      setSchools(schoolData);
      setLocations(locationData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadSchools();
    }
  }, [authLoading]);

  const title = useMemo(
    () => (editingId ? 'Edit School' : 'Add School'),
    [editingId]
  );

  const submitLabel = useMemo(
    () => (saving ? 'Saving...' : editingId ? 'Update School' : 'Add School'),
    [editingId, saving]
  );

  const regionOptions = useMemo(
    () => locations?.regions.map((region) => region.name) || [],
    [locations]
  );

  const countyOptions = useMemo(() => {
    if (!locations) return [];

    return locations.counties.filter(
      (county) => !form.region || county.region === form.region
    );
  }, [form.region, locations]);

  const selectedCounty = useMemo(
    () => locations?.counties.find((county) => county.name === form.county) || null,
    [form.county, locations]
  );

  const hasLegacySubCounty = Boolean(
    form.subCounty &&
      selectedCounty &&
      !selectedCounty.subCounties.includes(form.subCounty)
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name || !form.subCounty || !form.county) {
      setError('School name, sub-county, and county are required.');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateSchool(editingId, form);
        setSuccess('School updated successfully.');
      } else {
        await createSchool(form);
        setSuccess('School added successfully.');
      }

      resetForm();
      await loadSchools();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (school: BackendSchool) => {
    const confirmed = window.confirm(`Delete ${school.name}?`);

    if (!confirmed) return;

    setDeletingId(school._id);
    setError(null);
    setSuccess(null);

    try {
      await deleteSchool(school._id);

      if (editingId === school._id) {
        resetForm();
      }

      setSuccess('School deleted successfully.');
      await loadSchools();
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
          <h1 className="section-title">Schools</h1>
          <p className="section-copy mt-2">
            Register and manage all schools participating in the competition.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          <div className="surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  School codes are generated automatically when the record is created.
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
                <label className="mb-2 block text-sm text-slate-300">School Name</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ngao Girls High School"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Region</label>
                <select
                  value={form.region}
                  onChange={(event) => {
                    const nextRegion = event.target.value;

                    setForm((current) => {
                      const currentCounty = locations?.counties.find(
                        (county) => county.name === current.county
                      );
                      const countyMatchesRegion =
                        currentCounty && currentCounty.region === nextRegion;

                      return {
                        ...current,
                        region: nextRegion,
                        county: countyMatchesRegion ? current.county : '',
                        subCounty:
                          countyMatchesRegion &&
                          currentCounty?.subCounties.includes(current.subCounty)
                            ? current.subCounty
                            : '',
                      };
                    });
                  }}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                >
                  <option value="" className="bg-slate-900">
                    Select region
                  </option>
                  {regionOptions.map((region) => (
                    <option key={region} value={region} className="bg-slate-900">
                      {region}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Kenya currently has 8 former provinces and 47 counties.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">County</label>
                <select
                  value={form.county}
                  onChange={(event) => {
                    const nextCounty = event.target.value;
                    const countyRecord = locations?.counties.find(
                      (county) => county.name === nextCounty
                    );

                    setForm((current) => ({
                      ...current,
                      county: nextCounty,
                      region: countyRecord?.region || current.region,
                      subCounty: countyRecord?.subCounties.includes(current.subCounty)
                        ? current.subCounty
                        : '',
                    }));
                  }}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                >
                  <option value="" className="bg-slate-900">
                    Select county
                  </option>
                  {countyOptions.map((county) => (
                    <option key={county.name} value={county.name} className="bg-slate-900">
                      {county.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Sub County</label>
                <select
                  value={form.subCounty}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subCounty: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                  disabled={!selectedCounty}
                >
                  <option value="" className="bg-slate-900">
                    {selectedCounty ? 'Select sub-county' : 'Select county first'}
                  </option>
                  {hasLegacySubCounty ? (
                    <option value={form.subCounty} className="bg-slate-900">
                      {form.subCounty} (saved value)
                    </option>
                  ) : null}
                  {selectedCounty?.subCounties.map((subCounty) => (
                    <option key={subCounty} value={subCounty} className="bg-slate-900">
                      {subCounty}
                    </option>
                  ))}
                </select>
                {hasLegacySubCounty ? (
                  <p className="mt-2 text-xs text-amber-300">
                    This school is using an older saved sub-county value. Pick a current
                    sub-county to update it.
                  </p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLabel}
              </button>
            </form>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-white/10 px-4 py-4">
              <h2 className="text-lg font-semibold text-white">Registered Schools</h2>
              <p className="mt-1 text-sm text-slate-400">
                {schools.length} schools currently available to patrons and judges.
              </p>
            </div>

            {authLoading || loading ? (
              <div className="px-4 py-6 text-slate-300">Loading schools...</div>
            ) : schools.length === 0 ? (
              <div className="px-4 py-6 text-slate-300">No schools have been added yet.</div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {schools.map((school) => (
                    <div
                      key={school._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="font-semibold text-white">{school.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {school.code || 'Pending code'}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Sub-County
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{school.subCounty || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            County
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{school.county || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Region
                          </p>
                          <p className="mt-1 text-sm text-slate-200">{school.region || '-'}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(school._id);
                            setForm(toSchoolForm(school));
                            setError(null);
                            setSuccess(null);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(school)}
                          disabled={deletingId === school._id}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                        >
                          {deletingId === school._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[760px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">School</th>
                        <th className="px-4 py-3">Sub-County</th>
                        <th className="px-4 py-3">County</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map((school) => (
                        <tr key={school._id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">
                            <div>{school.name}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {school.code || 'Pending code'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{school.subCounty || '-'}</td>
                          <td className="px-4 py-3 text-slate-300">{school.county || '-'}</td>
                          <td className="px-4 py-3 text-slate-300">{school.region || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(school._id);
                                  setForm(toSchoolForm(school));
                                  setError(null);
                                  setSuccess(null);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(school)}
                                disabled={deletingId === school._id}
                                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                              >
                                {deletingId === school._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
