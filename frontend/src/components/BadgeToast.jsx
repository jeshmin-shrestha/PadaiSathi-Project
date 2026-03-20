import React, { useState, useEffect, useRef } from 'react';

/**
 * BadgeToast
 * Props:
 *   badgeIds  — string[]  list of newly earned badge IDs
 *   onDone    — () => void  called after all popups have been shown
 */

const BADGE_DEFINITIONS = [
  { id: "trailblazer",        name: "Trailblazer",        icon: "🐣", description: "You uploaded your very first document!" },
  { id: "summary_scout",      name: "Summary Scout",      icon: "📝", description: "You've generated 3 summaries. Keep it up!" },
  { id: "summary_sensei",     name: "Summary Sensei",     icon: "🧠", description: "10 summaries generated. You're a summarizing machine!" },
  { id: "card_sharp",         name: "Card Sharp",         icon: "📇", description: "25 flashcards created. Your memory is getting sharper!" },
  { id: "deck_destroyer",     name: "Deck Destroyer",     icon: "⚡", description: "100 flashcards! You've absolutely crushed it." },
  { id: "quiz_challenger",    name: "Quiz Challenger",    icon: "❓", description: "10 quiz questions completed. Challenge accepted!" },
  { id: "trivia_titan",       name: "Trivia Titan",       icon: "🏆", description: "50 quiz questions crushed. You're unstoppable!" },
  { id: "video_visionary",    name: "Video Visionary",    icon: "🎬", description: "3 videos generated. Lights, camera, learning!" },
  { id: "knowledge_keeper",   name: "Knowledge Keeper",   icon: "📓", description: "5 notebooks created. Your knowledge is well organized!" },
  { id: "the_archivist",      name: "The Archivist",      icon: "🗂️", description: "15 notebooks! You've built an impressive library." },
  { id: "point_hunter",       name: "Point Hunter",       icon: "💰", description: "500 points reached. The grind is paying off!" },
  { id: "point_tycoon",       name: "Point Tycoon",       icon: "👑", description: "2000 points! You're at the top of the game." },
  { id: "streak_igniter",     name: "Streak Igniter",     icon: "🔥", description: "3 days in a row! The streak has begun." },
  { id: "unbreakable",        name: "Unbreakable",        icon: "⚔️", description: "30-day streak! Nothing can stop you." },
  { id: "iron_will",          name: "Iron Will",          icon: "🛡️", description: "60 days straight. Your dedication is iron-strong!" },
  { id: "eternal_flame",      name: "Eternal Flame",      icon: "💎", description: "90-day streak! You are truly legendary." },
  { id: "the_completionist",  name: "The Completionist",  icon: "🌟", description: "Every badge unlocked. You've mastered PadaiSathi!" },
];

// ── Web Audio celebration sound (no external file needed) ──────────────────
// Returns a stop function — call it to silence the loop immediately.
function playBadgeSoundLoop() {
  let stopped = false;
  let ctx;

  const CHIME_DURATION = 1.8; // seconds for one full chime sequence

  const playOnce = (audioCtx, offset = 0) => {
    const play = (freq, startTime, duration, type = 'sine', gain = 0.3) => {
      const osc      = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + offset + startTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + offset + startTime);
      gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + offset + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + offset + startTime + duration);
      osc.start(audioCtx.currentTime + offset + startTime);
      osc.stop(audioCtx.currentTime + offset + startTime + duration);
    };

    // Ascending chime: C5 → E5 → G5 → C6
    play(523.25, 0.00, 0.25, 'sine', 0.25);
    play(659.25, 0.12, 0.25, 'sine', 0.25);
    play(783.99, 0.24, 0.25, 'sine', 0.25);
    play(1046.5, 0.36, 0.55, 'sine', 0.30);
    // Sparkle layer
    play(1568.0, 0.38, 0.20, 'triangle', 0.12);
    play(2093.0, 0.44, 0.18, 'triangle', 0.08);
  };

  const loop = () => {
    if (stopped) return;
    playOnce(ctx, 0);
    // Schedule next ring slightly after the current one finishes
    const id = setTimeout(loop, CHIME_DURATION * 1000);
    // Store timeout id so we can cancel it on stop
    loop._tid = id;
  };

  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    loop();
  } catch (_) {
    // AudioContext not available — silently skip
  }

  return () => {
    stopped = true;
    clearTimeout(loop._tid);
    try { ctx?.close(); } catch (_) {}
  };
}

// ── Confetti particle component ────────────────────────────────────────────
const CONFETTI_COLORS = ['#fde68a', '#6a88be', '#9fc383', '#f9a8d4', '#a5b4fc', '#fb923c', '#34d399'];

