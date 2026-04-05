import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  BookOpen,
  Flame,
  BarChart3,
  FileText,
  FileCheck,
  Layers,
  HelpCircle,
  Video,
  Award,
  Trophy,
  Users,
  Globe,
  Crown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Medal,
  Star,
  Zap,
  TrendingUp,
  Sparkles,
  Target,
  Activity,
  UserPlus,
  Hand,
} from 'lucide-react';
import ChickenImage from '../assets/images/chickenicon.png';
import { API } from '../constants';

const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  label: 'Student',             bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  label: 'Wizard',              bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  label: 'Nerd',                bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', label: 'Gamer',               bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  label: 'Champion',            bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  label: 'Artist',              bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  label: 'Ballerina Cappucina', bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  label: 'Cappuccino Assassino',bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  label: 'Tralalero Tralala',   bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  label: 'Harry Potter',        bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', label: 'One Piece',           bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', label: 'Roblux',              bg: 'from-yellow-500 to-amber-600' },
];

const CUSTOM_AVATAR_KEY = 'user_custom_avatar';

const StudentDashboard = () => {
  const navigate = useNavigate();

  // ── State (unchanged) ──────────────────────────────────────────────────────
  const [username, setUsername]     = useState('');
  const [myEmail, setMyEmail]       = useState('');
  const [userAvatar, setUserAvatar] = useState('avatar1');
  const [customImg, setCustomImg]   = useState(null);

  const [userStats, setUserStats] = useState({
    points: 0, streak: 0, documents: 0, summaries: 0,
    notebooks: 0, flashcards: 0, quizzes: 0, videos: 0,
  });

  const [leaderboard, setLeaderboard]   = useState([]);
  const [yourRank, setYourRank]         = useState(null);
  const [friendsOnly, setFriendsOnly]   = useState(false);
  const [leaderLoading, setLeaderLoading] = useState(true);

  const [badges, setBadges]           = useState([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthOffset, setMonthOffset]   = useState(0);
  const [reportLoading, setReportLoading] = useState(true);

  const [initialLoad, setInitialLoad] = useState(true);

  // ── Fetch functions (unchanged logic, API constant used) ───────────────────
  const fetchLeaderboard = useCallback(async (email, fo) => {
    if (!email) return;
    setLeaderLoading(true);
    try {
      const res  = await fetch(`${API}/api/leaderboard?email=${email}&friends_only=${fo}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setYourRank(data.your_rank);
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLeaderLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (email) => {
    if (!email) return;
    try {
      const res  = await fetch(`${API}/api/my-stats?email=${email}`);
      const data = await res.json();
      setUserStats(prev => ({
        ...prev,
        documents:  data.documents  || 0,
        summaries:  data.summaries  || 0,
        notebooks:  data.notebooks  || 0,
        flashcards: data.flashcards || 0,
        quizzes:    data.quizzes    || 0,
        videos:     data.videos     || 0,
        streak:     data.streak     ?? prev.streak,
        points:     data.points     ?? prev.points,
      }));
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  const fetchBadges = useCallback(async (email) => {
    if (!email) return;
    try {
      const res  = await fetch(`${API}/api/my-badges?email=${email}`);
      const data = await res.json();
      console.log('Badges API response:', data);
      setBadges(data.badges || []);
      setEarnedCount(data.earned_count || 0);
    } catch (err) {
      console.error('Badges error:', err);
    }
  }, []);

  const fetchWeeklyReport = useCallback(async (email, offset = 0) => {
    if (!email) return;
    setReportLoading(true);
    try {
      const res  = await fetch(`${API}/api/my-activity-summary?email=${email}&week_offset=${offset}`);
      const data = await res.json();
      setWeeklyReport(data);
    } catch (err) {
      console.error('Activity summary error:', err);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // ── Effects (unchanged) ────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) { window.location.href = '/login'; return; }

    setUsername(storedUser.username);
    setMyEmail(storedUser.email);
    setUserAvatar(storedUser.avatar || 'avatar1');

    const savedCustom = localStorage.getItem(CUSTOM_AVATAR_KEY);
    if (savedCustom) setCustomImg(savedCustom);

    setUserStats(prev => ({
      ...prev,
      points: storedUser.points || 0,
      streak: storedUser.streak || 0,
    }));

    Promise.all([
      fetchLeaderboard(storedUser.email, false),
      fetchStats(storedUser.email),
      fetchBadges(storedUser.email),
      fetchWeeklyReport(storedUser.email),
    ]).finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (!myEmail || initialLoad) return;
    fetchLeaderboard(myEmail, friendsOnly);
  }, [friendsOnly, myEmail, fetchLeaderboard, initialLoad]);

  useEffect(() => {
    if (!myEmail || initialLoad) return;
    fetchWeeklyReport(myEmail, monthOffset);
  }, [monthOffset, myEmail, fetchWeeklyReport, initialLoad]);

  // ── Onboarding Tour ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialLoad) return;
    if (localStorage.getItem('tour_done')) return;
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(15, 30, 60, 0.55)',
      popoverClass: 'padai-tour-popover',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Get Started',
      steps: [
        {
          element: '#tour-welcome',
          popover: { title: 'Welcome to PadaiSathi', description: 'Your AI-powered study companion. Track your progress, points, and daily streak right from this dashboard.' },
        },
        {
          element: '#tour-streak',
          popover: { title: 'Daily Streak', description: 'Log in and study every day to keep your streak alive. Consistency is the key to better learning.' },
        },
        {
          element: '#tour-stats',
          popover: { title: 'Your Progress', description: 'A quick overview of everything you have created — documents, summaries, flashcards, quizzes, and more.' },
        },
        {
          element: '#tour-summary',
          popover: { title: 'AI Summary', description: 'Upload a PDF, PPTX, or TXT file and instantly get a clean AI-generated summary. Switch between formal and fun reading styles.' },
        },
        {
          element: '#tour-flashcard',
          popover: { title: 'Flashcards', description: 'Automatically generate flashcards from your documents to reinforce key concepts through active recall.' },
        },
        {
          element: '#tour-quiz',
          popover: { title: 'Quiz', description: 'Challenge yourself with AI-generated multiple choice questions based on your uploaded study material.' },
        },
        {
          element: '#tour-video',
          popover: { title: 'Video Lessons', description: 'Convert your summaries into short narrated explainer videos — a great way to review on the go.' },
        },
        {
          popover: { title: 'You are all set', description: 'Begin by heading to the Summary page and uploading your first document. Happy studying!' },
        },
      ],
      onDestroyStarted: () => {
        localStorage.setItem('tour_done', '1');
        driverObj.destroy();
      },
    });
    setTimeout(() => driverObj.drive(), 800);
  }, [initialLoad]);

  // ── Helpers (unchanged) ────────────────────────────────────────────────────
  const resolveAvatar = useCallback((entry) => {
    const avatarId = entry?.avatar || 'avatar1';
    const isMe     = entry?.is_you === true;
    if (avatarId === 'custom') {
      return { img: isMe && customImg ? customImg : null, bg: 'from-indigo-400 to-purple-500' };
    }
    const preset = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
    return { img: preset.img, bg: preset.bg };
  }, [customImg]);

  const top3        = leaderboard.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  const PodiumAvatar = ({ entry, size = 'md' }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const sizeClass   = size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';
    const borderColor = entry.is_you ? 'border-[#6a88be]' : 'border-white';
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br ${bg} overflow-hidden border-4 ${borderColor} shadow-lg flex-shrink-0`}>
        {img
          ? <img src={img} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-2xl">👤</div>
        }
      </div>
    );
  };

  const RowAvatar = ({ entry }) => {
    if (!entry) return null;
    const { img, bg } = resolveAvatar(entry);
    const borderColor = entry.is_you ? 'border-[#6a88be]' : 'border-white/60';
    return (
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${bg} overflow-hidden flex-shrink-0 border-2 ${borderColor}`}>
        {img
          ? <img src={img} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white text-sm">👤</div>
        }
      </div>
    );
  };

  const myEntry = useMemo(() => ({ avatar: userAvatar, is_you: true }), [userAvatar]);

  const getHeatmapColor = (actions, max) => {
    if (actions === 0) return '#e5e7eb';
    const intensity = actions / max;
    if (intensity <= 0.2) return '#d4e0f5';
    if (intensity <= 0.4) return '#b2c7e8';
    if (intensity <= 0.6) return '#8fa6d4';
    if (intensity <= 0.8) return '#6a88be';
    return '#3a5a8c';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .std-root {
          min-height: 100vh;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          background: #e8f1fb;
          position: relative;
          overflow-x: hidden;
        }

        .std-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 85% 55% at 5% 0%,   rgba(186,220,255,0.6)  0%, transparent 55%),
            radial-gradient(ellipse 65% 45% at 95% 100%, rgba(200,230,255,0.45) 0%, transparent 55%),
            linear-gradient(160deg, #d9eeff 0%, #e5f0fb 45%, #f0f5fd 100%);
        }

        .std-body { position: relative; z-index: 1; }

        .std-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 28px 48px;
        }

        /* ── Welcome banner ── */
        .std-welcome {
          position: relative;
          background: rgba(255,255,255,0.58);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(175,215,255,0.45);
          border-radius: 24px;
          padding: 32px 36px 32px 220px;
          margin-bottom: 28px;
          box-shadow: 0 4px 24px rgba(100,155,215,0.10), 0 1px 0 rgba(255,255,255,0.85) inset;
          overflow: visible;
          animation: std-rise 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (max-width: 768px) { .std-welcome { padding: 24px 24px 24px 24px; } }

        .std-chicken {
          position: absolute;
          bottom: -24px; left: -8px;
          width: 210px; height: 210px;
          object-fit: contain;
        }
        @media (max-width: 768px) { .std-chicken { display: none; } }

        .std-welcome-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px; font-weight: 700;
          color: #173a5c; letter-spacing: -0.4px;
          margin-bottom: 6px;
        }
        .std-welcome-sub {
          font-size: 14px; color: #4a6d8e; font-weight: 600; margin-bottom: 20px;
        }

        .std-progress-wrap {
          max-width: 480px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(175,215,255,0.5);
          border-radius: 16px;
          padding: 16px 20px;
        }
        .std-progress-label {
          font-size: 12.5px; font-weight: 800; color: #4a6d8e;
          text-transform: uppercase; letter-spacing: 0.6px;
          display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
        }
        .std-progress-bar-bg {
          height: 10px; background: rgba(175,215,255,0.4);
          border-radius: 20px; overflow: hidden; flex: 1;
        }
        .std-progress-bar-fill {
          height: 100%; border-radius: 20px;
          background: linear-gradient(90deg, #6a88be, #9fc383);
          transition: width 0.7s ease;
        }
        .std-progress-row {
          display: flex; align-items: center; gap: 12px;
        }
        .std-progress-pts {
          font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 800; color: #0d2540; white-space: nowrap;
        }

        /* ── Grid ── */
        .std-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) { .std-grid { grid-template-columns: 1fr; } }

        .std-left  { display: flex; flex-direction: column; gap: 20px; }
        .std-right { display: flex; flex-direction: column; gap: 20px; }

        /* ── Card ── */
        .std-card {
          background: rgba(255,255,255,0.62);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(175,215,255,0.38);
          border-radius: 22px;
          box-shadow: 0 4px 24px rgba(100,155,215,0.09), 0 1px 0 rgba(255,255,255,0.85) inset;
          overflow: hidden;
          animation: std-rise 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .std-card-body { padding: 22px 24px; }

        @keyframes std-rise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        /* ── Section headings ── */
        .std-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 700; color: #173a5c;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .std-section-title svg { opacity: 0.7; }

        /* ── Streak ── */
        .std-streak-wrap {
          display: flex; flex-direction: column; align-items: center;
          padding: 24px 20px;
          background: linear-gradient(135deg, rgba(106,136,190,0.12) 0%, rgba(159,195,131,0.08) 100%);
          border-radius: 18px;
        }
        .std-streak-num {
          font-family: 'Sora', sans-serif;
          font-size: 64px; font-weight: 700;
          color: #6a88be; line-height: 1;
          margin: 10px 0 6px;
        }
        .std-streak-label {
          font-size: 13px; font-weight: 700; color: #4a6d8e; letter-spacing: 0.4px;
        }

        /* ── Stat mini-cards ── */
        .std-stats-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .std-stat {
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(175,215,255,0.35);
          border-radius: 16px; padding: 16px 14px;
          display: flex; flex-direction: column; align-items: center;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .std-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(100,155,215,0.13); }
        .std-stat-num {
          font-family: 'Sora', sans-serif;
          font-size: 28px; font-weight: 700; color: #173a5c; line-height: 1; margin: 6px 0 4px;
        }
        .std-stat-lbl {
          font-size: 11px; font-weight: 700; color: #84a8c6;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* ── Heatmap ── */
        .std-heatmap-nav-btn {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(175,215,255,0.35); border: 1px solid rgba(175,215,255,0.5);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s;
        }
        .std-heatmap-nav-btn:hover { background: rgba(106,136,190,0.2); }
        .std-heatmap-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .std-heatmap-summary {
          background: rgba(175,215,255,0.2);
          border: 1px solid rgba(175,215,255,0.4);
          border-radius: 14px; padding: 14px 16px; margin-top: 16px;
        }

        /* ── Leaderboard ── */
        .std-lb-toggle {
          display: flex; align-items: center;
          background: rgba(175,215,255,0.25);
          border: 1px solid rgba(175,215,255,0.4);
          border-radius: 30px; padding: 3px;
          gap: 2px;
        }
        .std-lb-btn {
          padding: 6px 14px; border-radius: 24px;
          font-size: 12px; font-weight: 700;
          border: none; cursor: pointer;
          display: flex; align-items: center; gap: 5px;
          transition: all 0.15s;
          color: #4a6d8e; background: transparent;
        }
        .std-lb-btn.active {
          background: rgba(255,255,255,0.9);
          color: #173a5c;
          box-shadow: 0 2px 8px rgba(100,155,215,0.15);
        }

        .std-lb-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 14px;
          border: 1px solid rgba(175,215,255,0.3);
          background: rgba(255,255,255,0.55);
          transition: background 0.15s;
        }
        .std-lb-row.is-you {
          background: rgba(106,136,190,0.12);
          border-color: rgba(106,136,190,0.35);
        }
        .std-lb-rank {
          font-family: 'Sora', sans-serif;
          font-size: 15px; font-weight: 700; color: #84a8c6; width: 26px; flex-shrink: 0;
        }
        .std-lb-name { font-size: 14px; font-weight: 700; color: #173a5c; flex: 1; min-width: 0; }
        .std-lb-pts  { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; color: #6a88be; white-space: nowrap; }
        .std-you-chip {
          font-size: 10px; font-weight: 800; color: white;
          background: #6a88be; border-radius: 20px; padding: 2px 8px;
          letter-spacing: 0.3px; flex-shrink: 0;
        }

        /* podium blocks */
        .std-podium-block-1 { width: 100px; height: 112px; background: linear-gradient(160deg, #f5c842, #e8a800); border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; color: white; }
        .std-podium-block-2 { width: 88px;  height: 76px;  background: linear-gradient(160deg, #c0d8f5, #8fb4dc); border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: white; }
        .std-podium-block-3 { width: 88px;  height: 58px;  background: linear-gradient(160deg, #f5c4a0, #e8955a); border-radius: 14px 14px 0 0; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: white; }

        /* ── Badges ── */
        .std-badge-card {
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(175,215,255,0.35);
          border-radius: 16px; padding: 14px;
          text-align: center; transition: transform 0.15s, box-shadow 0.15s;
        }
        .std-badge-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(100,155,215,0.13); }
        .std-badge-card.locked { opacity: 0.55; }
        .std-badge-name { font-size: 11px; font-weight: 800; color: #173a5c; margin-top: 6px; line-height: 1.3; }
        .std-badge-desc { font-size: 10px; color: #84a8c6; margin-top: 3px; display: flex; align-items: center; justify-content: center; gap: 3px; }

        .std-badge-progress-bg {
          height: 8px; background: rgba(175,215,255,0.3);
          border-radius: 20px; overflow: hidden; margin-bottom: 20px;
        }
        .std-badge-progress-fill {
          height: 100%; border-radius: 20px;
          background: linear-gradient(90deg, #6a88be, #9fc383);
          transition: width 0.7s ease;
        }

        .std-toggle-btn {
          width: 100%; padding: 10px;
          background: rgba(175,215,255,0.2);
          border: 1px solid rgba(175,215,255,0.4);
          border-radius: 12px;
          font-family: 'Nunito', sans-serif;
          font-size: 12.5px; font-weight: 800; color: #4a6d8e;
          cursor: pointer; transition: background 0.15s;
        }
        .std-toggle-btn:hover { background: rgba(175,215,255,0.35); }

        /* ── Loader / empty states ── */
        .std-loading {
          text-align: center; padding: 36px 0;
          font-size: 13px; font-weight: 700; color: #84a8c6;
          letter-spacing: 0.4px;
          animation: std-pulse 1.4s ease-in-out infinite;
        }
        @keyframes std-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

        .std-empty {
          text-align: center; padding: 32px 20px;
        }
        .std-empty-icon { margin: 0 auto 12px; color: #aac6df; }
        .std-empty-title { font-size: 14px; font-weight: 800; color: #4a6d8e; }
        .std-empty-sub   { font-size: 12px; color: #84a8c6; margin-top: 4px; }

        /* ── Footer ── */
        .std-footer {
          text-align: center; padding: 20px 28px;
          font-size: 11px; font-weight: 700; color: #aac6df;
          letter-spacing: 0.5px;
          border-top: 1px solid rgba(170,210,250,0.22);
          margin-top: 8px;
        }

        /* ── Recommendation pills ── */
        .std-rec {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(175,215,255,0.35);
          border-radius: 12px; padding: 12px 14px;
        }
        .std-rec-title { font-size: 12.5px; font-weight: 800; color: #173a5c; }
        .std-rec-body  { font-size: 11.5px; color: #4a6d8e; margin-top: 2px; }

        @media (max-width: 640px) {
          .std-container { padding: 16px 14px 40px; }
          .std-welcome { padding: 20px; }
          .std-card-body { padding: 18px 16px; }
        }

        /* ── Tour Popover ── */
        .padai-tour-popover {
          background: rgba(255,255,255,0.96) !important;
          border: 1px solid rgba(175,215,255,0.5) !important;
          border-radius: 18px !important;
          box-shadow: 0 12px 40px rgba(90,120,180,0.18) !important;
          padding: 24px 26px 20px !important;
          font-family: 'Nunito', sans-serif !important;
          max-width: 320px !important;
        }
        .padai-tour-popover .driver-popover-title {
          font-family: 'Sora', sans-serif !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #1e3a5f !important;
          margin-bottom: 8px !important;
        }
        .padai-tour-popover .driver-popover-description {
          font-size: 13.5px !important;
          color: #4a6d8e !important;
          line-height: 1.6 !important;
          font-weight: 600 !important;
        }
        .padai-tour-popover .driver-popover-progress-text {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #8aafd4 !important;
        }
        .padai-tour-popover .driver-popover-navigation-btns button {
          background: rgba(90,120,180,0.88) !important;
          border: none !important;
          border-radius: 10px !important;
          color: white !important;
          font-family: 'Nunito', sans-serif !important;
          font-size: 12.5px !important;
          font-weight: 700 !important;
          padding: 7px 18px !important;
          cursor: pointer !important;
          transition: opacity 0.15s !important;
        }
        .padai-tour-popover .driver-popover-navigation-btns button:hover {
          opacity: 0.85 !important;
        }
        .padai-tour-popover .driver-popover-navigation-btns button.driver-popover-prev-btn {
          background: rgba(175,215,255,0.4) !important;
          color: #4a6d8e !important;
        }
        .padai-tour-popover .driver-popover-close-btn {
          color: #aac6df !important;
          font-size: 18px !important;
        }
        .padai-tour-popover .driver-popover-close-btn:hover {
          color: #4a6d8e !important;
        }
      `}</style>

      <div className="std-root">
        <div className="std-bg" />

        <div className="std-body">

          <div className="std-container">

            {/* ── Welcome Banner ───────────────────────────────────────────── */}
            <div id="tour-welcome" className="std-welcome">
              <img
                src={ChickenImage}
                alt="Chicken mascot"
                className="std-chicken animate-bounce"
                style={{ animationDuration: '2s' }}
              />

              <h1 className="std-welcome-title">Hello, {username}! <Hand size={28} style={{ display: 'inline', verticalAlign: 'middle', color: '#e8a800' }} /></h1>
              <p className="std-welcome-sub">Ready to continue your learning journey?</p>

              <div className="std-progress-wrap">
                <div className="std-progress-label">
                  <Target size={13} />
                  Keep learning to earn more points
                </div>
                <div className="std-progress-row">
                  <div className="std-progress-bar-bg" style={{ flex: 1 }}>
                    <div
                      className="std-progress-bar-fill"
                      style={{ width: `${Math.min((userStats.points / (Math.ceil((userStats.points + 1) / 100) * 100)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="std-progress-pts">{userStats.points} / {Math.ceil((userStats.points + 1) / 100) * 100} pts</span>
                  <button
                    onClick={() => navigate('/summary')}
                    style={{
                      padding: '5px 16px',
                      background: 'rgba(90,120,180,0.85)', color: '#fff',
                      border: 'none', borderRadius: 20,
                      fontFamily: 'Sora', fontWeight: 700, fontSize: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'background 0.18s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,120,180,1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(90,120,180,0.85)'}
                  >
                    Continue <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Main Grid ────────────────────────────────────────────────── */}
            <div className="std-grid">

              {/* LEFT COLUMN */}
              <div className="std-left">

                {/* Streak */}
                <div id="tour-streak" className="std-card">
                  <div className="std-card-body">
                    <div className="std-streak-wrap">
                      <Flame size={40} color="#f97316" strokeWidth={1.5} />
                      <div className="std-streak-num">{userStats.streak}</div>
                      <div className="std-streak-label">
                        {userStats.streak === 1 ? 'Day Streak' : 'Day Streak'} 🔥
                      </div>
                      <p style={{ fontSize: 11, color: '#84a8c6', marginTop: 6, fontWeight: 600 }}>
                        {userStats.streak === 0
                          ? 'Do something today to start your streak!'
                          : `Keep it up — come back tomorrow!`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Statistics */}
                <div id="tour-stats" className="std-card">
                  <div className="std-card-body">
                    <div className="std-section-title">
                      <BarChart3 size={16} /> Quick Statistics
                    </div>
                    <div className="std-stats-grid">
                      {[
                        { icon: FileText,   count: userStats.documents,  label: 'Documents',  color: '#6a88be' },
                        { icon: FileCheck,  count: userStats.summaries,  label: 'Summaries',  color: '#6a88be' },
                        { icon: Layers,     count: userStats.flashcards, label: 'Flashcards', color: '#6a88be' },
                        { icon: HelpCircle, count: userStats.quizzes,    label: 'Quizzes',    color: '#6a88be' },
                        { icon: Video,      count: userStats.videos,     label: 'Videos',     color: '#6a88be' },
                        { icon: BookOpen,   count: userStats.notebooks,  label: 'Notebooks',  color: '#9fc383' },
                      ].map(({ icon: Icon, count, label, color }) => (
                        <div key={label} className="std-stat">
                          <Icon size={26} color={color} strokeWidth={1.5} />
                          <div className="std-stat-num">{count}</div>
                          <div className="std-stat-lbl">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Heatmap */}
                {weeklyReport?.daily_activity && (
                  <div className="std-card">
                    <div className="std-card-body">
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={16} color="#4a6d8e" />
                          <div>
                            <div className="std-section-title" style={{ marginBottom: 0 }}>Activity Heatmap</div>
                            {weeklyReport.date_range && (
                              <p style={{ fontSize: 10.5, color: '#84a8c6', fontWeight: 600, marginTop: 2 }}>
                                {new Date(weeklyReport.date_range.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' – '}
                                {new Date(weeklyReport.date_range.end   + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button className="std-heatmap-nav-btn" onClick={() => setMonthOffset(prev => prev - 1)} title="Previous 30 days">
                            <ChevronLeft size={16} color="#4a6d8e" />
                          </button>
                          <button className="std-heatmap-nav-btn" onClick={() => setMonthOffset(prev => Math.min(prev + 1, 0))} disabled={monthOffset === 0} title="Next 30 days">
                            <ChevronRight size={16} color="#4a6d8e" />
                          </button>
                          {monthOffset < 0 && (
                            <button onClick={() => setMonthOffset(0)} style={{ fontSize: 11, fontWeight: 800, color: '#6a88be', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2 }}>
                              Today
                            </button>
                          )}
                        </div>
                      </div>

                      {reportLoading ? (
                        <div className="std-loading">Loading…</div>
                      ) : (() => {
                        const data = weeklyReport.daily_activity;
                        const max  = Math.max(...data.map(d => d.actions), 1);
                        const firstDayOfWeek = new Date(data[0].date + 'T00:00:00').getDay();
                        const padded = [...Array(firstDayOfWeek).fill(null), ...data];
                        const weeks  = [];
                        for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

                        return (
                          <div>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                              {['S','M','T','W','T','F','S'].map((d, i) => (
                                <div key={i} style={{ width: 26, textAlign: 'center', fontSize: 10, color: '#84a8c6', fontWeight: 700 }}>{d}</div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {weeks.map((week, wi) => (
                                <div key={wi} style={{ display: 'flex', gap: 4 }}>
                                  {week.map((day, di) => (
                                    <div
                                      key={di}
                                      title={day ? `${day.date}: ${day.actions} action${day.actions !== 1 ? 's' : ''}` : ''}
                                      style={{
                                        width: 26, height: 26, borderRadius: 6,
                                        background: day ? getHeatmapColor(day.actions, max) : 'transparent',
                                        transition: 'background 0.2s',
                                        cursor: day ? 'default' : 'default',
                                      }}
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: 10, color: '#84a8c6', fontWeight: 600, marginRight: 2 }}>Less</span>
                              {['#e5e7eb','#d4e0f5','#b2c7e8','#8fa6d4','#6a88be','#3a5a8c'].map(c => (
                                <div key={c} style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
                              ))}
                              <span style={{ fontSize: 10, color: '#84a8c6', fontWeight: 600, marginLeft: 2 }}>More</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Period summary */}
                      {!reportLoading && (
                        <div className="std-heatmap-summary">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <p style={{ fontSize: 11, color: '#84a8c6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {weeklyReport.is_current ? 'This Month' : 'This Period'}
                              </p>
                              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: '#6a88be', lineHeight: 1.2, marginTop: 2 }}>
                                {weeklyReport.month_summary?.total_actions ?? weeklyReport.week_summary.total_actions} actions
                              </p>
                              <p style={{ fontSize: 11, color: '#84a8c6', fontWeight: 600, marginTop: 3 }}>
                                {weeklyReport.month_summary?.active_days ?? weeklyReport.week_summary.active_days}/30 days active
                              </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 10, color: '#84a8c6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>This week</p>
                              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700, color: '#9fc383', marginTop: 2 }}>
                                {weeklyReport.week_summary.total_actions} actions
                              </p>
                              <div style={{ marginTop: 6 }}>
                                {weeklyReport.week_summary.active_days >= 5
                                  ? <Flame size={22} color="#f97316" />
                                  : weeklyReport.week_summary.active_days >= 3
                                    ? <Zap size={22} color="#eab308" />
                                    : <BookOpen size={22} color="#9fc383" />
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {!reportLoading && weeklyReport.is_current && weeklyReport.recommendations?.length > 0 && (
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {weeklyReport.recommendations.map((rec, i) => (
                            <div key={i} className="std-rec">
                              {rec.icon === '📚' && <BookOpen size={16} color="#6a88be" style={{ flexShrink: 0 }} />}
                              {rec.icon === '🔥' && <Flame    size={16} color="#f97316" style={{ flexShrink: 0 }} />}
                              {rec.icon === '💪' && <Zap      size={16} color="#eab308" style={{ flexShrink: 0 }} />}
                              <div>
                                <div className="std-rec-title">{rec.title}</div>
                                <div className="std-rec-body">{rec.body}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="std-right">

                {/* Leaderboard */}
                <div className="std-card">
                  <div className="std-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div className="std-section-title" style={{ marginBottom: 0 }}>
                        <Trophy size={16} color="#eab308" /> Leaderboard
                      </div>
                      <div className="std-lb-toggle">
                        <button className={`std-lb-btn${!friendsOnly ? ' active' : ''}`} onClick={() => setFriendsOnly(false)}>
                          <Globe size={12} /> Global
                        </button>
                        <button className={`std-lb-btn${friendsOnly  ? ' active' : ''}`} onClick={() => setFriendsOnly(true)}>
                          <Users size={12} /> Friends
                        </button>
                      </div>
                    </div>

                    {leaderLoading ? (
                      <div className="std-loading">Loading leaderboard…</div>
                    ) : (
                      <>
                        {/* Empty friends state */}
                        {friendsOnly && leaderboard.length <= 1 && (
                          <div className="std-empty" style={{ marginBottom: 8 }}>
                            <UserPlus size={48} className="std-empty-icon" />
                            <div className="std-empty-title">No friends yet!</div>
                            <div className="std-empty-sub">Add friends to see the friends leaderboard.</div>
                            <button
                              onClick={() => navigate('/friends')}
                              style={{ marginTop: 12, background: '#6a88be', color: 'white', border: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              + Find Friends
                            </button>
                          </div>
                        )}

                        {/* Podium */}
                        {leaderboard.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                            {/* 2nd */}
                            {podiumOrder[0] && (
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                                  <PodiumAvatar entry={podiumOrder[0]} />
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#173a5c', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto 2px' }}>
                                  {podiumOrder[0].is_you ? 'You' : podiumOrder[0].username}
                                </p>
                                <p style={{ fontSize: 10.5, color: '#84a8c6', fontWeight: 700, marginBottom: 4 }}>{podiumOrder[0].points} pts</p>
                                <div className="std-podium-block-2">2</div>
                              </div>
                            )}
                            {/* 1st */}
                            {podiumOrder[1] && (
                              <div style={{ textAlign: 'center' }}>
                                <Crown size={28} color="#eab308" style={{ margin: '0 auto 4px' }} />
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                                  <PodiumAvatar entry={podiumOrder[1]} size="lg" />
                                </div>
                                <p style={{ fontSize: 12, fontWeight: 800, color: '#173a5c', width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto 2px' }}>
                                  {podiumOrder[1].is_you ? 'You' : podiumOrder[1].username}
                                </p>
                                <p style={{ fontSize: 10.5, color: '#84a8c6', fontWeight: 700, marginBottom: 4 }}>{podiumOrder[1].points} pts</p>
                                <div className="std-podium-block-1">1</div>
                              </div>
                            )}
                            {/* 3rd */}
                            {podiumOrder[2] && (
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                                  <PodiumAvatar entry={podiumOrder[2]} />
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#173a5c', width: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto 2px' }}>
                                  {podiumOrder[2].is_you ? 'You' : podiumOrder[2].username}
                                </p>
                                <p style={{ fontSize: 10.5, color: '#84a8c6', fontWeight: 700, marginBottom: 4 }}>{podiumOrder[2].points} pts</p>
                                <div className="std-podium-block-3">3</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Full list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {leaderboard.slice(0, 10).map((entry) => (
                            <div key={entry.rank} className={`std-lb-row${entry.is_you ? ' is-you' : ''}`}>
                              <span className="std-lb-rank">{entry.rank}.</span>
                              <RowAvatar entry={entry} />
                              <span className="std-lb-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.username}
                              </span>
                              <span className="std-lb-pts">{entry.points} pts</span>
                              {entry.is_you && <span className="std-you-chip">You</span>}
                            </div>
                          ))}
                        </div>

                        {/* Your position outside top 10 */}
                        {yourRank > 10 && (
                          <div className="std-lb-row is-you" style={{ marginTop: 10 }}>
                            <span className="std-lb-rank">{yourRank}.</span>
                            <RowAvatar entry={myEntry} />
                            <span className="std-lb-name">{username}</span>
                            <span className="std-you-chip">Your Rank</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="std-card">
                  <div className="std-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div className="std-section-title" style={{ marginBottom: 0 }}>
                        <Award size={16} color="#eab308" /> Your Badges
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'white', background: '#6a88be', borderRadius: 20, padding: '3px 10px', letterSpacing: '0.3px' }}>
                        {earnedCount} / {badges.length}
                      </span>
                    </div>

                    <div className="std-badge-progress-bg">
                      <div
                        className="std-badge-progress-fill"
                        style={{ width: badges.length ? `${(earnedCount / badges.length) * 100}%` : '0%' }}
                      />
                    </div>

                    {earnedCount === 0 ? (
                      <div className="std-empty">
                        <Lock size={44} className="std-empty-icon" />
                        <div className="std-empty-title">No badges earned yet!</div>
                        <div className="std-empty-sub">Start learning to unlock your first badge.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                        {badges.filter(b => b.earned).map((badge) => (
                          <div
                            key={badge.id}
                            className="std-badge-card"
                            title={`Earned: ${new Date(badge.earned_at).toLocaleDateString()}`}
                          >
                            <img src={`/badges/${badge.id}.png`} alt={badge.name} style={{ width: 52, height: 52, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                            <div className="std-badge-name">{badge.name}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="std-toggle-btn" onClick={() => setShowAllBadges(prev => !prev)}>
                      {showAllBadges ? '▲ Hide locked badges' : `▼ See all badges (${badges.length - earnedCount} locked)`}
                    </button>

                    {showAllBadges && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
                        {badges.filter(b => !b.earned).map((badge) => (
                          <div key={badge.id} className="std-badge-card locked" title={badge.description}>
                            <img src={`/badges/${badge.id}.png`} alt={badge.name} style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'grayscale(1)' }} />
                            <div className="std-badge-name" style={{ color: '#84a8c6' }}>{badge.name}</div>
                            <div className="std-badge-desc"><Lock size={9} /> {badge.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="std-footer">© {new Date().getFullYear()} PadaiSathi — All rights reserved</div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
