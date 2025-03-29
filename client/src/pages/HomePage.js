import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function HomePage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add new state variables for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  // Add state for trivia toggling
  const [openTriviaId, setOpenTriviaId] = useState(null);
  
  // Add state for sorting
  const [sortOption, setSortOption] = useState('added_asc');

  // Add state for score inputs
  const [userScoreInputs, setUserScoreInputs] = useState({});

  // Add state for comment inputs
  const [commentInputs, setCommentInputs] = useState({});

  // Add state for updating images
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [updateImageMessage, setUpdateImageMessage] = useState(null);

  // Get auth context
  const { logout, isAuthenticated, user } = useContext(AuthContext);

  // Create axios instance with error interceptor for auth issues
  useEffect(() => {
    // Add a response interceptor to handle authentication errors
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Token is invalid or expired, log out the user
          alert('Your session has expired. Please log in again.');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  // Refactor fetching saved albums into a separate function
  const fetchSavedAlbums = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/albums', {
        params: { sort: sortOption } // Pass the current sortOption as query parameter
      });
      setAlbums(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching albums:', err);
      setError('Failed to fetch albums');
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchSavedAlbums();
  }, []);
  
  // Re-fetch when sort option changes
  useEffect(() => {
    fetchSavedAlbums();
  }, [sortOption]);

  // Create search handler function
  const handleSearch = async (event) => {
    event.preventDefault();
    
    // Reset previous results/errors and set loading state
    setIsSearching(true);
    setSearchResults([]);
    setSearchError(null);
    
    try {
      // Make API call to backend search endpoint
      const response = await axios.get('/api/spotify/search', { 
        params: { q: searchQuery } 
      });
      
      // Handle success: update searchResults state
      setSearchResults(response.data);
    } catch (error) {
      // Handle error
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      // Set isSearching back to false whether request succeeded or failed
      setIsSearching(false);
    }
  };

  // Create handleAddAlbum function
  const handleAddAlbum = async (spotifyAlbum) => {
    // Prepare data for the API call
    const newAlbumData = {
      title: spotifyAlbum.title,
      artist: spotifyAlbum.artists.join(', '), // Join artist names
      releaseYear: spotifyAlbum.releaseYear,
      coverArtUrl: spotifyAlbum.imageUrl,
      spotifyId: spotifyAlbum.id,
      genre: [], // Spotify search doesn't easily provide genre
    };

    try {
      // Make API call to add the album
      await axios.post('/api/albums', newAlbumData);
      
      // On success: Re-fetch saved albums to update the UI
      fetchSavedAlbums();
      
      // Optional: Show success message
      alert('Album added successfully!');
    } catch (error) {
      console.error('Failed to add album:', error);
      alert('Error adding album. It might already be in the club.');
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async (albumId, isCurrentlyFavorited) => {
    if (!isAuthenticated) {
      alert('Please log in to favorite albums.');
      return;
    }
    try {
      let response;
      if (isCurrentlyFavorited) {
        // Call Unfavorite API
        response = await axios.delete(`/api/albums/${albumId}/favorite`);
      } else {
        // Call Favorite API
        response = await axios.post(`/api/albums/${albumId}/favorite`);
      }

      // Update local state immediately for better UX
      const updatedAlbum = response.data;
      setAlbums(prevAlbums =>
        prevAlbums.map(a => (a._id === albumId ? updatedAlbum : a))
      );

    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  // Handle submitting a score
  const handleSubmitScore = async (albumId) => {
    if (!isAuthenticated) {
      alert('Please log in to submit a score.');
      return;
    }
    const scoreInput = userScoreInputs[albumId];
    const score = parseFloat(scoreInput);

    // Validate Score
    if (isNaN(score) || score < 0 || score > 10) {
      alert('Invalid score. Please enter a number between 0.0 and 10.0.');
      return;
    }

    try {
      // Call Backend API
      const response = await axios.post(`/api/albums/${albumId}/score`, { score });

      // Update local state immediately with the updated album from backend
      const updatedAlbum = response.data;
      setAlbums(prevAlbums =>
        prevAlbums.map(a => (a._id === albumId ? updatedAlbum : a))
      );
      // Clear the input for this album after successful submission
      setUserScoreInputs(prev => ({ ...prev, [albumId]: '' }));

    } catch (err) {
      console.error('Failed to submit score:', err);
      alert('Failed to submit score. Please try again.');
    }
  };

  // Handle submitting a comment
  const handleSubmitComment = async (albumId) => {
    if (!isAuthenticated) {
      alert('Please log in to comment.');
      return;
    }
    const text = commentInputs[albumId];

    if (!text || text.trim() === '') {
      alert('Comment cannot be empty.');
      return;
    }

    try {
      // Call Backend API to POST comment
      const response = await axios.post(`/api/albums/${albumId}/comments`, { text });
      const newPopulatedComment = response.data; // Backend should return the new comment with user populated

      // Update local state immediately
      setAlbums(prevAlbums =>
        prevAlbums.map(a =>
          a._id === albumId
            ? { ...a, comments: [newPopulatedComment, ...a.comments] } // Add new comment to the start of the array
            : a
        )
      );
      // Clear the input for this album
      setCommentInputs(prev => ({ ...prev, [albumId]: '' }));

    } catch (err) {
      console.error('Failed to submit comment:', err);
      alert('Failed to submit comment. Please try again.');
    }
  };

  // Handle updating all album cover images
  const handleUpdateAllImages = async () => {
    setIsUpdatingImages(true);
    setUpdateImageMessage(null);
    
    try {
      const response = await axios.put('/api/albums/update-all-images');
      setUpdateImageMessage(`Success: ${response.data.message}`);
      
      // Refresh albums to show updated images
      fetchSavedAlbums();
    } catch (err) {
      console.error('Failed to update album images:', err);
      setUpdateImageMessage('Error: Failed to update album images');
    } finally {
      setIsUpdatingImages(false);
    }
  };

  return (
    <div className="home-page max-w-4xl mx-auto px-4">
      {/* Add Search UI Elements */}
      <div className="mb-8 bg-slate-800 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-3">Search Spotify</h2>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Spotify for an album..."
              className="bg-rose-900 text-slate-100 border border-amber-600 px-3 py-2 rounded placeholder-slate-400 focus:outline-none focus:border-amber-400 flex-grow"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-2 px-4 rounded"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Render Search Results */}
        {isSearching && <p>Searching...</p>}
        
        {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
        
        {!isSearching && !searchError && searchResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Search Results</h3>
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.map(result => (
                <div 
                  key={result.id} 
                  className="border border-slate-700 bg-slate-700 mb-2 p-3 flex items-center rounded shadow-sm hover:bg-slate-600 transition duration-200"
                >
                  <img 
                    src={result.imageUrl} 
                    alt={result.title} 
                    className="w-20 h-20 sm:w-24 sm:h-24 mr-3 object-cover rounded flex-shrink-0" 
                  />
                  <div className="flex-grow">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-slate-300">{result.artists.join(', ')} ({result.releaseYear})</div>
                  </div>
                  <button 
                    onClick={() => handleAddAlbum(result)}
                    className="ml-auto bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1.5 px-3.5 rounded text-sm flex-shrink-0"
                  >
                    Add to Club
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <p>Loading albums...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Record Club Albums</h2>
          
          {/* Add Sort Dropdown UI */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <label htmlFor="sort-select" className="mr-3">Sort by: </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="bg-rose-900 text-slate-100 border border-amber-600 px-3 py-2 rounded focus:outline-none focus:border-amber-400"
              >
                <option value="added_asc">Entry Number (Oldest First)</option>
                <option value="added_desc">Entry Number (Newest First)</option>
                <option value="date_added_asc">Date Added (Oldest First)</option>
                <option value="date_added_desc">Date Added (Newest First)</option>
                <option value="artist_asc">Artist (A-Z)</option>
                <option value="artist_desc">Artist (Z-A)</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="year_asc">Release Year (Oldest First)</option>
                <option value="year_desc">Release Year (Newest First)</option>
              </select>
            </div>
            
            {/* Admin tools - could add isAdmin check here in a full app */}
            {isAuthenticated && (
              <div className="ml-auto">
                <button
                  onClick={handleUpdateAllImages}
                  disabled={isUpdatingImages}
                  className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1.5 px-3.5 rounded text-sm"
                >
                  {isUpdatingImages ? 'Updating Images...' : 'Update Album Covers'}
                </button>
                {updateImageMessage && <p className="text-sm mt-1">{updateImageMessage}</p>}
              </div>
            )}
          </div>
          
          {albums.length === 0 ? (
            <p>No albums found. Add your first album!</p>
          ) : (
            <ul className="list-none p-0">
              {albums.map(album => {
                // Calculate if this album is favorited by current user
                const isFavorited = isAuthenticated && user && album.favoritedBy && album.favoritedBy.includes(user.id);
                
                // Find user's existing score
                const userExistingScore = isAuthenticated ? album.scores.find(s => s.userId?._id === user?.id) : null;
                
                return (
                  <li key={album._id} className="bg-slate-800 rounded-lg p-4 mb-5 shadow-md flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* Display Cover Art */}
                    {album.coverArtUrl && (
                      <img 
                        src={album.coverArtUrl} 
                        alt={album.title} 
                        className="w-36 h-36 sm:w-48 sm:h-48 object-cover rounded flex-shrink-0 mx-auto sm:mx-0" 
                      />
                    )}
                    
                    {/* Album Info */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold mb-2">{album.title}</h3>
                      <p className="mb-1"><strong>Artist:</strong> {album.artist}</p>
                      {album.releaseYear && <p className="mb-1"><strong>Year:</strong> {album.releaseYear}</p>}
                      {album.clubEntryNumber && <p className="mb-1"><strong>Club Entry #:</strong> {album.clubEntryNumber}</p>}
                      {album.genre && album.genre.length > 0 && (
                        <p className="mb-2"><strong>Genre:</strong> {album.genre.join(', ')}</p>
                      )}
                      
                      {/* External Links */}
                      <div className="flex space-x-4 mt-2 mb-3 text-sm">
                        <a
                          href={`http://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(album.artist + ' ' + album.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300"
                        >
                          Wikipedia
                        </a>
                        {album.spotifyId && (
                          <a
                            href={`http://open.spotify.com/album/${album.spotifyId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 hover:text-green-400"
                          >
                            Open on Spotify
                          </a>
                        )}
                      </div>
                      
                      {/* Scores Section */}
                      <div className="mt-4 p-3 bg-slate-700 rounded mb-4 max-w-prose">
                        <h4 className="mt-0 mb-2">Scores</h4>
                        <p className="mb-1"><strong>Club Score:</strong> {album.clubOriginalScore !== null && album.clubOriginalScore !== undefined ? album.clubOriginalScore.toFixed(1) : 'Not set'}</p>
                        <p className="mb-2"><strong>Average User Score:</strong> {album.averageUserScore.toFixed(1)} ({album.scores.length} votes)</p>
                        
                        {/* Individual Scores */}
                        {album.scores && album.scores.length > 0 && (
                          <div className="mb-2">
                            <h6 className="mb-1">Individual Scores:</h6>
                            <ul className="list-none p-0 m-0">
                              {album.scores.map(scoreEntry => (
                                <li key={scoreEntry._id} className="text-sm">
                                  {scoreEntry.userId?.username || 'User'}: {scoreEntry.score.toFixed(1)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* User's Score Input */}
                        {isAuthenticated && (
                          <div className="mt-3">
                            {userExistingScore && (
                              <p className="mb-1"><strong>Your Score:</strong> {userExistingScore.score.toFixed(1)}</p>
                            )}
                            <div className="flex items-center gap-3">
                              <label htmlFor={`score-${album._id}`}>Your Rating (0.0-10.0): </label>
                              <input
                                type="number"
                                id={`score-${album._id}`}
                                min="0"
                                max="10"
                                step="0.1"
                                value={userScoreInputs[album._id] || ''}
                                onChange={e => setUserScoreInputs(prev => ({ ...prev, [album._id]: e.target.value }))}
                                placeholder={userExistingScore ? "Update score" : "Rate it!"}
                                className="bg-rose-900 text-slate-100 border border-amber-600 px-2 py-1 rounded focus:outline-none focus:border-amber-400 mr-2"
                              />
                              <button 
                                onClick={() => handleSubmitScore(album._id)}
                                className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1.5 px-3 rounded text-sm"
                              >
                                {userExistingScore ? 'Update Score' : 'Submit Score'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Favorites count and button */}
                      <div className="mb-4 flex items-center">
                        <span className="mr-4">
                          {album.favoritedBy ? album.favoritedBy.length : 0} 
                          {album.favoritedBy && album.favoritedBy.length === 1 ? ' favorite' : ' favorites'}
                        </span>
                        <button
                          onClick={() => handleToggleFavorite(album._id, isFavorited)}
                          disabled={!isAuthenticated}
                          className={`py-1.5 px-3.5 rounded mr-3 ${isFavorited ? 'bg-rose-600 text-white' : 'bg-slate-600 text-slate-200'} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {isFavorited ? '♥ Unfavorite' : '♡ Favorite'}
                        </button>
                      </div>
                      
                      {/* Trivia Toggle Button */}
                      {album.trivia && (
                        <button 
                          onClick={() => setOpenTriviaId(openTriviaId === album._id ? null : album._id)}
                          className="mb-3 bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1.5 px-3.5 rounded text-sm"
                        >
                          {openTriviaId === album._id ? 'Hide Trivia' : 'Show Trivia'}
                        </button>
                      )}
                      
                      {/* Conditionally Display Trivia */}
                      {openTriviaId === album._id && (
                        <p className="mb-3 p-3 bg-slate-700 rounded">
                          <strong>Trivia:</strong> {album.trivia}
                        </p>
                      )}
                      
                      {/* Comments Section */}
                      <div className="mt-5 border-t border-slate-600 pt-4 mb-4 max-w-prose">
                        <h5 className="mb-3 text-lg">Comments ({album.comments ? album.comments.length : 0})</h5>
                        {album.comments && album.comments.length > 0 ? (
                          <ul className="list-none p-0">
                            {album.comments.map(comment => (
                              <li key={comment._id} className="mb-2 border-b border-dashed border-slate-600 pb-1">
                                <strong>{comment.userId?.username || 'User'}</strong> ({new Date(comment.createdAt).toLocaleString()}):
                                <p className="m-1 ml-3">{comment.text}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No comments yet.</p>
                        )}
                      </div>
                      
                      {/* Spotify Player */}
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
                      
                      {/* Add Comment Form (Only for logged-in users) */}
                      {isAuthenticated && (
                        <div className="mt-3">
                          <textarea
                            rows="2"
                            value={commentInputs[album._id] || ''}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [album._id]: e.target.value }))}
                            placeholder="Add a comment..."
                            className="bg-rose-900 text-slate-100 border border-amber-600 w-[90%] block mb-2 p-2 rounded placeholder-slate-400 focus:outline-none focus:border-amber-400"
                          />
                          <button 
                            onClick={() => handleSubmitComment(album._id)}
                            className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1.5 px-3.5 rounded text-sm"
                          >
                            Post Comment
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage; 