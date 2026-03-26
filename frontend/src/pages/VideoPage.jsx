import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, CheckCircle, Clock, Settings } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';
import Icon4Image from '../assets/images/subwaysurfericon.png';
import Icon5Image from '../assets/images/minecrafticon.png';
import Icon6Image from '../assets/images/slimeicon.png';
import { API } from '../constants';

const JOB_KEY   = 'padai_video_job';
const VIDEO_KEY = 'padai_video';

const saveJob  = (job) => localStorage.setItem(JOB_KEY, JSON.stringify(job));
const loadJob  = () => { try { return JSON.parse(localStorage.getItem(JOB_KEY)); } catch { return null; } };
const clearJob = () => localStorage.removeItem(JOB_KEY);

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

  const selectedSummaryIdRef = useRef(null);
  const pollingRef = useRef(false);

  useEffect(() => {
    selectedSummaryIdRef.current = selectedSummaryId;
  }, [selectedSummaryId]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) { window.location.href = '/login'; return; }

    setUserEmail(storedUser.email);
    setUsername(storedUser.username);

    const savedJob = loadJob();
    if (savedJob) {
      setSelectedSummaryId(savedJob.summaryId);
      selectedSummaryIdRef.current = savedJob.summaryId;
      setSelectedTheme(savedJob.theme || 'subway');

      if (savedJob.status === 'done' && savedJob.videoUrl) {
        setVideoUrl(savedJob.videoUrl);
        setVideoGenerated(true);
        setVideoStatus('done');
      } else if (savedJob.status === 'queued' || savedJob.status === 'processing') {
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

  const fetchSummaries = async (email) => {
    try {
      const res  = await fetch(`${API}/api/my-summaries?email=${email}`);
      const data = await res.json();
      if (data.summaries?.length > 0) {
        const sorted = [...data.summaries].sort(
          (a, b) => new Date(b.generated_at) - new Date(a.generated_at)
        );
        setAvailableSummaries(sorted);
        const hint = Number(localStorage.getItem('padai_notebook_summary_hint'));
        if (hint && sorted.find(s => s.id === hint)) {
          setSelectedSummaryId(hint);
          selectedSummaryIdRef.current = hint;
          localStorage.removeItem('padai_notebook_summary_hint');
        } else if (!selectedSummaryIdRef.current) {
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

  const uploadAndCreateSummary = async (file) => {
    setIsUploading(true);
    setSelectedSummaryId(null);
    selectedSummaryIdRef.current = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', userEmail);

      const uploadRes  = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error('Upload failed');

      const sumRes  = await fetch(`${API}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: uploadData.document_id, user_email: userEmail, genz_style: true }),
      });
      const sumData = await sumRes.json();
      if (!sumData.success) throw new Error('Summary failed');
      const allNewBadges = [
        ...(uploadData.newly_earned_badges || []),
        ...(sumData.newly_earned_badges    || []),
      ];
      if (allNewBadges.length > 0) setNewBadges(allNewBadges);
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

  const checkVideoStatus = async (summaryId) => {
    try {
      const res  = await fetch(`${API}/api/video-status/${summaryId}`);
      const data = await res.json();
      console.log('[VideoPage] Status for', summaryId, ':', data.status);
      setVideoStatus(data.status);

      if (data.status === 'done') {
        pollingRef.current = false;
        const url = data.video_url?.startsWith('http')
          ? data.video_url
          : `${API}${data.video_url}`;

        setVideoUrl(url);
        setVideoGenerated(true);
        setIsGenerating(false);

        saveJob({ summaryId, status: 'done', videoUrl: url, theme: selectedTheme });
        localStorage.setItem(VIDEO_KEY, JSON.stringify({ url, summaryId }));

      } else if (data.status === 'error') {
        pollingRef.current = false;
        clearJob();
        alert('Video generation failed: ' + data.error);
        setIsGenerating(false);

      } else {
        saveJob({ summaryId, status: data.status, videoUrl: null, theme: selectedTheme });
        setTimeout(() => checkVideoStatus(summaryId), 3000);
      }
    } catch (err) {
      console.error('[VideoPage] Status check error:', err);
      setTimeout(() => checkVideoStatus(summaryId), 5000);
    }
  };

  const resumePolling = (summaryId) => {
    checkVideoStatus(summaryId);
  };

  const generateVideo = async () => {
    const idToUse = selectedSummaryIdRef.current;
    if (!idToUse) { alert('Please upload a PDF first!'); return; }

    setIsGenerating(true);
    setVideoGenerated(false);
    setVideoUrl(null);
    setVideoStatus('queued');
    pollingRef.current = true;

    saveJob({ summaryId: idToUse, status: 'queued', videoUrl: null, theme: selectedTheme });

    try {
      const res  = await fetch(`${API}/api/generate-video`, {
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

  // Human-friendly label for the selected summary — avoids showing a confusing
  // global DB id (e.g. #75) when the user only has 4 summaries.
  const selectedSummaryEntry = availableSummaries.find(s => s.id === selectedSummaryId);
  const summaryLabel = selectedSummaryEntry
    ? new Date(selectedSummaryEntry.generated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : selectedSummaryId ? `Summary ${selectedSummaryId}` : '';

  const StatusBadge = () => {
    if (!isGenerating && !videoGenerated) return null;
    const isReady      = videoGenerated;
    const isProcessing = videoStatus === 'processing';
    return (
      <div className={`rounded-2xl p-4 mb-6 border flex items-center gap-3 ${
        isReady      ? 'bg-green-50 border-green-200' :
        isProcessing ? 'bg-blue-50 border-blue-200'   :
                       'bg-yellow-50 border-yellow-200'
      }`}>
        {isReady
          ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          : isProcessing
            ? <Settings className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin" />
            : <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        }
        <p className={`font-bold ${isReady ? 'text-green-700' : isProcessing ? 'text-blue-700' : 'text-yellow-700'}`}>
          {isReady ? 'Video ready!' : isProcessing ? 'Rendering…' : 'Queued…'}
        </p>
        {isGenerating && (
          <p className={`text-sm ${isProcessing ? 'text-blue-600' : 'text-yellow-600'}`}>
            — you can navigate away and come back, it'll still be here!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pad-bg">
      <style>{PAD_STYLE}</style>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8">

        {/* Hero */}
        <div className="pad-hero p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
              Hello {username}!
            </h1>
            <p className="text-gray-600 font-medium">Upload & Generate</p>
            <p className="text-gray-500">Transform your summaries into engaging videos</p>
          </div>
          <img src={Icon1Image} alt="icon" className="w-32 h-32 object-contain" />
        </div>

        <StatusBadge />

        {/* Active summary indicator */}
        {selectedSummaryId && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="font-bold text-green-700">Summary ready — {summaryLabel}</p>
          </div>
        )}

        {/* Summary selector */}
        {availableSummaries.length > 0 && (
          <div className="pad-card p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Or pick an older summary</h3>
            <p className="text-sm text-gray-500 mb-3">Newest is auto-selected after upload.</p>
            <select
              className="w-full p-3 border border-blue-100 rounded-xl bg-white/60"
              value={selectedSummaryId || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedSummaryId(val);
                selectedSummaryIdRef.current = val;
              }}
            >
              {availableSummaries.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Summary {availableSummaries.length - i} — {new Date(s.generated_at).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload + Theme */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Upload */}
          <div className="pad-card p-6">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-blue-500" />
              <span className="ml-2 font-bold text-gray-700">Upload New PDF</span>
            </div>
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-white/40'
              }`}
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept=".pdf" />
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ background: 'rgba(99,130,190,0.15)' }}>
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Drop your file here</h3>
              <p className="text-sm text-gray-500 mb-1">or click to browse</p>
              <p className="text-xs text-gray-400">PDF only · Max 5MB</p>
              <label htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 text-white text-sm rounded-xl font-semibold cursor-pointer transition"
                style={{ background: 'rgba(90,120,180,0.85)' }}>
                Browse Files
              </label>
              {isUploading && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  <p className="text-blue-600 text-sm font-medium">Uploading & summarising…</p>
                </div>
              )}
              {uploadedFile && !isUploading && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 text-sm font-medium">✓ {uploadedFile.name}</p>
                  <p className="text-green-500 text-xs">Summary created — ready to generate!</p>
                </div>
              )}
            </div>
          </div>

          {/* Theme */}
          <div className="pad-card p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Customize Theme</h3>
            <div className="space-y-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`w-full flex items-center space-x-4 p-4 rounded-xl border transition ${
                    selectedTheme === theme.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-blue-100 hover:border-blue-200 bg-white/40'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${theme.color} overflow-hidden shadow-md`}>
                    <img src={theme.icon} alt="Theme" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-lg font-semibold text-gray-700">{theme.name}</span>
                  {selectedTheme === theme.id && (
                    <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(90,120,180,0.85)' }}>
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
          className="w-full text-white py-4 rounded-2xl font-bold text-lg transition mb-6 max-w-md mx-auto block"
          style={{
            background: (isGenerating || isUploading || !selectedSummaryId)
              ? 'rgba(150,170,200,0.7)'
              : 'rgba(90,120,180,0.9)',
            backdropFilter: 'blur(8px)',
          }}
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
            : `Generate Video (${summaryLabel})`
          }
        </button>

        {/* Video display */}
        <div className="pad-card p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Your Video</h2>
          <div className="max-w-2xl mx-auto">
            {isGenerating ? (
              <div className="aspect-video bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    {videoStatus === 'queued' ? 'Video queued…' : 'Rendering video with AI…'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">This may take a minute.</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    You can navigate away — we'll keep generating in the background!
                  </p>
                </div>
              </div>
            ) : videoGenerated && videoUrl ? (
              <div>
                <video
                  controls
                  className="w-full aspect-video bg-black rounded-2xl border border-blue-100"
                  src={videoUrl}
                />
                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={downloadVideo}
                    className="text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2"
                    style={{ background: 'rgba(90,120,180,0.9)' }}
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </button>
                  <button
                    onClick={handleNewVideo}
                    className="border border-blue-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
                  >
                    Generate New Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
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

      <footer className="text-center py-6 text-gray-500 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default VideoPage;
