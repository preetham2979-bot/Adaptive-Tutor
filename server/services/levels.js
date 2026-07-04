/**
 * The five difficulty levels a student progresses through.
 * Levels are 1-indexed. `name` is what gets passed to the LLM prompt;
 * `label` is what the student sees in the UI.
 */
export const LEVELS = [
  { level: 1, name: 'easy',         label: 'Easy',         emoji: '🌱' },
  { level: 2, name: 'medium',       label: 'Medium',       emoji: '⚡' },
  { level: 3, name: 'intermediate', label: 'Intermediate', emoji: '🔥' },
  { level: 4, name: 'hard',         label: 'Hard',         emoji: '💎' },
  { level: 5, name: 'expert',       label: 'Expert',       emoji: '🚀' },
];

export const MAX_LEVEL = 5;

// Number of consecutive correct answers that triggers the level-up prompt.
export const LEVEL_STREAK_THRESHOLD = 3;

export function getLevelConfig(levelNumber) {
  return LEVELS.find(l => l.level === levelNumber) ?? LEVELS[0];
}

export function getDifficultyForLevel(levelNumber) {
  return getLevelConfig(levelNumber).name;
}
