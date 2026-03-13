import type { Category, Patron, Project, Score } from '@/data/types';
import { clearAuth, getToken, setStoredUser, setToken, StoredUser } from './auth';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const BASE_URL = (rawBaseUrl || 'http://localhost:4000').replace(/\/$/, '');

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type WithId = { _id?: string };

const defaultCompetitionSummary = {
  totalProjects: 0,
  scoredProjects: 0,
  categoriesWithProjects: 0,
  readyCategories: 0,
  publishedCategories: 0,
  scheduledEvents: 0,
  liveEvents: 0,
  upcomingEvents: 0,
};

export type CompetitionLevelKey = 'sub_county' | 'county' | 'regional' | 'national';

export type BackendCategory = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  active?: boolean;
};

export type BackendSchool = {
  _id: string;
  name: string;
  code?: string;
  county?: string;
  region?: string;
  subCounty?: string;
  active?: boolean;
};

export type BackendKenyaCountyLocation = {
  name: string;
  region: string;
  subCounties: string[];
  sourceUrl?: string;
};

export type BackendKenyaAdministrativeUnits = {
  generatedAt: string;
  sources: Array<{
    name: string;
    url: string;
  }>;
  regions: Array<{
    name: string;
    counties: Array<{
      name: string;
      subCounties: string[];
    }>;
  }>;
  counties: BackendKenyaCountyLocation[];
};

export type BackendUser = {
  _id: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'admin' | 'judge' | 'patron' | string;
  schoolId?: BackendSchool | string;
  active?: boolean;
  trainedJudge?: boolean;
  mustChangePassword?: boolean;
};

export type BackendJudgePayload = {
  fullName: string;
  email: string;
  phone?: string;
  schoolId: string;
  trainedJudge?: boolean;
  active?: boolean;
  categoryIds?: string[];
  sendCredentialsSms?: boolean;
};

export type BackendSmsDispatchResult = {
  delivered: boolean;
  mode: 'gateway' | 'textbee' | 'disabled';
  message: string;
};

export type BackendJudgeProjectAssignmentSummary = {
  judgeId: string;
  categoryCount: number;
  projectCount: number;
  assignedCount: number;
  message: string;
};

export type BackendJudgeCreateResponse = {
  judge: BackendUser;
  credentials: {
    loginEmail: string;
    temporaryPassword: string;
  };
  sms?: BackendSmsDispatchResult;
  projectAssignments?: BackendJudgeProjectAssignmentSummary;
};

export type BackendProjectStudent = {
  fullName: string;
  gender: 'Male' | 'Female';
  classForm: string;
  schoolName: string;
  subCounty: string;
  county: string;
  region: string;
};

export type BackendProjectMentorCandidate = {
  fullName: string;
  email: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  projectCount: number;
  projectCodes: string[];
  existingJudgeId?: string;
  trainedJudge: boolean;
  activeJudge: boolean;
};

export type BackendProject = {
  _id: string;
  projectCode?: string;
  title: string;
  mentorName?: string;
  mentorEmail?: string;
  mentorPhone?: string;
  categoryId?: BackendCategory | string;
  schoolId?: BackendSchool | string;
  currentLevel?: CompetitionLevelKey | string;
  submissionStatus?: string;
  status?: string;
  qualifiedForNextLevel?: boolean;
  published?: boolean;
  students?: BackendProjectStudent[];
  createdAt?: string;
  updatedAt?: string;
};

export type BackendScore = {
  _id: string;
  projectId: BackendProject | string;
  judgeId?: BackendUser | string;
  sectionA: number;
  sectionB: number;
  sectionC: number;
  judgeTotal: number;
  locked: boolean;
  submittedAt?: string;
};

export type BackendJudgeCategoryAssignment = {
  _id: string;
  judgeId: BackendUser | string;
  categoryId: BackendCategory | string;
  active?: boolean;
};

export type BackendProjectJudgeAssignment = {
  _id: string;
  projectId: BackendProject | string;
  judgeId: BackendUser | string;
  categoryId: BackendCategory | string;
  assignedBy: 'system' | 'admin';
  assignmentStatus: 'assigned' | 'completed' | 'removed';
  conflictFlag?: boolean;
};

