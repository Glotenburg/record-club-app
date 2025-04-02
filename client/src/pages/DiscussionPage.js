import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function DiscussionPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useContext(AuthContext);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/discussions`);
      setThreads(response.data);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError('Failed to load discussion threads. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      setError('Please provide both a title and content for the thread.');
      return;
    }
    if (!user) {
      setError('You must be logged in to post a thread.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/discussions`, {
        title: newThreadTitle,
        content: newThreadContent,
        author: user.username,
      });
      setThreads([response.data, ...threads]);
      setNewThreadTitle('');
      setNewThreadContent('');
    } catch (err) {
      console.error("Error creating thread:", err);
      setError('Failed to create thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">Current Discussion</h1>

      <form onSubmit={handleCreateThread} className="bg-slate-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-amber-400">Start a New Discussion</h2>
        <input
          type="text"
          placeholder="Thread Title"
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
          disabled={isSubmitting}
          className="block w-full p-3 mb-4 bg-slate-700 border border-slate-600 rounded-md placeholder-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
          required
        />
        <textarea
          placeholder="What's on your mind?"
          value={newThreadContent}
          onChange={(e) => setNewThreadContent(e.target.value)}
          disabled={isSubmitting}
          className="block w-full p-3 mb-4 bg-slate-700 border border-slate-600 rounded-md placeholder-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[100px] disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-2 px-5 rounded-md shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Thread'}
        </button>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </form>

      <h2 className="text-2xl font-semibold mb-4 text-amber-400">Active Threads</h2>
      {loading && <p className="text-gray-400 italic">Loading threads...</p>}
      {!loading && threads.length === 0 && <p className="text-gray-400">No discussions started yet. Be the first!</p>}

      <ul className="space-y-4">
        {threads.map(thread => (
          <li key={thread._id} className="bg-slate-800 p-5 rounded-lg shadow-md hover:bg-slate-700 transition duration-200">
            <h3 className="text-xl font-semibold mb-2 text-amber-400">{thread.title}</h3>
            <p className="text-gray-300 mb-3">{thread.content.substring(0, 200)}{thread.content.length > 200 ? '...' : ''}</p>
            <div className="text-sm text-gray-500">
              Posted by <span className="font-medium text-gray-400">{thread.author}</span> on {new Date(thread.createdAt).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DiscussionPage; 