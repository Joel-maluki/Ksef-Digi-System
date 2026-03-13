import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserModel } from '../models/User';
import { SchoolModel } from '../models/School';
import { validateKenyaSchoolLocation } from '../services/kenyaAdministrativeUnits.service';
import { buildPasswordRecoverySms, sendSms } from '../services/sms.service';
import {
  buildUniqueSchoolCode,
  findExistingSchoolByIdentity,
  normalizeSchoolField,
} from '../services/schoolIdentity.service';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';
import { signJwt } from '../utils/jwt';

const normalizeEmail = (value: unknown) =>
  String(value || '').trim().toLowerCase();

const normalizeUsername = (value: unknown) =>
  String(value || '').trim().toLowerCase();

const normalizeText = (value: unknown) => String(value || '').trim();

const normalizePhoneForMatch = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 9) {
    return `0${digits}`;
  }

  if (digits.startsWith('254') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }

  return digits;
};

const generateTemporaryPassword = (role: 'judge' | 'patron') =>
  `${role === 'judge' ? 'Judge' : 'Patron'}${randomBytes(4).toString('hex')}!`;

const validatePassword = (password: unknown, label = 'Password') => {
  const normalizedPassword = String(password || '');

  if (normalizedPassword.length < 8) {
    throw new ApiError(400, `${label} must be at least 8 characters long`);
  }

  return normalizedPassword;
};

