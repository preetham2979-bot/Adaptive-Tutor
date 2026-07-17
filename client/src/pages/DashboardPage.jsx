import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTopics } from '../context/TopicsContext.jsx';
import TopicCard from '../components/TopicCard.jsx';
import MasteryBar from '../components/MasteryBar.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';
import RecentAttemptsFeed from '../components/RecentAttemptsFeed.jsx';
import TopicDeepDive from '../components/TopicDeepDive.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs font-mono">
      <span style={{ color: masteryColor(val) }}>{Math.round(val * 100)}% mastery</span>
    </div>
  );
}

export default function DashboardPage() {
  const { topics }          = useTopics();
  const [selectedId, setSelectedId] = useState(null);

  const mastered = topics.filter(t => t.mastered).length;
  const overall  = topics.length > 0
    ? topics.reduce((s, t) => s + t.mastery, 0) / topics.length
    : 0;

  const chartData = topics.map(t => ({
    name:    t.name.replace(' / ', '/').replace(' & ', '&'),
    mastery: t.mastery,
  }));

  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">

      {/* Topic deep-dive panel */}
      {selectedId && (
        <TopicDeepDive topicId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {/* ── Row 1: Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Mastered',    value: mastered,                          unit: `/ ${topics.length} topics`,  color: 'text-emerald-400' },
          { label: 'In Progress', value: topics.length - mastered,          unit: 'remaining',                   color: 'text-indigo-400'  },
          { label: 'Avg Mastery', value: `${Math.round(overall * 100)}%`,   unit: 'across all topics',           color: 'text-violet-400'  },
          { label: 'Total Topics',value: topics.length,                     unit: 'being tracked',               color: 'text-slate-300'   },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">{label}</p>
            <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5">{unit}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Overall progress + bar chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Progress card */}
        <div className="glass rounded-xl p-5">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4">
            Overall Progress
          </p>
          <MasteryBar mastery={overall} showLabel className="mb-5" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Mastered',   val: mastered,               color: '#10B981' },
              { label: 'Remaining',  val: topics.length - mastered, color: '#6366F1' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-black/20 rounded-xl p-3">
                <p className="text-2xl font-mono font-bold" style={{ color }}>{val}</p>
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/learn"
            className="flex items-center justify-center w-full py-2.5
              bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs
              rounded-xl transition-all duration-200 hover:-translate-y-0.5">
            Continue Learning →
          </Link>
        </div>

        {/* Mastery by topic chart */}
        <div className="glass rounded-xl p-5 lg:col-span-2">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4">
            Mastery by Topic
          </p>
          {topics.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 1]}
                  tickFormatter={v => `${Math.round(v * 100)}%`}
                  tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120}
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="mastery" radius={[0, 4, 4, 0]} maxBarSize={12}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={masteryColor(entry.mastery)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs font-mono text-slate-600">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Activity heatmap ── */}
      <ActivityHeatmap />

      {/* ── Row 4: Recent feed + topic grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Recent activity feed */}
        <div className="lg:col-span-2">
          <RecentAttemptsFeed />
        </div>

        {/* Topic grid — grouped by language */}
        <div className="lg:col-span-3 space-y-5">
          {(() => {
            const LANG_LABELS = {
              javascript:'JavaScript', python:'Python', java:'Java',
              cpp:'C++', c:'C', typescript:'TypeScript', go:'Go',
              rust:'Rust', ruby:'Ruby', php:'PHP', swift:'Swift', kotlin:'Kotlin',
            };
            const progTopics = topics.filter(t => t.topicSet === 'programming');
            const dsaTopics  = topics.filter(t => t.topicSet === 'dsa');
            const groups = [];
            if (progTopics.length) groups.push({ label: 'Programming Topics', topics: progTopics });
            if (dsaTopics.length)  groups.push({ label: 'DSA Topics', topics: dsaTopics });
            return groups.map(({ label, topics: grp }) => (
              <div key={label}>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
                  {label} — Click to Explore
                </p>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {grp.map(t => (
                    <TopicCard key={t.id} topic={t} onClick={() => setSelectedId(t.id)} />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

    </div>
  );
}
