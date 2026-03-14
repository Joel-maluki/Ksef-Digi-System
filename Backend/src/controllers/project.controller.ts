import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { ResultPublicationModel } from '../models/ResultPublication';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { UserModel } from '../models/User';
import { generateProjectCode } from '../utils/projectCode';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';
import { calculateCategoryRanking } from '../services/ranking.service';
import { autoAssignJudgesForProject } from '../services/judgeAssignment.service';
import {
  adminCanAccessProject,
  buildScopedProjectFilter,
} from '../services/adminScope.service';

type SchoolSnapshot = {
  _id?: unknown;
  name: string;
  subCounty: string;
  county: string;
  region: string;
};

type StudentInput = {
  fullName?: unknown;
  gender?: unknown;
  classForm?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeProjectTitle = (value: unknown) => {
  const title = String(value || '').trim();

  if (!title) {
    throw new ApiError(400, 'Project title is required');
  }

  return title;
};

const normalizeMentorFields = (payload: {
  mentorName?: unknown;
  mentorEmail?: unknown;
  mentorPhone?: unknown;
}) => {
  const mentorName = String(payload.mentorName || '').trim();
  const mentorEmail = String(payload.mentorEmail || '').trim().toLowerCase();
  const mentorPhone = String(payload.mentorPhone || '').trim();

  if (!mentorName || !mentorEmail || !mentorPhone) {
    throw new ApiError(400, 'Mentor name, email and phone are required');
  }

  if (!emailPattern.test(mentorEmail)) {
    throw new ApiError(400, 'Mentor email must be a valid email address');
  }

  return {
    mentorName,
    mentorEmail,
    mentorPhone,
  };
};

const normalizeStudents = (students: unknown, school: SchoolSnapshot) => {
  if (!Array.isArray(students) || students.length < 1 || students.length > 2) {
    throw new ApiError(400, 'Projects must have 1 or 2 students');
  }

  return students.map((student, index) => {
    const studentInput = (student || {}) as StudentInput;
    const fullName = String(studentInput.fullName || '').trim();
    const classForm = String(studentInput.classForm || '').trim();
    const gender = String(studentInput.gender || '').trim();

    if (!fullName || !classForm || !['Male', 'Female'].includes(gender)) {
      throw new ApiError(
        400,
        `Student ${index + 1} must include full name, gender, and class/form`
      );
    }

    return {
      fullName,
      gender,
      classForm,
      schoolName: school.name,
      subCounty: school.subCounty,
      county: school.county,
      region: school.region,
    };
  });
};

const loadSchoolForProject = async (schoolId: unknown) => {
  const school = await SchoolModel.findById(schoolId).lean<SchoolSnapshot | null>();

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return school;
};

const getParamId = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const ensureAdminProjectAccess = async (req: Request, projectId: string) => {
  if (req.user?.role !== 'admin') {
    return;
  }

  const allowed = await adminCanAccessProject(projectId, req.adminScope);

  if (!allowed) {
    throw new ApiError(
      403,
      'This project is outside your assigned competition area or level'
    );
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { title, categoryId, abstractPdfUrl, currentLevel, students } = req.body;

  if (!req.user || req.user.role !== 'patron') throw new ApiError(403, 'Only patrons can submit projects');
  if (!title || !categoryId || !students) throw new ApiError(400, 'Missing required fields');
  if (!req.user.schoolId) throw new ApiError(400, 'Patron account is not linked to a school');

  const category = await CategoryModel.findById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');
  const school = await loadSchoolForProject(req.user.schoolId);
  const mentor = normalizeMentorFields(req.body);
  const normalizedStudents = normalizeStudents(students, school);

  const projectCode = await generateProjectCode(category.code);
  const project = await ProjectModel.create({
    projectCode,
    title: normalizeProjectTitle(title),
    categoryId,
    ...mentor,
    abstractPdfUrl: String(abstractPdfUrl || '').trim(),
    currentLevel: currentLevel || 'sub_county',
    patronId: req.user.userId,
    schoolId: req.user.schoolId,
    students: normalizedStudents,
  });

  try {
    await autoAssignJudgesForProject(String(project._id));
  } catch (error) {
    console.error('Automatic judge assignment failed for project', project._id, error);
  }

  res.status(201).json(ok(project, 'Project submitted'));
};

export const listProjects = async (req: Request, res: Response) => {
  let query: any = {};
  if (req.query.categoryId) query.categoryId = req.query.categoryId;
  if (req.query.currentLevel) query.currentLevel = req.query.currentLevel;
  if (req.query.status) query.submissionStatus = req.query.status;
  if (req.user?.role === 'patron') query.patronId = req.user.userId;

  const schoolFilter: Record<string, unknown> = {};

  if (typeof req.query.schoolId === 'string' && req.query.schoolId) {
    schoolFilter._id = req.query.schoolId;
  }

  if (typeof req.query.subCounty === 'string' && req.query.subCounty) {
    schoolFilter.subCounty = req.query.subCounty;
  }

  if (typeof req.query.county === 'string' && req.query.county) {
    schoolFilter.county = req.query.county;
  }

  if (typeof req.query.region === 'string' && req.query.region) {
    schoolFilter.region = req.query.region;
  }

  if (Object.keys(schoolFilter).length > 0) {
    const schools = await SchoolModel.find(schoolFilter).select('_id').lean();
    query.schoolId = { $in: schools.map((school) => school._id) };
  }

  if (req.user?.role === 'admin') {
    query = await buildScopedProjectFilter(req.adminScope, query);
  }

  const projects = await ProjectModel.find(query)
    .populate('categoryId', 'name code')
    .populate('schoolId', 'name subCounty county region')
    .sort({ createdAt: -1 });
  res.json(ok(projects));
};

export const getProject = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId)
    .populate('categoryId', 'name code')
    .populate('schoolId', 'name subCounty county region');
  if (!project) throw new ApiError(404, 'Project not found');
  await ensureAdminProjectAccess(req, projectId);
  res.json(ok(project));
};

