import React, { useContext, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';

// Import pages & components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import DeepDivePage from './pages/DeepDivePage';
import SinglePostPage from './pages/SinglePostPage';
import PostFormPage from './pages/PostFormPage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import PostDetailPage from './pages/PostDetailPage';
import WorldMusicPage from './pages/WorldMusicPage';

function Layout() {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumDetailPage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/deep-dive" element={<DeepDivePage />} />
          <Route path="/deep-dive/:postId" element={<PostDetailPage />} />
          <Route path="/deep-dive/new" element={<PostFormPage />} />
          <Route path="/deep-dive/edit/:postId" element={<PostFormPage />} />
          <Route path="/world-music" element={<WorldMusicPage />} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App bg-slate-900 text-white min-h-screen">
          <Layout />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
