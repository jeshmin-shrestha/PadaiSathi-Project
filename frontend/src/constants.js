// ─── constants.js ────────────────────────────────────────────────────────────
// Single source of truth for shared values across the app.

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AVATARS = [
  { id: 'avatar1',  img: '/avatars/avatar1.jpeg',  bg: 'from-green-400 to-green-600' },
  { id: 'avatar2',  img: '/avatars/avatar2.jpeg',  bg: 'from-pink-400 to-pink-600' },
  { id: 'avatar3',  img: '/avatars/avatar3.jpeg',  bg: 'from-blue-400 to-blue-600' },
  { id: 'avatar4',  img: '/avatars/avatar12.jpeg', bg: 'from-purple-400 to-purple-600' },
  { id: 'avatar5',  img: '/avatars/avatar5.jpeg',  bg: 'from-gray-600 to-gray-800' },
  { id: 'avatar6',  img: '/avatars/avatar4.jpeg',  bg: 'from-amber-400 to-orange-500' },
  { id: 'avatar7',  img: '/avatars/avatar6.jpeg',  bg: 'from-cyan-400 to-cyan-600' },
  { id: 'avatar8',  img: '/avatars/avatar7.jpeg',  bg: 'from-lime-400 to-lime-600' },
  { id: 'avatar9',  img: '/avatars/avatar8.jpeg',  bg: 'from-red-400 to-orange-500' },
  { id: 'avatar10', img: '/avatars/avatar9.jpeg',  bg: 'from-yellow-400 to-yellow-500' },
  { id: 'avatar11', img: '/avatars/avatar10.jpeg', bg: 'from-sky-300 to-indigo-400' },
  { id: 'avatar12', img: '/avatars/avatar11.jpeg', bg: 'from-yellow-500 to-amber-600' },
];

export const CUSTOM_AVATAR_KEY = 'user_custom_avatar';

export const PALETTE = {
  indigo:  '#6366f1',
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
  violet:  '#8b5cf6',
  lime:    '#84cc16',
};

export const PIE_COLORS = Object.values(PALETTE);

export const STUDENT_NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard', id: ''               },
  { label: 'Notebooks', path: '/notebook',  id: ''               },
  { label: 'Summary',   path: '/summary',   id: 'tour-summary'   },
  { label: 'Video',     path: '/video',     id: 'tour-video'     },
  { label: 'Flashcard', path: '/flashcards',id: 'tour-flashcard' },
  { label: 'Quiz',      path: '/quiz',      id: 'tour-quiz'      },
  { label: 'Friends',   path: '/friends',   id: ''               },
];

export const ADMIN_NAV_LINKS = [
  { label: 'Overview', path: '/dashboard',      icon: 'BarChart2' },
  { label: 'Users',    path: '/admin/users',    icon: 'Users'     },
  { label: 'Reports',  path: '/admin/reports',  icon: 'FileText'  },
  { label: 'Settings', path: '/admin/settings', icon: 'Settings'  },
];