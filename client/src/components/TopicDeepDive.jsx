import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import MasteryGauge from './MasteryGauge.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

const BKT_PARAMS = [
  { key: 'pInit',    label: 'p(init)',    desc: 'Prior knowledge' },
  { key: 'pTransit', label: 'p(transit)', desc: 'Learning rate'   },
  { key: 'pGuess',   label: 'p(guess)',   desc: 'Lucky guess'     },
  { key: 'pSlip',    label: 'p(slip)',    desc: 'Careless error'  },
];

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4}
    fill={payload.correct ? '#10B981' : '#EF4444'}
    stroke="rgba(0,0,0,0.4)" strokeWidth={1} />;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-[10px] font-mono">
      <p style={{ color: masteryColor(d.mastery / 100) }}>{d.mastery}% mastery</p>
      <p className={d.correct ? 'text-emerald-400' : 'text-red-400'}>
        {d.correct ? '✓ Correct' : '✗ Incorrect'}
      </p>
    </div>
  );
}

export default function TopicDeepDive({ topicId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!topicId) return;
    setLoading(true); setData(null);
    api.topics.stats(topicId)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const chartData = (data?.attempts || []).map((a, i) => ({
    attempt: i + 1,
    mastery: Math.round(a.p_mastery_after * 100),
    correct: a.correct === 1,
  }));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — full-width on mobile, 400px on md+ */}
      <div className="fixed inset-x-0 bottom-0 top-12 md:top-0 md:inset-x-auto md:right-0
        md:h-full md:w-[400px] z-50 overflow-y-auto
        bg-[#070B14] border-t md:border-t-0 md:border-l border-white/[0.08]
        animate-slide-from-right shadow-2xl rounded-t-2xl md:rounded-none">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4
          bg-[#070B14]/90 backdrop-blur-md border-b border-white/[0.06] z-10">
          <div className="flex items-center gap-3">
            {/* Mobile drag handle */}
            <div className="w-8 h-1 rounded-full bg-white/20 md:hidden" />
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Topic Detail
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1]
              text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center text-sm">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="p-5 space-y-5">
            {/* Gauge + name */}
            <div className="flex flex-col items-center text-center pt-2">
              <MasteryGauge mastery={data.mastery} size={120} />
              <h2 className="font-mono font-semibold text-slate-100 text-base mt-3">{data.topic.name}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs">{data.topic.description}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Attempts', value: data.totalAttempts,                    color: 'text-indigo-400' },
                { label: 'Accuracy', value: `${Math.round(data.accuracy*100)}%`,   color: 'text-emerald-400' },
                { label: 'Mastery',  value: `${Math.round(data.mastery*100)}%`,    color: masteryColor(data.mastery) },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass rounded-xl p-3 text-center">
                  <p className={`text-lg font-mono font-bold`}
                    style={color.startsWith('#') ? { color } : undefined}>{value}</p>
                  <p className={`text-[10px] font-mono text-slate-600 mt-0.5 ${!color.startsWith('#') ? color : ''}`}>{label}</p>
                </div>
              ))}
            </div>

            {/* BKT Parameters */}
            <div>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">BKT Parameters</p>
              <div className="grid grid-cols-2 gap-2">
                {BKT_PARAMS.map(({ key, label, desc }) => (
                  <div key={key} className="glass rounded-xl p-3">
                    <p className="text-[10px] font-mono text-indigo-400/80">{label}</p>
                    <p className="text-xl font-mono font-bold text-slate-100 mt-1 mb-0.5">
                      {Math.round(data.topic[key] * 100)}%
                    </p>
                    <p className="text-[9px] font-mono text-slate-600 mb-2">{desc}</p>
                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full mastery-bar-inner bg-indigo-500/50"
                        style={{ width: `${data.topic[key]*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mastery history */}
            {chartData.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
                  Mastery History ({chartData.length} attempt{chartData.length !== 1 ? 's' : ''})
                </p>
                <div className="glass rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                      <XAxis dataKey="attempt"
                        tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                        axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`}
                        tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                        axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
                      <Line type="monotone" dataKey="mastery" stroke="#6366F1" strokeWidth={2}
                        dot={<CustomDot />} activeDot={{ r: 5, fill: '#6366F1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 justify-center mt-2">
                    {[['#10B981','Correct'],['#EF4444','Incorrect']].map(([color, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[9px] font-mono text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => { navigate('/learn'); onClose(); }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white
                font-mono text-sm rounded-xl transition-all duration-200 hover:-translate-y-0.5">
              Practice This Topic →
            </button>
          </div>
        ) : (
          <p className="text-center text-xs font-mono text-red-400 py-20">Failed to load topic data</p>
        )}
      </div>
    </>
  );
}