export type BackendRankedProject = {
  projectId: string;
  projectCode: string;
  title: string;
  schoolId: string;
  schoolName: string;
  subCounty: string;
  county: string;
  region: string;
  currentLevel: CompetitionLevelKey | string;
  sectionAAverage: number;
  sectionBAverage: number;
  sectionCAverage: number;
  finalScore: number;
  judgesCount: number;
  meetsMinimumJudgeThreshold: boolean;
  rank: number;
  tie: boolean;
  qualifiedForNextLevel: boolean;
  award: 'gold' | 'silver' | 'bronze' | null;
};

export type BackendPublicRankingGroup = {
  categoryId: string;
  categoryName: string;
  competitionLevel: CompetitionLevelKey | string;
  rankings: BackendRankedProject[];
};

export type BackendAnnouncement = {
  _id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BackendDonation = {
  _id: string;
  donorPhone: string;
  recipientPhone?: string;
  paybillNumber?: string;
  accountNumber?: string;
  amount: number;
  paymentReference: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  createdAt: string;
};

export type BackendDashboardSummary = {
  schools: number;
  projects: number;
  judges: number;
  scores: number;
};

export type BackendPublicationOverview = {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  competitionLevel: CompetitionLevelKey | string;
  projectCount: number;
  scoredProjects: number;
  lockedScores: number;
  minimumJudgeCount: number;
  maximumJudgeCount: number;
  ready: boolean;
  published: boolean;
  judgeCount: number;
};

export type BackendAdminDashboardStats = {
  schools: number;
  projects: number;
  students: number;
  maleStudents: number;
  femaleStudents: number;
  judges: number;
  categories: number;
  activeCompetitionLevel: CompetitionLevelKey;
  projectsByCategory: Array<{
    _id: string;
    name: string;
    code: string;
    count: number;
  }>;
  projectsByRegion: Array<{
    _id: string;
    name: string;
    count: number;
  }>;
  activeLevelSchedule: BackendCompetitionScheduleEntry[];
  activeLevelSummary: BackendCompetitionMetricsReport['summary'];
  leaderboards: BackendCompetitionMetricsReport['leaderboards'];
};

export type BackendAdminRankingGroup = {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  competitionLevel: CompetitionLevelKey | string;
  projectCount: number;
  scoredProjects: number;
  minimumJudgeCount: number;
  maximumJudgeCount: number;
  ready: boolean;
  published: boolean;
  rankings: BackendRankedProject[];
};

export type BackendParticipationReport = {
  summary: {
    schools: number;
    projects: number;
    students: number;
    maleStudents: number;
    femaleStudents: number;
    judges: number;
    categories: number;
  };
  projectsPerSchool: Array<{
    _id: string;
    schoolName: string;
    subCounty: string;
    county: string;
    region: string;
    projectCount: number;
    studentCount: number;
  }>;
};

export type BackendCategoryReportRow = {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  projectCount: number;
  qualifiedCount: number;
  publishedCount: number;
  topLevelReached: CompetitionLevelKey | string;
};

export type BackendRegionReport = {
  regions: Array<{
    region: string;
    schoolCount: number;
    countyCount: number;
    projectCount: number;
    studentCount: number;
  }>;
  counties: Array<{
    county: string;
    region: string;
    projectCount: number;
  }>;
};

export type BackendCompetitionScheduleEntry = {
  competitionLevel: CompetitionLevelKey;
  scopeName: string;
  hostSchoolName: string;
  judgingStartDate: string;
  judgingEndDate: string;
  resultsAnnouncementDate?: string | null;
  notes?: string;
  status?: 'upcoming' | 'live' | 'awaiting_results' | 'completed';
};

export type BackendCompetitionLeaderboardRow = {
  name: string;
  points: number;
  goldAwards: number;
  silverAwards: number;
  bronzeAwards: number;
  qualifiedProjects: number;
  projectCount: number;
  averageScore: number;
  topScore: number;
};

export type BackendCompetitionMetricsReport = {
  competitionLevel: CompetitionLevelKey | string;
  summary: {
    totalProjects: number;
    scoredProjects: number;
    categoriesWithProjects: number;
    readyCategories: number;
    publishedCategories: number;
    scheduledEvents: number;
    liveEvents: number;
    upcomingEvents: number;
  };
  schedule: BackendCompetitionScheduleEntry[];
  leaderboards: {
    schools: BackendCompetitionLeaderboardRow[];
    subCounties: BackendCompetitionLeaderboardRow[];
    counties: BackendCompetitionLeaderboardRow[];
    regions: BackendCompetitionLeaderboardRow[];
  };
};

export type BackendSystemSettings = {
  _id: string;
  key: string;
  activeCompetitionLevel: CompetitionLevelKey;
  projectSubmissionDeadline?: string | null;
  scoreSubmissionDeadline?: string | null;
  allowAdminRankingOverride: boolean;
  competitionSchedule: BackendCompetitionScheduleEntry[];
  createdAt?: string;
  updatedAt?: string;
};

export type BackendPublicSummary = {
  schools: number;
  projects: number;
  categories: number;
  donationsTotal: number;
};

export type BackendHealth = {
  success: boolean;
  message: string;
};

const normalizeCompetitionScheduleEntry = (
  entry: Partial<BackendCompetitionScheduleEntry> | undefined
): BackendCompetitionScheduleEntry => ({
  competitionLevel: (entry?.competitionLevel || 'sub_county') as CompetitionLevelKey,
  scopeName: entry?.scopeName || '',
  hostSchoolName: entry?.hostSchoolName || '',
  judgingStartDate: entry?.judgingStartDate || '',
  judgingEndDate: entry?.judgingEndDate || '',
  resultsAnnouncementDate: entry?.resultsAnnouncementDate || null,
  notes: entry?.notes || '',
  status: entry?.status,
});

const normalizeCompetitionLeaderboardRow = (
  row: Partial<BackendCompetitionLeaderboardRow> | undefined
): BackendCompetitionLeaderboardRow => ({
  name: row?.name || '',
  points: Number(row?.points || 0),
  goldAwards: Number(row?.goldAwards || 0),
  silverAwards: Number(row?.silverAwards || 0),
  bronzeAwards: Number(row?.bronzeAwards || 0),
  qualifiedProjects: Number(row?.qualifiedProjects || 0),
  projectCount: Number(row?.projectCount || 0),
  averageScore: Number(row?.averageScore || 0),
  topScore: Number(row?.topScore || 0),
});

const normalizeCompetitionMetricsReport = (
  data?: Partial<BackendCompetitionMetricsReport>
): BackendCompetitionMetricsReport => ({
  competitionLevel: (data?.competitionLevel || 'sub_county') as CompetitionLevelKey,
  summary: {
    ...defaultCompetitionSummary,
    ...(data?.summary || {}),
  },
  schedule: Array.isArray(data?.schedule)
    ? data.schedule.map((entry) => normalizeCompetitionScheduleEntry(entry))
    : [],
  leaderboards: {
    schools: Array.isArray(data?.leaderboards?.schools)
      ? data.leaderboards.schools.map((row) => normalizeCompetitionLeaderboardRow(row))
      : [],
    subCounties: Array.isArray(data?.leaderboards?.subCounties)
      ? data.leaderboards.subCounties.map((row) => normalizeCompetitionLeaderboardRow(row))
      : [],
    counties: Array.isArray(data?.leaderboards?.counties)
      ? data.leaderboards.counties.map((row) => normalizeCompetitionLeaderboardRow(row))
      : [],
    regions: Array.isArray(data?.leaderboards?.regions)
      ? data.leaderboards.regions.map((row) => normalizeCompetitionLeaderboardRow(row))
      : [],
  },
});

const normalizeAdminDashboardStats = (
  data?: Partial<BackendAdminDashboardStats>
): BackendAdminDashboardStats => ({
  schools: Number(data?.schools || 0),
  projects: Number(data?.projects || 0),
  students: Number(data?.students || 0),
  maleStudents: Number(data?.maleStudents || 0),
  femaleStudents: Number(data?.femaleStudents || 0),
  judges: Number(data?.judges || 0),
  categories: Number(data?.categories || 0),
  activeCompetitionLevel: (data?.activeCompetitionLevel || 'sub_county') as CompetitionLevelKey,
  projectsByCategory: Array.isArray(data?.projectsByCategory) ? data.projectsByCategory : [],
  projectsByRegion: Array.isArray(data?.projectsByRegion) ? data.projectsByRegion : [],
  activeLevelSchedule: Array.isArray(data?.activeLevelSchedule)
    ? data.activeLevelSchedule.map((entry) => normalizeCompetitionScheduleEntry(entry))
    : [],
  activeLevelSummary: {
    ...defaultCompetitionSummary,
    ...(data?.activeLevelSummary || {}),
  },
  leaderboards: normalizeCompetitionMetricsReport({
    leaderboards: data?.leaderboards,
  }).leaderboards,
});

const normalizeSystemSettings = (
  data?: Partial<BackendSystemSettings>
): BackendSystemSettings => ({
  _id: data?._id || '',
  key: data?.key || 'system',
  activeCompetitionLevel: (data?.activeCompetitionLevel || 'sub_county') as CompetitionLevelKey,
  projectSubmissionDeadline: data?.projectSubmissionDeadline || null,
  scoreSubmissionDeadline: data?.scoreSubmissionDeadline || null,
  allowAdminRankingOverride:
    typeof data?.allowAdminRankingOverride === 'boolean'
      ? data.allowAdminRankingOverride
      : true,
  competitionSchedule: Array.isArray(data?.competitionSchedule)
    ? data.competitionSchedule.map((entry) => normalizeCompetitionScheduleEntry(entry))
    : [],
  createdAt: data?.createdAt,
  updatedAt: data?.updatedAt,
});

export type CreateProjectPayload = {
  title: string;
  categoryId: string;
  mentorName: string;
  mentorEmail: string;
  mentorPhone: string;
  currentLevel?: CompetitionLevelKey;
  abstractPdfUrl?: string;
  students: BackendProjectStudent[];
};

export type RegisterSchoolPayload = {
  schoolName: string;
  region: string;
  county: string;
  subCounty: string;
  patronFullName: string;
  patronEmail: string;
  patronPhone: string;
  username: string;
  password: string;
};

export type PublishResultsPayload = {
  categoryId: string;
  competitionLevel: CompetitionLevelKey;
  force?: boolean;
};

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

const buildUrl = (path: string) => `${BASE_URL}${path}`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  let body: unknown = null;

  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message?: string }).message || res.statusText)
        : res.statusText;

    if (res.status === 401) {
      clearAuth();
    }

    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return body as T;
}

function toQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.append(key, value);
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function login(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: StoredUser }> {
  const normalizedIdentifier = identifier.trim();
  const res = await request<ApiResponse<{ token: string; user: StoredUser }>>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        identifier: normalizedIdentifier,
        email: normalizedIdentifier,
        username: normalizedIdentifier,
        password,
      }),
    }
  );

  if (res.success && res.data?.token && res.data?.user) {
    setToken(res.data.token);
    setStoredUser(res.data.user);
    return { success: true, user: res.data.user };
  }

  return { success: false };
}

export async function forgotPassword(data: {
  role: 'judge' | 'patron';
  identifier: string;
  phone: string;
}): Promise<{ success: boolean; message?: string }> {
  const res = await request<ApiResponse<{ role: string; loginIdentifier: string }>>(
    '/api/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return { success: true, message: res.message };
}

export async function logout(): Promise<void> {
  clearAuth();
}

export async function me(): Promise<StoredUser | null> {
  const res = await request<ApiResponse<{ user: StoredUser }>>('/api/auth/me');

  if (res.success && res.data?.user) {
    setStoredUser(res.data.user);
    return res.data.user;
  }

  return null;
}

export async function updateMyPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; user?: StoredUser }> {
  const res = await request<ApiResponse<{ user: StoredUser }>>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (res.success && res.data?.user) {
    setStoredUser(res.data.user);
    return { success: true, user: res.data.user };
  }

  return { success: false };
}

