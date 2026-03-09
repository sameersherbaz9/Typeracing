import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
    <div className="text-center animate-slide-up">
      <div className="text-8xl font-bold font-mono text-brand-500 mb-4" style={{ textShadow: '0 0 40px rgba(255,61,36,0.3)' }}>
        404
      </div>
      <h1 className="text-2xl font-bold font-display text-white mb-3">Page Not Found</h1>
      <p className="text-dark-300 mb-8">Looks like you took a wrong turn on the race track.</p>
      <Link
        to="/"
        className="inline-block px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors font-display"
      >
        ← Back to Home
      </Link>
    </div>
  </div>
);

export default NotFound;
