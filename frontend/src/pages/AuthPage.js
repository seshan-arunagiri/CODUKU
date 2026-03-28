import React, { useState } from 'react';
import './AuthPage.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AuthPage({ onLogin }) {
  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [userType, setUserType] = useState('student'); // 'student' | 'teacher'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [teacherSecret, setTeacherSecret] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const reset = () => { setError(''); };

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
      {/* Animated background orbs */}
      <div className="auth-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-logo">🏰</div>
          <h1 className="auth-brand">CodeHouses</h1>
          <p className="auth-tagline">Compete. Conquer. Code.</p>
          <div className="house-chips">
            {[
              { name: 'Gryffindor', color: '#ae0001', icon: '🦁' },
              { name: 'Hufflepuff', color: '#ecb939', icon: '🦡' },
              { name: 'Ravenclaw',  color: '#6375d6', icon: '🦅' },
              { name: 'Slytherin', color: '#2a7c46', icon: '🐍' },
            ].map(h => (
              <div key={h.name} className="house-chip" style={{ borderColor: h.color }}>
                <span>{h.icon}</span>
                <span style={{ color: h.color }}>{h.name}</span>
              </div>
            ))}
          </div>
          <div className="auth-features">
            <div className="feature-item"><span className="feature-icon">⚡</span> Real-time code execution</div>
            <div className="feature-item"><span className="feature-icon">🏆</span> House &amp; global leaderboards</div>
            <div className="feature-item"><span className="feature-icon">📊</span> Dynamic scoring system</div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Role Toggle */}
            <div className="auth-tabs" style={{ marginBottom: '1rem' }}>
              <button className={`auth-tab ${userType === 'student' ? 'active' : ''}`} onClick={() => { setUserType('student'); reset(); }}>
                👨‍🎓 Student
              </button>
              <button className={`auth-tab ${userType === 'teacher' ? 'active' : ''}`} onClick={() => { setUserType('teacher'); reset(); }}>
                🧑‍🏫 Teacher
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="auth-tabs" style={{ backgroundColor: 'transparent', padding: 0, gap: '0.5rem' }}>
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); reset(); }} style={{ border: '1px solid #2e2e38' }}>
                Sign In
              </button>
              <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); reset(); }} style={{ border: '1px solid #2e2e38' }}>
                Register
              </button>
            </div>

            <h2 className="auth-form-title" style={{ marginTop: '1.5rem' }}>
              {mode === 'login' 
                ? (userType === 'student' ? 'Welcome back, Student!' : 'Welcome back, Teacher!') 
                : (userType === 'student' ? 'Join a House' : 'Register as Teacher')}
            </h2>
            <p className="auth-form-sub">
              {mode === 'login'
                ? 'Sign in to continue'
                : 'Create your account to get started'}
            </p>

            {error && <div className="auth-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Harry Potter"
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
                    placeholder="Ask your admin for the code"
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
                  placeholder="you@hogwarts.edu"
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
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? '⏳ Please wait…' : mode === 'login' ? '🚀 Sign In' : '✨ Create Account'}
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
