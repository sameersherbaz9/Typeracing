import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

// Animated typing demo text
const DEMO_TEXT = "The quick brown fox jumps over the lazy dog.";

const TypingDemo = () => {
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (pos >= DEMO_TEXT.length) {
      setTimeout(() => setPos(0), 1500);
      return;
    }
    const t = setTimeout(() => setPos(p => p + 1), 80 + Math.random() * 60);
    return () => clearTimeout(t);
  }, [pos]);

  return (
    <div className="glass rounded-xl p-4 font-mono text-sm border border-white/5 select-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="text-dark-400 text-xs ml-2">practice_race.txt</span>
      </div>
      <p style={{ fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
        {DEMO_TEXT.split('').map((char, i) => (
          <span key={i} style={{
            color: i < pos ? '#00ff88' : i === pos ? '#fff' : '#5a5a75',
            textDecoration: i === pos ? 'underline' : 'none',
          }}>
            {char}
          </span>
        ))}
      </p>
      <div className="mt-3 flex gap-4 text-xs font-mono">
        <span className="text-brand-400">WPM: <strong>{Math.round((pos / 5) / 0.1) > 0 ? Math.min(Math.round((pos / 5) / 0.05), 85) : 0}</strong></span>
        <span className="text-neon-green">ACC: <strong>99%</strong></span>
        <span className="text-dark-300">PROG: <strong>{Math.round((pos / DEMO_TEXT.length) * 100)}%</strong></span>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, badge }) => (
  <div className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-1 group">
    <div className="flex items-start justify-between mb-3">
      <span className="text-3xl">{icon}</span>
      {badge && <span className="text-xs px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full font-mono border border-brand-500/20">{badge}</span>}
    </div>
    <h3 className="font-semibold font-display text-white mb-2 group-hover:text-brand-400 transition-colors">{title}</h3>
    <p className="text-dark-300 text-sm leading-relaxed">{desc}</p>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono mb-6 animate-slide-up">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse-fast" />
                REAL-TIME MULTIPLAYER TYPING RACES
              </div>

              <h1 className="text-5xl md:text-7xl font-bold font-display text-white mb-6 animate-slide-up stagger-1 leading-tight">
                The fastest
                <br />
                <span className="text-brand-500" style={{ textShadow: '0 0 40px rgba(255,61,36,0.3)' }}>
                  typists
                </span>
                <br />
                race here.
              </h1>

              <p className="text-lg text-dark-200 mb-8 animate-slide-up stagger-2 leading-relaxed max-w-md">
                Compete in live typing races, track your WPM, analyze your weak keys, and climb the global leaderboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-slide-up stagger-3">
                {user ? (
                  <>
                    <Link to="/race" className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display text-center">
                      🏎️ Find Race →
                    </Link>
                    <Link to="/practice" className="px-8 py-4 glass border border-white/10 hover:border-brand-500/30 text-white font-semibold rounded-xl text-lg transition-all duration-200 font-display text-center">
                      🎯 Practice
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display text-center">
                      Start Racing Free →
                    </Link>
                    <Link to="/login" className="px-8 py-4 glass border border-white/10 hover:border-brand-500/30 text-white font-semibold rounded-xl text-lg transition-all duration-200 font-display text-center">
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-6 mt-10 animate-slide-up stagger-4">
                {[
                  { v: '150+', l: 'WPM Record' },
                  { v: '3', l: 'Languages' },
                  { v: '4', l: 'Time Modes' },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div className="text-2xl font-bold font-mono text-brand-400">{v}</div>
                    <div className="text-dark-400 text-xs font-display">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: live demo */}
            <div className="animate-slide-up stagger-2 space-y-4">
              <TypingDemo />

              {/* Mock race track */}
              <div className="glass rounded-xl p-4 border border-white/5 space-y-3">
                <p className="text-xs font-display text-dark-400 uppercase tracking-wider">🏁 Live Race — Room XYZABC</p>
                {[
                  { name: 'SpeedKing99', pct: 87, wpm: 112, avatar: '🏎️', color: 'from-brand-500 to-orange-500' },
                  { name: 'TypeMaster', pct: 74, wpm: 94,  avatar: '🚀', color: 'from-blue-500 to-cyan-400' },
                  { name: 'KeyWizard',  pct: 61, wpm: 78,  avatar: '⚡', color: 'from-purple-500 to-violet-400' },
                ].map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white">{p.avatar} {p.name}</span>
                      <span className="text-brand-400 font-bold">{p.wpm} WPM</span>
                    </div>
                    <div className="h-5 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className={`h-full rounded-lg bg-gradient-to-r ${p.color} opacity-30`} style={{ width: `${p.pct}%` }} />
                      <div className="absolute top-1/2 -translate-y-1/2 text-sm" style={{ left: `calc(${p.pct}% - 12px)` }}>{p.avatar}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold font-display text-white mb-4">
              Built to make you <span className="text-brand-500">type faster</span>
            </h2>
            <p className="text-dark-300 text-lg">Every feature designed to sharpen your skills and fuel competition.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon="🏎️" title="Real-Time Multiplayer" badge="LIVE" desc="Race against real players with live animated race track. See every opponent's car move as they type." />
            <FeatureCard icon="⚡" title="Tricky Key Tracker" badge="NEW" desc="After every race, see exactly which keys are slowing you down and how many times you hit them wrong." />
            <FeatureCard icon="⌨️" title="Keystroke Sounds" badge="NEW" desc="Satisfying audio feedback on every keystroke. Hear the difference between correct and incorrect characters." />
            <FeatureCard icon="⚠️" title="Caps Lock Warning" desc="Instant alert when Caps Lock is on so you never lose a race to a silly keyboard mistake." />
            <FeatureCard icon="⏱️" title="Time Modes" badge="NEW" desc="Practice with 15s, 30s, 60s sprints or unlimited mode. Race the clock and your best score." />
            <FeatureCard icon="💬" title="Race Chat" badge="NEW" desc="Trash talk or cheer on opponents with live in-race chat. Make friends or rivals." />
            <FeatureCard icon="📊" title="WPM History Graph" desc="See your speed progression throughout every practice session with a visual bar chart." />
            <FeatureCard icon="🔒" title="Private Rooms" desc="Create private races with a shareable room code. Compete only with the people you invite." />
            <FeatureCard icon="💻" title="Coding Mode" desc="Practice typing real code snippets in JavaScript, SQL, and more. Perfect for developers." />
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="glass rounded-3xl p-12 border border-brand-500/10">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-4xl font-bold font-display text-white mb-4">Ready to race?</h2>
              <p className="text-dark-200 mb-8 text-lg">Join thousands of typists competing in real-time. Free forever.</p>
              <Link to="/register"
                className="inline-block px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display">
                Create Free Account →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
