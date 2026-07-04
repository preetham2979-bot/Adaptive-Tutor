import { useState } from 'react';

export default function HintPanel({ hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3
          text-xs font-mono text-slate-400 hover:text-amber-300 transition-colors duration-200">
        <span className="flex items-center gap-2">
          <span className="text-amber-400">💡</span>
          <span>{open ? 'Hide hint' : 'Need a hint?'}</span>
        </span>
        <span className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-32' : 'max-h-0'}`}>
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06]">
          <p className="text-xs font-mono text-amber-300/80 leading-relaxed mt-3">{hint}</p>
        </div>
      </div>
    </div>
  );
}
