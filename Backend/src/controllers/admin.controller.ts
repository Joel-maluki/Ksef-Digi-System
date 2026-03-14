import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { UserModel } from '../models/User';
import {
  buildScopedProjectFilter,
  buildSchoolScopeFilter,
  getScopedSchoolIds,
} from '../services/adminScope.service';
import { getCompetitionMetrics } from '../services/competitionMetrics.service';
import { toCompetitionScheduleEntries } from '../services/competitionSchedule.service';
import { getSystemSettings } from '../services/systemSettings.service';
import { ok } from '../utils/apiResponse';
import {
  buildProjectScoreCountMap,
  projectHasMinimumJudgeScores,
} from '../services/judgingRules.service';

export const dashboardStats = async (req: Request, res: Response) => {
  const settings = await getSystemSettings();

  if (req.adminScope && !req.adminScope.isGlobal) {
    const schoolFilter = buildSchoolScopeFilter(req.adminScope);
    const schoolIds = await getScopedSchoolIds(req.adminScope);
    const projectFilter = await buildScopedProjectFilter(req.adminScope);
    const projectIdsFilter = schoolIds ? { $in: schoolIds } : undefined;

    const [
      schoolCount,
      projectCount,
      judgeCount,
      categoryCount,
      genderBreakdown,
      projectsByCategory,
      projectsByRegion,
      scopedProjects,
      scopedScores,
    ] = await Promise.all([
      SchoolModel.countDocuments(schoolFilter),
      ProjectModel.countDocuments(projectFilter),
      UserModel.countDocuments({
        role: 'judge',
        active: true,
        ...(projectIdsFilter ? { schoolId: projectIdsFilter } : {}),
      }),
      CategoryModel.countDocuments({ active: true }),
      ProjectModel.aggregate([
        { $match: projectFilter },
        { $unwind: '$students' },
        { $group: { _id: '$students.gender', count: { $sum: 1 } } },
      ]),
      ProjectModel.aggregate([
        { $match: projectFilter },
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
        { $match: projectFilter },
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
      ProjectModel.find(projectFilter).select('_id categoryId published currentLevel').lean(),
      ScoreModel.find({ locked: true }).select('projectId locked').lean(),
    ]);

    const lockedScoreCountMap = buildProjectScoreCountMap(scopedScores);
    const scoredProjects = scopedProjects.filter((project) =>
      projectHasMinimumJudgeScores(String(project._id), lockedScoreCountMap)
    ).length;
    const categoryIds = new Set(scopedProjects.map((project) => String(project.categoryId)));
    const publishedCategoryIds = new Set(
      scopedProjects
        .filter((project) => project.published)
        .map((project) => String(project.categoryId))
    );

    const readyCategoryIds = Array.from(categoryIds).filter((categoryId) => {
      const categoryProjects = scopedProjects.filter(
        (project) => String(project.categoryId) === categoryId
      );

      return (
        categoryProjects.length > 0 &&
        categoryProjects.every((project) =>
          projectHasMinimumJudgeScores(String(project._id), lockedScoreCountMap)
        )
      );
    });

    const maleStudents =
      genderBreakdown.find((entry) => entry._id === 'Male')?.count || 0;
    const femaleStudents =
      genderBreakdown.find((entry) => entry._id === 'Female')?.count || 0;

    return res.json(
      ok({
        schools: schoolCount,
        projects: projectCount,
        students: maleStudents + femaleStudents,
        maleStudents,
        femaleStudents,
        judges: judgeCount,
        categories: categoryCount,
        activeCompetitionLevel: req.adminScope.competitionLevel,
        projectsByCategory,
        projectsByRegion,
        activeLevelSchedule: [],
        activeLevelSummary: {
          totalProjects: projectCount,
          scoredProjects,
          categoriesWithProjects: categoryIds.size,
          readyCategories: readyCategoryIds.length,
          publishedCategories: publishedCategoryIds.size,
          scheduledEvents: 0,
          liveEvents: 0,
          upcomingEvents: 0,
        },
        leaderboards: {
          schools: [],
          subCounties: [],
          counties: [],
          regions: [],
        },
      })
    );
  }

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
