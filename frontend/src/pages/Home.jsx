import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeatureCard = ({ icon, title, desc, delay }) => (
  <div
    className={`glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-1 animate-slide-up stagger-${delay}`}
  >
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold font-display text-white mb-2">{title}</h3>
    <p className="text-dark-200 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StatCard = ({ value, label }) => (
  <div className="text-center">
    <div className="text-4xl font-bold font-display text-brand-400">{value}</div>
    <div className="text-dark-300 text-sm mt-1">{label}</div>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono mb-8 animate-slide-up">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse-fast" />
            LIVE MULTIPLAYER TYPING RACES
          </div>

          <h1 className="text-6xl md:text-8xl font-bold font-display text-white mb-6 animate-slide-up stagger-1 leading-none">
            Race Your
            <br />
            <span className="text-brand-500" style={{ textShadow: '0 0 40px rgba(255,61,36,0.3)' }}>
              Fingers
            </span>
          </h1>

          <p className="text-xl text-dark-200 mb-10 max-w-2xl mx-auto animate-slide-up stagger-2 leading-relaxed">
            Compete in real-time typing races. Sharpen your skills, climb the leaderboard,
            and dominate the keyboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            {user ? (
              <>
                <Link
                  to="/race"
                  className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display"
                >
                  Find Race →
                </Link>
                <Link
                  to="/practice"
                  className="px-8 py-4 glass border border-white/10 hover:border-brand-500/30 text-white font-semibold rounded-xl text-lg transition-all duration-200 font-display"
                >
                  Practice Mode
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display"
                >
                  Start Racing Free →
                </Link>
                <Link
                  to="/leaderboard"
                  className="px-8 py-4 glass border border-white/10 hover:border-brand-500/30 text-white font-semibold rounded-xl text-lg transition-all duration-200 font-display"
                >
                  View Leaderboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            <StatCard value="120+" label="WPM Record" />
            <StatCard value="6" label="Modes" />
            <StatCard value="∞" label="Races" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold font-display text-white mb-4">
              Everything you need to{' '}
              <span className="text-brand-500">type faster</span>
            </h2>
            <p className="text-dark-200 text-lg">Built for competitive typists and beginners alike.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard delay={1} icon="🏎️" title="Multiplayer Racing" desc="Race against real players in real-time. See everyone's progress live as you type." />
            <FeatureCard delay={2} icon="🎯" title="Practice Mode" desc="Improve solo with random texts. Track your WPM and accuracy over time." />
            <FeatureCard delay={3} icon="📊" title="Live Statistics" desc="Real-time WPM, accuracy, and progress tracking as you race." />
            <FeatureCard delay={4} icon="🏆" title="Global Leaderboard" desc="Compete for the top spot. Rankings based on your best WPM performance." />
            <FeatureCard delay={5} icon="🔒" title="Private Rooms" desc="Create private races with a room code and invite only your friends." />
            <FeatureCard delay={6} icon="💻" title="Coding Mode" desc="Practice typing real code snippets. Perfect for developers." />
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="glass rounded-3xl p-12 border border-brand-500/10">
              <h2 className="text-4xl font-bold font-display text-white mb-4">Ready to race?</h2>
              <p className="text-dark-200 mb-8">Create your free account and start competing in seconds.</p>
              <Link
                to="/register"
                className="inline-block px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-lg transition-all duration-200 hover:glow-brand font-display"
              >
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
