import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PersonalAlbumDisplay from '../components/PersonalAlbumDisplay';
import ProfileAlbumSearch from '../components/ProfileAlbumSearch';
import ProfileCustomizationForm from '../components/ProfileCustomizationForm';
import UserActivitySection from '../components/UserActivitySection';
import axios from 'axios';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [personalAlbums, setPersonalAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState(null);
  const [showCustomizeForm, setShowCustomizeForm] = useState(false);
  
  // Check if profile belongs to current user
  const isOwnProfile = currentUser && currentUser._id === userId;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/profiles/${userId}`);
        setProfileData(response.data.user);
        setPersonalAlbums(response.data.personalAlbums);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
      // Clear form states when changing profiles
      setShowAddForm(false);
      setAlbumToEdit(null);
      setShowCustomizeForm(false);
    }
  }, [userId]);

  const handleAddAlbum = (newAlbum) => {
    setPersonalAlbums(prevAlbums => [newAlbum, ...prevAlbums]);
    setShowAddForm(false); // Auto-close form after successful add
  };

  const handleDeleteAlbum = (albumId) => {
    setPersonalAlbums(prevAlbums => 
      prevAlbums.filter(album => album._id !== albumId)
    );
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    // Close edit form if open
    if (albumToEdit) setAlbumToEdit(null);
    // Close customize form if open
    if (showCustomizeForm) setShowCustomizeForm(false);
  };

  const toggleCustomizeForm = () => {
    setShowCustomizeForm(!showCustomizeForm);
    // Close add form if open
    if (showAddForm) setShowAddForm(false);
    // Close edit form if open
    if (albumToEdit) setAlbumToEdit(null);
  };

  const startEditingAlbum = (album) => {
    setAlbumToEdit(album);
    setShowAddForm(false); // Close add form if open
    setShowCustomizeForm(false); // Close customize form if open
  };

  const handleSettingsUpdated = (updatedSettings) => {
    // Update the profile data with new settings
    setProfileData(prevData => ({
      ...prevData,
      profileSettings: updatedSettings
    }));
    
    // Close the form after successful update
    setShowCustomizeForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Profile Not Found</h2>
        <p className="text-gray-400">The user profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-amber-500 text-gray-900 rounded-md font-medium">
          Return to Home
        </Link>
      </div>
    );
  }

  // Get profile settings for styling
  const { backgroundColor, textColor, accentColor, backgroundImageUrl, layoutStyle } = 
    profileData.profileSettings || {};
  
  // Create style objects
  const containerStyle = {
    backgroundColor: backgroundColor || '#1a202c',
    color: textColor || '#e2e8f0',
    ...(backgroundImageUrl && {
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    })
  };
  
  const accentStyle = {
    color: accentColor || '#f6ad55'
  };
  
  const buttonStyle = {
    backgroundColor: accentColor || '#f6ad55',
    color: backgroundColor || '#1a202c'
  };
  
  // Apply different layout styles
  let layoutClasses = "space-y-8 p-4";
  if (layoutStyle === 'compact') {
    layoutClasses = "space-y-4 max-w-3xl mx-auto p-4";
  } else if (layoutStyle === 'wide') {
    layoutClasses = "space-y-12 p-4";
  }
  
  return (
    <div className={layoutClasses} style={containerStyle}>
      {/* Profile Header */}
      <div className="bg-opacity-90 bg-slate-800 rounded-lg shadow-md overflow-hidden backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold" style={accentStyle}>
              {profileData.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1" style={accentStyle}>{profileData.username}'s Profile</h1>
              <p className="opacity-80">Member since {new Date(profileData.dateRegistered).toLocaleDateString()}</p>
            </div>
          </div>
          
          {isOwnProfile && (
            <button 
              onClick={toggleCustomizeForm}
              className="mt-4 px-4 py-2 rounded-md font-medium transition-colors hover:opacity-90"
              style={buttonStyle}
            >
              {showCustomizeForm ? 'Cancel' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Customization Form - Only shown to profile owner when customize button is clicked */}
      {isOwnProfile && showCustomizeForm && (
        <ProfileCustomizationForm 
          currentSettings={profileData.profileSettings}
          onSettingsUpdated={handleSettingsUpdated}
          onCancel={toggleCustomizeForm}
        />
      )}
      
      {/* User Activity Section (Favorites and Ratings) */}
      <UserActivitySection 
        userId={userId}
        accentStyle={accentStyle}
        buttonStyle={buttonStyle}
      />

      {/* Personal Albums Section */}
      <div className="bg-opacity-90 bg-slate-800 rounded-lg shadow-md p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={accentStyle}>Personal Album Collection</h2>
          
          {isOwnProfile && (
            <div className="flex space-x-3">
              {albumToEdit && (
                <button
                  onClick={() => setAlbumToEdit(null)}
                  className="px-4 py-2 bg-slate-600 rounded-md font-medium transition-colors hover:bg-slate-500"
                >
                  Cancel Edit
                </button>
              )}
              
              <button 
                onClick={toggleAddForm}
                className="px-4 py-2 rounded-md font-medium transition-colors hover:opacity-90"
                style={buttonStyle}
                disabled={albumToEdit !== null}
              >
                {showAddForm ? 'Cancel' : 'Add New Album'}
              </button>
            </div>
          )}
        </div>

        {/* Album Search Form - Only shown to profile owner when Add button is clicked */}
        {isOwnProfile && showAddForm && (
          <ProfileAlbumSearch 
            onAlbumAdded={handleAddAlbum} 
            buttonStyle={buttonStyle} 
            accentStyle={accentStyle}
            closeSearch={() => setShowAddForm(false)}
          />
        )}
        
        {/* Edit Album Form - Only shown to profile owner when editing an album */}
        {isOwnProfile && albumToEdit && (
          <div className="bg-opacity-95 bg-slate-700 rounded-lg shadow-lg p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4" style={accentStyle}>Edit Album</h3>
            {/* We could create an EditAlbumForm component in the future or adapt PersonalAlbumForm to handle both cases */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setAlbumToEdit(null)}
                className="px-4 py-2 bg-slate-600 rounded-md font-medium transition-colors hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-md font-medium transition-colors hover:opacity-90"
                style={buttonStyle}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {personalAlbums.length === 0 ? (
          <p className="opacity-70 text-center py-8">
            {isOwnProfile 
              ? "You haven't added any personal albums yet. Click 'Add New Album' to get started!" 
              : `${profileData.username} hasn't added any personal albums yet.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalAlbums.map(album => (
              <PersonalAlbumDisplay
                key={album._id}
                personalAlbum={album}
                accentStyle={accentStyle}
                isOwner={isOwnProfile}
                onAlbumUpdated={startEditingAlbum}
                onAlbumDeleted={handleDeleteAlbum}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Back to Home Link */}
      <div className="flex justify-center mt-4">
        <Link to="/" className="text-center opacity-80 hover:opacity-100 transition-opacity">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage; 