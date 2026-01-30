import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';
import Icon4Image from '../assets/images/icon4.png';

const VideoPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('subway');
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const themes = [
    { id: 'subway', name: 'Subway Surfer', color: 'from-yellow-300 to-yellow-400' },
    { id: 'slime', name: 'Slime Videos', color: 'from-pink-300 to-pink-400' },
    { id: 'minecraft', name: 'Minecraft', color: 'from-green-300 to-green-400' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.type) || file.size <= 5242880) {
      setUploadedFile(file);
    } else {
      alert('Please upload PDF, TXT, DOCX (Max 5MB)');
    }
  };

  const generateVideo = () => {
    if (!uploadedFile) {
      alert('Please upload a file first!');
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setVideoGenerated(true);
      setIsGenerating(false);
    }, 3000);
  };

  const downloadVideo = () => {
    alert('Downloading video...');
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload & Generate
            </h1>
            <p className="text-gray-700">
              Transform your documents into interactive learning materials
            </p>
          </div>
          <div className="flex justify-center">
            <img 
              src={Icon1Image} 
              alt="Icon1Image"
              className="w-32 h-32 object-contain" />
          </div>
        </div>

        {/* Upload and Theme Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Upload Section */}
          <div className="bg-white rounded-3xl p-6 border-4 border-black">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-gray-800" />
            </div>
            
            <div
              className={`border-4 border-dashed rounded-2xl p-12 text-center transition ${
                dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-400 bg-white'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleChange}
                accept=".pdf,.txt,.docx"
              />
              
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Drop your files here
              </h3>
              <p className="text-sm text-gray-600 mb-1">or click to browse</p>
              <p className="text-xs text-gray-500">
                Supports PDF, TXT, DOCX (Max 5MB)
              </p>
              
              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg font-medium cursor-pointer hover:bg-gray-700 transition"
              >
                Browse Files
              </label>
              
              {uploadedFile && (
                <div className="mt-3 p-2 bg-green-100 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ {uploadedFile.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="bg-white rounded-3xl p-6 border-4 border-black">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Customized Theme</h3>
            
            <div className="space-y-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border-3 transition ${
                    selectedTheme === theme.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-md p-2`}>
                    <img 
                      src={Icon4Image} 
                      alt="Theme Icon1"
                      className="w-full h-full object-contain" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">{theme.name}</span>
                  {selectedTheme === theme.id && (
                    <div className="ml-auto">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateVideo}
          disabled={isGenerating}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 mb-6 max-w-md mx-auto block"
        >
          {isGenerating ? 'Generating Video...' : 'Generate Video'}
        </button>

        {/* Video Display */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Generate Video</h2>
          
          <div className="max-w-2xl mx-auto">
            {isGenerating ? (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-800 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Generating your video...</p>
                </div>
              </div>
            ) : videoGenerated ? (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 560 315">
                    <line x1="0" y1="0" x2="560" y2="315" stroke="#cbd5e1" strokeWidth="2"/>
                    <line x1="560" y1="0" x2="0" y2="315" stroke="#cbd5e1" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="relative z-10 text-gray-500 text-lg font-medium">
                  Video Preview
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center">
                <p className="text-gray-400 italic">Your video will appear here...</p>
              </div>
            )}
            
            {videoGenerated && (
              <button
                onClick={downloadVideo}
                className="mt-6 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center space-x-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
            )}
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

export default VideoPage;