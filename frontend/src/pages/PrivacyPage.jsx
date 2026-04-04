import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Effective date: January 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            When you register, we collect your name, email address, and password. When you use the platform, we also collect the documents you upload and the study materials generated from them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed">
            Your information is used to provide and improve the PadaiSathi service — including generating summaries, flashcards, quizzes, and videos from your uploaded content. We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Data Storage</h2>
          <p className="text-gray-600 leading-relaxed">
            Your data is securely stored using Supabase. We take reasonable technical measures to protect your information from unauthorized access, loss, or misuse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            PadaiSathi uses local storage and session tokens to keep you logged in. We do not use tracking or advertising cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            We use third-party services including Supabase (database and authentication) and AI APIs to generate study content. These services have their own privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You may request deletion of your account and associated data at any time by contacting us. We will process your request within a reasonable timeframe.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For any privacy-related concerns, contact us at <span className="text-blue-500">shresthajeshmin30@gmail.com</span>.
          </p>
        </section>

        <Link to="/register" className="text-blue-500 hover:underline text-sm">
          ← Back to Register
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPage;
