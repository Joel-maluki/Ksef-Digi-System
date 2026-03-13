import type { ProjectRanking, SchoolRanking } from './types';

export const projectRankings: ProjectRanking[] = [
  { projectId: 'proj-5', projectTitle: 'Low-Cost Wind Charger', school: 'Kenya High School', categoryId: 'cat-4', categoryName: 'Physics', averageScore: 74.7, rank: 1 },
  { projectId: 'proj-3', projectTitle: 'Flood Alert River Sensor', school: 'Hola Boys Secondary School', categoryId: 'cat-8', categoryName: 'Robotics', averageScore: 74.5, rank: 1 },
  { projectId: 'proj-1', projectTitle: 'Smart Mangrove Monitoring System', school: 'Ngao Girls High School', categoryId: 'cat-1', categoryName: 'Computer Science', averageScore: 70.7, rank: 1 },
  { projectId: 'proj-2', projectTitle: 'Salt-Tolerant Kitchen Garden Model', school: 'Tarasaa Secondary School', categoryId: 'cat-3', categoryName: 'Agriculture', averageScore: 64.5, rank: 2 },
  { projectId: 'proj-6', projectTitle: 'Plastic Waste Sorting Station', school: 'Alliance High School', categoryId: 'cat-9', categoryName: 'Environmental Science', averageScore: 61.3, rank: 3 },
];

export const schoolRankings: SchoolRanking[] = [
  { school: 'Kenya High School', totalScore: 224.1, projectCount: 3, rank: 1 },
  { school: 'Hola Boys Secondary School', totalScore: 213.9, projectCount: 3, rank: 2 },
  { school: 'Ngao Girls High School', totalScore: 210.4, projectCount: 3, rank: 3 },
  { school: 'Tarasaa Secondary School', totalScore: 194.2, projectCount: 3, rank: 4 },
];
