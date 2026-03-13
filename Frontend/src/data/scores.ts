import type { Score } from './types';

export const scores: Score[] = [
  { id: 'score-1', projectId: 'proj-1', judgeId: 'judge-2', sectionA: 27, sectionB: 12, sectionC: 31, total: 70, submittedAt: '2026-03-03T14:00:00Z', isLocked: true },
  { id: 'score-2', projectId: 'proj-1', judgeId: 'judge-3', sectionA: 28, sectionB: 13, sectionC: 32, total: 73, submittedAt: '2026-03-03T14:15:00Z', isLocked: true },
  { id: 'score-3', projectId: 'proj-1', judgeId: 'judge-4', sectionA: 26, sectionB: 12, sectionC: 31, total: 69, submittedAt: '2026-03-03T14:25:00Z', isLocked: true },
  { id: 'score-4', projectId: 'proj-2', judgeId: 'judge-1', sectionA: 25, sectionB: 11, sectionC: 29, total: 65, submittedAt: '2026-03-03T09:00:00Z', isLocked: true },
  { id: 'score-5', projectId: 'proj-2', judgeId: 'judge-5', sectionA: 24, sectionB: 12, sectionC: 28, total: 64, submittedAt: '2026-03-03T09:10:00Z', isLocked: false },
  { id: 'score-6', projectId: 'proj-3', judgeId: 'judge-2', sectionA: 29, sectionB: 14, sectionC: 33, total: 76, submittedAt: '2026-03-01T11:00:00Z', isLocked: true },
  { id: 'score-7', projectId: 'proj-3', judgeId: 'judge-4', sectionA: 28, sectionB: 13, sectionC: 32, total: 73, submittedAt: '2026-03-01T11:15:00Z', isLocked: true },
  { id: 'score-8', projectId: 'proj-5', judgeId: 'judge-1', sectionA: 28, sectionB: 14, sectionC: 33, total: 75, submittedAt: '2026-02-28T10:30:00Z', isLocked: true },
  { id: 'score-9', projectId: 'proj-5', judgeId: 'judge-3', sectionA: 27, sectionB: 13, sectionC: 34, total: 74, submittedAt: '2026-02-28T10:35:00Z', isLocked: true },
  { id: 'score-10', projectId: 'proj-5', judgeId: 'judge-5', sectionA: 29, sectionB: 14, sectionC: 32, total: 75, submittedAt: '2026-02-28T10:40:00Z', isLocked: true }
];

export function getScoresByProject(projectId: string): Score[] {
  return scores.filter((score) => score.projectId === projectId);
}

export function getScoresByJudge(judgeId: string): Score[] {
  return scores.filter((score) => score.judgeId === judgeId);
}

export function getSectionAverages(projectId: string) {
  const projectScores = getScoresByProject(projectId);
  const count = projectScores.length || 1;
  const sectionA = projectScores.reduce((sum, item) => sum + item.sectionA, 0) / count;
  const sectionB = projectScores.reduce((sum, item) => sum + item.sectionB, 0) / count;
  const sectionC = projectScores.reduce((sum, item) => sum + item.sectionC, 0) / count;
  return { sectionA, sectionB, sectionC, finalScore: sectionA + sectionB + sectionC, judgesCount: projectScores.length };
}
