import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AlbumManagement = () => {
  const { token } = useContext(AuthContext);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('added_asc');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    clubEntryNumber: '',
    title: '',
    artist: '',
    releaseYear: ''
  });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch all albums
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/albums`, {
          params: { sort: sortOption },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setAlbums(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError('Failed to fetch albums');
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [sortOption, token]);

  // Handle selecting album to edit
  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album);
    setEditForm({
      clubEntryNumber: album.clubEntryNumber || '',
      title: album.title || '',
      artist: album.artist || '',
      releaseYear: album.releaseYear || ''
    });
    setIsEditing(true);
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  // Handle saving album edits
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!selectedAlbum) return;

    try {
      const formData = {
        ...editForm,
        clubEntryNumber: parseInt(editForm.clubEntryNumber, 10) || undefined,
        releaseYear: parseInt(editForm.releaseYear, 10) || undefined
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/albums/${selectedAlbum._id}/admin`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local state
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album._id === selectedAlbum._id ? response.data : album
        )
      );

      setSuccessMessage('Album updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setIsEditing(false);
      setSelectedAlbum(null);
    } catch (err) {
      console.error('Error updating album:', err);
      setError(`Failed to update album: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle initiating delete
  const handleDeleteInitiate = (albumId) => {
    setDeletingId(albumId);
    setConfirmDelete(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/albums/${deletingId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local state
      setAlbums(prevAlbums => prevAlbums.filter(album => album._id !== deletingId));
      
      setSuccessMessage('Album deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting album:', err);
      setError(`Failed to delete album: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
    }
  };

  // Handle fixing all clubEntryNumbers
  const handleFixEntryNumbers = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/albums/fix-entry-numbers`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local state with the corrected albums
      setAlbums(response.data);
      
      setSuccessMessage('Club entry numbers fixed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error fixing entry numbers:', err);
      setError(`Failed to fix entry numbers: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedAlbum(null);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeletingId(null);
    setConfirmDelete(false);
  };

  if (loading) return <p className="text-gray-300">Loading albums...</p>;
  if (error && !albums.length) return <p className="text-red-400">{error}</p>;

  return (
    <div className="album-management">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
        Album Management
      </h2>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-800 text-green-100 rounded-md">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-800 text-red-100 rounded-md">
          {error}
        </div>
      )}

      {/* Fixing All Club Entry Numbers */}
      <div className="mb-6 p-4 bg-slate-900 rounded-md border border-amber-500">
        <h3 className="text-lg font-medium text-amber-400 mb-2">Fix Club Entry Numbers</h3>
        <p className="text-gray-300 mb-3">
          This will reorder all club entry numbers to eliminate gaps from deleted albums.
          Albums will be renumbered based on their current entry numbers.
        </p>
        <button
          onClick={handleFixEntryNumbers}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
        >
          Fix Entry Numbers
        </button>
      </div>

      {/* Sorting Options */}
      <div className="mb-4">
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
        </select>
      </div>

      {/* Edit Form */}
      {isEditing && selectedAlbum && (
        <div className="mb-6 p-4 bg-slate-900 rounded-md">
          <h3 className="text-lg font-medium text-pink-500 mb-3">Edit Album</h3>
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-1">Club Entry Number:</label>
              <input
                type="number"
                name="clubEntryNumber"
                value={editForm.clubEntryNumber}
                onChange={handleEditChange}
                className="bg-slate-800 text-gray-100 border border-slate-600 w-full p-2 rounded-md focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Title:</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                required
                className="bg-slate-800 text-gray-100 border border-slate-600 w-full p-2 rounded-md focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Artist:</label>
              <input
                type="text"
                name="artist"
                value={editForm.artist}
                onChange={handleEditChange}
                required
                className="bg-slate-800 text-gray-100 border border-slate-600 w-full p-2 rounded-md focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Release Year:</label>
              <input
                type="number"
                name="releaseYear"
                value={editForm.releaseYear}
                onChange={handleEditChange}
                className="bg-slate-800 text-gray-100 border border-slate-600 w-full p-2 rounded-md focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-gray-900 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="mb-6 p-4 bg-red-900 rounded-md">
          <h3 className="text-lg font-medium text-white mb-3">Confirm Delete</h3>
          <p className="text-gray-200 mb-3">
            Are you sure you want to delete this album? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            >
              Yes, Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Album List */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-2 text-gray-300">#</th>
              <th className="text-left p-2 text-gray-300">Title</th>
              <th className="text-left p-2 text-gray-300">Artist</th>
              <th className="text-left p-2 text-gray-300">Year</th>
              <th className="text-left p-2 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {albums.map(album => (
              <tr key={album._id} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="p-2 text-gray-400">{album.clubEntryNumber || '-'}</td>
                <td className="p-2 text-gray-300">{album.title}</td>
                <td className="p-2 text-gray-400">{album.artist}</td>
                <td className="p-2 text-gray-400">{album.releaseYear || '-'}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleSelectAlbum(album)}
                    className="bg-amber-600 hover:bg-amber-700 text-gray-900 font-medium py-1 px-2 rounded-md text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteInitiate(album._id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2 rounded-md text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlbumManagement; 