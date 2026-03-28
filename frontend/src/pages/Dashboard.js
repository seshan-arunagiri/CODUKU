import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOUSE_META = {
  Gryffindor: { color: '#ae0001', icon: '🦁', gradient: 'linear-gradient(135deg, #ae0001, #d4af37)' },
  Hufflepuff:  { color: '#ecb939', icon: '🦡', gradient: 'linear-gradient(135deg, #ecb939, #e8832a)' },
  Ravenclaw:   { color: '#6375d6', icon: '🦅', gradient: 'linear-gradient(135deg, #222f5b, #6375d6)' },
  Slytherin:   { color: '#2a7c46', icon: '🐍', gradient: 'linear-gradient(135deg, #1a472a, #5d8a5e)' },
};

export default function Dashboard({ user, token, onNavigate }) {
  const [profile, setProfile]     = useState(null);
  const [houses, setHouses]       = useState([]);
  const [recentSubs, setRecent]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, hRes, sRes] = await Promise.all([
        fetch(`${API}/api/user/profile`, { headers }),
        fetch(`${API}/api/leaderboards/houses`, { headers }),
        fetch(`${API}/api/user/submissions`, { headers }),
      ]);
      const [p, h, s] = await Promise.all([pRes.json(), hRes.json(), sRes.json()]);
      setProfile(p);
      setHouses(Array.isArray(h) ? h : []);
      setRecent(Array.isArray(s) ? s.slice(0, 5) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const meta = HOUSE_META[user.house] || { color: '#6c3de8', icon: '🏠', gradient: 'linear-gradient(135deg,#6c3de8,#a78bfa)' };

  if (loading) return (
    <div className="dash-loader">
      <div className="loader-spinner"></div>
      <p>Loading your dashboard…</p>
    </div>
  );

  const stats = [
    { label: 'Problems Solved', value: profile?.problems_solved ?? 0,     icon: '✅' },
    { label: 'Average Score',   value: `${profile?.average_score ?? 0}`,  icon: '📈' },
    { label: 'Submissions',     value: profile?.total_submissions ?? 0,   icon: '📤' },
    { label: 'House',           value: user.house,                         icon: meta.icon },
  ];

  return (
    <div className="dashboard">
      {/* ── Hero banner ── */}
      <div className="dash-hero" style={{ background: meta.gradient }}>
        <div className="hero-text">
          <h1 className="hero-greeting">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
          <p className="hero-sub">House {user.house} is counting on you. Keep coding!</p>
        </div>
        <div className="hero-house-icon">{meta.icon}</div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-body">
        {/* ── House standings ── */}
        <div className="card house-standings">
          <h2 className="section-title">🏠 House Standings</h2>
          <div className="house-list">
            {houses.map((h, i) => {
              const m = HOUSE_META[h.house] || {};
              return (
                <div key={h.house} className="house-row">
                  <span className="house-rank">#{i + 1}</span>
                  <span className="house-icon-sm">{m.icon || '🏰'}</span>
                  <div className="house-bar-wrap">
                    <div className="house-bar-label">
                      <span style={{ color: m.color || '#fff' }}>{h.house}</span>
                      <span className="house-bar-score">{h.average_score.toFixed(1)} pts avg</span>
                    </div>
                    <div className="house-bar-track">
                      <div
                        className="house-bar-fill"
                        style={{ width: `${Math.min(100, h.average_score)}%`, background: m.color || '#6c3de8' }}
                      />
                    </div>
                  </div>
                  <span className="house-members">{h.members} members</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="dash-right">
          {/* Quick actions */}
          <div className="card quick-actions">
            <h2 className="section-title">⚡ Quick Actions</h2>
            <div className="action-grid">
              <button className="action-btn" onClick={() => onNavigate('code')}>
                <span className="action-icon">💻</span>
                <span>Solve Problems</span>
              </button>
              <button className="action-btn" onClick={() => onNavigate('leaderboards')}>
                <span className="action-icon">🏆</span>
                <span>Leaderboards</span>
              </button>
              {user.role === 'admin' && (
                <button className="action-btn" onClick={() => onNavigate('admin')}>
                  <span className="action-icon">⚙️</span>
                  <span>Admin Panel</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent submissions */}
          <div className="card recent-subs">
            <h2 className="section-title">📋 Recent Submissions</h2>
            {recentSubs.length === 0
              ? <p className="empty-state">No submissions yet. Start solving problems!</p>
              : (
                <div className="sub-list">
                  {recentSubs.map(s => (
                    <div key={s._id} className="sub-row">
                      <div className="sub-info">
                        <span className="sub-title">{s.question_title}</span>
                        <span className={`badge badge-${(s.difficulty || '').toLowerCase()}`}>{s.difficulty}</span>
                      </div>
                      <div className="sub-meta">
                        <span className="sub-score" style={{ color: s.score >= 80 ? '#34d399' : s.score >= 50 ? '#fbbf24' : '#f87171' }}>
                          {s.score?.toFixed(1) ?? '0'} pts
                        </span>
                        <span className="sub-tests">{s.passed_tests}/{s.total_tests} tests</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
