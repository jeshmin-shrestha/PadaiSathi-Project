import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Navbar from '../components/Navbar';
import Icon1Image from '../assets/images/icon1.png';

const SummaryPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get user email on component mount
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    } else {
      // For demo purposes
      setUserEmail('demo@padai.com');
    }
  }, []);

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
    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.type) && file.size <= 5242880) {
      setUploadedFile(file);
      // Clear previous summary when new file is uploaded
      setSummary('');
    } else {
      alert('Please upload PDF files only (Max 5MB)');
    }
  };

  const generateSummary = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first!');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('email', userEmail);

      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);
      
      // Step 2: Generate summary
      const summaryResponse = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadData.document_id,
          user_email: userEmail,
          genz_style: true // Change to false for formal summary
        })
      });

      if (!summaryResponse.ok) {
        throw new Error('Summary generation failed');
      }

      const summaryData = await summaryResponse.json();
      console.log('Summary response:', summaryData);
      
      if (summaryData.success) {
        // Use the AI-generated summary
        setSummary(summaryData.genz_summary); // or summaryData.formal_summary
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

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hello {userEmail.split('@')[0]}!
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
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleChange}
              accept=".pdf"
            />
            
            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-400 rounded-full mx-auto flex items-center justify-center">
                <Upload className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Drop your files here
            </h3>
            <p className="text-gray-600 mb-1">or click to browse</p>
            <p className="text-sm text-gray-500">
              Supports PDF (Max 5MB)
            </p>
            
            <label
              htmlFor="file-upload"
              className="inline-block mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg font-medium cursor-pointer hover:bg-gray-700 transition"
            >
              Browse Files
            </label>
            
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ {uploadedFile.name}
                </p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">AI is analyzing your document...</div>
            </div>
          ) : summary ? (
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {summary}
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
    </div>
  );
};

export default SummaryPage;