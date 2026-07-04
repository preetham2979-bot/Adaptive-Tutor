import MasteryBar from './MasteryBar.jsx';

export default function FeedbackPanel({ feedback, onNext }) {
  const { correct, explanation, masteryBefore, masteryAfter, mastered } = feedback;
  const delta = masteryAfter - masteryBefore;

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Result */}
      <div className={`glass rounded-xl p-4
        ${correct ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-red-500/30 bg-red-500/[0.06]'}`}>
        <div className={`flex items-center gap-2 mb-2 font-mono font-semibold text-sm
          ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
          <span>{correct ? '✓ Correct' : '✗ Not quite'}</span>
          {mastered && <span className="text-xs text-emerald-300/60 font-normal">— topic mastered!</span>}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{explanation}</p>
      </div>

      {/* Mastery update */}
      <div className="glass rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-mono text-slate-500">mastery update</span>
          <span className={`text-xs font-mono font-medium ${delta >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
            {Math.round(masteryBefore * 100)}% → {Math.round(masteryAfter * 100)}%
            <span className="ml-1 opacity-60">({delta >= 0 ? '+' : ''}{Math.round(delta * 100)}%)</span>
          </span>
        </div>
        <MasteryBar mastery={masteryAfter} prevMastery={masteryBefore} />
      </div>

      <button onClick={onNext}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm
          rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
        Next Question →
      </button>
    </div>
  );
}
