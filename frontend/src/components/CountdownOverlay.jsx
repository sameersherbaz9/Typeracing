import { useState, useEffect } from 'react';

const CountdownOverlay = ({ seconds, onDone }) => {
  const [current, setCurrent] = useState(seconds);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setCurrent(seconds);
    setKey((k) => k + 1);

    if (seconds === 0) {
      onDone?.();
    }
  }, [seconds]);

  if (seconds === null) return null;

  return (
    <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
      <div className="text-center">
        {current > 0 ? (
          <>
            <div
              key={key}
              className="countdown-number text-[8rem] font-bold font-display text-brand-500 leading-none"
              style={{ textShadow: '0 0 60px rgba(255,61,36,0.5)' }}
            >
              {current}
            </div>
            <p className="text-dark-300 font-display mt-2 tracking-widest uppercase text-sm">Get ready...</p>
          </>
        ) : (
          <div className="animate-bounce-in">
            <div
              className="text-6xl font-bold font-display text-neon-green leading-none"
              style={{ textShadow: '0 0 40px rgba(0,255,136,0.5)' }}
            >
              GO!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountdownOverlay;
