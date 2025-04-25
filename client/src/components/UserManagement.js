import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const UserManagement = () => {
  const { token, user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('activity');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  // Sort users based on current sort option
  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'username':
        return a.username.localeCompare(b.username);
      case 'dateRegistered':
        return new Date(b.dateRegistered) - new Date(a.dateRegistered);
      case 'activity':
      default:
        return b.activity - a.activity;
    }
  });

  // Handle initiating delete
  const handleDeleteInitiate = (userId) => {
    setDeletingId(userId);
    setConfirmDelete(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    console.log(`Attempting to delete user with ID: ${deletingId}`);
    
    try {
      console.log(`Sending DELETE request to: ${process.env.REACT_APP_API_URL}/api/users/${deletingId}`);
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/users/${deletingId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Delete user response:', response.data);

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user._id !== deletingId));
      
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        config: err.config
      });
      
      setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
      setConfirmDelete(false);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeletingId(null);
    setConfirmDelete(false);
  };

  if (loading) return <p className="text-gray-300">Loading users...</p>;
  if (error && !users.length) return <p className="text-red-400">{error}</p>;

  return (
    <div className="user-management">
      <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
        User Management
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

      {/* Sorting Options */}
      <div className="mb-4">
        <label htmlFor="sort-select" className="mr-3 text-gray-300">Sort by: </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-slate-900 text-gray-100 border border-slate-600 px-3 py-2 rounded-md focus:outline-none focus:border-amber-500"
        >
          <option value="activity">Activity (Most Active First)</option>
          <option value="username">Username (A-Z)</option>
          <option value="dateRegistered">Join Date (Newest First)</option>
        </select>
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="mb-6 p-4 bg-red-900 rounded-md">
          <h3 className="text-lg font-medium text-white mb-3">Confirm Delete</h3>
          <p className="text-gray-200 mb-3">
            Are you sure you want to delete this user? This action cannot be undone.
            All their contributions, comments, and favorites will remain but will no longer be associated with a user account.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            >
              Yes, Delete User
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

      {/* User List */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-2 text-gray-300">Username</th>
              <th className="text-left p-2 text-gray-300">Joined</th>
              <th className="text-left p-2 text-gray-300">Activity</th>
              <th className="text-left p-2 text-gray-300">Role</th>
              <th className="text-left p-2 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(user => (
              <tr key={user._id} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="p-2 text-gray-300">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 flex items-center justify-center text-sm font-bold text-slate-900 mr-2">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.username}
                  </div>
                </td>
                <td className="p-2 text-gray-400">{new Date(user.dateRegistered).toLocaleDateString()}</td>
                <td className="p-2 text-gray-400">{user.activity} contributions</td>
                <td className="p-2">
                  <span className={user.role === 'admin' ? 'text-pink-400' : 'text-gray-400'}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="p-2">
                  {user._id !== currentUser._id ? (
                    <button
                      onClick={() => handleDeleteInitiate(user._id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2 rounded-md text-xs"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">(current user)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement; 