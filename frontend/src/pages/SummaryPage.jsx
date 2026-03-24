import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';
import BadgeToast from '../components/BadgeToast';
import { API } from '../constants';

const SummaryPage = () => {
  const [dragActive, setDragActive]     = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formalSummary, setFormalSummary] = useState('');
  const [genzSummary, setGenzSummary]     = useState('');
  const [showGenz, setShowGenz]           = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [username, setUsername]           = useState('');
  const [userEmail, setUserEmail]         = useState('');
  const [newBadges, setNewBadges] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('padai_summaries');
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormalSummary(parsed.formal || '');
      setGenzSummary(parsed.genz || '');
    }
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    setUserEmail(storedUser.email);
    setUsername(storedUser.username);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (file.type === 'application/pdf' && file.size <= 5242880) {
      setUploadedFile(file);
      setFormalSummary('');
      setGenzSummary('');
    } else {
      alert('Please upload PDF files only (Max 5MB)');
    }
  };

  const generateSummary = async () => {
    if (!uploadedFile) { alert('Please upload a file first!'); return; }
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('email', userEmail);

      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      const summaryRes = await fetch(`${API}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: uploadData.document_id,
          user_email: userEmail,
          genz_style: true,
        }),
      });
      if (!summaryRes.ok) throw new Error('Summary generation failed');
      const summaryData = await summaryRes.json();

      if (summaryData.success) {
        setFormalSummary(summaryData.formal_summary);
        const allNewBadges = [
          ...(uploadData.newly_earned_badges || []),
          ...(summaryData.newly_earned_badges || []),
        ];
        if (allNewBadges.length > 0) {
          setNewBadges(allNewBadges);
        }
        setGenzSummary(summaryData.genz_summary);
        setShowGenz(false);
        localStorage.setItem('padai_summaries', JSON.stringify({
          formal: summaryData.formal_summary,
          genz:   summaryData.genz_summary,
        }));
      } else {
        throw new Error(summaryData.detail || 'Summary generation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate summary: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeSummary = showGenz ? genzSummary : formalSummary;

  return (
    <div className="min-h-screen pad-bg">
      <style>{`
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
      `}</style>

      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Hero Banner */}
        <div className="pad-hero p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hello {username}!
            </h1>
            <p className="text-gray-600">Transform your documents into interactive learning materials</p>
          </div>
          <img src={Icon1Image} alt="icon" className="w-32 h-32 object-contain" />
        </div>

        {/* Upload Section */}
        <div className="pad-card p-8 mb-6">
          <div className="flex items-center mb-6">
            <Upload className="w-7 h-7 text-blue-500" />
            <span className="ml-2 font-bold text-gray-700 text-lg">Upload PDF</span>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept=".pdf" />

            <div className="mb-4">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'rgba(99,130,190,0.15)' }}>
                <Upload className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">Drop your files here</h3>
            <p className="text-gray-500 mb-1">or click to browse</p>
            <p className="text-sm text-gray-400">Supports PDF (Max 5MB)</p>

            <label
              htmlFor="file-upload"
              className="inline-block mt-4 px-6 py-2 text-white rounded-xl font-semibold cursor-pointer transition"
              style={{ background: 'rgba(90,120,180,0.85)' }}
            >
              Browse Files
            </label>

            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 font-medium">✓ {uploadedFile.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateSummary}
          disabled={isGenerating}
          className="w-full text-white py-4 rounded-2xl font-bold text-lg transition mb-6"
          style={{
            background: isGenerating ? 'rgba(150,170,200,0.7)' : 'rgba(90,120,180,0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
        </button>

        {/* Summary Display */}
        <div className="pad-card p-8 min-h-64">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Summary</h2>

            {(formalSummary || genzSummary) && !isGenerating && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGenz(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
                    !showGenz ? 'text-white' : 'text-gray-500 hover:bg-blue-50'
                  }`}
                  style={!showGenz ? { background: 'rgba(90,120,180,0.85)' } : {}}
                >
                  <BookOpen className="w-4 h-4" /> Formal
                </button>
                <button
                  onClick={() => setShowGenz(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
                    showGenz ? 'text-white' : 'text-gray-500 hover:bg-purple-50'
                  }`}
                  style={showGenz ? { background: 'rgba(140,80,200,0.85)' } : {}}
                >
                  <Star className="w-4 h-4" /> Fun Mode
                </button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-400" />
              <p className="text-gray-500">AI is analyzing your document...</p>
              <p className="text-gray-400 text-sm">BART + Flan-T5 working together</p>
            </div>
          ) : activeSummary ? (
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {activeSummary}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              Upload a PDF and click "Generate Summary" to see AI-generated content
            </p>
          )}
        </div>

      </div>

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
      <BadgeToast badgeIds={newBadges} onDone={() => setNewBadges([])} />
    </div>
  );
};

export default SummaryPage;
