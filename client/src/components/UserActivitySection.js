import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserActivitySection = ({ userId, accentStyle, buttonStyle }) => {
  const [userActivity, setUserActivity] = useState({ favorites: [], ratings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    const fetchUserActivity = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userId}/activity`);
        setUserActivity(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setError('Failed to load user activity');
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivity();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: accentStyle.color }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded" role="alert">
        {error}
      </div>
    );
  }

  const hasFavorites = userActivity.favorites && userActivity.favorites.length > 0;
  const hasRatings = userActivity.ratings && userActivity.ratings.length > 0;
  
  if (!hasFavorites && !hasRatings) {
    return <p className="text-center py-4 opacity-70">No activity found from the main albums list yet.</p>;
  }

  return (
    <div className="bg-opacity-90 bg-slate-800 rounded-lg shadow-md p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4" style={accentStyle}>Club Activity</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-600 mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'favorites' ? 'border-b-2 -mb-px' : 'text-gray-400 hover:text-gray-300'}`}
          style={activeTab === 'favorites' ? {borderColor: accentStyle.color} : {}}
          onClick={() => setActiveTab('favorites')}
          disabled={!hasFavorites}
        >
          Favorites{hasFavorites ? ` (${userActivity.favorites.length})` : ''}
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'ratings' ? 'border-b-2 -mb-px' : 'text-gray-400 hover:text-gray-300'}`}
          style={activeTab === 'ratings' ? {borderColor: accentStyle.color} : {}}
          onClick={() => setActiveTab('ratings')}
          disabled={!hasRatings}
        >
          Ratings{hasRatings ? ` (${userActivity.ratings.length})` : ''}
        </button>
      </div>
      
      {/* Favorites Tab Content */}
      {activeTab === 'favorites' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userActivity.favorites.map(album => (
            <div key={album._id} className="bg-slate-700 bg-opacity-60 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex">
                <img 
                  src={album.coverArtUrl} 
                  alt={album.title} 
                  className="w-20 h-20 object-cover" 
                  onError={(e) => {e.target.src = 'https://via.placeholder.com/80?text=No+Image'}}
                />
                <div className="p-3 flex-grow">
                  <h4 className="font-medium text-sm truncate" title={album.title}>{album.title}</h4>
                  <p className="text-xs text-gray-400 truncate" title={album.artist}>{album.artist}</p>
                  <Link 
                    to={`/`} 
                    className="text-xs inline-block mt-2 hover:underline"
                    style={accentStyle}
                  >
                    View on club feed
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Ratings Tab Content */}
      {activeTab === 'ratings' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userActivity.ratings.map(rating => (
            <div key={rating._id} className="bg-slate-700 bg-opacity-60 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex">
                <img 
                  src={rating.album.coverArtUrl} 
                  alt={rating.album.title} 
                  className="w-20 h-20 object-cover" 
                  onError={(e) => {e.target.src = 'https://via.placeholder.com/80?text=No+Image'}}
                />
                <div className="p-3 flex-grow">
                  <h4 className="font-medium text-sm truncate" title={rating.album.title}>{rating.album.title}</h4>
                  <p className="text-xs text-gray-400 truncate" title={rating.album.artist}>{rating.album.artist}</p>
                  <div className="mt-1 flex items-center">
                    <span className="text-amber-400 font-bold text-sm">{rating.score.toFixed(1)}</span>
                    <span className="text-xs text-gray-400 ml-1">/10</span>
                  </div>
                  <Link 
                    to={`/`} 
                    className="text-xs inline-block mt-1 hover:underline"
                    style={accentStyle}
                  >
                    View on club feed
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserActivitySection; 