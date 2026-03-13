import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { SchoolModel } from '../models/School';
import { UserModel } from '../models/User';
import { getCompetitionMetrics } from '../services/competitionMetrics.service';
import { toCompetitionScheduleEntries } from '../services/competitionSchedule.service';
import { getSystemSettings } from '../services/systemSettings.service';
import { ok } from '../utils/apiResponse';

export const dashboardStats = async (_req: Request, res: Response) => {
  const settings = await getSystemSettings();
  const [
    schoolCount,
    projectCount,
    judgeCount,
    categoryCount,
    genderBreakdown,
    projectsByCategory,
    projectsByRegion,
    competitionMetrics,
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
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          name: { $first: '$category.name' },
          code: { $first: '$category.code' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, name: 1 } },
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
          _id: '$school.region',
          name: { $first: '$school.region' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, name: 1 } },
    ]),
    getCompetitionMetrics({
      competitionLevel: settings.activeCompetitionLevel,
      scheduleEntries: toCompetitionScheduleEntries(settings.competitionSchedule),
    }),
  ]);

  const maleStudents =
    genderBreakdown.find((entry) => entry._id === 'Male')?.count || 0;
  const femaleStudents =
    genderBreakdown.find((entry) => entry._id === 'Female')?.count || 0;

  res.json(
    ok({
      schools: schoolCount,
      projects: projectCount,
      students: maleStudents + femaleStudents,
      maleStudents,
      femaleStudents,
      judges: judgeCount,
      categories: categoryCount,
      activeCompetitionLevel: settings.activeCompetitionLevel,
      projectsByCategory,
      projectsByRegion,
      activeLevelSchedule: competitionMetrics.schedule,
      activeLevelSummary: competitionMetrics.summary,
      leaderboards: {
        schools: competitionMetrics.leaderboards.schools.slice(0, 5),
        subCounties: competitionMetrics.leaderboards.subCounties.slice(0, 5),
        counties: competitionMetrics.leaderboards.counties.slice(0, 5),
        regions: competitionMetrics.leaderboards.regions.slice(0, 5),
      },
    })
  );
};
