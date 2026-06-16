export interface TaskCombination {
  questionId: string;
  platformId: string;
  brandId: string;
}

function combinationKey(c: TaskCombination): string {
  return `${c.questionId}::${c.platformId}::${c.brandId}`;
}

// Cartesian product of questions x platforms x brands, minus combinations
// that already exist as test tasks — regenerating must be idempotent
// (PRD §5.4 task generation: question_count x platform_count x brand_count = task_count).
export function buildTaskCombinations(
  questionIds: string[],
  platformIds: string[],
  brandIds: string[],
  existing: TaskCombination[] = [],
): TaskCombination[] {
  const existingKeys = new Set(existing.map(combinationKey));
  const combinations: TaskCombination[] = [];

  for (const questionId of questionIds) {
    for (const platformId of platformIds) {
      for (const brandId of brandIds) {
        const combo = { questionId, platformId, brandId };
        if (!existingKeys.has(combinationKey(combo))) {
          combinations.push(combo);
        }
      }
    }
  }

  return combinations;
}
