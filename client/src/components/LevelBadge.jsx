import { getLevelConfig } from '../config/levels.js';

export default function LevelBadge({ level, size = 'sm' }) {
  const cfg = getLevelConfig(level);
  return (
    <span className={`font-mono border rounded-full inline-flex items-center gap-1
      ${cfg.text} ${cfg.bg} ${cfg.border}
      ${size === 'sm'  ? 'text-[10px] px-2 py-0.5' : ''}
      ${size === 'md'  ? 'text-xs    px-3 py-1'     : ''}
      ${size === 'lg'  ? 'text-sm    px-4 py-1.5'   : ''}`}>
      <span>{cfg.emoji}</span>
      <span>Level {level} · {cfg.label}</span>
    </span>
  );
}