export const updateProject = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (req.user?.role === 'patron' && String(project.patronId) !== req.user.userId) throw new ApiError(403, 'Forbidden');
  await ensureAdminProjectAccess(req, projectId);

  const updates: Record<string, unknown> = { ...req.body };
  const school = await loadSchoolForProject(project.schoolId);

  if ('title' in req.body) {
    updates.title = normalizeProjectTitle(req.body.title);
  }

  if ('abstractPdfUrl' in req.body) {
    updates.abstractPdfUrl = String(req.body.abstractPdfUrl || '').trim();
  }

  if ('students' in req.body) {
    updates.students = normalizeStudents(req.body.students, school);
  }

  if (
    'mentorName' in req.body ||
    'mentorEmail' in req.body ||
    'mentorPhone' in req.body
  ) {
    Object.assign(
      updates,
      normalizeMentorFields({
        mentorName: req.body.mentorName ?? project.mentorName,
        mentorEmail: req.body.mentorEmail ?? project.mentorEmail,
        mentorPhone: req.body.mentorPhone ?? project.mentorPhone,
      })
    );
  }

  const updated = await ProjectModel.findByIdAndUpdate(projectId, updates, {
    new: true,
    runValidators: true,
  });
  res.json(ok(updated, 'Project updated'));
};

export const deleteProject = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  if (req.user?.role === 'patron' && String(project.patronId) !== req.user.userId) throw new ApiError(403, 'Forbidden');
  await ensureAdminProjectAccess(req, projectId);
  await project.deleteOne();
  res.json(ok(null, 'Project deleted'));
};

export const promoteProject = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  await ensureAdminProjectAccess(req, projectId);
  if (project.currentLevel === 'national') {
    throw new ApiError(400, 'National-level projects cannot be promoted further');
  }
  const nextMap: Record<'sub_county' | 'county' | 'regional' | 'national', 'county' | 'regional' | 'national'> = {
    sub_county: 'county',
    county: 'regional',
    regional: 'national',
    national: 'national',
  };
  project.currentLevel = nextMap[project.currentLevel as keyof typeof nextMap];
  project.qualifiedForNextLevel = true;
  project.submissionStatus = 'qualified';
  await project.save();
  res.json(ok(project, 'Project promoted'));
};

