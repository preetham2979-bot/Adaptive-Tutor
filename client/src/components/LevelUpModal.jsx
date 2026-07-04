import { getLevelConfig } from '../config/levels.js';

// Mini streak pip — shows how many correct answers built up to this moment
function StreakPips({ count }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {[...Array(count)].map((_, i) => (
        <div key={i}
          className="w-2.5 h-2.5 rounded-full bg-emerald-500"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export default function LevelUpModal({ currentLevel, nextLevel, streakCount, onAdvance, onStay }) {
  const current = getLevelConfig(currentLevel);
  const next    = getLevelConfig(nextLevel);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-strong rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in
          border border-white/[0.12] shadow-2xl">

          {/* Current level emoji — large */}
          <div className="text-6xl mb-2 animate-bounce" style={{ animationDuration: '1.5s' }}>
            {current.emoji}
          </div>

          {/* Streak pips */}
          <div className="mb-4">
            <StreakPips count={streakCount} />
          </div>

          {/* Headline */}
          <h2 className="font-mono font-bold text-white text-xl mb-2">
            You're crushing <span className={current.text}>{current.label}</span>!
          </h2>
          <p className="text-sm text-slate-400 mb-7 leading-relaxed">
            {streakCount} correct in a row. Ready to level up to{' '}
            <span className={`font-medium ${next.text}`}>{next.label}</span> challenges?
          </p>

          {/* Level transition visual */}
          <div className="flex items-center justify-center gap-4 mb-8 px-4">
            <div className={`flex-1 glass rounded-xl py-3 border ${current.border}`}>
              <p className="text-2xl">{current.emoji}</p>
              <p className={`text-xs font-mono mt-1 ${current.text}`}>{current.label}</p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">current</p>
            </div>
            <div className="text-slate-600 text-xl font-mono">→</div>
            <div className={`flex-1 rounded-xl py-3 border ${next.border} ${next.bg}`}>
              <p className="text-2xl">{next.emoji}</p>
              <p className={`text-xs font-mono mt-1 ${next.text}`}>{next.label}</p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">next</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button onClick={onAdvance}
              className={`w-full py-3.5 rounded-xl font-mono text-sm font-medium
                transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0
                text-white ${next.bg} border ${next.border} hover:opacity-90`}
              style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
              Level Up to {next.label} {next.emoji}
            </button>
            <button onClick={onStay}
              className="w-full py-2.5 text-slate-500 hover:text-slate-300 font-mono text-sm
                transition-colors duration-200 rounded-xl hover:bg-white/[0.03]">
              Keep practicing {current.label} first
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
