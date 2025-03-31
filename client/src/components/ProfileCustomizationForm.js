import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileCustomizationForm = ({ currentSettings, onSettingsUpdated, onCancel }) => {
  const defaultSettings = {
    backgroundColor: '#1a202c',
    textColor: '#e2e8f0',
    accentColor: '#f6ad55',
    backgroundImageUrl: '',
    layoutStyle: 'default'
  };

  // Initialize with current settings or defaults
  const [formData, setFormData] = useState({ 
    ...defaultSettings,
    ...currentSettings
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Update form when currentSettings change (e.g., from parent)
  useEffect(() => {
    if (currentSettings) {
      setFormData(prev => ({
        ...prev,
        ...currentSettings
      }));
    }
  }, [currentSettings]);

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
      const response = await axios.put('/api/profiles/settings', formData);
      
      setSuccess(true);
      
      // Notify parent component with updated settings
      if (onSettingsUpdated) {
        onSettingsUpdated(response.data.profileSettings);
      }
      
      // Reset success message after delay
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating profile settings:', err);
      setError(err.response?.data?.message || 'Failed to update profile settings. Please try again.');
    }
    
    setLoading(false);
  };

  // Create preview styles based on current form values
  const previewStyles = {
    backgroundColor: formData.backgroundColor,
    color: formData.textColor,
    padding: '1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem'
  };
  
  const accentStyle = {
    color: formData.accentColor
  };
  
  const buttonStyle = {
    backgroundColor: formData.accentColor,
    color: formData.backgroundColor
  };

  return (
    <div className="bg-opacity-95 bg-slate-700 rounded-lg shadow-lg p-6 backdrop-blur-sm mb-6">
      <h3 className="text-xl font-bold mb-4">Customize Your Profile</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">Profile settings updated successfully!</span>
        </div>
      )}
      
      {/* Preview section */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-2">Preview</h4>
        <div style={previewStyles}>
          <h5 className="text-lg font-bold mb-2" style={accentStyle}>Sample Heading</h5>
          <p className="mb-3">This is how your profile will appear with these settings.</p>
          <button 
            className="px-4 py-2 rounded-md font-medium text-sm"
            style={buttonStyle}
          >
            Sample Button
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Colors Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Colors</h4>
            
            <div className="space-y-2">
              <label className="block">
                <span className="opacity-90">Background Color</span>
                <div className="flex items-center mt-1">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="h-10 w-10 border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none"
                  />
                </div>
              </label>
              
              <label className="block">
                <span className="opacity-90">Text Color</span>
                <div className="flex items-center mt-1">
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="h-10 w-10 border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none"
                  />
                </div>
              </label>
              
              <label className="block">
                <span className="opacity-90">Accent Color</span>
                <div className="flex items-center mt-1">
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="h-10 w-10 border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none"
                  />
                </div>
              </label>
            </div>
          </div>
          
          {/* Layout and Background Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Layout & Background</h4>
            
            <label className="block">
              <span className="opacity-90">Layout Style</span>
              <select
                name="layoutStyle"
                value={formData.layoutStyle}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="wide">Wide</option>
              </select>
            </label>
            
            <label className="block">
              <span className="opacity-90">Background Image URL</span>
              <input
                type="url"
                name="backgroundImageUrl"
                value={formData.backgroundImageUrl || ''}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md focus:outline-none"
              />
            </label>
            
            <div className="opacity-80 text-sm italic mt-1">
              Leave the URL empty for a solid color background.
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 rounded-md font-medium transition-colors hover:bg-slate-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-md font-medium transition-colors"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileCustomizationForm; 