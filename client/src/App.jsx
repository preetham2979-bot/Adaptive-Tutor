import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TopicsProvider } from './context/TopicsContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import AuthPage from './pages/AuthPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Shown on mobile only — logo + logout */
function MobileTopBar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-12 shrink-0
      bg-abyss/80 backdrop-blur-md border-b border-white/[0.06]">
      <span className="font-mono font-semibold text-sm">
        <span className="text-indigo-400">Adaptive</span>
        <span className="text-white ml-1">Tutor</span>
      </span>
      <button onClick={handleLogout}
        className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors">
        Log out
      </button>
    </header>
  );
}

/** Shown on mobile only — bottom tab bar */
function MobileBottomNav() {
  return (
    <nav className="lg:hidden flex shrink-0 border-t border-white/[0.06] bg-abyss/90 backdrop-blur-md">
      {[
        { to: '/learn',     icon: '⚡', label: 'Learn'     },
        { to: '/dashboard', icon: '◈',  label: 'Dashboard' },
      ].map(({ to, icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-0.5
             font-mono text-[10px] transition-colors
             ${isActive ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`
          }>
          <span className="text-lg leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppShell() {
  const { user, authLoading } = useAuth();
  const isAuth = !authLoading && !!user;
  if (authLoading) return null;

  /* ── Unauthenticated: full-screen auth pages ── */
  if (!isAuth) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <Routes>
          <Route path="/login"    element={<AuthPage mode="login"    />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="*"         element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  /* ── Authenticated: sidebar (desktop) + content ── */
  return (
    <TopicsProvider>
      {/*
        h-[100dvh]: use dynamic viewport height so mobile browser chrome
        (address bar, tab bar) is properly accounted for.
        overflow-hidden: scroll happens inside the content pane, not the body.
      */}
      <div className="flex h-[100dvh] overflow-hidden relative">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

        {/* Sidebar — desktop only */}
        <div className="hidden lg:flex shrink-0 z-10">
          <Sidebar />
        </div>

        {/* Content column: mobile top bar + routes + mobile bottom nav */}
        <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
          <MobileTopBar />

          <main className="flex-1 min-h-0 overflow-hidden">
            <Routes>
              <Route path="/learn"
                element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
              <Route path="/dashboard"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="*"
                element={<Navigate to="/learn" replace />} />
            </Routes>
          </main>

          <MobileBottomNav />
        </div>
      </div>
    </TopicsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
