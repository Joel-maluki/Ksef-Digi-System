import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { ResultPublicationModel } from '../models/ResultPublication';
import { UserModel } from '../models/User';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { getCompetitionMetrics } from '../services/competitionMetrics.service';
import {
  isCompetitionLevel,
  toCompetitionScheduleEntries,
} from '../services/competitionSchedule.service';
import { getSystemSettings } from '../services/systemSettings.service';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/apiResponse';

export const projectsPerCategory = async (_req: Request, res: Response) => {
  const data = await ProjectModel.aggregate([{ $group: { _id: '$categoryId', count: { $sum: 1 } } }]);
  res.json(ok(data));
};

export const projectsPerCounty = async (_req: Request, res: Response) => {
  const data = await ProjectModel.aggregate([
    { $lookup: { from: 'schools', localField: 'schoolId', foreignField: '_id', as: 'school' } },
    { $unwind: '$school' },
    { $group: { _id: '$school.county', count: { $sum: 1 } } },
  ]);
  res.json(ok(data));
};

export const projectsPerRegion = async (_req: Request, res: Response) => {
  const data = await ProjectModel.aggregate([
    { $lookup: { from: 'schools', localField: 'schoolId', foreignField: '_id', as: 'school' } },
    { $unwind: '$school' },
    { $group: { _id: '$school.region', count: { $sum: 1 } } },
  ]);
  res.json(ok(data));
};

export const studentsByGender = async (_req: Request, res: Response) => {
  const projects = await ProjectModel.find().lean();
  const counts = projects.flatMap((p) => p.students).reduce<Record<string, number>>((acc, s) => {
    acc[s.gender] = (acc[s.gender] || 0) + 1;
    return acc;
  }, {});
  res.json(ok(counts));
};

export const dashboardSummary = async (_req: Request, res: Response) => {
  const [schools, projects, judges, scores] = await Promise.all([
    SchoolModel.countDocuments(),
    ProjectModel.countDocuments(),
    UserModel.countDocuments({ role: 'judge' }),
    ScoreModel.countDocuments(),
  ]);
  res.json(ok({ schools, projects, judges, scores }));
};

export const participationReport = async (_req: Request, res: Response) => {
  const [
    schools,
    projects,
    judges,
    categories,
    genderBreakdown,
    projectsPerSchool,
  ] = await Promise.all([
    SchoolModel.countDocuments({ active: true }),
    ProjectModel.countDocuments(),
    UserModel.countDocuments({ role: 'judge', active: true }),
    CategoryModel.countDocuments({ active: true }),
    ProjectModel.aggregate([
      { $unwind: '$students' },
      { $group: { _id: '$students.gender', count: { $sum: 1 } } },
    ]),
    ProjectModel.aggregate([
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school',
        },
      },
      { $unwind: '$school' },
      {
        $addFields: {
          studentCount: { $size: '$students' },
        },
      },
      {
        $group: {
          _id: '$school._id',
          schoolName: { $first: '$school.name' },
          subCounty: { $first: '$school.subCounty' },
          county: { $first: '$school.county' },
          region: { $first: '$school.region' },
          projectCount: { $sum: 1 },
          studentCount: { $sum: '$studentCount' },
        },
      },
      { $sort: { projectCount: -1, schoolName: 1 } },
    ]),
  ]);

  const maleStudents =
    genderBreakdown.find((entry) => entry._id === 'Male')?.count || 0;
  const femaleStudents =
    genderBreakdown.find((entry) => entry._id === 'Female')?.count || 0;

  res.json(
    ok({
      summary: {
        schools,
        projects,
        students: maleStudents + femaleStudents,
        maleStudents,
        femaleStudents,
        judges,
        categories,
      },
      projectsPerSchool,
    })
  );
};

export const categoryReport = async (_req: Request, res: Response) => {
  const [categories, projects, publications] = await Promise.all([
    CategoryModel.find().sort({ name: 1 }).lean(),
    ProjectModel.find()
      .select('categoryId currentLevel qualifiedForNextLevel published')
      .lean(),
    ResultPublicationModel.find({ published: true }).lean(),
  ]);

  const levelOrder: Record<string, number> = {
    sub_county: 1,
    county: 2,
    regional: 3,
    national: 4,
  };

  const rows = categories.map((category) => {
    const categoryProjects = projects.filter(
      (project) => String(project.categoryId) === String(category._id)
    );
    const publishedCount = publications.filter(
      (publication) => String(publication.categoryId) === String(category._id)
    ).length;

    const topLevelReached = categoryProjects.reduce(
      (best, project) =>
        levelOrder[project.currentLevel] > levelOrder[best]
          ? project.currentLevel
          : best,
      'sub_county'
    );

    return {
      categoryId: String(category._id),
      categoryName: category.name,
      categoryCode: category.code,
      projectCount: categoryProjects.length,
      qualifiedCount: categoryProjects.filter((project) => project.qualifiedForNextLevel).length,
      publishedCount,
      topLevelReached,
    };
  });

  res.json(ok(rows));
};

export const regionReport = async (_req: Request, res: Response) => {
  const [regions, counties] = await Promise.all([
    ProjectModel.aggregate([
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school',
        },
      },
      { $unwind: '$school' },
      {
        $addFields: {
          studentCount: { $size: '$students' },
        },
      },
      {
        $group: {
          _id: '$school.region',
          region: { $first: '$school.region' },
          schoolIds: { $addToSet: '$school._id' },
          counties: { $addToSet: '$school.county' },
          projectCount: { $sum: 1 },
          studentCount: { $sum: '$studentCount' },
        },
      },
      {
        $project: {
          _id: 0,
          region: 1,
          schoolCount: { $size: '$schoolIds' },
          countyCount: { $size: '$counties' },
          projectCount: 1,
          studentCount: 1,
        },
      },
      { $sort: { projectCount: -1, region: 1 } },
    ]),
    ProjectModel.aggregate([
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school',
        },
      },
      { $unwind: '$school' },
      {
        $group: {
          _id: '$school.county',
          county: { $first: '$school.county' },
          region: { $first: '$school.region' },
          projectCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          county: 1,
          region: 1,
          projectCount: 1,
        },
      },
      { $sort: { projectCount: -1, county: 1 } },
    ]),
  ]);

  res.json(ok({ regions, counties }));
};

export const competitionMetricsReport = async (req: Request, res: Response) => {
  const requestedLevel =
    typeof req.query.competitionLevel === 'string' ? req.query.competitionLevel : undefined;
  const settings = await getSystemSettings();
  const competitionLevel = String(requestedLevel || settings.activeCompetitionLevel);

  if (!isCompetitionLevel(competitionLevel)) {
    throw new ApiError(400, 'Invalid competition level');
  }

  const metrics = await getCompetitionMetrics({
    competitionLevel,
    scheduleEntries: toCompetitionScheduleEntries(settings.competitionSchedule),
  });

  res.json(ok(metrics));
};
