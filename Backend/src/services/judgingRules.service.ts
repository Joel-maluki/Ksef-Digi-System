export const MIN_JUDGES_PER_PROJECT = 2;
export const MAX_JUDGES_PER_PROJECT = 3;

export const ACTIVE_PROJECT_ASSIGNMENT_STATUSES = ['assigned', 'completed'] as const;

type ScoreLike = {
  projectId: unknown;
  locked?: boolean;
};

type AssignmentLike = {
  projectId: unknown;
  assignmentStatus?: string;
};

export const hasSchoolConflict = (judgeSchoolId: unknown, projectSchoolId: unknown) =>
  Boolean(judgeSchoolId && projectSchoolId && String(judgeSchoolId) === String(projectSchoolId));

export const buildProjectScoreCountMap = (
  scores: ScoreLike[],
  { lockedOnly = true }: { lockedOnly?: boolean } = {}
) =>
  scores.reduce<Record<string, number>>((accumulator, score) => {
    if (lockedOnly && !score.locked) {
      return accumulator;
    }

    const key = String(score.projectId);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

export const buildProjectAssignmentCountMap = (assignments: AssignmentLike[]) =>
  assignments.reduce<Record<string, number>>((accumulator, assignment) => {
    if (
      !ACTIVE_PROJECT_ASSIGNMENT_STATUSES.includes(
        assignment.assignmentStatus as (typeof ACTIVE_PROJECT_ASSIGNMENT_STATUSES)[number]
      )
    ) {
      return accumulator;
    }

    const key = String(assignment.projectId);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

export const projectHasMinimumJudgeScores = (
  projectId: string,
  scoreCountMap: Record<string, number>
) => (scoreCountMap[projectId] || 0) >= MIN_JUDGES_PER_PROJECT;

export const projectHasMaximumJudgeAssignments = (
  projectId: string,
  assignmentCountMap: Record<string, number>
) => (assignmentCountMap[projectId] || 0) >= MAX_JUDGES_PER_PROJECT;

export const getJudgeCoverageStatus = (assignedCount: number) => {
  if (assignedCount >= MAX_JUDGES_PER_PROJECT) {
    return 'fully_assigned';
  }

  if (assignedCount >= MIN_JUDGES_PER_PROJECT) {
    return 'minimally_assigned';
  }

  return 'needs_judges';
};
