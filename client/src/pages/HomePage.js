import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlbumCard from '../components/AlbumCard';

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

  // Add state for active users
  const [activeUsers, setActiveUsers] = useState([]);

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

  // Refactor fetching saved albums into a separate function using useCallback
  const fetchSavedAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/albums`, {
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
  }, [sortOption, setAlbums, setLoading, setError]);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    try {
      // Get all unique users who have rated or commented on albums
      const userMap = new Map();
      
      if (albums && albums.length > 0) {
        // Collect users from scores
        albums.forEach(album => {
          if (album.scores && album.scores.length > 0) {
            album.scores.forEach(score => {
              if (score.userId && score.userId._id && score.userId.username) {
                userMap.set(score.userId._id, {
                  _id: score.userId._id,
                  username: score.userId.username,
                  activity: (userMap.get(score.userId._id)?.activity || 0) + 1
                });
              }
            });
          }
          
          // Also collect users from comments
          if (album.comments && album.comments.length > 0) {
            album.comments.forEach(comment => {
              if (comment.author && comment.author._id && comment.author.username) {
                const userId = comment.author._id;
                userMap.set(userId, {
                  _id: userId,
                  username: comment.author.username,
                  activity: (userMap.get(userId)?.activity || 0) + 1
                });
              }
            });
          }
        });
        
        // Convert Map to array and sort by activity (most active first)
        const usersArray = Array.from(userMap.values());
        usersArray.sort((a, b) => b.activity - a.activity);
        
        // Take top 8 most active users
        setActiveUsers(usersArray.slice(0, 8));
      }
    } catch (err) {
      console.error('Error processing active users:', err);
    }
  }, [albums]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchSavedAlbums();
  }, [fetchSavedAlbums]);

  // Update active users when albums change
  useEffect(() => {
    if (albums.length > 0) {
      fetchActiveUsers();
    }
  }, [albums, fetchActiveUsers]);

  // Create search handler function
  const handleSearch = async (event) => {
    event.preventDefault();
    
    // Reset previous results/errors and set loading state
    setIsSearching(true);
    setSearchResults([]);
    setSearchError(null);
    
    try {
      // Make API call to backend search endpoint
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/spotify/search`, { 
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
      await axios.post(`${process.env.REACT_APP_API_URL}/api/albums`, newAlbumData);
      
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
        response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/albums/${albumId}/favorite`);
      } else {
        // Call Favorite API
        response = await axios.post(`${process.env.REACT_APP_API_URL}/api/albums/${albumId}/favorite`);
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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/albums/${albumId}/score`, { score });

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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/albums/${albumId}/comments`, { text });
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
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/albums/update-all-images`);
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

  // Handle album update from AlbumCard component
  const handleAlbumUpdate = (updatedAlbum) => {
    setAlbums(prevAlbums =>
      prevAlbums.map(a => (a._id === updatedAlbum._id ? updatedAlbum : a))
    );
  };

  return (
    <div className="home-page max-w-4xl mx-auto px-4">
      {/* Add Search UI Elements */}
      <div className="mb-8 bg-slate-800 p-5 rounded-lg shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
          Search Spotify
        </h2>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Spotify for an album..."
              className="bg-slate-900 text-gray-100 border border-slate-600 px-3 py-2 rounded-md placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 flex-grow"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Render Search Results */}
        {isSearching && <p>Searching...</p>}
        
        {searchError && <p className="text-red-400">{searchError}</p>}
        
        {!isSearching && !searchError && searchResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-amber-400">Search Results</h3>
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.map(result => (
                <div 
                  key={result.id} 
                  className="border border-slate-700 bg-slate-900 mb-2 p-3 flex items-center rounded-md shadow-sm hover:bg-slate-800 transition duration-200"
                >
                  <img 
                    src={result.imageUrl} 
                    alt={result.title} 
                    className="w-20 h-20 sm:w-24 sm:h-24 mr-3 object-cover rounded-md flex-shrink-0" 
                  />
                  <div className="flex-grow">
                    <div className="font-medium text-gray-100">{result.title}</div>
                    <div className="text-sm text-gray-400">{result.artists.join(', ')} ({result.releaseYear})</div>
                  </div>
                  {/* Only show Add button if user is admin */}
                  {isAuthenticated && user && user.role === 'admin' && (
                    <button 
                      onClick={() => handleAddAlbum(result)}
                      className="ml-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-gray-900 font-medium py-1.5 px-3.5 rounded-md text-sm flex-shrink-0 shadow-md transition duration-200"
                    >
                      Add to Club
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Active Users Section */}
      {activeUsers.length > 0 && (
        <div className="bg-slate-800 bg-opacity-80 rounded-lg shadow-lg p-5 mb-8">
          <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
            Active Members
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {activeUsers.map(user => (
              <Link 
                key={user._id} 
                to={`/profile/${user._id}`}
                className="flex flex-col items-center text-center transition-all hover:transform hover:scale-105 p-2 rounded-lg hover:bg-slate-700"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 flex items-center justify-center text-xl font-bold text-slate-900 mb-2 shadow-md">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-200 text-sm font-medium">{user.username}</span>
                <span className="text-xs text-amber-400 mt-1">{user.activity} {user.activity === 1 ? 'contribution' : 'contributions'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {loading ? (
        <p>Loading albums...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
            Uppsala Listeners Club Albums
          </h2>
          
          {/* Add Sort Dropdown UI */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <label htmlFor="sort-select" className="mr-3 text-gray-300">Sort by: </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="bg-slate-900 text-gray-100 border border-slate-600 px-3 py-2 rounded-md focus:outline-none focus:border-amber-500"
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
                <option value="club_score_desc">Club Score (High-Low)</option>
                <option value="club_score_asc">Club Score (Low-High)</option>
              </select>
            </div>
            
            {/* Admin tools - check for admin role */}
            {isAuthenticated && user && user.role === 'admin' && (
              <div className="ml-auto">
                <button
                  onClick={handleUpdateAllImages}
                  disabled={isUpdatingImages}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-3.5 rounded-md text-sm shadow-md transition duration-200"
                >
                  {isUpdatingImages ? 'Updating Images...' : 'Update Album Covers'}
                </button>
                {updateImageMessage && <p className="text-sm mt-1 text-gray-400">{updateImageMessage}</p>}
              </div>
            )}
          </div>
          
          {albums.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No albums found. Add your first album!</p>
          ) : (
            <ul className="list-none p-0">
              {albums.map(album => (
                <AlbumCard
                  key={album._id}
                  album={album}
                  userScoreInputs={userScoreInputs}
                  setUserScoreInputs={setUserScoreInputs}
                  setOpenTriviaId={setOpenTriviaId}
                  openTriviaId={openTriviaId}
                  handleToggleFavorite={handleToggleFavorite}
                  handleSubmitScore={handleSubmitScore}
                  handleSubmitComment={handleSubmitComment}
                  commentInputs={commentInputs}
                  setCommentInputs={setCommentInputs}
                  onAlbumUpdate={handleAlbumUpdate}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default HomePage; 