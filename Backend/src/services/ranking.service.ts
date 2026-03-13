import { Types } from 'mongoose';
import { CategoryModel } from '../models/Category';
import { ProjectModel } from '../models/Project';
import { SchoolModel } from '../models/School';
import { ScoreModel } from '../models/Score';
import { MIN_JUDGES_PER_PROJECT } from './judgingRules.service';

export type RankedProject = {
  projectId: string;
  projectCode: string;
  title: string;
  schoolId: string;
  schoolName: string;
  subCounty: string;
  county: string;
  region: string;
  currentLevel: string;
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

const round2 = (n: number) => Math.round(n * 100) / 100;

export const calculateCategoryRanking = async (categoryId: string, currentLevel?: string): Promise<RankedProject[]> => {
  const filter: any = { categoryId: new Types.ObjectId(categoryId) };
  if (currentLevel) filter.currentLevel = currentLevel;

  const projects = await ProjectModel.find(filter).lean();
  const scores = await ScoreModel.find({
    projectId: { $in: projects.map((p) => p._id) },
    locked: true,
  }).lean();
  const schoolIds = [...new Set(projects.map((project) => String(project.schoolId)))];
  const schools = await SchoolModel.find({ _id: { $in: schoolIds } }).lean();
  const schoolMap = new Map(schools.map((school) => [String(school._id), school]));

  const ranked = projects.map((project) => {
    const projectScores = scores.filter((s) => String(s.projectId) === String(project._id));
    const judgesCount = projectScores.length;
    const sumA = projectScores.reduce((sum, s) => sum + s.sectionA, 0);
    const sumB = projectScores.reduce((sum, s) => sum + s.sectionB, 0);
    const sumC = projectScores.reduce((sum, s) => sum + s.sectionC, 0);
    const sectionAAverage = judgesCount ? round2(sumA / judgesCount) : 0;
    const sectionBAverage = judgesCount ? round2(sumB / judgesCount) : 0;
    const sectionCAverage = judgesCount ? round2(sumC / judgesCount) : 0;
    const finalScore = round2(sectionAAverage + sectionBAverage + sectionCAverage);

    return {
      projectId: String(project._id),
      projectCode: project.projectCode,
      title: project.title,
      schoolId: String(project.schoolId),
      schoolName: schoolMap.get(String(project.schoolId))?.name || 'Unknown School',
      subCounty: schoolMap.get(String(project.schoolId))?.subCounty || '',
      county: schoolMap.get(String(project.schoolId))?.county || '',
      region: schoolMap.get(String(project.schoolId))?.region || '',
      currentLevel: project.currentLevel,
      sectionAAverage,
      sectionBAverage,
      sectionCAverage,
      finalScore,
      judgesCount,
      meetsMinimumJudgeThreshold: judgesCount >= MIN_JUDGES_PER_PROJECT,
      rank: 0,
      tie: false,
      qualifiedForNextLevel: false,
      award: null as 'gold' | 'silver' | 'bronze' | null,
    };
  });

  ranked.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.sectionAAverage !== a.sectionAAverage) return b.sectionAAverage - a.sectionAAverage;
    if (b.sectionCAverage !== a.sectionCAverage) return b.sectionCAverage - a.sectionCAverage;
    if (b.sectionBAverage !== a.sectionBAverage) return b.sectionBAverage - a.sectionBAverage;
    return a.projectCode.localeCompare(b.projectCode);
  });

  for (let i = 0; i < ranked.length; i += 1) {
    const prev = ranked[i - 1];
    const current = ranked[i];
    const isTie = !!prev &&
      prev.finalScore === current.finalScore &&
      prev.sectionAAverage === current.sectionAAverage &&
      prev.sectionBAverage === current.sectionBAverage &&
      prev.sectionCAverage === current.sectionCAverage;

    current.tie = isTie;
    current.rank = isTie && prev ? prev.rank : i + 1;
    current.qualifiedForNextLevel = current.rank <= 4;
    current.award = current.rank === 1 ? 'gold' : current.rank === 2 ? 'silver' : current.rank === 3 ? 'bronze' : null;
  }

  return ranked;
};

export const getPublishedRankings = async (currentLevel?: string) => {
  const categories = await CategoryModel.find({ active: true }).lean();
  const result = [] as Array<{ categoryId: string; categoryName: string; rankings: RankedProject[] }>;
  for (const category of categories) {
    const rankings = await calculateCategoryRanking(String(category._id), currentLevel);
    result.push({ categoryId: String(category._id), categoryName: category.name, rankings });
  }
  return result;
};
