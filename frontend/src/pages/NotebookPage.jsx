import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, BookOpen, List, Trash2, Pencil, Check, X } from 'lucide-react';
import Icon2Image from '../assets/images/icon2.png';
import Icon3Image from '../assets/images/icon3.png';
import { API } from '../constants';

const PAD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Sora:wght@400;600;700;800&display=swap');
  .pad-bg * { font-family: 'Nunito', sans-serif; }
  .pad-bg {
    background: radial-gradient(ellipse 85% 55% at 5% 0%, rgba(186,220,255,0.6) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 95% 10%, rgba(200,225,255,0.5) 0%, transparent 55%),
                radial-gradient(ellipse 60% 40% at 50% 100%, rgba(176,212,255,0.4) 0%, transparent 60%),
                #e8f1fb;
    min-height: 100vh;
  }
  .pad-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(175,215,255,0.38);
    border-radius: 22px;
  }
  .pad-hero {
    background: linear-gradient(135deg, rgba(186,220,255,0.55) 0%, rgba(214,233,255,0.35) 100%);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(175,215,255,0.45);
    border-radius: 28px;
  }
`;

const NotebooksPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notebooks, setNotebooks] = useState([]);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUsername(storedUser.username);
    setUserEmail(storedUser.email);
    fetchAll(storedUser.email);
  }, []);

  const fetchAll = async (email) => {
    setIsLoading(true);
    try {
      const [notebooksRes, favsRes] = await Promise.all([
        fetch(`${API}/api/my-notebooks?email=${email}`),
        fetch(`${API}/api/my-favorites?email=${email}`),
      ]);
      const notebooksData = await notebooksRes.json();
      const favsData      = await favsRes.json();

      if (notebooksData.notebooks) setNotebooks(notebooksData.notebooks);
      if (favsData.favorite_notebook_ids) {
        setFavorites(new Set(favsData.favorite_notebook_ids));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      await fetch(`${API}/api/toggle-favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, notebook_id: id }),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavorites(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  };

  const deleteNotebook = async (id) => {
    try {
      await fetch(`${API}/api/notebook/${id}?email=${userEmail}`, { method: 'DELETE' });
      setNotebooks(prev => prev.filter(n => n.id !== id));
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Error deleting notebook:', error);
    }
  };

  const renameNotebook = async (id, newTitle) => {
    try {
      const res = await fetch(`${API}/api/notebook/${id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, title: newTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setNotebooks(prev => prev.map(n => n.id === id ? { ...n, title: data.title } : n));
      }
    } catch (error) {
      console.error('Error renaming notebook:', error);
    }
  };

  const filteredNotebooks = notebooks.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const favoriteNotebooks = filteredNotebooks.filter(n => favorites.has(n.id));

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Hero Banner */}
        <div className="pad-hero p-8 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <img src={Icon2Image} alt="Notebooks" className="w-32 h-32 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Hello {username}!
              </h1>
              <p className="text-gray-600">Organize and access all your learning materials</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Notebooks</h2>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-white/60 focus:outline-none focus:border-blue-300"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notebooks.length === 0 && (
          <div className="pad-card p-16 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-blue-200 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No notebooks yet!</p>
            <p className="text-gray-400 text-sm mt-2">
              Upload a PDF on the Summary page to auto-create your first notebook.
            </p>
          </div>
        )}

        {/* Favorites Section */}
        {!isLoading && favoriteNotebooks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h3 className="text-lg font-bold text-gray-800">Favorites</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {favoriteNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  isFavorite={favorites.has(notebook.id)}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteNotebook}
                  onRename={renameNotebook}
                  onOpen={() => navigate(`/notebook/${notebook.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Notebooks */}
        {!isLoading && filteredNotebooks.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <List className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-gray-800">All Notebooks</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {filteredNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  isFavorite={favorites.has(notebook.id)}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteNotebook}
                  onRename={renameNotebook}
                  onOpen={() => navigate(`/notebook/${notebook.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

const NotebookCard = ({ notebook, isFavorite, onToggleFavorite, onOpen, onDelete, onRename }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(notebook.title);

  const saveRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== notebook.title) onRename(notebook.id, trimmed);
    else setEditTitle(notebook.title);
    setEditing(false);
  };

  return (
    <div className="pad-card p-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <img src={Icon3Image} alt="Folder Icon" className="w-20 h-20 object-contain" />
        <div className="flex-1 w-full">
          {editing ? (
            <div className="flex items-center justify-center gap-2">
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setEditTitle(notebook.title); setEditing(false); } }}
                className="text-center text-sm font-bold text-gray-800 border-b border-blue-400 bg-transparent outline-none w-full"
              />
              <button onClick={saveRename} className="text-green-500 hover:text-green-600"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setEditTitle(notebook.title); setEditing(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 group">
              <h4 className="text-lg font-bold text-gray-800">{notebook.title}</h4>
              <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-blue-400">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-gray-400">
            {new Date(notebook.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full justify-center">
          <button
            onClick={onOpen}
            className="px-8 py-2 text-white rounded-xl font-semibold transition hover:opacity-90"
            style={{ background: 'rgba(90,120,180,0.85)' }}
          >
            Open
          </button>
          <button
            onClick={() => onToggleFavorite(notebook.id)}
            className="w-10 h-10 flex items-center justify-center hover:bg-blue-50 rounded-xl transition"
          >
            <Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-10 h-10 flex items-center justify-center hover:bg-red-50 rounded-xl transition text-gray-300 hover:text-red-400"
            title="Delete notebook"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {confirmDelete && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <p className="text-sm font-semibold text-red-600 mb-2">Delete this notebook?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => { onDelete(notebook.id); setConfirmDelete(false); }}
                className="px-4 py-1 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebooksPage;
