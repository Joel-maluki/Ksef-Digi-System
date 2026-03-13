import type { CategoryReport, JudgeActivity, RegionalReport, SchoolReport } from './types';

export const categoryReports: CategoryReport[] = [
  { categoryId: 'cat-1', categoryName: 'Computer Science', projectCount: 16, averageScore: 71.4 },
  { categoryId: 'cat-2', categoryName: 'Mathematics', projectCount: 8, averageScore: 66.8 },
  { categoryId: 'cat-3', categoryName: 'Agriculture', projectCount: 12, averageScore: 68.1 },
  { categoryId: 'cat-8', categoryName: 'Robotics', projectCount: 7, averageScore: 73.2 },
];

export const schoolReports: SchoolReport[] = [
  { school: 'Ngao Girls High School', projectCount: 3, averageScore: 70.4, topCategory: 'Computer Science' },
  { school: 'Hola Boys Secondary School', projectCount: 4, averageScore: 72.1, topCategory: 'Robotics' },
  { school: 'Tarasaa Secondary School', projectCount: 2, averageScore: 64.5, topCategory: 'Agriculture' },
];

export const regionalReports: RegionalReport[] = [
  { subCounty: 'Tana Delta', schoolCount: 4, projectCount: 12, averageScore: 68.9 },
  { subCounty: 'Galole', schoolCount: 2, projectCount: 6, averageScore: 71.3 },
  { subCounty: 'Dagoretti North', schoolCount: 3, projectCount: 7, averageScore: 73.1 },
];

export const judgeActivities: JudgeActivity[] = [
  { judgeId: 'judge-1', judgeName: 'Madam Phanice Waliora', projectsScored: 4, averageScoreGiven: 71.3, lastActivity: '2026-03-03T14:00:00Z' },
  { judgeId: 'judge-2', judgeName: 'Mr. Hussein Juma', projectsScored: 5, averageScoreGiven: 72.6, lastActivity: '2026-03-03T15:00:00Z' },
  { judgeId: 'judge-3', judgeName: 'Mrs. Zawadi Kenga', projectsScored: 3, averageScoreGiven: 69.1, lastActivity: '2026-03-03T13:20:00Z' },
];
