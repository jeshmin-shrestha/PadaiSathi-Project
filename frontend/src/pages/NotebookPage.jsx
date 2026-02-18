import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon2Image from '../assets/images/icon2.png';
import Icon3Image from '../assets/images/icon3.png';

const NotebooksPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notebooks, setNotebooks] = useState([
    { id: 1, name: 'Science', favorite: true, updated: 'Updated Latest' },
    { id: 2, name: 'Science', favorite: false, updated: 'Updated Latest' },
    { id: 3, name: 'Science', favorite: false, updated: 'Updated Latest' },
    { id: 4, name: 'Science', favorite: false, updated: 'Updated Latest' },
    { id: 5, name: 'Science', favorite: false, updated: 'Updated Latest' },
  ]);

  const toggleFavorite = (id) => {
    setNotebooks(notebooks.map(notebook => 
      notebook.id === id ? { ...notebook, favorite: !notebook.favorite } : notebook
    ));
  };

  const favoriteNotebooks = notebooks.filter(n => n.favorite);
  const allNotebooks = notebooks;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <img 
              src={Icon2Image} 
              alt="Icon2Image"
              className="w-32 h-32 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hello Jeshmin!
              </h1>
              <p className="text-gray-700">
                Organize and access all your learning materials
              </p>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Notebooks</h2>

        {/* Search and New Notebook */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-gray-400"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
          <button className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>New Notebook</span>
          </button>
        </div>

        {/* Favorites Section */}
        {favoriteNotebooks.length > 0 && (
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
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Notebooks Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-5 h-5 bg-gray-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">☰</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">All</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {allNotebooks.map((notebook) => (
              <NotebookCard 
                key={notebook.id} 
                notebook={notebook} 
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

const NotebookCard = ({ notebook, onToggleFavorite }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border-4 border-black">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Folder Icon */}
        <img 
          src={Icon3Image} 
          alt="Folder Icon"
          className="w-20 h-20 object-contain" />
        
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-900">{notebook.name}</h4>
          <p className="text-sm text-gray-500">{notebook.updated}</p>
        </div>

        <div className="flex items-center space-x-3 w-full justify-center">
          <button className="px-8 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition">
            Open
          </button>
          <button 
            onClick={() => onToggleFavorite(notebook.id)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
          >
            <Star 
              className={`w-6 h-6 ${notebook.favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebooksPage;