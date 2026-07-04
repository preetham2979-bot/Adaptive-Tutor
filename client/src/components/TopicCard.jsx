import MasteryBar from './MasteryBar.jsx';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

function difficultyLabel(p) {
  if (p < 0.4)  return { label: 'Beginner',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (p < 0.75) return { label: 'Intermediate', color: 'text-amber-400   bg-amber-500/10   border-amber-500/20' };
  return             { label: 'Advanced',      color: 'text-rose-400    bg-rose-500/10    border-rose-500/20' };
}

export default function TopicCard({ topic, onClick }) {
  const { name, description, mastery, mastered } = topic;
  const pct = Math.round(mastery * 100);
  const { label, color } = difficultyLabel(mastery);

  return (
    <button onClick={onClick}
      className={`w-full text-left glass rounded-xl p-4 transition-all duration-200
        hover:bg-white/[0.08] hover:-translate-y-0.5 group
        ${mastered ? 'mastered-glow' : 'hover:border-indigo-500/25'}`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="font-mono font-medium text-slate-100 text-xs leading-snug">{name}</h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {mastered && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full
              text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              ✓
            </span>
          )}
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${color}`}>
            {label}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 mb-3 leading-relaxed line-clamp-2">{description}</p>

      {/* Mastery bar + percent */}
      <div className="flex items-center gap-2">
        <MasteryBar mastery={mastery} className="flex-1" />
        <span className="text-[10px] font-mono font-semibold shrink-0"
          style={{ color: masteryColor(mastery) }}>
          {pct}%
        </span>
      </div>

      {/* Explore hint on hover */}
      <p className="text-[9px] font-mono text-slate-700 group-hover:text-indigo-400/60
        transition-colors duration-200 mt-2">
        Click to explore →
      </p>
    </button>
  );
}
