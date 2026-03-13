export type UserRole = 'admin' | 'judge' | 'patron';
export type CompetitionLevel = 'sub-county' | 'county' | 'regional' | 'national';
export type ProjectStatus = 'draft' | 'submitted' | 'qualified' | 'eliminated' | 'published' | 'needs-judges';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface School {
  id: string;
  name: string;
  subCounty: string;
  county: string;
  region: string;
  type: string;
  patron: string;
}

export interface Judge extends User {
  role: 'judge';
  school: string;
  assignedCategories: string[];
  assignedLevels: CompetitionLevel[];
  isActive: boolean;
  workload: number;
}

export interface Patron extends User {
  role: 'patron';
  school: string;
  phone: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  maxScore: number;
}

export interface Presenter {
  name: string;
  gender: 'male' | 'female' | 'other';
  school?: string;
  subCounty?: string;
  county?: string;
  region?: string;
}

export interface Project {
  id: string;
  code?: string;
  title: string;
  categoryId: string;
  presenters: Presenter[];
  mentor: string;
  school: string;
  subCounty: string;
  county?: string;
  region?: string;
  patronId: string;
  currentLevel?: CompetitionLevel;
  assignedJudges?: number;
  submittedAt: string;
  status: ProjectStatus | 'scored' | 'locked';
}

export interface Score {
  id: string;
  projectId: string;
  judgeId: string;
  sectionA: number;
  sectionB: number;
  sectionC: number;
  total: number;
  submittedAt: string;
  isLocked: boolean;
}

export interface ProjectRanking {
  projectId: string;
  projectTitle: string;
  school: string;
  categoryId: string;
  categoryName: string;
  averageScore: number;
  rank: number;
}

export interface SchoolRanking {
  school: string;
  totalScore: number;
  projectCount: number;
  rank: number;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  message?: string;
  createdAt: string;
  isAnonymous: boolean;
}

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  projectCount: number;
  averageScore: number;
}

export interface SchoolReport {
  school: string;
  projectCount: number;
  averageScore: number;
  topCategory: string;
}

export interface RegionalReport {
  subCounty: string;
  schoolCount: number;
  projectCount: number;
  averageScore: number;
}

export interface JudgeActivity {
  judgeId: string;
  judgeName: string;
  projectsScored: number;
  averageScoreGiven: number;
  lastActivity: string;
}

export interface Announcement {
  id: string;
  title: string;
  audience: 'public' | 'patron' | 'judge' | 'admin';
  body: string;
  publishedAt: string;
}
