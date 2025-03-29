import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import pages & components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthContext } from './context/AuthContext';

function App() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 shadow-md py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400 mb-4 sm:mb-0">Record Club App</h1>
          <nav>
            <ul className="flex gap-6 items-center">
              <li><Link to="/" className="text-amber-400 hover:text-amber-300 font-medium">Home</Link></li>
              {!isAuthenticated ? (
                <>
                  <li><Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Login</Link></li>
                  <li><Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium">Register</Link></li>
                </>
              ) : (
                <>
                  <li className="text-slate-300">Welcome, {user?.username || 'User'}!</li>
                  <li><button onClick={logout} className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold py-1 px-3 rounded text-sm">Logout</button></li>
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

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<HomePage />} />
            {/* Add more protected routes here as needed */}
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
