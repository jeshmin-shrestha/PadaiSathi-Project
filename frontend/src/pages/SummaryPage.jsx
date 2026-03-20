import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';
import BadgeToast from '../components/BadgeToast';
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
  // Restore saved summaries on mount
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
      // Step 1: Upload
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('email', userEmail);

      const uploadRes = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      // Step 2: Summarize
      const summaryRes = await fetch('http://localhost:8000/api/summarize', {
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
        // Collect badges from BOTH upload AND summarize responses
        const allNewBadges = [
          ...(uploadData.newly_earned_badges || []),
          ...(summaryData.newly_earned_badges || []),
        ];
        if (allNewBadges.length > 0) {
          setNewBadges(allNewBadges);
        }
        setGenzSummary(summaryData.genz_summary);
        setShowGenz(false); // default to formal
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
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello {username}!</h1>
            <p className="text-gray-700">Transform your documents into interactive learning materials</p>
          </div>
          <img src={Icon1Image} alt="icon" className="w-32 h-32 object-contain" />
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-3xl p-8 mb-6 border-4 border-black">
          <div className="flex items-center mb-6">
            <Upload className="w-8 h-8 text-gray-800" />
          </div>

          <div
            className={`border-4 border-dashed rounded-2xl p-16 text-center transition ${
              dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-400 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept=".pdf" />

            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-400 rounded-full mx-auto flex items-center justify-center">
                <Upload className="w-10 h-10 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Drop your files here</h3>
            <p className="text-gray-600 mb-1">or click to browse</p>
            <p className="text-sm text-gray-500">Supports PDF (Max 5MB)</p>

            <label
              htmlFor="file-upload"
              className="inline-block mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg font-medium cursor-pointer hover:bg-gray-700 transition"
            >
              Browse Files
            </label>

            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">✓ {uploadedFile.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateSummary}
          disabled={isGenerating}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 mb-6"
        >
          {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
        </button>

        {/* Summary Display */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black min-h-64">

          {/* Header + Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Summary</h2>

            {/* Only show toggle once we have summaries */}
            {(formalSummary || genzSummary) && !isGenerating && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGenz(false)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                    !showGenz
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📖 Formal
                </button>
                <button
                  onClick={() => setShowGenz(true)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                    showGenz
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✨ Fun Mode
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-black" />
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

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
      <BadgeToast badgeIds={newBadges} onDone={() => setNewBadges([])} />
    </div>
  );
};

export default SummaryPage;