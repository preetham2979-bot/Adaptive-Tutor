import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '◈', title: 'Bayesian Knowledge Tracing', desc: 'Probabilistic mastery tracking — four equations, no neural net.' },
  { icon: '⚡', title: 'LLM-Generated Questions',   desc: 'Questions adapt to your level, generated on demand.'           },
  { icon: '▸', title: 'Clean Separation',           desc: 'BKT decides what is next. The LLM only writes the words.'     },
];

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'python',     label: 'Python',     icon: '🐍' },
  { value: 'java',       label: 'Java',       icon: '☕' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'cpp',        label: 'C++',        icon: '⚙️' },
  { value: 'c',          label: 'C',          icon: '🔩' },
  { value: 'go',         label: 'Go',         icon: '🐹' },
  { value: 'rust',       label: 'Rust',       icon: '🦀' },
  { value: 'ruby',       label: 'Ruby',       icon: '💎' },
  { value: 'swift',      label: 'Swift',      icon: '🦉' },
  { value: 'kotlin',     label: 'Kotlin',     icon: '🟣' },
  { value: 'php',        label: 'PHP',        icon: '🐘' },
];

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5
           c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639
           C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5
           c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5
           c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774
           M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21
           m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [lang, setLang]         = useState('javascript');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const isRegister = mode === 'register';
  const isDSA      = lang === 'dsa';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = isRegister
      ? await register(email, password, lang)
      : await login(email, password);
    setLoading(false);
    if (err) setError(err);
    else navigate('/learn');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      {/* Left — product pitch */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-5/12 relative z-10">
        <div className="mb-10">
          <span className="font-mono text-xs text-indigo-400 tracking-widest uppercase mb-4 block">
            Portfolio Project
          </span>
          <h1 className="font-mono text-4xl font-bold text-white leading-tight mb-4">
            Adaptive<br /><span className="text-indigo-400">Tutor</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            A knowledge tracing agent that learns what you know and adapts in real time.
            BKT makes the decisions. The LLM generates the text.
          </p>
        </div>
        <div className="space-y-5">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20
                flex items-center justify-center shrink-0 font-mono text-indigo-400 text-sm">
                {f.icon}
              </div>
              <div>
                <p className="font-mono text-sm text-slate-200 mb-0.5">{f.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10 overflow-y-auto py-8">
        <div className="w-full max-w-lg">
          <div className="glass-strong rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex gap-1 bg-black/20 rounded-xl p-1 mb-7">
              {[{to:'/login',label:'Log in'},{to:'/register',label:'Register'}].map(({to,label}) => (
                <Link key={to} to={to}
                  className={`flex-1 text-center text-sm font-mono py-2.5 rounded-lg transition-all duration-200
                    ${(mode==='login' && to==='/login') || (mode==='register' && to==='/register')
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-300'}`}>
                  {label}
                </Link>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm
                    font-mono text-slate-200 placeholder-slate-700 focus:outline-none
                    focus:border-indigo-500/50 transition-colors duration-200"
                  placeholder="you@example.com" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={8}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 pr-12
                      text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none
                      focus:border-indigo-500/50 transition-colors duration-200"
                    placeholder="at least 8 characters" />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1">
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              {/* Subject / language — register only */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-3">Choose your subject</label>

                  <button type="button" onClick={() => setLang('dsa')}
                    className={`w-full mb-3 px-4 py-3 rounded-xl border text-sm font-mono
                      transition-all duration-200 flex items-center gap-3
                      ${isDSA
                        ? 'bg-violet-600/20 border-violet-500/50 text-violet-200'
                        : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'}`}>
                    <span className="text-xl">🧩</span>
                    <div className="text-left">
                      <p className="font-semibold">Data Structures & Algorithms</p>
                      <p className="text-[11px] opacity-70 mt-0.5">Arrays, trees, graphs, DP, sorting</p>
                    </div>
                    {isDSA && <span className="ml-auto text-violet-400">✓</span>}
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[10px] font-mono text-slate-600">or pick a language</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {PROGRAMMING_LANGUAGES.map(l => (
                      <button key={l.value} type="button" onClick={() => setLang(l.value)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-mono
                          transition-all duration-200 flex items-center gap-2
                          ${lang === l.value && !isDSA
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                            : 'bg-black/20 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}>
                        <span>{l.icon}</span><span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20
                  rounded-xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                  text-white font-mono text-sm rounded-xl transition-all duration-200
                  hover:-translate-y-0.5 active:translate-y-0">
                {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
