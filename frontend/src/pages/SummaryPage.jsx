import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import Navbar from '../components/Navbar';

const SummaryPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (allowedTypes.includes(file.type) || file.size <= 5242880) { // 5MB
      setUploadedFile(file);
    } else {
      alert('Please upload PDF, TXT, DOCX (Max 5MB)');
    }
  };

  const generateSummary = () => {
    if (!uploadedFile) {
      alert('Please upload a file first!');
      return;
    }
    
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setSummary(`Summary of "${uploadedFile.name}":\n\nThis is a generated summary of your document. The AI has analyzed the key points and concepts from your uploaded file and condensed them into this digestible format. Main topics include important concepts, key findings, and critical information that will help you understand the material better.\n\nKey Points:\n• Main concept 1 discussed in detail\n• Important finding from section 2\n• Critical information from the conclusion\n• Supporting evidence and examples\n\nThis summary helps you study more efficiently by focusing on the essential information.`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="bg-gray-300 rounded-3xl p-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hello Jeshmin!
            </h1>
            <p className="text-gray-700">
              Transform your documents into interactive learning materials
            </p>
          </div>
          <div className="w-32 h-32">
            <div className="text-6xl">🐱‍💻</div>
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
              accept=".pdf,.txt,.docx"
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
              Supports PDF, TXT, DOCX (Max 5MB)
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Summary...</h2>
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Generating your summary...</div>
            </div>
          ) : summary ? (
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {summary}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              Your generated summary will appear here...
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm mt-8">
        © PadaiSathi All rights reserved.
      </footer>
    </div>
  );
};

export default SummaryPage;