export const reopenProjectScoring = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  await ensureAdminProjectAccess(req, projectId);

  const [scoreResult, assignmentResult] = await Promise.all([
    ScoreModel.updateMany({ projectId: project._id }, { locked: false }),
    ProjectJudgeAssignmentModel.updateMany(
      { projectId: project._id, assignmentStatus: 'completed' },
      { assignmentStatus: 'assigned' }
    ),
  ]);

  await ResultPublicationModel.findOneAndUpdate(
    {
      categoryId: project.categoryId,
      competitionLevel: project.currentLevel,
    },
    {
      published: false,
    }
  );

  await ProjectModel.updateMany(
    { categoryId: project.categoryId, currentLevel: project.currentLevel },
    { published: false }
  );

  if (project.submissionStatus === 'published') {
    project.submissionStatus = 'submitted';
    project.published = false;
    await project.save();
  }

  res.json(
    ok(
      {
        projectId: String(project._id),
        unlockedScores: scoreResult.modifiedCount,
        reopenedAssignments: assignmentResult.modifiedCount,
      },
      'Project scoring reopened'
    )
  );
};

export const getProjectRankingSummary = async (req: Request, res: Response) => {
  const projectId = getParamId(req.params.id);
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  await ensureAdminProjectAccess(req, projectId);
  const rankings = await calculateCategoryRanking(String(project.categoryId), project.currentLevel);
  const summary = rankings.find((item) => item.projectId === String(project._id));
  res.json(ok(summary));
};

export const listProjectMentorCandidates = async (req: Request, res: Response) => {
  const projectFilter = await buildScopedProjectFilter(req.adminScope, {
    mentorName: { $exists: true, $ne: '' },
    mentorEmail: { $exists: true, $ne: '' },
  });

  const projects = await ProjectModel.find(projectFilter)
    .select('mentorName mentorEmail mentorPhone schoolId projectCode title')
    .populate('schoolId', 'name')
    .lean<
      Array<{
        mentorName?: string;
        mentorEmail?: string;
        mentorPhone?: string;
        projectCode?: string;
        title?: string;
        schoolId?:
          | string
          | {
              _id?: unknown;
              name?: string;
            };
      }>
    >();

  const mentorEmails = Array.from(
    new Set(
      projects
        .map((project) => String(project.mentorEmail || '').trim().toLowerCase())
        .filter(Boolean)
    )
  );

  const existingJudges = await UserModel.find({
    role: 'judge',
    email: { $in: mentorEmails },
  })
    .select('_id email schoolId trainedJudge active')
    .lean<
      Array<{
        _id: unknown;
        email?: string;
        schoolId?: unknown;
        trainedJudge?: boolean;
        active?: boolean;
      }>
    >();

  const judgeMap = new Map(
    existingJudges.map((judge) => [
      `${String(judge.schoolId || '')}:${String(judge.email || '').trim().toLowerCase()}`,
      judge,
    ])
  );

  const grouped = new Map<
    string,
    {
      fullName: string;
      email: string;
      phone: string;
      schoolId: string;
      schoolName: string;
      projectCount: number;
      projectCodes: string[];
      existingJudgeId?: string;
      trainedJudge: boolean;
      activeJudge: boolean;
    }
  >();

  projects.forEach((project) => {
    const schoolId =
      typeof project.schoolId === 'string'
        ? project.schoolId
        : String(project.schoolId?._id || '');
    const schoolName =
      typeof project.schoolId === 'string' ? '' : String(project.schoolId?.name || '');
    const email = String(project.mentorEmail || '').trim().toLowerCase();

    if (!schoolId || !email) {
      return;
    }

    const key = `${schoolId}:${email}`;
    const existingJudge = judgeMap.get(key);
    const current = grouped.get(key);

    if (current) {
      current.projectCount += 1;

      if (project.projectCode) {
        current.projectCodes.push(project.projectCode);
      }

      return;
    }

    grouped.set(key, {
      fullName: String(project.mentorName || '').trim(),
      email,
      phone: String(project.mentorPhone || '').trim(),
      schoolId,
      schoolName,
      projectCount: 1,
      projectCodes: project.projectCode ? [project.projectCode] : [],
      existingJudgeId: existingJudge ? String(existingJudge._id) : undefined,
      trainedJudge: Boolean(existingJudge?.trainedJudge),
      activeJudge: Boolean(existingJudge?.active),
    });
  });

  const mentorCandidates = Array.from(grouped.values()).sort(
    (a, b) =>
      a.schoolName.localeCompare(b.schoolName) ||
      a.fullName.localeCompare(b.fullName)
  );

  res.json(ok(mentorCandidates));
};
