import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const AlbumCard = ({ 
  album, 
  userScoreInputs, 
  setUserScoreInputs, 
  setOpenTriviaId, 
  openTriviaId, 
  handleToggleFavorite, 
  handleSubmitScore, 
  handleSubmitComment,
  commentInputs,
  setCommentInputs,
  onAlbumUpdate 
}) => {
  const { user, isAuthenticated, token } = useContext(AuthContext);
  const [clubScoreInput, setClubScoreInput] = useState('');
  const [isUpdatingClubScore, setIsUpdatingClubScore] = useState(false);
  const [triviaInput, setTriviaInput] = useState(album.trivia || '');
  const [isEditingTrivia, setIsEditingTrivia] = useState(false);
  const [isUpdatingTrivia, setIsUpdatingTrivia] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate if this album is favorited by current user
  const isFavorited = isAuthenticated && user && album.favoritedBy && album.favoritedBy.includes(user.id);
                
  // Find user's existing score
  const userExistingScore = isAuthenticated ? album.scores.find(s => s.userId?._id === user?.id) : null;

  // Handle setting club score (admin only)
  const handleSetClubScore = async () => {
    if (!user || user.role !== 'admin') return;
    if (!token) return;
    
    const albumId = album._id;
    const scoreValue = parseFloat(clubScoreInput);
    
    // Validate Score
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
      alert('Invalid score. Please enter a number between 0.0 and 10.0.');
      return;
    }
    
    setIsUpdatingClubScore(true);
    
    try {
      // Call Backend API to update club score
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/albums/${albumId}/clubscore`, 
        { clubScore: scoreValue },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Club score updated:', response.data);
      
      // Update album in parent component
      if (onAlbumUpdate) {
        onAlbumUpdate(response.data);
      }
      
      setClubScoreInput('');
      setIsUpdatingClubScore(false);
      alert('Club score updated successfully!');
    } catch (err) {
      console.error('Error updating club score:', err.response ? err.response.data : err.message);
      alert('Failed to update club score. Please try again.');
      setIsUpdatingClubScore(false);
    }
  };

  // Handle updating album trivia (admin only)
  const handleUpdateTrivia = async () => {
    if (!user || user.role !== 'admin') return;
    if (!token) return;
    
    setIsUpdatingTrivia(true);
    
    try {
      // Call Backend API to update trivia
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/albums/${album._id}`, 
        { trivia: triviaInput },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Trivia updated:', response.data);
      
      // Update album in parent component
      if (onAlbumUpdate) {
        onAlbumUpdate(response.data);
      }
      
      setIsEditingTrivia(false);
      setIsUpdatingTrivia(false);

      // Open trivia view if there's content, close it if trivia was deleted
      if (triviaInput) {
        setOpenTriviaId(album._id);
      } else if (openTriviaId === album._id) {
        setOpenTriviaId(null);
      }
    } catch (err) {
      console.error('Error updating trivia:', err.response ? err.response.data : err.message);
      alert('Failed to update trivia. Please try again.');
      setIsUpdatingTrivia(false);
    }
  };

  // Begin trivia editing
  const startEditingTrivia = () => {
    setTriviaInput(album.trivia || '');
    setIsEditingTrivia(true);
  };

  // Cancel trivia editing
  const cancelEditingTrivia = () => {
    setTriviaInput(album.trivia || '');
    setIsEditingTrivia(false);
  };
  
  return (
    <li className="bg-slate-800 rounded-lg p-5 mb-5 shadow-lg border border-slate-700 hover:shadow-amber-900/10 transition-shadow duration-300">
      {/* --- Always Visible Section --- */}
      <div 
        className="flex flex-col sm:flex-row sm:items-start gap-5 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Cover Art */}
        {album.coverArtUrl && (
          <img
            src={album.coverArtUrl}
            alt={album.title}
            className="w-36 h-36 sm:w-48 sm:h-48 object-cover rounded-md flex-shrink-0 mx-auto sm:mx-0 shadow-md"
          />
        )}

        {/* Basic Info + Toggle Button */}
        <div className="flex-grow">
          {/* Title & Artist */}
           <div> 
               <h3 className="text-xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">{album.title}</h3>
               <p className="mb-1 text-gray-300"><strong className="text-gray-200">Artist:</strong> {album.artist}</p>
               {/* Display Club Score if available */}
                {album.clubOriginalScore !== null && album.clubOriginalScore !== undefined && (
                    <p className="mb-2 text-gray-300 flex items-center"><span className="text-yellow-400 mr-1 text-lg">⭐</span> <strong className="text-gray-200">Club Score:</strong> {album.clubOriginalScore.toFixed(1)}</p>
                )}
           </div>
          {/* Show More/Less Button - Stop propagation to prevent immediate re-toggle */}
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded); 
              }} 
              className="text-sm text-amber-400 mt-2 hover:text-amber-300 font-medium"
          >
              {isExpanded ? 'Show Less Details' : 'Show More Details'}
          </button>
        </div>
      </div>

      {/* --- Expandable Content Wrapper --- */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          {/* Detailed Info (moved from above) */}
          {album.releaseYear && <p className="mb-1 text-gray-300"><strong className="text-gray-200">Year:</strong> {album.releaseYear}</p>}
          {album.clubEntryNumber && <p className="mb-1 text-gray-300"><strong className="text-gray-200">Club Entry #:</strong> {album.clubEntryNumber}</p>}
          {album.genre && album.genre.length > 0 && (
            <p className="mb-2 text-gray-300"><strong className="text-gray-200">Genre:</strong> {album.genre.join(', ')}</p>
          )}

          {/* External Links (moved from above) */}
          <div className="flex space-x-4 mt-2 mb-3 text-sm">
            <a
              href={`http://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(album.artist + ' ' + album.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors duration-200"
            >
              Wikipedia
            </a>
            {album.spotifyId && (
              <a
                href={`http://open.spotify.com/album/${album.spotifyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition-colors duration-200"
              >
                Open on Spotify
              </a>
            )}
          </div>

          {/* Scores Section (moved from above) */}
          <div className="mt-4 p-4 bg-slate-900 rounded-md mb-4 max-w-prose border border-slate-700 shadow-sm">
            <h4 className="mt-0 mb-2 text-amber-400 font-medium">Scores</h4>
            <p className="mb-1 text-gray-300"><strong className="text-gray-200">Club Score:</strong> {album.clubOriginalScore !== null && album.clubOriginalScore !== undefined ? album.clubOriginalScore.toFixed(1) : 'Not set'}</p>
            <p className="mb-2 text-gray-300"><strong className="text-gray-200">Average User Score:</strong> {album.averageUserScore.toFixed(1)} ({album.scores.length} votes)</p>

            {/* Admin Controls for Club Score */}
            {user && user.role === 'admin' && (
              <div className="admin-controls mt-3 p-3 border border-amber-500 rounded-md bg-slate-800 shadow-inner">
                <label htmlFor={`clubScoreInput-${album._id}`} className="block mb-2 text-amber-400">Set Club Score: </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id={`clubScoreInput-${album._id}`}
                    min="0"
                    max="10"
                    step="0.1"
                    value={clubScoreInput}
                    onChange={(e) => setClubScoreInput(e.target.value)}
                    placeholder="0.0-10.0"
                    className="bg-slate-900 text-gray-100 border border-slate-600 px-2 py-1 rounded-md focus:outline-none focus:border-amber-500 w-24"
                  />
                  <button
                    onClick={handleSetClubScore}
                    disabled={isUpdatingClubScore}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1 px-3 rounded-md text-sm shadow-md transition duration-200"
                  >
                    {isUpdatingClubScore ? 'Updating...' : 'Set Score'}
                  </button>
                </div>
              </div>
            )}

            {/* Individual Scores */}
            {album.scores && album.scores.length > 0 && (
              <div className="mb-2 mt-3 border-t border-slate-700 pt-3">
                <h6 className="mb-2 text-gray-200 font-medium">Individual Scores:</h6>
                <ul className="list-none p-0 m-0 grid grid-cols-2 gap-1">
                  {album.scores.map(scoreEntry => (
                    <li key={scoreEntry._id} className="text-sm text-gray-400">
                      {scoreEntry.userId?._id ? (
                        <Link to={`/profile/${scoreEntry.userId._id}`} className="text-amber-400 hover:text-amber-300 hover:underline transition-colors">
                          {scoreEntry.userId.username || 'User'}
                        </Link>
                      ) : (
                        <span className="text-amber-400">{scoreEntry.userId?.username || 'User'}</span>
                      )}: {scoreEntry.score.toFixed(1)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* User's Score Input */}
            {isAuthenticated && (
              <div className="mt-3 border-t border-slate-700 pt-3">
                {userExistingScore && (
                  <p className="mb-2 text-gray-300"><strong className="text-gray-200">Your Score:</strong> {userExistingScore.score.toFixed(1)}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor={`score-${album._id}`} className="text-gray-200">Your Rating (0.0-10.0): </label>
                  <input
                    type="number"
                    id={`score-${album._id}`}
                    min="0"
                    max="10"
                    step="0.1"
                    value={userScoreInputs[album._id] || ''}
                    onChange={e => setUserScoreInputs(prev => ({ ...prev, [album._id]: e.target.value }))}
                    placeholder={userExistingScore ? "Update score" : "Rate it!"}
                    className="bg-slate-900 text-gray-100 border border-slate-600 px-2 py-1 rounded-md focus:outline-none focus:border-amber-500 w-20 mr-2"
                  />
                  <button
                    onClick={() => handleSubmitScore(album._id)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-3 rounded-md text-sm shadow-md transition duration-200"
                  >
                    {userExistingScore ? 'Update Score' : 'Submit Score'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Favorites count and button (moved from above) */}
          <div className="mb-4 flex items-center">
            <span className="mr-4 text-gray-400">
              {album.favoritedBy ? album.favoritedBy.length : 0}
              {album.favoritedBy && album.favoritedBy.length === 1 ? ' favorite' : ' favorites'}
            </span>
            <button
              onClick={() => handleToggleFavorite(album._id, isFavorited)}
              disabled={!isAuthenticated}
              className={`py-1.5 px-3.5 rounded-md mr-3 shadow-sm transition-colors duration-200 ${isFavorited ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
            >
              {isFavorited ? '♥ Unfavorite' : '♡ Favorite'}
            </button>
          </div>

          {/* Trivia Section with Admin Controls (moved from above) */}
          <div className="mb-3">
            {/* Trivia Actions */}
            <div className="flex gap-2 mb-2">
              {/* Show/Hide Trivia button for all users */}
              {album.trivia && !isEditingTrivia && (
                <button
                  onClick={() => setOpenTriviaId(openTriviaId === album._id ? null : album._id)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
                >
                  {openTriviaId === album._id ? 'Hide Trivia' : 'Show Trivia'}
                </button>
              )}

              {/* Admin Edit Trivia Button */}
              {user && user.role === 'admin' && !isEditingTrivia && (
                <button
                  onClick={startEditingTrivia}
                  className="bg-slate-700 hover:bg-slate-600 text-amber-400 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
                >
                  {album.trivia ? 'Edit Trivia' : 'Add Trivia'}
                </button>
              )}
            </div>

            {/* Trivia Editor (Admin Only) */}
            {user && user.role === 'admin' && isEditingTrivia && (
              <div className="mb-3 p-4 bg-slate-900 rounded-md border border-amber-500">
                <label htmlFor={`trivia-${album._id}`} className="block mb-2 font-medium text-amber-400">
                  Edit Album Trivia:
                </label>
                <textarea
                  id={`trivia-${album._id}`}
                  rows="4"
                  value={triviaInput}
                  onChange={(e) => setTriviaInput(e.target.value)}
                  className="bg-slate-800 text-gray-100 border border-slate-600 w-full block mb-2 p-2 rounded-md placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  placeholder="Enter interesting facts about this album..."
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdateTrivia}
                    disabled={isUpdatingTrivia}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
                  >
                    {isUpdatingTrivia ? 'Saving...' : 'Save Trivia'}
                  </button>
                  <button
                    onClick={cancelEditingTrivia}
                    disabled={isUpdatingTrivia}
                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
                  >
                    Cancel
                  </button>
                  {album.trivia && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this trivia?')) {
                          setTriviaInput('');
                          handleUpdateTrivia();
                        }
                      }}
                      disabled={isUpdatingTrivia}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-1.5 px-3.5 rounded-md text-sm ml-auto shadow-md transition duration-200"
                    >
                      Delete Trivia
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Display Trivia Content (for all users) */}
            {!isEditingTrivia && openTriviaId === album._id && album.trivia && (
              <div className="mb-3 p-4 bg-slate-900 rounded-md border border-slate-700">
                <h5 className="font-medium mb-2 text-amber-400">Trivia</h5>
                <p className="text-gray-300">{album.trivia}</p>
              </div>
            )}
          </div>

          {/* Comments Section (moved from above) */}
          <div className="mt-5 border-t border-slate-700 pt-4 mb-4 max-w-prose">
            <h5 className="mb-3 text-lg text-amber-400">Comments ({album.comments ? album.comments.length : 0})</h5>
            {album.comments && album.comments.length > 0 ? (
              <ul className="list-none p-0 space-y-3">
                {album.comments.map(comment => (
                  <li key={comment._id} className="mb-2 border-b border-dashed border-slate-700 pb-2">
                    <strong className="text-pink-500">{comment.userId?.username || 'User'}</strong> <span className="text-gray-500 text-xs">({new Date(comment.createdAt).toLocaleString()})</span>
                    <p className="m-1 ml-3 text-gray-300">{comment.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>

          {/* Spotify Player (moved from above) */}
          {album.spotifyId && (
            <div className="mt-4 mb-4">
              <iframe
                style={{ borderRadius: '12px' }}
                src={`https://open.spotify.com/embed/album/${album.spotifyId}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                allowFullScreen=""
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={`${album.title} Spotify Embed`}
                frameBorder="0"
              ></iframe>
            </div>
          )}

          {/* Add Comment Form (Only for logged-in users) (moved from above) */}
          {isAuthenticated && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <textarea
                rows="2"
                value={commentInputs[album._id] || ''}
                onChange={e => setCommentInputs(prev => ({ ...prev, [album._id]: e.target.value }))}
                placeholder="Add a comment..."
                className="bg-slate-900 text-gray-100 border border-slate-600 w-[90%] block mb-3 p-2 rounded-md placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => handleSubmitComment(album._id)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
              >
                Post Comment
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default AlbumCard; 