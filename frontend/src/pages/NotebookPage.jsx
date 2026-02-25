import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon2Image from '../assets/images/icon2.png';
import Icon3Image from '../assets/images/icon3.png';

const NotebooksPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notebooks, setNotebooks] = useState([]);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUsername(storedUser.username);
    setUserEmail(storedUser.email);
    fetchNotebooks(storedUser.email);
  }, []);

  const fetchNotebooks = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/my-notebooks?email=${email}`);
      const data = await response.json();
      if (data.notebooks) {
        setNotebooks(data.notebooks);
      }
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredNotebooks = notebooks.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteNotebooks = filteredNotebooks.filter(n => favorites.has(n.id));

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <img src={Icon2Image} alt="Icon2Image" className="w-32 h-32 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hello {username}!
              </h1>
              <p className="text-gray-700">Organize and access all your learning materials</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Notebooks</h2>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search notebooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-gray-400"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notebooks.length === 0 && (
          <div className="bg-white rounded-3xl p-16 border-4 border-black text-center">
            <p className="text-5xl mb-4">📓</p>
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
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <h3 className="text-lg font-bold text-gray-900">Favorites</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {favoriteNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  isFavorite={favorites.has(notebook.id)}
                  onToggleFavorite={toggleFavorite}
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
              <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center">
                <span className="text-white text-xs">☰</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">All Notebooks</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {filteredNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  isFavorite={favorites.has(notebook.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpen={() => navigate(`/notebook/${notebook.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

const NotebookCard = ({ notebook, isFavorite, onToggleFavorite, onOpen }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border-4 border-black">
      <div className="flex flex-col items-center text-center space-y-4">
        <img src={Icon3Image} alt="Folder Icon" className="w-20 h-20 object-contain" />
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900">{notebook.title}</h4>
          <p className="text-sm text-gray-500">
            {new Date(notebook.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full justify-center">
          <button
            onClick={onOpen}
            className="px-8 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Open
          </button>
          <button
            onClick={() => onToggleFavorite(notebook.id)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
          >
            <Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebooksPage;