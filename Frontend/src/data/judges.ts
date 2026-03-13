import type { Judge } from './types';

export const judges: Judge[] = [
  { id: 'judge-1', name: 'Madam Phanice Waliora', email: 'phanice@ngao.ac.ke', role: 'judge', school: 'Ngao Girls High School', assignedCategories: ['cat-1', 'cat-2'], assignedLevels: ['sub-county', 'county'], isActive: true, workload: 4 },
  { id: 'judge-2', name: 'Mr. Hussein Juma', email: 'hussein@holaboys.ac.ke', role: 'judge', school: 'Hola Boys Secondary School', assignedCategories: ['cat-1', 'cat-8'], assignedLevels: ['sub-county', 'county', 'regional'], isActive: true, workload: 3 },
  { id: 'judge-3', name: 'Mrs. Zawadi Kenga', email: 'zawadi@tarasaa.ac.ke', role: 'judge', school: 'Tarasaa Secondary School', assignedCategories: ['cat-3', 'cat-9'], assignedLevels: ['sub-county'], isActive: true, workload: 5 },
  { id: 'judge-4', name: 'Ms. Angela Wairimu', email: 'angela@kenyahigh.ac.ke', role: 'judge', school: 'Kenya High School', assignedCategories: ['cat-4', 'cat-14'], assignedLevels: ['county', 'regional', 'national'], isActive: true, workload: 2 },
  { id: 'judge-5', name: 'Mr. Peter Githinji', email: 'peter@alliance.ac.ke', role: 'judge', school: 'Alliance High School', assignedCategories: ['cat-2', 'cat-9'], assignedLevels: ['county', 'regional'], isActive: true, workload: 3 },
  { id: 'judge-6', name: 'Mr. Yassin Mohammed', email: 'yassin@kipini.ac.ke', role: 'judge', school: 'Kipini Girls', assignedCategories: ['cat-2', 'cat-3'], assignedLevels: ['sub-county', 'county'], isActive: false, workload: 1 },
];
