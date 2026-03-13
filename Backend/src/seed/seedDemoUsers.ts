import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { SchoolModel } from '../models/School';
import { UserModel } from '../models/User';

const demoCredentials = {
  admin: {
    fullName: 'KSEF System Admin',
    email: 'admin@ksef.ke',
    password: 'Admin123!',
    phone: '+254700000001',
  },
  patron: {
    fullName: 'Madam Phanice Waliora',
    email: 'patron@ngao.ac.ke',
    password: 'Patron123!',
    phone: '+254700000002',
  },
  judge: {
    fullName: 'Mr. Hussein Juma',
    email: 'judge@holaboys.ac.ke',
    password: 'Judge123!',
    phone: '+254700000003',
  },
} as const;

const demoSchools = {
  patronSchool: {
    name: 'Ngao Girls High School',
    code: 'NGAO001',
    subCounty: 'Tana Delta',
    county: 'Tana River',
    region: 'Coast',
    active: true,
  },
  judgeSchool: {
    name: 'Hola Boys Secondary School',
    code: 'HOLA001',
    subCounty: 'Galole',
    county: 'Tana River',
    region: 'Coast',
    active: true,
  },
} as const;

const upsertSchool = async (school: (typeof demoSchools)[keyof typeof demoSchools]) => {
  return SchoolModel.findOneAndUpdate(
    { code: school.code },
    { $set: school },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const upsertUser = async ({
  fullName,
  email,
  password,
  phone,
  role,
  schoolId,
  trainedJudge,
}: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'patron' | 'judge';
  schoolId?: string;
  trainedJudge?: boolean;
}) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        email,
        phone,
        passwordHash,
        role,
        schoolId,
        trainedJudge: !!trainedJudge,
        active: true,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const run = async () => {
  await connectDb();

  const patronSchool = await upsertSchool(demoSchools.patronSchool);
  const judgeSchool = await upsertSchool(demoSchools.judgeSchool);

  await upsertUser({
    ...demoCredentials.admin,
    role: 'admin',
  });

  await upsertUser({
    ...demoCredentials.patron,
    role: 'patron',
    schoolId: String(patronSchool._id),
  });

  await upsertUser({
    ...demoCredentials.judge,
    role: 'judge',
    schoolId: String(judgeSchool._id),
    trainedJudge: true,
  });

  console.log('Demo users seeded successfully');
  console.log('');
  console.log(`Admin  -> ${demoCredentials.admin.email} / ${demoCredentials.admin.password}`);
  console.log(`Patron -> ${demoCredentials.patron.email} / ${demoCredentials.patron.password}`);
  console.log(`Judge  -> ${demoCredentials.judge.email} / ${demoCredentials.judge.password}`);
};

run()
  .catch((error) => {
    console.error('Failed to seed demo users', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
