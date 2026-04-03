import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/apiService';
import '../styles/AuthPage.css';

const houses = [
  { 
    value: 'gryffindor', 
    label: 'Gryffindor', 
    emoji: '🦁', 
    desc: 'Brave & Bold',
    gradient: 'linear-gradient(135deg, #b91c1c, #f59e0b)'
  },
  { 
    value: 'hufflepuff', 
    label: 'Hufflepuff', 
    emoji: '🦡', 
    desc: 'Loyal & Kind',
    gradient: 'linear-gradient(135deg, #ca8a04, #422006)'
  },
  { 
    value: 'ravenclaw', 
    label: 'Ravenclaw', 
    emoji: '🦅', 
    desc: 'Wise & Creative',
    gradient: 'linear-gradient(135deg, #1d4ed8, #92400e)'
  },
  { 
    value: 'slytherin', 
    label: 'Slytherin', 
    emoji: '🐍', 
    desc: 'Cunning & Ambitious',
    gradient: 'linear-gradient(135deg, #15803d, #475569)'
  }
];

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    house: 'gryffindor'
  });
  
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        response = await authAPI.login({
          email: form.email,
          password: form.password
        });
      } else {
        response = await authAPI.register({
          username: form.username || form.email.split('@')[0],
          email: form.email,
          password: form.password,
          house: form.house
        });
      }

      const { access_token, user_id, username, house, message } = response;
      
      login(access_token, {
        user_id,
        username,
        email: form.email,
        house,
        message
      });

      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Authentication failed. Please try again.';
      setError(errorMsg);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated magical background */}
      <div className="auth-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <div className="auth-container">
        {/* Left branding panel */}
        <div className="auth-branding">
          <div className="brand-content">
            <div className="brand-logo-area">
              <span className="brand-icon">⚡</span>
              <h1 className="brand-title">CODUKU</h1>
            </div>
            <p className="brand-tagline">Where Code Meets Competition</p>
            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-icon">🏰</span>
                <div>
                  <strong>House System</strong>
                  <p>Choose your house and compete for glory</p>
                </div>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">⚔️</span>
                <div>
                  <strong>Code Arena</strong>
                  <p>Solve challenges with a powerful editor</p>
                </div>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">🏆</span>
                <div>
                  <strong>Live Leaderboards</strong>
                  <p>Rise through the ranks in real-time</p>
                </div>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">🧙</span>
                <div>
                  <strong>AI Mentor</strong>
                  <p>Get magical hints when you're stuck</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome Back, Wizard' : 'Join the Arena'}</h2>
            <p>{isLogin ? 'Sign in to continue your quest' : 'Create your account & choose a house'}</p>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group animate-fade-in-up">
                <label htmlFor="auth-username">Wizard Name</label>
                <input
                  id="auth-username"
                  type="text"
                  name="username"
                  placeholder="Choose your wizard name"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <div className="form-group animate-fade-in-up">
                <label>Choose Your House</label>
                <div className="house-grid">
                  {houses.map(h => (
                    <button
                      key={h.value}
                      type="button"
                      className={`house-option ${form.house === h.value ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, house: h.value })}
                      style={{ '--house-gradient': h.gradient }}
                    >
                      <span className="house-emoji">{h.emoji}</span>
                      <span className="house-name">{h.label}</span>
                      <span className="house-desc">{h.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error animate-fade-in">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-submit-btn" id="auth-submit">
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Casting Spell...
                </span>
              ) : (
                isLogin ? '✨ Sign In' : '✨ Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