export async function registerPatron(data: Partial<Patron>): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/auth/register-patron', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function registerSchoolAccount(
  data: RegisterSchoolPayload
): Promise<{ success: boolean; message?: string }> {
  const res = await request<ApiResponse<unknown>>('/api/auth/register-school', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true, message: res.message };
}

export async function createProject(
  data: CreateProjectPayload
): Promise<{ success: boolean; projectId?: string }> {
  const res = await request<ApiResponse<BackendProject>>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true, projectId: (res.data as WithId)?._id };
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendProject>>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/projects/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function listProjects(filters?: {
  categoryId?: string;
  schoolId?: string;
  subCounty?: string;
  county?: string;
  region?: string;
  currentLevel?: string;
  status?: string;
}): Promise<BackendProject[]> {
  const query = toQuery({
    categoryId: filters?.categoryId,
    schoolId: filters?.schoolId,
    subCounty: filters?.subCounty,
    county: filters?.county,
    region: filters?.region,
    currentLevel: filters?.currentLevel,
    status: filters?.status,
  });

  const res = await request<ApiResponse<BackendProject[]>>(`/api/projects${query}`);
  return res.data;
}

export async function getProject(id: string): Promise<BackendProject> {
  const res = await request<ApiResponse<BackendProject>>(`/api/projects/${id}`);
  return res.data;
}

