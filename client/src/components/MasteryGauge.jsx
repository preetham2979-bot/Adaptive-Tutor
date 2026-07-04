import { useEffect, useState } from 'react';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

export default function MasteryGauge({ mastery, size = 140 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplay(mastery), 200);
    return () => clearTimeout(t);
  }, [mastery]);

  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - display);
  const color = masteryColor(mastery);
  const pct = Math.round(mastery * 100);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      {/* Progress arc */}
      <circle cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease' }}
      />
      {/* Glow ring for mastered */}
      {mastery >= 0.95 && (
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          opacity="0.12"
        />
      )}
      {/* Percent */}
      <text x="50" y="46" textAnchor="middle"
        fill="white" fontSize="18" fontWeight="600"
        fontFamily="JetBrains Mono, monospace">
        {pct}%
      </text>
      <text x="50" y="60" textAnchor="middle"
        fill="rgba(148,163,184,0.7)" fontSize="8"
        fontFamily="JetBrains Mono, monospace">
        {mastery >= 0.95 ? 'mastered ✓' : 'mastery'}
      </text>
    </svg>
  );
}
