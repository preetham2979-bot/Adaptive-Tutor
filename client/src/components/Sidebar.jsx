import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTopics } from '../context/TopicsContext.jsx';
import { getLevelConfig } from '../config/levels.js';

function masteryColor(p) {
  if (p >= 0.95) return '#10B981';
  if (p >= 0.60) return '#6366F1';
  if (p >= 0.30) return '#F59E0B';
  return '#475569';
}

function MiniBar({ mastery }) {
  return (
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full mastery-bar-inner"
        style={{ width: `${mastery * 100}%`, backgroundColor: masteryColor(mastery) }}
      />
    </div>
  );
}

const NAV = [
  { to: '/learn',     label: 'Learn',     icon: '⚡' },
  { to: '/dashboard', label: 'Dashboard', icon: '◈'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { topics } = useTopics();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="glass-sidebar w-60 shrink-0 flex flex-col h-full z-10">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <span className="font-mono font-semibold text-base text-white">
          <span className="text-indigo-400">AT</span>
          <span className="text-slate-400 font-normal ml-2 text-sm">Adaptive Tutor</span>
        </span>
      </div>

      {/* Current level */}
      {user && (() => {
        const lvl = getLevelConfig(user.currentLevel ?? 1);
        return (
          <div className={`mx-3 mt-3 px-3 py-2.5 rounded-xl border ${lvl.border}
            flex items-center gap-2.5`}
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-xl">{lvl.emoji}</span>
            <div>
              <p className={`text-xs font-mono font-medium ${lvl.text}`}>{lvl.label}</p>
              <p className="text-[10px] font-mono text-slate-600">Level {user.currentLevel ?? 1} / 5</p>
            </div>
          </div>
        );
      })()}

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200
              ${isActive
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Topic progress */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3 px-1">
          Progress
        </p>
        <div className="space-y-3">
          {topics.map(t => (
            <div key={t.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-mono text-slate-400 truncate pr-2">{t.name}</span>
                <span className="text-[10px] font-mono shrink-0"
                  style={{ color: masteryColor(t.mastery) }}>
                  {Math.round(t.mastery * 100)}%
                </span>
              </div>
              <MiniBar mastery={t.mastery} />
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <p className="text-[11px] font-mono text-slate-500 truncate mb-2">{user?.email}</p>
        <button onClick={handleLogout}
          className="text-[11px] font-mono text-slate-600 hover:text-red-400 transition-colors duration-200">
          Log out →
        </button>
      </div>
    </aside>
  );
}
