import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create context
export const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Effect to setup axios header and check authentication state on load or token change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      try {
        const decoded = jwtDecode(token); // Decode token payload
        // Make sure the user object includes the role from the decoded token
        const userData = decoded.user;
        
        // If we don't have the user in localStorage or it's missing the role, update it
        if (!user || !user.role) {
          const updatedUser = {
            ...user,
            _id: userData.id,
            username: userData.username,
            role: userData.role
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        // Handle potential decoding errors (e.g., invalid token)
        console.error("Failed to decode token:", error);
        localStorage.removeItem('token'); // Clear invalid token
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, [token, user]);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      
      // Ensure the user object has the role property
      const decodedToken = jwtDecode(newToken);
      const userWithRole = {
        ...userData,
        _id: userData._id || decodedToken.user.id,
        role: userData.role || decodedToken.user.role
      };
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      // Update state
      setToken(newToken);
      setUser(userWithRole);
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Login failed. Please check your credentials.' 
      };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, { username, email, password });
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || 'Registration failed. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user,
        isAuthenticated, 
        loading, 
        login,
        register,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 