export async function listProjectMentorCandidates(): Promise<BackendProjectMentorCandidate[]> {
  const res = await request<ApiResponse<BackendProjectMentorCandidate[]>>(
    '/api/projects/mentor-candidates'
  );
  return res.data;
}

export async function promoteProject(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/projects/${id}/promote`, {
    method: 'POST',
  });
  return { success: true };
}

export async function reopenProjectScoring(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/projects/${id}/reopen-scoring`, {
    method: 'POST',
  });
  return { success: true };
}

export async function submitScore(data: Partial<Score>): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/scores', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function listScoresByJudge(judgeId: string): Promise<BackendScore[]> {
  const res = await request<ApiResponse<BackendScore[]>>(`/api/scores/judge/${judgeId}`);
  return res.data;
}

export async function listScores(filters?: {
  projectId?: string;
  judgeId?: string;
}): Promise<BackendScore[]> {
  const query = toQuery({
    projectId: filters?.projectId,
    judgeId: filters?.judgeId,
  });

  const res = await request<ApiResponse<BackendScore[]>>(`/api/scores${query}`);
  return res.data;
}

export async function unlockScore(scoreId: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/scores/${scoreId}/unlock`, {
    method: 'PATCH',
  });

  return { success: true };
}

export async function relockScore(scoreId: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/scores/${scoreId}/relock`, {
    method: 'PATCH',
  });

  return { success: true };
}

