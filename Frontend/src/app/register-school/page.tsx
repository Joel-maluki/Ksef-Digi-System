'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BackendKenyaAdministrativeUnits,
  getKenyaAdministrativeUnits,
  registerSchoolAccount,
} from '@/lib/api';

type RegistrationForm = {
  schoolName: string;
  region: string;
  county: string;
  subCounty: string;
  patronFullName: string;
  patronEmail: string;
  patronPhone: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const initialForm: RegistrationForm = {
  schoolName: '',
  region: '',
  county: '',
  subCounty: '',
  patronFullName: '',
  patronEmail: '',
  patronPhone: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<BackendKenyaAdministrativeUnits | null>(null);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        setLocations(await getKenyaAdministrativeUnits());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !form.schoolName ||
      !form.region ||
      !form.county ||
      !form.subCounty ||
      !form.patronFullName ||
      !form.patronEmail ||
      !form.patronPhone ||
      !form.username ||
      !form.password
    ) {
      setError('Fill in the school, patron, and school-login details before submitting.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Initial password and confirmation do not match.');
      return;
    }

    setSaving(true);

    try {
      const result = await registerSchoolAccount({
        schoolName: form.schoolName,
        region: form.region,
        county: form.county,
        subCounty: form.subCounty,
        patronFullName: form.patronFullName,
        patronEmail: form.patronEmail,
        patronPhone: form.patronPhone,
        username: form.username,
        password: form.password,
      });

      setSuccess(
        result.message ||
          'School account created. Log in with the school username and initial password, then create the final patron password.'
      );
      setForm(initialForm);
      window.setTimeout(() => router.push('/login'), 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              <BadgeCheck className="h-4 w-4" />
              One school, one patron account
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-white">Register Your School</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Create the school patron account once, using a school username and initial
              password. After the first login, the patron will be required to create the
              final password before entering projects.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <p>- Each school can only have one patron account.</p>
              <p>- Patron projects are automatically linked to that school.</p>
              <p>- The patron may also appear as a mentor on some projects.</p>
              <p>- Judges are later trained and assigned separately by admin.</p>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Already registered?{' '}
              <Link href="/login" className="text-blue-200 hover:text-white">
                Log in here
              </Link>
              .
            </p>
          </div>

          <Card className="surface p-2">
            <CardHeader>
              <CardTitle className="text-2xl text-white">School Registration Form</CardTitle>
              <p className="text-sm text-slate-400">
                Use the official Kenya region, county, and sub-county structure.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  Loading registration form...
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm text-slate-300">School Name</label>
                      <Input
                        value={form.schoolName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, schoolName: event.target.value }))
                        }
                        placeholder="Ngao Girls High School"
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Region</label>
                      <select
                        value={form.region}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            region: event.target.value,
                            county: '',
                            subCounty: '',
                          }))
                        }
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
                            subCounty: '',
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

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm text-slate-300">Sub-County</label>
                      <select
                        value={form.subCounty}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, subCounty: event.target.value }))
                        }
                        disabled={!selectedCounty}
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none disabled:opacity-70"
                      >
                        <option value="" className="bg-slate-900">
                          {selectedCounty ? 'Select sub-county' : 'Select county first'}
                        </option>
                        {selectedCounty?.subCounties.map((subCounty) => (
                          <option key={subCounty} value={subCounty} className="bg-slate-900">
                            {subCounty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Patron Full Name</label>
                      <Input
                        value={form.patronFullName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            patronFullName: event.target.value,
                          }))
                        }
                        placeholder="Teacher in charge / patron"
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Patron Email</label>
                      <Input
                        type="email"
                        value={form.patronEmail}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            patronEmail: event.target.value,
                          }))
                        }
                        placeholder="patron@school.ac.ke"
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">Patron Phone</label>
                      <Input
                        value={form.patronPhone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            patronPhone: event.target.value,
                          }))
                        }
                        placeholder="0712345678"
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">School Username</label>
                      <Input
                        value={form.username}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, username: event.target.value }))
                        }
                        placeholder="ngao-girls"
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Initial Access Password
                      </label>
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Confirm Initial Password
                      </label>
                      <Input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className="border-white/10 bg-white/5 text-white"
                      />
                    </div>
                  </div>

                  {error ? <p className="text-sm text-red-300">{error}</p> : null}
                  {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500"
                  >
                    {saving ? 'Registering...' : 'Register School'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
