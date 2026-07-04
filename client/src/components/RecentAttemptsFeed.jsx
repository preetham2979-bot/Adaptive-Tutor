import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

export default function RecentAttemptsFeed() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.stats.recent()
      .then(d => setAttempts(d.attempts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass rounded-xl p-5 flex flex-col h-full">
      <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4 shrink-0">
        Recent Activity
      </p>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && attempts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <p className="text-2xl mb-3">📭</p>
          <p className="text-xs font-mono text-slate-600">No activity yet</p>
          <p className="text-[11px] font-mono text-slate-700 mt-1">
            Answer questions to see your history
          </p>
        </div>
      )}

      <div className="space-y-1.5 overflow-y-auto">
        {attempts.map(a => {
          const delta = a.p_mastery_after - a.p_mastery_before;
          return (
            <div key={a.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                bg-white/[0.02] border border-white/[0.04]
                hover:bg-white/[0.05] transition-colors duration-150">

              {/* Correct / wrong */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs
                ${a.correct
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'}`}>
                {a.correct ? '✓' : '✗'}
              </div>

              {/* Topic + mastery change */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono truncate font-medium"
                  style={{ color: masteryColor(a.p_mastery_after) }}>
                  {a.topic_name}
                </p>
                <p className={`text-[10px] font-mono mt-0.5
                  ${delta >= 0 ? 'text-indigo-400/70' : 'text-red-400/70'}`}>
                  {Math.round(a.p_mastery_before * 100)}%
                  <span className="text-slate-700 mx-1">→</span>
                  {Math.round(a.p_mastery_after * 100)}%
                  <span className="ml-1 opacity-50">
                    ({delta >= 0 ? '+' : ''}{Math.round(delta * 100)}%)
                  </span>
                </p>
              </div>

              {/* Time */}
              <span className="text-[10px] font-mono text-slate-700 shrink-0">
                {timeAgo(a.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
