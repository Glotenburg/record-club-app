import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import pages & components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthContext } from './context/AuthContext';

function App() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex flex-col background-image text-gray-100">
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500 mb-0">
              Uppsala Listeners Club
            </h1>
          </div>
          <nav className="mt-4 sm:mt-0">
            <ul className="flex gap-6 items-center">
              <li>
                <Link to="/" className="text-gray-200 hover:text-amber-400 transition-colors duration-200 font-medium">
                  Home
                </Link>
              </li>
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link to="/login" className="text-gray-200 hover:text-amber-400 transition-colors duration-200 font-medium">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-gray-200 hover:text-amber-400 transition-colors duration-200 font-medium">
                      Register
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="text-gray-300">Welcome, {user?.username || 'User'}!</li>
                  {user && (
                    <li>
                      <Link to={`/profile/${user._id}`} className="text-gray-200 hover:text-amber-400 transition-colors duration-200 font-medium">
                        My Profile
                      </Link>
                    </li>
                  )}
                  {user && user.role === 'admin' && (
                    <li>
                      <Link to="/admin" className="text-gray-200 hover:text-amber-400 transition-colors duration-200 font-medium">
                        Admin Panel
                      </Link>
                    </li>
                  )}
                  <li>
                    <button 
                      onClick={logout} 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-medium py-1.5 px-4 rounded-md text-sm shadow-md transition duration-200"
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            {/* Add more protected routes here as needed */}
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
            {/* Add more admin routes here as needed */}
          </Route>
        </Routes>
      </main>
      
      <footer className="bg-slate-900 text-center py-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Uppsala Listeners Club. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