export async function createJudge(
  data: BackendJudgePayload
): Promise<{
  success: boolean;
  judgeId?: string;
  judge?: BackendUser;
  loginEmail?: string;
  temporaryPassword?: string;
  sms?: BackendSmsDispatchResult;
  projectAssignments?: BackendJudgeProjectAssignmentSummary;
}> {
  const res = await request<ApiResponse<BackendJudgeCreateResponse | BackendUser>>('/api/judges', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (res.data && typeof res.data === 'object' && 'judge' in res.data) {
    return {
      success: true,
      judgeId: res.data.judge?._id,
      judge: res.data.judge,
      loginEmail: res.data.credentials?.loginEmail,
      temporaryPassword: res.data.credentials?.temporaryPassword,
      sms: res.data.sms,
      projectAssignments: res.data.projectAssignments,
    };
  }

  return {
    success: true,
    judgeId: (res.data as WithId)?._id,
    judge: res.data as BackendUser,
  };
}

export async function updateJudge(
  id: string,
  data: Partial<BackendJudgePayload>
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendUser>>(`/api/judges/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function resetJudgeCredentials(
  id: string
): Promise<{
  success: boolean;
  judge?: BackendUser;
  loginEmail?: string;
  temporaryPassword?: string;
  sms?: BackendSmsDispatchResult;
}> {
  const res = await request<ApiResponse<BackendJudgeCreateResponse>>(
    `/api/judges/${id}/reset-credentials`,
    {
      method: 'POST',
    }
  );

  return {
    success: true,
    judge: res.data?.judge,
    loginEmail: res.data?.credentials?.loginEmail,
    temporaryPassword: res.data?.credentials?.temporaryPassword,
    sms: res.data?.sms,
  };
}

export async function deleteJudge(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/judges/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function assignCategoriesToJudge(
  judgeId: string,
  categoryIds: string[],
  replaceExisting = false
): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/judge-category-assignments', {
    method: 'POST',
    body: JSON.stringify({ judgeId, categoryIds, replaceExisting }),
  });

  return { success: true };
}

export async function listCategories(): Promise<BackendCategory[]> {
  const res = await request<ApiResponse<BackendCategory[]>>('/api/categories');
  return res.data;
}

export async function createCategory(
  data: Partial<Category>
): Promise<{ success: boolean; categoryId?: string }> {
  const res = await request<ApiResponse<Category>>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true, categoryId: (res.data as WithId)?._id };
}

export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<{ success: boolean }> {
  await request<ApiResponse<Category>>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function deleteCategory(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/categories/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function listJudges(): Promise<BackendUser[]> {
  const res = await request<ApiResponse<BackendUser[]>>('/api/judges');
  return res.data;
}

export async function listJudgeCategoryAssignments(): Promise<BackendJudgeCategoryAssignment[]> {
  const res = await request<ApiResponse<BackendJudgeCategoryAssignment[]>>(
    '/api/judge-category-assignments'
  );
  return res.data;
}

export async function listMyProjectAssignments(): Promise<BackendProjectJudgeAssignment[]> {
  const res = await request<ApiResponse<BackendProjectJudgeAssignment[]>>(
    '/api/project-judge-assignments/mine'
  );
  return res.data;
}

export async function listSchools(): Promise<BackendSchool[]> {
  const res = await request<ApiResponse<BackendSchool[]>>('/api/schools');
  return res.data;
}

export async function getKenyaAdministrativeUnits(): Promise<BackendKenyaAdministrativeUnits> {
  const res = await request<ApiResponse<BackendKenyaAdministrativeUnits>>(
    '/api/locations/kenya-administrative-units'
  );
  return res.data;
}

export async function getSchool(id: string): Promise<BackendSchool> {
  const res = await request<ApiResponse<BackendSchool>>(`/api/schools/${id}`);
  return res.data;
}

export async function createSchool(
  data: Partial<BackendSchool>
): Promise<{ success: boolean; schoolId?: string }> {
  const res = await request<ApiResponse<BackendSchool>>('/api/schools', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return { success: true, schoolId: (res.data as WithId)?._id };
}

export async function updateSchool(
  id: string,
  data: Partial<BackendSchool>
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendSchool>>(`/api/schools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function deleteSchool(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/schools/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function createDonation(data: {
  donorPhone: string;
  amount: number;
}): Promise<{ success: boolean; donation?: BackendDonation; message?: string }> {
  const res = await request<ApiResponse<{ donation: BackendDonation; message?: string }>>(
    '/api/donations/initiate',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return {
    success: true,
    donation: res.data?.donation,
    message: res.data?.message || res.message,
  };
}

export async function listDonations(): Promise<BackendDonation[]> {
  const res = await request<ApiResponse<BackendDonation[]>>('/api/donations');
  return res.data;
}

export async function updateDonationStatus(
  id: string,
  paymentStatus: 'pending' | 'success' | 'failed'
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendDonation>>(`/api/donations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  });

  return { success: true };
}

export async function fetchReportData(
  reportType: string
): Promise<{ success: boolean; data?: unknown }> {
  const res = await request<ApiResponse<unknown>>(`/api/reports/${reportType}`);
  return { success: true, data: res.data };
}

export async function getDashboardSummary(): Promise<BackendDashboardSummary> {
  const res = await request<ApiResponse<BackendDashboardSummary>>(
    '/api/reports/dashboard-summary'
  );
  return res.data;
}

export async function getAdminDashboardStats(): Promise<BackendAdminDashboardStats> {
  const res = await request<ApiResponse<BackendAdminDashboardStats>>(
    '/api/admin/dashboard-stats'
  );
  return normalizeAdminDashboardStats(res.data);
}

export async function getProjectsPerCategory(): Promise<Array<{ _id: string; count: number }>> {
  const res = await request<ApiResponse<Array<{ _id: string; count: number }>>>(
    '/api/reports/projects-per-category'
  );
  return res.data;
}

export async function getStudentsByGender(): Promise<Record<string, number>> {
  const res = await request<ApiResponse<Record<string, number>>>(
    '/api/reports/students-by-gender'
  );
  return res.data;
}

export async function getPublicationOverview(): Promise<BackendPublicationOverview[]> {
  const res = await request<ApiResponse<BackendPublicationOverview[]>>(
    '/api/publications/overview'
  );
  return res.data;
}

export async function publishCategoryResults(
  data: PublishResultsPayload
): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/publications/publish', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function listRankings(filters?: {
  categoryId?: string;
  competitionLevel?: string;
}): Promise<BackendAdminRankingGroup[]> {
  const query = toQuery({
    categoryId: filters?.categoryId,
    competitionLevel: filters?.competitionLevel,
  });

  const res = await request<ApiResponse<BackendAdminRankingGroup[]>>(
    `/api/rankings${query}`
  );
  return res.data;
}

export async function publishRankings(
  data: PublishResultsPayload
): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/rankings/publish', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function hideRankings(
  data: PublishResultsPayload
): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/rankings/hide', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function getParticipationReport(): Promise<BackendParticipationReport> {
  const res = await request<ApiResponse<BackendParticipationReport>>(
    '/api/reports/participation'
  );
  return res.data;
}

export async function getCategoryReport(): Promise<BackendCategoryReportRow[]> {
  const res = await request<ApiResponse<BackendCategoryReportRow[]>>(
    '/api/reports/categories'
  );
  return res.data;
}

export async function getRegionReport(): Promise<BackendRegionReport> {
  const res = await request<ApiResponse<BackendRegionReport>>('/api/reports/regions');
  return res.data;
}

export async function getCompetitionMetricsReport(filters?: {
  competitionLevel?: string;
}): Promise<BackendCompetitionMetricsReport> {
  const query = toQuery({
    competitionLevel: filters?.competitionLevel,
  });

  const res = await request<ApiResponse<BackendCompetitionMetricsReport>>(
    `/api/reports/competition-metrics${query}`
  );
  return normalizeCompetitionMetricsReport(res.data);
}

export async function getSettings(): Promise<BackendSystemSettings> {
  const res = await request<ApiResponse<BackendSystemSettings>>('/api/settings');
  return normalizeSystemSettings(res.data);
}

export async function updateSettings(
  data: Partial<BackendSystemSettings>
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendSystemSettings>>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function hideCategoryResults(
  data: PublishResultsPayload
): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>('/api/publications/hide', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function listAnnouncements(): Promise<BackendAnnouncement[]> {
  const res = await request<ApiResponse<BackendAnnouncement[]>>('/api/announcements');
  return res.data;
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  published: boolean;
}): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendAnnouncement>>('/api/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function updateAnnouncement(
  id: string,
  data: Partial<BackendAnnouncement>
): Promise<{ success: boolean }> {
  await request<ApiResponse<BackendAnnouncement>>(`/api/announcements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean }> {
  await request<ApiResponse<unknown>>(`/api/announcements/${id}`, {
    method: 'DELETE',
  });

  return { success: true };
}

export async function listPublicAnnouncements(): Promise<BackendAnnouncement[]> {
  const res = await request<ApiResponse<BackendAnnouncement[]>>('/api/public/announcements');
  return res.data;
}

export async function getPublicSummary(): Promise<BackendPublicSummary> {
  const res = await request<ApiResponse<BackendPublicSummary>>('/api/public/summary');
  return res.data;
}

export async function getBackendHealth(): Promise<BackendHealth> {
  return request<BackendHealth>('/health');
}

export async function getPublicRankings(filters?: {
  categoryId?: string;
  competitionLevel?: string;
}): Promise<BackendPublicRankingGroup[] | BackendPublicRankingGroup> {
  const query = toQuery({
    categoryId: filters?.categoryId,
    competitionLevel: filters?.competitionLevel,
  });

  const res = await request<ApiResponse<BackendPublicRankingGroup[] | BackendPublicRankingGroup>>(
    `/api/public/rankings${query}`
  );
  return res.data;
}
