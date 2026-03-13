import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { CategoryModel } from '../models/Category';
import { JudgeCategoryAssignmentModel } from '../models/JudgeCategoryAssignment';
import { ProjectJudgeAssignmentModel } from '../models/ProjectJudgeAssignment';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { UserModel } from '../models/User';
import { assignEligibleProjectsToJudge } from '../services/judgeAssignment.service';
import {
  buildJudgeCredentialsSms,
  getJudgeLoginEmail,
  sendSms,
  SmsDispatchResult,
} from '../services/sms.service';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';

const generateTemporaryPassword = () =>
  `Judge${randomBytes(4).toString('hex')}!`;

const buildSmsFailure = (message: string): SmsDispatchResult => ({
  delivered: false,
  mode: 'disabled',
  message,
});

const resolveCategoryNames = async (categoryIds: string[]) => {
  if (categoryIds.length === 0) {
    return [];
  }

  const categories = await CategoryModel.find({ _id: { $in: categoryIds } })
    .select('name')
    .lean();

  return categories.map((category) => category.name);
};

const issueJudgeCredentials = async (judgeId: string) => {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  await UserModel.findByIdAndUpdate(judgeId, {
    passwordHash,
    mustChangePassword: true,
  });

  return {
    temporaryPassword,
  };
};

const dispatchJudgeCredentialsSms = async ({
  fullName,
  email,
  phone,
  temporaryPassword,
  categoryIds,
}: {
  fullName: string;
  email: string;
  phone?: string;
  temporaryPassword: string;
  categoryIds: string[];
}) => {
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedPhone) {
    return buildSmsFailure('Judge phone number is missing');
  }

  const categoryNames = await resolveCategoryNames(categoryIds);
  const smsMessage = buildJudgeCredentialsSms({
    fullName,
    email,
    temporaryPassword,
    categoryNames,
  });

  try {
    return await sendSms({
      to: normalizedPhone,
      message: smsMessage,
    });
  } catch (error: unknown) {
    return {
      delivered: false,
      mode: 'gateway' as const,
      message: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
};

export const listJudges = async (_req: Request, res: Response) => {
  const judges = await UserModel.find({ role: 'judge' }).select('-passwordHash').populate('schoolId', 'name');
  res.json(ok(judges));
};

export const getJudge = async (req: Request, res: Response) => {
  const judge = await UserModel.findOne({ _id: req.params.id, role: 'judge' }).select('-passwordHash').populate('schoolId', 'name');
  if (!judge) throw new ApiError(404, 'Judge not found');
  res.json(ok(judge));
};

export const createJudge = async (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phone,
    schoolId,
    trainedJudge,
    categoryIds,
    sendCredentialsSms = false,
  } = req.body;
  if (!fullName || !email || !schoolId) {
    throw new ApiError(400, 'Judge name, email and school are required');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();
  const targetCategoryIds = Array.from(
    new Set(
      (Array.isArray(categoryIds) ? categoryIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  if (sendCredentialsSms && !normalizedPhone) {
    throw new ApiError(400, 'Phone number is required to send judge credentials by SMS');
  }

  const school = await SchoolModel.findById(schoolId);
  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  if (targetCategoryIds.length > 0) {
    const categories = await CategoryModel.find({ _id: { $in: targetCategoryIds } })
      .select('_id')
      .lean();

    if (categories.length !== targetCategoryIds.length) {
      throw new ApiError(404, 'One or more selected categories were not found');
    }
  }

  const existingJudge = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (existingJudge) {
    throw new ApiError(409, 'Email already in use');
  }

  const temporaryPassword = generateTemporaryPassword();
  const judge = await UserModel.create({
    fullName,
    email: normalizedEmail,
    username: normalizedEmail,
    phone: normalizedPhone || undefined,
    passwordHash: await bcrypt.hash(temporaryPassword, 10),
    role: 'judge',
    schoolId,
    trainedJudge: trainedJudge ?? true,
    mustChangePassword: true,
  });

  if (targetCategoryIds.length > 0) {
    await Promise.all(
      targetCategoryIds.map((categoryId: string) =>
        JudgeCategoryAssignmentModel.findOneAndUpdate(
          { judgeId: judge._id, categoryId },
          {
            judgeId: judge._id,
            categoryId,
            active: true,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );
  }

  const projectAssignments =
    targetCategoryIds.length > 0
      ? await assignEligibleProjectsToJudge(String(judge._id), targetCategoryIds)
      : {
          judgeId: String(judge._id),
          categoryCount: 0,
          projectCount: 0,
          assignedCount: 0,
          message: 'No categories assigned',
        };

  let sms: SmsDispatchResult | undefined;
  const loginEmail = getJudgeLoginEmail(normalizedEmail);

  if (sendCredentialsSms) {
    sms = await dispatchJudgeCredentialsSms({
      fullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      temporaryPassword,
      categoryIds: targetCategoryIds,
    });
  }

  const safeJudge = await UserModel.findById(judge._id)
    .select('-passwordHash')
    .populate('schoolId', 'name');

  res.status(201).json(
    ok(
      {
        judge: safeJudge,
        credentials: {
          loginEmail,
          temporaryPassword,
        },
        sms,
        projectAssignments,
      },
      'Judge created'
    )
  );
};

export const resetJudgeCredentials = async (req: Request, res: Response) => {
  const judge = await UserModel.findOne({ _id: req.params.id, role: 'judge' });

  if (!judge) {
    throw new ApiError(404, 'Judge not found');
  }

  const categoryIds = (
    await JudgeCategoryAssignmentModel.find({
      judgeId: judge._id,
      active: { $ne: false },
    })
      .select('categoryId')
      .lean()
  ).map((assignment) => String(assignment.categoryId));

  const { temporaryPassword } = await issueJudgeCredentials(String(judge._id));
  const sms = await dispatchJudgeCredentialsSms({
    fullName: judge.fullName,
    email: judge.email,
    phone: judge.phone,
    temporaryPassword,
    categoryIds,
  });

  const safeJudge = await UserModel.findById(judge._id)
    .select('-passwordHash')
    .populate('schoolId', 'name');

  res.json(
    ok(
      {
        judge: safeJudge,
        credentials: {
          loginEmail: getJudgeLoginEmail(judge.email),
          temporaryPassword,
        },
        sms,
      },
      'Judge login credentials reset'
    )
  );
};

export const updateJudge = async (req: Request, res: Response) => {
  if (req.body?.schoolId) {
    const school = await SchoolModel.findById(req.body.schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }
  }

  const judge = await UserModel.findOneAndUpdate(
    { _id: req.params.id, role: 'judge' },
    req.body,
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .populate('schoolId', 'name');
  if (!judge) throw new ApiError(404, 'Judge not found');
  res.json(ok(judge, 'Judge updated'));
};

export const deleteJudge = async (req: Request, res: Response) => {
  const scoreCount = await ScoreModel.countDocuments({ judgeId: req.params.id });

  if (scoreCount > 0) {
    throw new ApiError(
      409,
      'This judge already has submitted scores and cannot be deleted'
    );
  }

  const judge = await UserModel.findOneAndDelete({ _id: req.params.id, role: 'judge' });
  if (!judge) throw new ApiError(404, 'Judge not found');

  await Promise.all([
    JudgeCategoryAssignmentModel.deleteMany({ judgeId: req.params.id }),
    ProjectJudgeAssignmentModel.deleteMany({ judgeId: req.params.id }),
  ]);

  res.json(ok(null, 'Judge deleted'));
};
