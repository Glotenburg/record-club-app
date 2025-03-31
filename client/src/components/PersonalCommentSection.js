import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PersonalCommentForm from './PersonalCommentForm';
import axios from 'axios';

const PersonalCommentSection = ({ personalAlbumId, buttonStyle, accentStyle }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/personal-albums/${personalAlbumId}/comments`);
      setComments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [personalAlbumId]);

  useEffect(() => {
    if (personalAlbumId) {
      fetchComments();
    }
  }, [personalAlbumId, fetchComments]);

  const handleCommentAdded = (newComment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-600">
      <h4 className="font-medium text-lg mb-3" style={accentStyle}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </h4>

      {/* Comment submission form for authenticated users */}
      {isAuthenticated ? (
        <PersonalCommentForm
          personalAlbumId={personalAlbumId}
          onCommentAdded={handleCommentAdded}
          buttonStyle={buttonStyle}
          accentStyle={accentStyle}
        />
      ) : (
        <div className="bg-slate-800 bg-opacity-70 p-3 rounded text-sm opacity-80 mb-4">
          Log in to add a comment
        </div>
      )}

      {/* Comments display */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2" style={{ borderColor: accentStyle.color }}></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded" role="alert">
          {error}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 opacity-70 text-sm">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-slate-800 bg-opacity-60 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium" style={accentStyle}>
                  {comment.author?._id ? (
                    <Link 
                      to={`/profile/${comment.author._id}`}
                      className="hover:underline transition-all duration-200 hover:opacity-80"
                    >
                      {comment.author.username || 'User'}
                    </Link>
                  ) : (
                    comment.author?.username || 'User'
                  )}
                </div>
                <div className="text-xs opacity-70">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalCommentSection; 