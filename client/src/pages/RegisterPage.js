import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Get register function from AuthContext
  const { register, loading } = useContext(AuthContext);

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    
    // Use register function from context
    const result = await register(username, email, password);
    
    if (result.success) {
      alert('Registration successful! Please log in.');
      navigate('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <h2>Register for Uppsala Listeners Club</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        
        <p className="auth-redirect">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage; 