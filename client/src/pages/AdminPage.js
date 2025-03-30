import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="p-6 bg-slate-800 rounded-lg max-w-4xl mx-auto shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
        Uppsala Listeners Club Admin Panel
      </h1>
      
      <div className="mb-8 p-4 bg-slate-900 rounded-md border border-purple-900">
        <p className="mb-2">Logged in as: <strong className="text-amber-400">{user?.username}</strong></p>
        <p className="mb-2">Role: <strong className="text-pink-500">{user?.role}</strong></p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-slate-900 p-5 rounded-md shadow-md border-l-4 border-amber-500 hover:shadow-amber-900/20 transition-shadow duration-300">
          <h2 className="text-xl font-bold mb-3 text-amber-400">User Management</h2>
          <p className="mb-4 text-gray-300">Manage users and their roles</p>
          <button 
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            onClick={() => alert('This functionality is not implemented yet')}
          >
            View Users
          </button>
        </div>
        
        <div className="bg-slate-900 p-5 rounded-md shadow-md border-l-4 border-pink-500 hover:shadow-pink-900/20 transition-shadow duration-300">
          <h2 className="text-xl font-bold mb-3 text-pink-500">Album Administration</h2>
          <p className="mb-4 text-gray-300">Update album metadata, delete albums, or set club scores</p>
          <button 
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-gray-900 font-medium py-2 px-4 rounded-md shadow-md transition duration-200"
            onClick={() => alert('This functionality is not implemented yet')}
          >
            Manage Albums
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 