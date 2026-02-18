import React, { useState } from 'react';

const FileUpload = ({ userEmail }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage(`Selected: ${selectedFile.name}`);
      setError('');
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    // Here you can add real upload to backend later
    setMessage('Upload successful! (Simulation)');
    setFile(null); // Reset
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <p className="text-gray-500 mb-4">
          {file ? file.name : 'Drag & drop your PDF here or click to browse'}
        </p>
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          id="file-upload"
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Browse Files
        </label>
      </div>

      {message && <p className="text-green-600 text-center">{message}</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      {file && (
        <button
          onClick={handleUpload}
          className="w-full py-3 bg-purple-600 text-white rounded-lg"
        >
          Upload PDF
        </button>
      )}
    </div>
  );
};

export default FileUpload;