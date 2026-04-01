import React, { useState } from 'react';
import './AuthPage.css';
import HouseLogo from '../components/HouseLogo';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOUSES = [
  { name: 'Gryffindor', color: '#ae0001', gold: '#d4af37', trait: 'Brave & Bold' },
  { name: 'Hufflepuff', color: '#e8a800', gold: '#f5d020', trait: 'Loyal & Warm' },
  { name: 'Ravenclaw',  color: '#4a5fa0', gold: '#7fa7c9', trait: 'Wise & Witty' },
  { name: 'Slytherin',  color: '#2a7c46', gold: '#aaaaaa', trait: 'Cunning & Ambitious' },
];

export default function AuthPage({ onLogin }) {
  const [mode, setMode]                     = useState('login');
  const [userType, setUserType]             = useState('student');
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [teacherSecret, setTeacherSecret]   = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [hoveredHouse, setHoveredHouse]     = useState(null);

  const reset = () => setError('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email, password }
      : { name, email, password, role: userType, teacher_secret: teacherSecret };

    try {
      const res  = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      onLogin(data.user, data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Animated starfield background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb orb-1" />
        <div className="auth-orb orb-2" />
        <div className="auth-orb orb-3" />
        <div className="auth-stars">
          {[...Array(30)].map((_, i) => (
            <span key={i} className="auth-star" style={{ '--si': i }} />
          ))}
        </div>
      </div>

      <div className="auth-container">
        {/* ── Left Panel ── */}
        <div className="auth-left">
          {/* Brand */}
          <div className="auth-brand-wrap">
            <HouseLogo house={hoveredHouse || null} size={56} />
            <div>
              <h1 className="auth-brand">Coduku</h1>
              <p className="auth-tagline">Competitive Coding Platform</p>
            </div>
          </div>

          {/* House Cards */}
          <div className="auth-houses">
            {HOUSES.map(h => (
              <div
                key={h.name}
                className="house-card"
                style={{ '--hc': h.color, '--hg': h.gold }}
                onMouseEnter={() => setHoveredHouse(h.name)}
                onMouseLeave={() => setHoveredHouse(null)}
              >
                <HouseLogo house={h.name} size={32} />
                <div className="house-card-info">
                  <span className="house-card-name" style={{ color: h.color }}>{h.name}</span>
                  <span className="house-card-trait">{h.trait}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul className="auth-features">
            <li><span className="feature-dot" />Real-time code execution</li>
            <li><span className="feature-dot" />House &amp; global leaderboards</li>
            <li><span className="feature-dot" />Free code testing</li>
            <li><span className="feature-dot" />Dynamic scoring system</li>
          </ul>
        </div>

        {/* ── Right Panel (Form) ── */}
        <div className="auth-right">
          <div className="auth-card">

            {/* Role toggle */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${userType === 'student' ? 'active' : ''}`}
                onClick={() => { setUserType('student'); reset(); }}
              >Student</button>
              <button
                className={`auth-tab ${userType === 'teacher' ? 'active' : ''}`}
                onClick={() => { setUserType('teacher'); reset(); }}
              >Teacher</button>
            </div>

            {/* Mode toggle */}
            <div className="auth-mode-tabs">
              <button
                className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); reset(); }}
              >Sign In</button>
              <button
                className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); reset(); }}
              >Register</button>
            </div>

            <h2 className="auth-form-title">
              {mode === 'login'
                ? (userType === 'student' ? 'Welcome back, Student!' : 'Welcome back, Teacher!')
                : (userType === 'student' ? 'Create an Account' : 'Register as Teacher')}
            </h2>
            <p className="auth-form-sub">
              {mode === 'login' ? 'Enter your credentials to continue' : 'Join the platform to begin'}
            </p>

            {error && <div className="auth-error"> {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              {mode === 'register' && userType === 'teacher' && (
                <div className="form-group">
                  <label className="form-label">Teacher Access Code</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Enter access code…"
                    value={teacherSecret}
                    onChange={e => setTeacherSecret(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder={mode === 'register' ? 'At least 6 characters' : '********'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading
                  ? 'Loading...'
                  : mode === 'login'
                    ? 'Login'
                    : 'Register Account'}
              </button>
            </form>

            {mode === 'login' && (
              <div className="auth-hint">
                <span>Test credentials — Admin: </span>
                <code>admin@test.com / admin123</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