const formatUser = (user: any) => ({
  _id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  phone: user.phone,
  role: user.role,
  schoolId: user.schoolId,
  trainedJudge: !!user.trainedJudge,
  mustChangePassword: !!user.mustChangePassword,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const findIdentityConflict = async ({
  email,
  username,
}: {
  email?: string;
  username?: string;
}) => {
  const identities = Array.from(
    new Set([email, username].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))
  );

  if (identities.length === 0) {
    return null;
  }

  return UserModel.findOne({
    $or: identities.flatMap((identity) => [{ email: identity }, { username: identity }]),
  });
};

const findUserByIdentifier = async (identifier: string) => {
  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return UserModel.findOne(
    identifier.includes('@')
      ? {
          $or: [{ email: identifier }, { username: identifier }],
        }
      : {
          $or: [
            { username: identifier },
            { email: identifier },
            { email: { $regex: `^${escapedIdentifier}@`, $options: 'i' } },
          ],
        }
  );
};

const findUserByIdentifierAndRole = async (
  identifier: string,
  role: 'judge' | 'patron'
) => {
  const user = await findUserByIdentifier(identifier);

  if (!user || user.role !== role) {
    return null;
  }

  return user;
};

const createUser = async (req: Request, res: Response) => {
  const { fullName, email, username, phone, password, role, schoolId, trainedJudge } =
    req.body;

  const normalizedFullName = normalizeText(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const normalizedPhone = normalizeText(phone);
  const normalizedPassword = validatePassword(password);

  if (!normalizedFullName || !normalizedEmail || !normalizedPassword || !role) {
    throw new ApiError(400, 'fullName, email, password and role are required');
  }

  if (!['admin', 'patron', 'judge'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  if (role === 'patron' && !schoolId) {
    throw new ApiError(400, 'schoolId is required for patrons');
  }

  if (schoolId) {
    const school = await SchoolModel.findById(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }
  }

  const loginUsername =
    normalizedUsername || (role === 'judge' ? normalizedEmail : undefined);

  const existing = await findIdentityConflict({
    email: normalizedEmail,
    username: loginUsername,
  });

  if (existing) {
    throw new ApiError(409, 'Email or username already in use');
  }

  if (role === 'patron') {
    const existingPatron = await UserModel.findOne({ role: 'patron', schoolId });
    if (existingPatron) {
      throw new ApiError(409, 'This school already has a patron');
    }
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);

  const user = await UserModel.create({
    fullName: normalizedFullName,
    email: normalizedEmail,
    username: loginUsername || undefined,
    phone: normalizedPhone || undefined,
    passwordHash,
    role,
    schoolId,
    trainedJudge: !!trainedJudge,
  });

  res.status(201).json(ok({ user: formatUser(user) }, 'User created'));
};

export const registerAdmin = createUser;
export const registerPatron = createUser;
export const registerJudge = createUser;

export const registerSchool = async (req: Request, res: Response) => {
  const schoolName = normalizeSchoolField(req.body?.schoolName);
  const county = normalizeSchoolField(req.body?.county);
  const subCounty = normalizeSchoolField(req.body?.subCounty);
  const patronFullName = normalizeText(req.body?.patronFullName);
  const patronEmail = normalizeEmail(req.body?.patronEmail);
  const patronPhone = normalizeText(req.body?.patronPhone);
  const username = normalizeUsername(req.body?.username);
  const password = validatePassword(req.body?.password, 'Initial access password');

  if (
    !schoolName ||
    !county ||
    !subCounty ||
    !patronFullName ||
    !patronEmail ||
    !patronPhone ||
    !username
  ) {
    throw new ApiError(
      400,
      'School name, county, sub-county, patron name, patron email, patron phone, username and password are required'
    );
  }

  const location = validateKenyaSchoolLocation({ county, subCounty });
  const identityConflict = await findIdentityConflict({
    email: patronEmail,
    username,
  });

  if (identityConflict) {
    throw new ApiError(409, 'Email or username already in use');
  }

  let school = await findExistingSchoolByIdentity({
    name: schoolName,
    county: location.county,
    subCounty: location.subCounty,
  });

  if (school) {
    const existingPatron = await UserModel.findOne({
      role: 'patron',
      schoolId: school._id,
    }).lean();

    if (existingPatron) {
      throw new ApiError(409, 'This school already has a patron account');
    }
  } else {
    school = await SchoolModel.create({
      name: schoolName,
      county: location.county,
      subCounty: location.subCounty,
      region: location.region,
      active: true,
      code: await buildUniqueSchoolCode(schoolName),
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const patron = await UserModel.create({
    fullName: patronFullName,
    email: patronEmail,
    username,
    phone: patronPhone,
    passwordHash,
    role: 'patron',
    schoolId: school._id,
    mustChangePassword: true,
  });

  res.status(201).json(
    ok(
      {
        school,
        patron: formatUser(patron),
      },
      'School registered. Log in with the school username and initial password, then create the final patron password.'
    )
  );
};

export const login = async (req: Request, res: Response) => {
  const rawIdentifier = req.body?.identifier ?? req.body?.email ?? req.body?.username;
  const password = req.body?.password;
  const identifier = String(rawIdentifier || '').trim().toLowerCase();

  if (!identifier || !password) {
    throw new ApiError(400, 'Username or email and password are required');
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signJwt({
    userId: String(user._id),
    role: user.role,
    schoolId: user.schoolId ? String(user.schoolId) : undefined,
  });

  res.json(
    ok(
      { token, user: formatUser(user) },
      user.mustChangePassword ? 'Password setup required' : 'Login successful'
    )
  );
};

export const forgotPassword = async (req: Request, res: Response) => {
  const role = String(req.body?.role || '').trim().toLowerCase() as 'judge' | 'patron';
  const identifier = String(req.body?.identifier || '').trim().toLowerCase();
  const phone = normalizePhoneForMatch(req.body?.phone);
  const genericMessage =
    'If the details matched an active account, a temporary password has been sent to the registered phone number.';

  if (!['judge', 'patron'].includes(role) || !identifier || !phone) {
    throw new ApiError(400, 'Role, login identifier, and phone number are required');
  }

  const user = await findUserByIdentifierAndRole(identifier, role);

  if (
    !user ||
    !user.active ||
    !user.phone ||
    normalizePhoneForMatch(user.phone) !== phone
  ) {
    return res.json(ok(null, genericMessage));
  }

  const temporaryPassword = generateTemporaryPassword(role);
  const loginIdentifier = user.username || user.email;
  const sms = await sendSms({
    to: user.phone,
    message: buildPasswordRecoverySms({
      fullName: user.fullName,
      role,
      loginIdentifier,
      temporaryPassword,
    }),
  });

  if (!sms.delivered) {
    throw new ApiError(
      503,
      sms.message || 'We could not send the reset SMS right now. Please contact admin.'
    );
  }

  user.passwordHash = await bcrypt.hash(temporaryPassword, 10);
  user.mustChangePassword = true;
  await user.save();

  res.json(
    ok(
      {
        role,
        loginIdentifier,
      },
      'A temporary password has been sent by SMS. Use it to log in, then create a new password.'
    )
  );
};

export const me = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user?.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(ok({ user: formatUser(user) }));
};

export const setPassword = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user?.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = validatePassword(req.body?.newPassword, 'New password');

  if (!currentPassword) {
    throw new ApiError(400, 'Current password is required');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!valid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const reusingCurrentPassword = await bcrypt.compare(newPassword, user.passwordHash);

  if (reusingCurrentPassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();

  res.json(ok({ user: formatUser(user) }, 'Password updated'));
};
