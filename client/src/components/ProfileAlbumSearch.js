import React, { useState } from 'react';
import axios from 'axios';

const ProfileAlbumSearch = ({ buttonStyle, accentStyle, onAlbumAdded, closeSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Handle search submission
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

  // Handle adding album to personal collection
  const handleAddAlbum = async (spotifyAlbum) => {
    try {
      // Prepare data for the API call
      const personalAlbumData = {
        title: spotifyAlbum.title,
        artist: spotifyAlbum.artists.join(', '), // Join artist names
        releaseYear: spotifyAlbum.releaseYear,
        coverArtUrl: spotifyAlbum.imageUrl,
        spotifyId: spotifyAlbum.id
      };
      
      // Make API call to add personal album
      const response = await axios.post('/api/personal-albums', personalAlbumData);
      
      // Notify parent component about new album
      if (onAlbumAdded) {
        onAlbumAdded(response.data);
      }
      
      // Clear search results and close search form
      setSearchResults([]);
      setSearchQuery('');
      
      // Optional: Close the search panel
      if (closeSearch) {
        closeSearch();
      }
    } catch (error) {
      console.error('Failed to add album:', error);
      alert('Error adding album to your collection. Please try again.');
    }
  };

  return (
    <div className="bg-opacity-95 bg-slate-700 rounded-lg shadow-lg p-6 mb-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4" style={accentStyle}>Search for albums</h3>
      
      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Spotify for an album..."
            className="bg-slate-800 text-gray-100 border border-slate-600 px-3 py-2 rounded-md placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 flex-grow"
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="py-2 px-4 rounded-md font-medium transition-colors hover:opacity-90"
            style={buttonStyle}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {/* Search results */}
      {isSearching && <p className="text-center py-4">Searching...</p>}
      
      {searchError && 
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded" role="alert">
          {searchError}
        </div>
      }
      
      {!isSearching && !searchError && searchResults.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-2" style={accentStyle}>Search Results</h4>
          <div className="max-h-[400px] overflow-y-auto">
            {searchResults.map(result => (
              <div 
                key={result.id} 
                className="border border-slate-600 bg-slate-800 mb-2 p-3 flex items-center rounded-md shadow-sm hover:bg-slate-700 transition duration-200"
              >
                <img 
                  src={result.imageUrl} 
                  alt={result.title} 
                  className="w-16 h-16 sm:w-20 sm:h-20 mr-3 object-cover rounded-md flex-shrink-0" 
                />
                <div className="flex-grow">
                  <div className="font-medium text-gray-100">{result.title}</div>
                  <div className="text-sm text-gray-400">{result.artists.join(', ')} ({result.releaseYear})</div>
                </div>
                <button 
                  onClick={() => handleAddAlbum(result)}
                  className="ml-auto rounded-md font-medium py-1.5 px-3.5 text-sm flex-shrink-0 shadow-md transition-colors hover:opacity-90"
                  style={buttonStyle}
                >
                  Add to Collection
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Close button */}
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={closeSearch}
          className="px-4 py-2 bg-slate-600 rounded-md font-medium transition-colors hover:bg-slate-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfileAlbumSearch; 