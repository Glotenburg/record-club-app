import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Check if user is authenticated AND has admin role
  const isAdmin = isAuthenticated && user && user.role === 'admin';
  
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute; 