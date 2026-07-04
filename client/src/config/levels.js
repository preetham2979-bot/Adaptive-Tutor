export const LEVELS = [
  { level: 1, name: 'easy',         label: 'Easy',         emoji: '🌱', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  { level: 2, name: 'medium',       label: 'Medium',       emoji: '⚡', text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/25'    },
  { level: 3, name: 'intermediate', label: 'Intermediate', emoji: '🔥', text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25'   },
  { level: 4, name: 'hard',         label: 'Hard',         emoji: '💎', text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/25'  },
  { level: 5, name: 'expert',       label: 'Expert',       emoji: '🚀', text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25'    },
];
export const MAX_LEVEL = 5;
export const LEVEL_STREAK_THRESHOLD = 3;
export function getLevelConfig(n) { return LEVELS.find(l => l.level === n) ?? LEVELS[0]; }
