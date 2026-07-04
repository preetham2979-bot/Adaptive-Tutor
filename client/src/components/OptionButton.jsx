const STYLES = {
  null:               'glass hover:bg-white/[0.08] hover:-translate-y-0.5 text-slate-200 cursor-pointer hover:border-indigo-500/30',
  'selected-correct': 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 cursor-default',
  'selected-wrong':   'bg-red-500/15 border-red-500/60 text-red-300 cursor-default',
  'revealed-correct': 'bg-emerald-500/8 border-emerald-500/30 text-emerald-400/80 cursor-default',
  disabled:           'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-40',
};

const ICON = {
  null:               null,
  'selected-correct': '✓',
  'selected-wrong':   '✗',
  'revealed-correct': '✓',
  disabled:           null,
};

const LETTER = ['A', 'B', 'C', 'D'];

export default function OptionButton({ index, label, status, onClick }) {
  const s = STYLES[status] ?? STYLES.null;
  const icon = ICON[status];

  return (
    <button
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200
        font-mono text-sm animate-fade-in ${s}`}
      style={{ animationDelay: `${index * 55}ms` }}
      onClick={status === null ? onClick : undefined}
      disabled={status !== null}
    >
      <span className="text-slate-600 mr-3 text-xs">{LETTER[index]}.</span>
      {label}
      {icon && <span className="float-right text-sm">{icon}</span>}
    </button>
  );
}
