import React, { useState } from 'react';
import axios from 'axios';

const PersonalCommentForm = ({ personalAlbumId, onCommentAdded, buttonStyle, accentStyle }) => {
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`/api/personal-albums/${personalAlbumId}/comments`, {
        text: commentText
      });
      
      // Clear the input
      setCommentText('');
      
      // Notify parent component that a comment was added
      if (onCommentAdded) {
        onCommentAdded(response.data);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded mb-3" role="alert">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <label className="opacity-90 font-medium" htmlFor="comment-text">
            Add a comment
          </label>
          <textarea
            id="comment-text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts..."
            rows="2"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
            required
          />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-1.5 rounded-md font-medium text-sm transition-colors hover:opacity-90 disabled:opacity-50"
              style={buttonStyle}
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PersonalCommentForm; 