import { useEffect, useState } from 'react';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981'; // emerald  — mastered
  if (p >= 0.60) return '#6366F1'; // indigo   — getting there
  if (p >= 0.30) return '#F59E0B'; // amber    — early progress
  return '#475569';                 // slate    — just started
}

/**
 * Animated probability bar.
 * Mounts at 0 width and transitions to the real value —
 * making the hidden BKT math visually satisfying.
 */
export default function MasteryBar({ mastery, prevMastery = null, showLabel = false, className = '' }) {
  const [displayWidth, setDisplayWidth] = useState(prevMastery !== null ? prevMastery * 100 : 0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayWidth(mastery * 100), 150);
    return () => clearTimeout(t);
  }, [mastery]);

  const pct = Math.round(mastery * 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500 font-mono">mastery</span>
          <span className="text-xs font-mono font-medium" style={{ color: masteryColor(mastery) }}>
            {pct}%{mastery >= 0.95 && ' ✓'}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-raised rounded-full overflow-hidden">
        <div
          className="mastery-bar-inner h-full rounded-full"
          style={{
            width: `${displayWidth}%`,
            backgroundColor: masteryColor(mastery),
          }}
        />
      </div>
    </div>
  );
}
