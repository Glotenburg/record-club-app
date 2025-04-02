import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PersonalCommentSection from './PersonalCommentSection';

const PersonalAlbumDisplay = ({ personalAlbum, accentStyle, isOwner, onAlbumUpdated, onAlbumDeleted }) => {
  const { _id, title, artist, releaseYear, coverArtUrl, userRating, notes } = personalAlbum;
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRating, setEditedRating] = useState(userRating || '');
  const [editedNotes, setEditedNotes] = useState(notes || '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    setEditedRating(userRating || '');
    setEditedNotes(notes || '');
    setIsEditing(false);
    setEditLoading(false);
    setEditError(null);
  }, [personalAlbum, userRating, notes]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${title}" by ${artist}?`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await axios.delete(`/api/personal-albums/${_id}`);
      if (onAlbumDeleted) {
        onAlbumDeleted(_id);
      }
    } catch (err) {
      console.error('Error deleting album:', err);
      setDeleteError('Failed to delete album. Please try again.');
      setIsDeleting(false);
    }
  };

  const toggleExpanded = () => {
    if (isEditing) {
      handleCancelEdit();
    }
    setIsExpanded(!isExpanded);
  };

  const handleStartEdit = () => {
    setEditedRating(userRating || '');
    setEditedNotes(notes || '');
    setIsEditing(true);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLoading(false);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError(null);

    const ratingValue = editedRating === '' ? null : Number(editedRating);

    if (ratingValue !== null && (ratingValue < 0 || ratingValue > 10)) {
        setEditError('Rating must be between 0 and 10.');
        setEditLoading(false);
        return;
    }

    try {
      const response = await axios.put(`/api/personal-albums/${_id}`, {
        userRating: ratingValue,
        notes: editedNotes
      });
      if (onAlbumUpdated) {
        onAlbumUpdated(response.data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating album:', err);
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setEditLoading(false);
    }
  };

  const buttonStyle = {
    backgroundColor: accentStyle.color || '#f6ad55',
    color: '#1a202c'
  };

  return (
    <div className="bg-opacity-80 bg-slate-700 rounded-lg overflow-hidden shadow-md h-full flex flex-col transition-all duration-300 hover:shadow-xl">
      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm" role="alert">
          {deleteError}
        </div>
      )}
      
      <div className="relative">
        {coverArtUrl ? (
          <img 
            src={coverArtUrl} 
            alt={`${title} by ${artist}`} 
            className="w-full h-48 object-cover cursor-pointer"
            onClick={toggleExpanded}
          />
        ) : (
          <div className="w-full h-48 bg-slate-600 flex items-center justify-center cursor-pointer" onClick={toggleExpanded}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-40" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}
        {userRating && (
          <div 
            className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full px-2 py-1 text-sm font-bold flex items-center"
            style={{color: accentStyle.color || '#f6ad55'}}
          >
            {userRating}/10
          </div>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        {isEditing ? (
          <div className="mb-4 space-y-3 animate-fadeIn">
            {editError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded" role="alert">
                {editError}
              </div>
            )}
            <div>
              <label htmlFor={`rating-${_id}`} className="block text-sm font-medium opacity-80 mb-1">Rating (0-10):</label>
              <input
                type="number"
                id={`rating-${_id}`}
                min="0"
                max="10"
                step="1"
                value={editedRating}
                onChange={(e) => setEditedRating(e.target.value)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-opacity-50"
                style={{ borderColor: accentStyle.color }}
              />
            </div>
            <div>
              <label htmlFor={`notes-${_id}`} className="block text-sm font-medium opacity-80 mb-1">Notes:</label>
              <textarea
                id={`notes-${_id}`}
                rows="3"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-opacity-50"
                style={{ borderColor: accentStyle.color }}
              />
            </div>
             <div className="flex justify-end space-x-2 mt-2">
               <button
                 onClick={handleCancelEdit}
                 className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleSaveEdit}
                 disabled={editLoading}
                 className="text-xs px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
                 style={buttonStyle}
               >
                 {editLoading ? 'Saving...' : 'Save'}
               </button>
             </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-1" style={accentStyle}>{title}</h3>
                <p className="mb-1">{artist}</p>
                {releaseYear && <p className="opacity-70 text-sm mb-2">({releaseYear})</p>}
              </div>
              <button
                onClick={toggleExpanded}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-600 transition-colors"
                aria-label={isExpanded ? "Hide details" : "Show details"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-3 border-t border-slate-600 animate-fadeIn">
                {notes && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium opacity-80 mb-1">Notes:</h4>
                    <p className="text-sm italic opacity-80">{notes}</p>
                  </div>
                )}
                
                <PersonalCommentSection 
                  personalAlbumId={_id}
                  buttonStyle={buttonStyle}
                  accentStyle={accentStyle}
                />
              </div>
            )}
          </>
        )}
        
        <div className="mt-auto">
          {isOwner && !isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleStartEdit}
                className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-md disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalAlbumDisplay; 