'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  BackendCategory,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type CategoryForm = {
  name: string;
  code: string;
  description: string;
};

const initialForm: CategoryForm = {
  name: '',
  code: '',
  description: '',
};

const toCategoryForm = (category: BackendCategory): CategoryForm => ({
  name: category.name,
  code: category.code,
  description: category.description || '',
});

export default function AdminCategoriesPage() {
  const { loading: authLoading } = useRequireAuth();
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      setCategories(await listCategories());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadCategories();
    }
  }, [authLoading]);

  const title = useMemo(
    () => (editingId ? 'Edit Category' : 'Add Category'),
    [editingId]
  );

  const submitLabel = useMemo(
    () => (saving ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'),
    [editingId, saving]
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name || !form.code) {
      setError('Category name and code are required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        code: form.code.toUpperCase(),
        description: form.description,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        setSuccess('Category updated successfully.');
      } else {
        await createCategory(payload);
        setSuccess('Category added successfully.');
      }

      resetForm();
      await loadCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: BackendCategory) => {
    const confirmed = window.confirm(`Delete ${category.name}?`);

    if (!confirmed) return;

    setDeletingId(category._id);
    setError(null);
    setSuccess(null);

    try {
      await deleteCategory(category._id);

      if (editingId === category._id) {
        resetForm();
      }

      setSuccess('Category deleted successfully.');
      await loadCategories();
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
          <h1 className="section-title">Categories</h1>
          <p className="section-copy mt-2">
            Manage the science fair categories available for project submission and
            ranking.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          <div className="surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Use the official short code for each KSEF category.
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
                <label className="mb-2 block text-sm text-slate-300">Category Name</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Computer Science"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Code</label>
                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                  placeholder="CS"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm uppercase text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional description for admins"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
                />
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
              <h2 className="text-lg font-semibold text-white">Category List</h2>
              <p className="mt-1 text-sm text-slate-400">
                {categories.length} categories currently available.
              </p>
            </div>

            {authLoading || loading ? (
              <div className="px-4 py-6 text-slate-300">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-6 text-slate-300">
                No categories have been created yet.
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 md:hidden">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <p className="font-semibold text-white">{category.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-blue-200">
                          {category.code}
                        </p>
                      </div>
                      {category.description ? (
                        <p className="mt-3 text-sm text-slate-300">{category.description}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(category._id);
                            setForm(toCategoryForm(category));
                            setError(null);
                            setSuccess(null);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category._id}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                        >
                          {deletingId === category._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[640px] text-sm">
                    <thead className="bg-white/5 text-left text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Category Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category._id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">
                            <div>{category.name}</div>
                            {category.description ? (
                              <div className="mt-1 text-xs text-slate-400">
                                {category.description}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{category.code}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(category._id);
                                  setForm(toCategoryForm(category));
                                  setError(null);
                                  setSuccess(null);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(category)}
                                disabled={deletingId === category._id}
                                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-60"
                              >
                                {deletingId === category._id ? 'Deleting...' : 'Delete'}
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
