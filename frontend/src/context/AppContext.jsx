import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { API } from '../constants';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [summaryJobs, setSummaryJobs] = useState({});
  const [videoJobs, setVideoJobs] = useState({});
  const pollRefs = useRef({});

  const updateSummaryJob = (jobId, data) => {
    setSummaryJobs(prev => ({ ...prev, [jobId]: { ...prev[jobId], ...data } }));
  };

  const updateVideoJob = (summaryId, data) => {
    setVideoJobs(prev => ({ ...prev, [summaryId]: { ...prev[summaryId], ...data } }));
  };

  const uploadAndSummarize = useCallback(async (file, userEmail) => {
    const jobId = `job_${Date.now()}`;
    updateSummaryJob(jobId, { status: 'uploading', fileName: file.name });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', userEmail);

      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error('Upload failed');

      updateSummaryJob(jobId, { status: 'summarizing', documentId: uploadData.document_id });

      const summaryRes = await fetch(`${API}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: uploadData.document_id,
          user_email: userEmail,
          genz_style: true,
        }),
      });
      const summaryData = await summaryRes.json();
      if (!summaryData.success) throw new Error('Summary failed');

      updateSummaryJob(jobId, {
        status: 'done',
        summaryId: summaryData.summary_id,
        genzSummary: summaryData.genz_summary,
        formalSummary: summaryData.formal_summary,
      });

      return { jobId, summaryId: summaryData.summary_id };
    } catch (err) {
      updateSummaryJob(jobId, { status: 'error', error: err.message });
      return { jobId, summaryId: null };
    }
  }, []);

  const startVideoGeneration = useCallback(async (summaryId, userEmail, theme) => {
    updateVideoJob(summaryId, { status: 'queued', theme });

    try {
      const res = await fetch(`${API}/api/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary_id: summaryId, user_email: userEmail, theme }),
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to start video generation');

      const poll = async () => {
        try {
          const statusRes = await fetch(`${API}/api/video-status/${summaryId}`);
          const statusData = await statusRes.json();
          updateVideoJob(summaryId, { status: statusData.status });

          if (statusData.status === 'done') {
            const url = statusData.video_url?.startsWith('http')
              ? statusData.video_url
              : `${API}${statusData.video_url}`;
            updateVideoJob(summaryId, { status: 'done', videoUrl: url });
          } else if (statusData.status === 'error') {
            updateVideoJob(summaryId, { status: 'error', error: statusData.error });
          } else {
            pollRefs.current[summaryId] = setTimeout(poll, 3000);
          }
        } catch {
          pollRefs.current[summaryId] = setTimeout(poll, 5000);
        }
      };
      poll();
    } catch (err) {
      updateVideoJob(summaryId, { status: 'error', error: err.message });
    }
  }, []);

  return (
    <AppContext.Provider value={{ summaryJobs, videoJobs, uploadAndSummarize, startVideoGeneration }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);