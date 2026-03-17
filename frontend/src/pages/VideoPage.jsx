import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';
import Icon4Image from '../assets/images/subwaysurfericon.png';
import Icon5Image from '../assets/images/minecrafticon.png';
import Icon6Image from '../assets/images/slimeicon.png';

// ─── localStorage helpers ────────────────────────────────────────────────────
// We persist the whole "active job" so navigating away and coming back restores
// exactly where things were (queued / processing / done).

const JOB_KEY   = 'padai_video_job';   // { summaryId, status, videoUrl, theme }
const VIDEO_KEY = 'padai_video';       // legacy key — keep writing for other pages

function saveJob(job) {
  localStorage.setItem(JOB_KEY, JSON.stringify(job));
}
function loadJob() {
  try { return JSON.parse(localStorage.getItem(JOB_KEY)); }
  catch { return null; }
}
function clearJob() {
  localStorage.removeItem(JOB_KEY);
}

const VideoPage = () => {
  const [dragActive, setDragActive]         = useState(false);
  const [uploadedFile, setUploadedFile]     = useState(null);
  const [selectedTheme, setSelectedTheme]   = useState('subway');
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [isUploading, setIsUploading]       = useState(false);
  const [videoUrl, setVideoUrl]             = useState(null);
  const [videoStatus, setVideoStatus]       = useState(null);
  const [username, setUsername]             = useState('');
  const [userEmail, setUserEmail]           = useState('');
  const [availableSummaries, setAvailableSummaries] = useState([]);
  const [selectedSummaryId, setSelectedSummaryId]   = useState(null);

  // Ref so polling callbacks always see the latest summaryId (no stale closure)
  const selectedSummaryIdRef = useRef(null);
  // Prevent double-polling on strict-mode double-mount
  const pollingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  // ── On mount: restore any in-progress or completed job ──────────────────
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) { window.location.href = '/login'; return; }

    setUserEmail(storedUser.email);
    setUsername(storedUser.username);

    // Restore persisted job FIRST
    const savedJob = loadJob();
    if (savedJob) {
      setSelectedSummaryId(savedJob.summaryId);
      selectedSummaryIdRef.current = savedJob.summaryId;
      setSelectedTheme(savedJob.theme || 'subway');

      if (savedJob.status === 'done' && savedJob.videoUrl) {
        // Already finished — just show the video
        setVideoUrl(savedJob.videoUrl);
        setVideoGenerated(true);
        setVideoStatus('done');
      } else if (savedJob.status === 'queued' || savedJob.status === 'processing') {
        // Still in progress — resume polling
        setIsGenerating(true);
        setVideoStatus(savedJob.status);
        if (!pollingRef.current) {
          pollingRef.current = true;
          setTimeout(() => resumePolling(savedJob.summaryId), 1500);
        }
      }
    }

    fetchSummaries(storedUser.email);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch summaries list ─────────────────────────────────────────────────
  const fetchSummaries = async (email) => {
    try {
      const res  = await fetch(`http://localhost:8000/api/my-summaries?email=${email}`);
      const data = await res.json();
      if (data.summaries?.length > 0) {
        const sorted = [...data.summaries].sort(
          (a, b) => new Date(b.generated_at) - new Date(a.generated_at)
        );
        setAvailableSummaries(sorted);
        // Only set default if nothing is already selected (don't override restored job)
        if (!selectedSummaryIdRef.current) {
          setSelectedSummaryId(sorted[0].id);
          selectedSummaryIdRef.current = sorted[0].id;
        }
        return sorted;
      }
    } catch (err) {
      console.error('Error fetching summaries:', err);
    }
    return [];
  };

  const themes = [
    { id: 'subway',    name: 'Subway Surfer', color: 'from-yellow-300 to-yellow-400', icon: Icon4Image },
    { id: 'slime',     name: 'Slime Videos',  color: 'from-pink-300 to-pink-400',     icon: Icon6Image },
    { id: 'minecraft', name: 'Minecraft',     color: 'from-green-300 to-green-400',   icon: Icon5Image },
  ];

  // ── Drag & drop ──────────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
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

  // ── Upload PDF → auto-summarise ──────────────────────────────────────────
  const uploadAndCreateSummary = async (file) => {
    setIsUploading(true);
    setSelectedSummaryId(null);
    selectedSummaryIdRef.current = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', userEmail);

      const uploadRes  = await fetch('http://localhost:8000/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error('Upload failed');

      const sumRes  = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: uploadData.document_id, user_email: userEmail, genz_style: true }),
      });
      const sumData = await sumRes.json();
      if (!sumData.success) throw new Error('Summary failed');

      const newId = sumData.summary_id;
      setSelectedSummaryId(newId);
      selectedSummaryIdRef.current = newId;
      await fetchSummaries(userEmail);
    } catch (err) {
      console.error('[VideoPage] Upload/summarise error:', err);
      alert('Failed to process PDF: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Polling — shared by initial generation AND page-return resume ────────
  const checkVideoStatus = async (summaryId) => {
    try {
      const res  = await fetch(`http://localhost:8000/api/video-status/${summaryId}`);
      const data = await res.json();
      console.log('[VideoPage] Status for', summaryId, ':', data.status);
      setVideoStatus(data.status);

      if (data.status === 'done') {
        pollingRef.current = false;
        const url = data.video_url?.startsWith('http')
          ? data.video_url
          : `http://localhost:8000${data.video_url}`;

        setVideoUrl(url);
        setVideoGenerated(true);
        setIsGenerating(false);

        // Persist completed state so coming back again still shows the video
        saveJob({ summaryId, status: 'done', videoUrl: url, theme: selectedTheme });
        localStorage.setItem(VIDEO_KEY, JSON.stringify({ url, summaryId }));

      } else if (data.status === 'error') {
        pollingRef.current = false;
        clearJob();
        alert('Video generation failed: ' + data.error);
        setIsGenerating(false);

      } else {
        // Still queued / processing — save current status and keep polling
        saveJob({ summaryId, status: data.status, videoUrl: null, theme: selectedTheme });
        setTimeout(() => checkVideoStatus(summaryId), 3000);
      }
    } catch (err) {
      console.error('[VideoPage] Status check error:', err);
      // Network blip — retry in 5s
      setTimeout(() => checkVideoStatus(summaryId), 5000);
    }
  };

  // Called on mount when a saved in-progress job is found
  const resumePolling = (summaryId) => {
    checkVideoStatus(summaryId);
  };

  // ── Start new video generation ───────────────────────────────────────────
  const generateVideo = async () => {
    const idToUse = selectedSummaryIdRef.current;
    if (!idToUse) { alert('Please upload a PDF first!'); return; }

    setIsGenerating(true);
    setVideoGenerated(false);
    setVideoUrl(null);
    setVideoStatus('queued');
    pollingRef.current = true;

    // Persist immediately so a page-leave mid-generation can resume
    saveJob({ summaryId: idToUse, status: 'queued', videoUrl: null, theme: selectedTheme });

    try {
      const res  = await fetch('http://localhost:8000/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: idToUse, user_email: userEmail, theme: selectedTheme }),
      });
      const data = await res.json();
      if (data.success) {
        checkVideoStatus(idToUse);
      } else {
        throw new Error(data.detail || 'Video generation failed');
      }
    } catch (err) {
      pollingRef.current = false;
      clearJob();
      console.error('[VideoPage] Generate error:', err);
      alert('Failed to generate video: ' + err.message);
      setIsGenerating(false);
    }
  };

  // ── Start fresh (clear completed job) ───────────────────────────────────
  const handleNewVideo = () => {
    clearJob();
    setVideoUrl(null);
    setVideoGenerated(false);
    setVideoStatus(null);
    setIsGenerating(false);
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `padaiSathi-video-${selectedTheme}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Status badge helper ──────────────────────────────────────────────────
  const StatusBadge = () => {
    if (!isGenerating && !videoGenerated) return null;
    const cfg = videoGenerated
      ? { bg: 'bg-green-100 border-green-400', text: 'text-green-800', label: '✅ Video ready!' }
      : videoStatus === 'processing'
      ? { bg: 'bg-blue-100 border-blue-400',  text: 'text-blue-800',  label: '⚙️ Rendering…'  }
      : { bg: 'bg-yellow-100 border-yellow-400', text: 'text-yellow-800', label: '⏳ Queued…' };
    return (
      <div className={`rounded-2xl p-4 mb-6 border-2 flex items-center gap-3 ${cfg.bg}`}>
        <p className={`font-bold ${cfg.text}`}>{cfg.label}</p>
        {isGenerating && (
          <p className={`text-sm ${cfg.text}`}>
            — you can navigate away and come back, it'll still be here!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Hero */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello {username}! 🎬</h1>
            <p className="text-gray-700 font-medium">Upload & Generate</p>
            <p className="text-gray-700">Transform your summaries into engaging videos</p>
          </div>
          <img src={Icon1Image} alt="icon" className="w-32 h-32 object-contain" />
        </div>

        {/* Persistent status banner */}
        <StatusBadge />

        {/* Active summary indicator */}
        {selectedSummaryId && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <p className="font-bold text-green-800">Summary ready — ID #{selectedSummaryId}</p>
          </div>
        )}

        {/* Summary selector */}
        {availableSummaries.length > 0 && (
          <div className="bg-white rounded-3xl p-6 mb-6 border-4 border-black">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Or pick an older summary</h3>
            <p className="text-sm text-gray-500 mb-3">Newest is auto-selected after upload.</p>
            <select
              className="w-full p-3 border-2 border-gray-300 rounded-xl"
              value={selectedSummaryId || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedSummaryId(val);
                selectedSummaryIdRef.current = val;
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
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept=".pdf" />
              <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Drop your file here</h3>
              <p className="text-sm text-gray-600 mb-1">or click to browse</p>
              <p className="text-xs text-gray-500">PDF only · Max 5MB</p>
              <label htmlFor="file-upload" className="inline-block mt-3 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg font-medium cursor-pointer hover:bg-gray-700 transition">
                Browse Files
              </label>
              {isUploading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  <p className="text-blue-700 text-sm font-medium">Uploading & summarising…</p>
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
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${theme.color} overflow-hidden shadow-md`}>
                    <img src={theme.icon} alt="Theme" className="w-full h-full object-cover" />
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

        {/* Generate button */}
        <button
          onClick={generateVideo}
          disabled={isGenerating || isUploading || !selectedSummaryId}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 mb-6 max-w-md mx-auto block"
        >
          {isUploading ? 'Processing PDF…'
            : isGenerating
              ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {videoStatus === 'queued' ? 'Queued…' : 'Generating Video…'}
                </span>
              )
            : !selectedSummaryId ? 'Upload a PDF first'
            : `Generate Video (summary #${selectedSummaryId})`
          }
        </button>

        {/* Video display */}
        <div className="bg-white rounded-3xl p-8 border-4 border-black">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Your Video</h2>
          <div className="max-w-2xl mx-auto">
            {isGenerating ? (
              <div className="aspect-video bg-gray-100 rounded-2xl border-4 border-black flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-800 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {videoStatus === 'queued' ? 'Video queued…' : 'Rendering video with AI…'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">This may take a minute.</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    ✨ You can navigate away — we'll keep generating in the background!
                  </p>
                </div>
              </div>
            ) : videoGenerated && videoUrl ? (
              <div>
                <video
                  controls
                  className="w-full aspect-video bg-black rounded-2xl border-4 border-black"
                  src={videoUrl}
                />
                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={downloadVideo}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </button>
                  <button
                    onClick={handleNewVideo}
                    className="border-2 border-black text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
                  >
                    Generate New Video
                  </button>
                </div>
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