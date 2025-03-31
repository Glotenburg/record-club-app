import React, { useState } from 'react';
import axios from 'axios';

const PersonalAlbumForm = ({ onAlbumAdded, buttonStyle, accentStyle, closeForm }) => {
  const initialFormState = {
    title: '',
    artist: '',
    releaseYear: '',
    coverArtUrl: '',
    userRating: '',
    notes: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create cleaned form data (convert releaseYear to number if provided)
      const cleanedData = {
        ...formData,
        releaseYear: formData.releaseYear ? parseInt(formData.releaseYear, 10) : undefined,
        userRating: formData.userRating ? parseFloat(formData.userRating) : undefined
      };
      
      // Make POST request to create new personal album
      const response = await axios.post('/api/personal-albums', cleanedData);
      
      // Show success message and reset form
      setSuccess(true);
      setFormData(initialFormState);
      
      // Notify parent component
      if (onAlbumAdded) {
        onAlbumAdded(response.data);
      }
      
      // Reset success message after a delay
      setTimeout(() => {
        setSuccess(false);
        if (closeForm) closeForm();
      }, 2000);
    } catch (err) {
      console.error('Error creating personal album:', err);
      setError(err.response?.data?.message || 'Failed to add album. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-opacity-95 bg-slate-700 rounded-lg shadow-lg p-6 mb-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4" style={accentStyle}>Add to Your Collection</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">Album added successfully!</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block opacity-90 font-medium">
              Title *
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRing: accentStyle.color }}
              />
            </label>
            
            <label className="block opacity-90 font-medium">
              Artist *
              <input
                type="text"
                name="artist"
                value={formData.artist}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </label>
            
            <label className="block opacity-90 font-medium">
              Release Year
              <input
                type="number"
                name="releaseYear"
                value={formData.releaseYear}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </label>
            
            <label className="block opacity-90 font-medium">
              Rating (0-10)
              <select
                name="userRating"
                value={formData.userRating}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="">Select a rating</option>
                {[...Array(11).keys()].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
                {[0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="block opacity-90 font-medium">
              Cover Art URL
              <input
                type="url"
                name="coverArtUrl"
                value={formData.coverArtUrl}
                onChange={handleChange}
                placeholder="https://example.com/album-cover.jpg"
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </label>
            
            <label className="block opacity-90 font-medium">
              Notes
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Your thoughts on this album..."
                rows="5"
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
              />
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          {closeForm && (
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 bg-slate-600 rounded-md font-medium transition-colors hover:bg-slate-500"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-6 py-2 rounded-md font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={buttonStyle}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Album'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalAlbumForm; 