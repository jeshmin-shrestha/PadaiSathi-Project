import React, { useState, useEffect, useRef } from 'react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);

  // ── Use a ref so the polling callback always sees the LATEST summary ID ──
  // This is the core fix: React state closures inside setTimeout keep stale values.
  const selectedSummaryIdRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'demo@padai.com';
    setUserEmail(email);
    fetchSummaries(email);
  }, []);

  const fetchSummaries = async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/api/my-summaries?email=${email}`);
      const data = await response.json();
      if (data.summaries && data.summaries.length > 0) {
        // Sort newest first
        const sorted = [...data.summaries].sort((a, b) =>
          new Date(b.generated_at) - new Date(a.generated_at)
        );
        setAvailableSummaries(sorted);
        // Only set if we don't already have a freshly uploaded one selected
        if (!selectedSummaryIdRef.current) {
          setSelectedSummaryId(sorted[0].id);
          selectedSummaryIdRef.current = sorted[0].id;
        }
        return sorted;
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
    return [];
  };

  const themes = [
    { id: 'subway', name: 'Subway Surfer', color: 'from-yellow-300 to-yellow-400' },
    { id: 'slime',  name: 'Slime Videos',  color: 'from-pink-300 to-pink-400'   },
    { id: 'minecraft', name: 'Minecraft',  color: 'from-green-300 to-green-400' }
  ];

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
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (file.type === 'application/pdf' && file.size <= 5242880) {
      setUploadedFile(file);
      uploadAndCreateSummary(file);
    } else {
      alert('Please upload PDF files only (Max 5MB)');
    }
  };

  const uploadAndCreateSummary = async (file) => {
    setIsUploading(true);

    // ── CRITICAL: Reset selected ID so old one can't leak into video gen ──
    setSelectedSummaryId(null);
    selectedSummaryIdRef.current = null;

    try {
      // Step 1: Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', userEmail);

      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadResponse.json();
      console.log('[VideoPage] Upload response:', uploadData);

      if (!uploadData.success) throw new Error('Upload failed');

      // Step 2: Summarise
      const summaryResponse = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: uploadData.document_id,
          user_email: userEmail,
          genz_style: true
        })
      });
      const summaryData = await summaryResponse.json();
      console.log('[VideoPage] Summary response:', summaryData);

      if (!summaryData.success) throw new Error('Summary failed');

      const newId = summaryData.summary_id;
      console.log('[VideoPage] ✅ New summary ID:', newId);

      // ── Set BOTH state and ref immediately ──
      setSelectedSummaryId(newId);
      selectedSummaryIdRef.current = newId;

      // Refresh the dropdown list (newest first)
      await fetchSummaries(userEmail);

    } catch (error) {
      console.error('[VideoPage] Upload/summarise error:', error);
      alert('Failed to process PDF: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const checkVideoStatus = async (summaryId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/video-status/${summaryId}`);
      const data = await response.json();
      console.log('[VideoPage] Status for', summaryId, ':', data.status);
      setVideoStatus(data.status);

      if (data.status === 'done' && data.video_url) {
        setVideoUrl(`http://localhost:8000${data.video_url}`);
        setVideoGenerated(true);
        setIsGenerating(false);
      } else if (data.status === 'error') {
        alert('Video generation failed: ' + data.error);
        setIsGenerating(false);
      } else if (data.status === 'processing' || data.status === 'queued') {
        setTimeout(() => checkVideoStatus(summaryId), 3000);
      }
    } catch (error) {
      console.error('[VideoPage] Status check error:', error);
      setTimeout(() => checkVideoStatus(summaryId), 5000);
    }
  };

  const generateVideo = async () => {
    // ── Always read from ref — never from stale closure ──
    const idToUse = selectedSummaryIdRef.current;

    console.log('[VideoPage] === GENERATE VIDEO ===');
    console.log('[VideoPage] Summary ID from ref:', idToUse);
    console.log('[VideoPage] Summary ID from state:', selectedSummaryId);

    if (!idToUse) {
      alert('Please upload a PDF first to create a summary!');
      return;
    }

    setIsGenerating(true);
    setVideoGenerated(false);
    setVideoUrl(null);
    setVideoStatus('queued');

    try {
      const response = await fetch('http://localhost:8000/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_id: idToUse,   // ← the fresh ID, not a stale closure
          user_email: userEmail,
          theme: selectedTheme
        })
      });

      const data = await response.json();
      console.log('[VideoPage] Generate response:', data);

      if (data.success) {
        checkVideoStatus(idToUse);
      } else {
        throw new Error(data.detail || 'Video generation failed');
      }
    } catch (error) {
      console.error('[VideoPage] Generate error:', error);
      alert('Failed to generate video: ' + error.message);
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `padaiSathi-video-${selectedTheme}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload & Generate</h1>
            <p className="text-gray-700">Transform your summaries into engaging videos</p>
          </div>
          <img src={Icon1Image} alt="icon" className="w-32 h-32 object-contain" />
        </div>

        {/* Active summary indicator */}
        {selectedSummaryId && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div>
              <p className="font-bold text-green-800">Summary ready — ID #{selectedSummaryId}</p>
              <p className="text-sm text-green-600">
                This is the content that will be used to generate your video.
              </p>
            </div>
          </div>
        )}

        {/* Summary Selection (existing summaries) */}
        {availableSummaries.length > 0 && (
          <div className="bg-white rounded-3xl p-6 mb-6 border-4 border-black">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Or pick an older summary</h3>
            <p className="text-sm text-gray-500 mb-3">
              Newest is auto-selected after upload. Change here if you want a different one.
            </p>
            <select
              className="w-full p-3 border-2 border-gray-300 rounded-xl"
              value={selectedSummaryId || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedSummaryId(val);
                selectedSummaryIdRef.current = val;   // ← keep ref in sync
              }}
            >
              {availableSummaries.map(s => (
                <option key={s.id} value={s.id}>
                  #{s.id} — {new Date(s.generated_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload + Theme */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Upload */}
          <div className="bg-white rounded-3xl p-6 border-4 border-black">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-gray-800" />
              <span className="ml-2 font-bold text-gray-800">Upload New PDF</span>
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
                type="file" id="file-upload" className="hidden"
                onChange={handleChange} accept=".pdf"
              />

              <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">Drop your file here</h3>
              <p className="text-sm text-gray-600 mb-1">or click to browse</p>
              <p className="text-xs text-gray-500">PDF only · Max 5MB</p>

              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg font-medium cursor-pointer hover:bg-gray-700 transition"
              >
                Browse Files
              </label>

              {isUploading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    <p className="text-blue-700 text-sm font-medium">
                      Uploading & summarising PDF...
                    </p>
                  </div>
                </div>
              )}

              {uploadedFile && !isUploading && (
                <div className="mt-3 p-2 bg-green-100 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">✓ {uploadedFile.name}</p>
                  <p className="text-green-600 text-xs">Summary created — ready to generate!</p>
                </div>
              )}
            </div>
          </div>

          {/* Theme */}
          <div className="bg-white rounded-3xl p-6 border-4 border-black">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Customize Theme</h3>
            <div className="space-y-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border-2 transition ${
                    selectedTheme === theme.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-md p-2`}>
                    <img src={Icon4Image} alt="Theme" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-lg font-semibold text-gray-800">{theme.name}</span>
                  {selectedTheme === theme.id && (
                    <div className="ml-auto w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
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
          disabled={isGenerating || isUploading || !selectedSummaryId}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 mb-6 max-w-md mx-auto block"
        >
          {isUploading ? (
            'Processing PDF...'
          ) : isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {videoStatus === 'queued' ? 'Queued...' :
               videoStatus === 'processing' ? 'Generating Video...' : 'Starting...'}
            </span>
          ) : !selectedSummaryId ? (
            'Upload a PDF first'
          ) : (
            `Generate Video (using summary #${selectedSummaryId})`
          )}
        </button>

        {/* Video Display */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Your Video</h2>

          <div className="max-w-2xl mx-auto">
            {isGenerating ? (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-800 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {videoStatus === 'queued' ? 'Video queued...' :
                     videoStatus === 'processing' ? 'Rendering video with AI...' : 'Preparing...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">This may take a minute</p>
                  <p className="text-xs text-gray-400 mt-1">Using summary #{selectedSummaryIdRef.current}</p>
                </div>
              </div>
            ) : videoGenerated && videoUrl ? (
              <div>
                <video
                  controls
                  className="w-full aspect-video bg-black rounded-2xl border-4 border-black"
                  src={videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
                <button
                  onClick={downloadVideo}
                  className="mt-6 bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center space-x-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Video</span>
                </button>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center">
                <p className="text-gray-400 italic text-center px-8">
                  {availableSummaries.length > 0
                    ? 'Click "Generate Video" to create your video'
                    : 'Upload a PDF to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default VideoPage;