import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function heatmapColor(count) {
  if (count === 0) return 'rgba(255,255,255,0.05)';
  if (count <= 2)  return 'rgba(99,102,241,0.35)';
  if (count <= 5)  return 'rgba(99,102,241,0.65)';
  return                   'rgba(99,102,241,0.95)';
}

function buildGrid(activityData) {
  const map = {};
  activityData.forEach(d => { map[d.day] = d.count; });
  const grid = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    grid.push({ date: dateStr, count: map[dateStr] || 0 });
  }
  return grid;
}

const DAY_LABELS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

export default function ActivityHeatmap() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats.activity()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="glass rounded-xl p-5 h-28 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const grid  = buildGrid(data.activity);
  const weeks = [];
  for (let w = 0; w < 12; w++) weeks.push(grid.slice(w * 7, (w + 1) * 7));

  return (
    <div className="glass rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
            Activity — last 12 weeks
          </p>
          <p className="text-xs text-slate-500 font-mono">{data.totalAttempts} total answers</p>
        </div>
        <div className="flex gap-5">
          <div className="text-center">
            <p className="text-xl font-mono font-bold text-orange-400">🔥 {data.currentStreak}</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">day streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-mono font-bold text-violet-400">⚡ {data.longestStreak}</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">longest</p>
          </div>
        </div>
      </div>

      {/* Heatmap — horizontally scrollable on small screens */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[480px]">
          <div className="flex gap-2">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-1 pt-0.5 shrink-0">
              {DAY_LABELS.map((l, i) => (
                <div key={i} style={{ height: '14px' }} className="flex items-center">
                  <span className="text-[9px] font-mono text-slate-700 w-6 leading-none">{l}</span>
                </div>
              ))}
            </div>
            {/* Week columns */}
            <div className="flex gap-1 flex-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map((day, di) => (
                    <div key={di}
                      className="rounded-[3px] hover:scale-110 transition-transform cursor-default"
                      style={{ height: '14px', backgroundColor: heatmapColor(day.count) }}
                      title={`${day.date}: ${day.count} attempt${day.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[9px] font-mono text-slate-700">Less</span>
            {[0, 2, 4, 7].map(n => (
              <div key={n} className="w-3 h-3 rounded-[3px]"
                style={{ backgroundColor: heatmapColor(n) }} />
            ))}
            <span className="text-[9px] font-mono text-slate-700">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
