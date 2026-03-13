'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BackendCategory,
  BackendSchool,
  createProject,
  CreateProjectPayload,
  getSchool,
  listCategories,
} from '@/lib/api';
import { competitionLevels, formatCompetitionLevel } from '@/lib/ksef';
import { useRequireAuth } from '@/lib/useRequireAuth';

type StudentForm = {
  fullName: string;
  gender: 'Male' | 'Female';
  classForm: string;
};

const createStudent = (): StudentForm => ({
  fullName: '',
  gender: 'Female',
  classForm: '',
});

export default function PatronSubmitProjectPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [school, setSchool] = useState<BackendSchool | null>(null);
  const [title, setTitle] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [abstractPdfUrl, setAbstractPdfUrl] = useState('');
  const [currentLevel] = useState<CreateProjectPayload['currentLevel']>('sub_county');
  const [students, setStudents] = useState<StudentForm[]>([createStudent()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const categoryData = await listCategories();
        setCategories(categoryData);
        setCategoryId(categoryData[0]?._id || '');
        setMentorName(user.fullName);
        setMentorEmail(user.email || '');
        setMentorPhone(user.phone || '');

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

  const schoolLocationReady = useMemo(
    () => !!school?.name && !!school.subCounty && !!school.county && !!school.region,
    [school]
  );
  const hasCategories = categories.length > 0;

  const updateStudent = (
    index: number,
    key: keyof StudentForm,
    value: StudentForm[keyof StudentForm]
  ) => {
    setStudents((current) =>
      current.map((student, studentIndex) =>
        studentIndex === index
          ? {
              ...student,
              [key]: value,
            }
          : student
      )
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!title || !mentorName || !mentorEmail || !mentorPhone || !categoryId) {
      setError('Project title, mentor name, mentor email, mentor phone, and category are required.');
      return;
    }

    if (!school || !schoolLocationReady) {
      setError('Your school details are incomplete. Please contact the admin.');
      return;
    }

    if (students.some((student) => !student.fullName || !student.classForm)) {
      setError('Each student must have a full name and class or form.');
      return;
    }

    setSaving(true);

    try {
      await createProject({
        title,
        categoryId,
        mentorName,
        mentorEmail,
        mentorPhone,
        currentLevel,
        abstractPdfUrl,
        students: students.map((student) => ({
          fullName: student.fullName,
          gender: student.gender,
          classForm: student.classForm,
          schoolName: school.name,
          subCounty: school.subCounty || '',
          county: school.county || '',
          region: school.region || '',
        })),
      });

      setSuccess('Project submitted successfully.');
      setTitle('');
      setAbstractPdfUrl('');
      setStudents([createStudent()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="patron">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="section-title">Submit Project</h1>
          <p className="section-copy mt-2">
            Your school is linked automatically from your patron account, so you never
            need to choose the school again here. Projects can have up to two student
            presenters from that same school only, and every project must name the
            same-school teacher mentor whose contact can later be used for judge
            onboarding after training.
          </p>
        </div>

        {authLoading || loading ? (
          <div className="surface p-6 text-slate-300">Loading submission form...</div>
        ) : (
          <>
            <div className="surface p-6">
              <h2 className="text-xl font-semibold text-white">Project Information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Project Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Mentor</label>
                  <Input
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Mentor Email</label>
                  <Input
                    type="email"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    placeholder="teacher@school.ac.ke"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Mentor Phone</label>
                  <Input
                    value={mentorPhone}
                    onChange={(e) => setMentorPhone(e.target.value)}
                    placeholder="0712345678"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={!hasCategories}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {hasCategories ? (
                      categories.map((category) => (
                        <option key={category._id} value={category._id} className="bg-slate-900">
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-slate-900">
                        No categories configured yet
                      </option>
                    )}
                  </select>
                  {!hasCategories ? (
                    <p className="mt-2 text-xs text-amber-300">
                      An admin needs to add project categories before submissions can be made.
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Competition Level</label>
                  <Input
                    value={
                      competitionLevels.find((level) => level.value === currentLevel)?.label ||
                      formatCompetitionLevel(currentLevel)
                    }
                    readOnly
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-300">
                    Project Abstract PDF URL (optional)
                  </label>
                  <Input
                    value={abstractPdfUrl}
                    onChange={(e) => setAbstractPdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>
            </div>

            {students.map((student, index) => (
              <div key={index} className="surface p-6">
                <h2 className="text-xl font-semibold text-white">
                  Student {index + 1} Information
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Full Name</label>
                    <Input
                      value={student.fullName}
                      onChange={(e) => updateStudent(index, 'fullName', e.target.value)}
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Gender</label>
                    <select
                      value={student.gender}
                      onChange={(e) =>
                        updateStudent(index, 'gender', e.target.value as StudentForm['gender'])
                      }
                      className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white"
                    >
                      <option value="Female" className="bg-slate-900">
                        Female
                      </option>
                      <option value="Male" className="bg-slate-900">
                        Male
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Class / Form</label>
                    <Input
                      value={student.classForm}
                      onChange={(e) => updateStudent(index, 'classForm', e.target.value)}
                      placeholder="Form 3"
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">School Name</label>
                    <Input
                      value={school?.name || ''}
                      readOnly
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Sub-County</label>
                    <Input
                      value={school?.subCounty || ''}
                      readOnly
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">County</label>
                    <Input
                      value={school?.county || ''}
                      readOnly
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Region</label>
                    <Input
                      value={school?.region || ''}
                      readOnly
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="surface p-5 text-sm text-slate-300">
              <p className="font-medium text-white">Submission Rules</p>
              <ul className="mt-3 space-y-2">
                <li>- Maximum 2 students per project.</li>
                <li>- All students are linked automatically to your school account.</li>
                <li>- Every project must include a same-school teacher mentor with email and phone.</li>
                <li>- Mentor details are used when the admin later prepares trained judges.</li>
                <li>- PDF uploads are handled as hosted links for now.</li>
                <li>- Project code will be generated automatically after submission.</li>
              </ul>
            </div>

            {error ? <div className="surface p-4 text-sm text-red-300">{error}</div> : null}
            {success ? <div className="surface p-4 text-sm text-emerald-300">{success}</div> : null}

            <div className="flex flex-wrap gap-3">
              {students.length < 2 ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                  onClick={() => setStudents((current) => [...current, createStudent()])}
                >
                  Add Second Student
                </Button>
              ) : null}
              {students.length > 1 ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/5 text-slate-200"
                  onClick={() => setStudents((current) => current.slice(0, 1))}
                >
                  Remove Second Student
                </Button>
              ) : null}
              <Button
                className="rounded-xl bg-blue-600 hover:bg-blue-500"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Project'}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
