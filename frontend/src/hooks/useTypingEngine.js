import { useState, useEffect, useRef, useCallback } from 'react';

// --- Sound Effects via Web Audio API (no external files needed) ---
const createSound = (ctx, type) => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  if (type === 'correct') {
    o.frequency.value = 600;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.type = 'sine';
  } else {
    o.frequency.value = 180;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.type = 'square';
  }
  o.start();
  o.stop(ctx.currentTime + 0.15);
};

// Shared typing engine — tracks typed text, WPM, accuracy, errors, tricky keys.
// Used by both the classic TypingArea and the scenic RaceScene.
export const useTypingEngine = ({ text, onProgress, onFinish, disabled = false, started = false, soundEnabled = true }) => {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [finished, setFinished] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [trickyKeys, setTrickyKeys] = useState({});
  const inputRef = useRef(null);
  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  // Reset state whenever the text changes
  useEffect(() => {
    setTyped('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setFinished(false);
    setErrorCount(0);
    setTrickyKeys({});
  }, [text]);

  // Auto-focus the hidden input as soon as typing is allowed
  useEffect(() => {
    if (started && !disabled) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [started, disabled]);

  const calculateStats = useCallback((typedText, startT) => {
    if (!startT || typedText.length === 0) return { wpm: 0, accuracy: 100 };
    const elapsed = (Date.now() - startT) / 1000 / 60;
    const correctChars = typedText.split('').filter((c, i) => c === text[i]).length;
    const calcWpm = Math.round((typedText.length / 5) / Math.max(elapsed, 0.01));
    const calcAccuracy = Math.round((correctChars / typedText.length) * 100);
    return { wpm: calcWpm, accuracy: calcAccuracy };
  }, [text]);

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState?.('CapsLock') || false);
  };

  const handleInput = useCallback((e) => {
    if (disabled || finished || !started) return;
    const value = e.target.value;
    if (value.length > text.length) return;

    let currentStart = startTime;
    if (!startTime && value.length > 0) {
      currentStart = Date.now();
      setStartTime(currentStart);
    }

    const lastIdx = value.length - 1;
    if (lastIdx >= 0 && value.length > typed.length) {
      const isCorrect = value[lastIdx] === text[lastIdx];
      if (soundEnabled) {
        try { createSound(getAudioCtx(), isCorrect ? 'correct' : 'error'); } catch {}
      }
      if (!isCorrect) {
        setErrorCount(c => c + 1);
        const wrongChar = text[lastIdx];
        setTrickyKeys(prev => ({ ...prev, [wrongChar]: (prev[wrongChar] || 0) + 1 }));
      }
    }

    setTyped(value);
    const { wpm: newWpm, accuracy: newAcc } = calculateStats(value, currentStart);
    setWpm(newWpm);
    setAccuracy(newAcc);

    const progress = Math.round((value.length / text.length) * 100);
    onProgress?.({ progress, wpm: newWpm, accuracy: newAcc });

    if (value.length === text.length) {
      const elapsed = Date.now() - currentStart;
      setFinished(true);
      onFinish?.({ wpm: newWpm, accuracy: newAcc, time: elapsed, errors: errorCount, trickyKeys });
    }
  }, [disabled, finished, started, startTime, text, typed, soundEnabled, errorCount, trickyKeys, calculateStats, onProgress, onFinish]);

  const progress = text ? Math.round((typed.length / text.length) * 100) : 0;

  return {
    typed, wpm, accuracy, finished, capsLock, errorCount, trickyKeys, progress,
    inputRef, handleInput, handleKeyDown,
  };
};