function Confetti() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${5 + (i * 4.2) % 90}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    duration: `${0.9 + (i % 5) * 0.18}s`,
    size: i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 5,
    rotate: i % 2 === 0 ? '45deg' : '0deg', // squares vs circles
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(260px) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-8px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.rotate === '0deg' ? '50%' : '2px',
            animation: `confettiFall ${p.duration} ease-in ${p.delay} forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const BadgeToast = ({ badgeIds = [], onDone }) => {
  const [queue, setQueue]       = useState([]);
  const [current, setCurrent]   = useState(null);
  const [exiting, setExiting]   = useState(false);
  const [imgError, setImgError] = useState(false);
  const dismissTimer            = useRef(null);
  const stopSound               = useRef(null);

  // Build queue when new badge IDs arrive
  useEffect(() => {
    if (!badgeIds || badgeIds.length === 0) return;
    const resolved = badgeIds
      .map(id => BADGE_DEFINITIONS.find(b => b.id === id))
      .filter(Boolean);
    if (resolved.length > 0) setQueue(resolved);
  }, [badgeIds]);

  // Show next badge in queue
  useEffect(() => {
    if (queue.length === 0 || current) return;

    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    setImgError(false);
    setExiting(false);

    // Stop any previous sound before starting a new one
    if (stopSound.current) stopSound.current();
    stopSound.current = playBadgeSoundLoop();

    // No auto-dismiss — user must click the button
  }, [queue, current]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    clearTimeout(dismissTimer.current);
    // Stop the looping chime immediately
    if (stopSound.current) { stopSound.current(); stopSound.current = null; }
    setExiting(true);
    setTimeout(() => {
      setCurrent(null);
      setExiting(false);
      setQueue(prev => {
        if (prev.length === 0 && onDone) onDone();
        return prev;
      });
    }, 380);
  };

  if (!current) return null;

  const imgSrc = `/badges/${current.id}.png`;

  return (
    <>
      <style>{`
        @keyframes badgeIn {
          0%   { opacity: 0; transform: scale(0.7) translateY(30px); }
          65%  { transform: scale(1.05) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes badgeOut {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.85) translateY(20px); }
        }
        @keyframes badgeShine {
          0%   { transform: translateX(-120%) skewX(-20deg); }
          100% { transform: translateX(220%)  skewX(-20deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .badge-card-enter { animation: badgeIn  0.5s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        .badge-card-exit  { animation: badgeOut 0.38s ease-in forwards; }
        .badge-img-float  { animation: floatBadge 2.4s ease-in-out 0.5s infinite; }
        .badge-shine-layer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.6) 50%, transparent 65%);
          animation: badgeShine 1.4s ease 0.6s forwards;
          pointer-events: none;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={dismiss}
      >
        {/* Card */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-white shadow-2xl
            max-w-xs w-full mx-5 pb-7 pt-6 px-7 text-center select-none
            border-2 border-gray-100
            ${exiting ? 'badge-card-exit' : 'badge-card-enter'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Confetti burst */}
          <Confetti />

          {/* Shine sweep over whole card */}
          <div className="badge-shine-layer absolute inset-0 rounded-3xl overflow-hidden pointer-events-none" />

          {/* Top pill */}
          <div className="mb-5 relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6a88be] to-[#5578a5] text-white text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
              🏅 Badge Unlocked!
            </span>
          </div>

          {/* Badge image — NO circle background, just the image floating */}
          <div className="relative z-10 mb-4 flex items-center justify-center">
            <div className="badge-img-float inline-block">
              {!imgError ? (
                <img
                  src={imgSrc}
                  alt={current.name}
                  className="w-28 h-28 object-contain drop-shadow-xl"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-7xl drop-shadow-lg leading-none">{current.icon}</span>
              )}
            </div>
          </div>

          {/* Stars decoration */}
          <div className="flex justify-center gap-1 mb-3 text-yellow-400 text-sm relative z-10">
            {'★★★'.split('').map((s, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.12}s` }}>★</span>
            ))}
          </div>

          {/* Badge name */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1 relative z-10 leading-tight">
            {current.name}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-6 relative z-10 leading-relaxed">
            {current.description}
          </p>

          {/* Button */}
          <button
            onClick={dismiss}
            className="relative z-10 w-full bg-gradient-to-r from-[#6a88be] to-[#5578a5] hover:from-[#5578a5] hover:to-[#4468a0] active:scale-95 text-white font-bold py-3 rounded-2xl transition-all duration-150 shadow-md text-sm tracking-wide"
          >
            Awesome! 🚀
          </button>

          {/* More badges indicator */}
          {queue.length > 0 && (
            <p className="mt-3 text-xs text-gray-400 relative z-10">
              +{queue.length} more badge{queue.length > 1 ? 's' : ''} waiting
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default BadgeToast;