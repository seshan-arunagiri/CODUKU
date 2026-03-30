import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import HouseLogo from '../components/HouseLogo';
import MagicalBadge from '../components/MagicalBadge';
import { Trophy, Code, Award, Flame, Zap, Compass, Star } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOUSE_META = {
  Gryffindor: { color: '#ae0001', rank: 'Brave',   gradient: 'linear-gradient(135deg, rgba(174,0,1,0.2), transparent)' },
  Hufflepuff: { color: '#e8a800', rank: 'Loyal',   gradient: 'linear-gradient(135deg, rgba(232,168,0,0.2), transparent)' },
  Ravenclaw:  { color: '#4a5fa0', rank: 'Wise',    gradient: 'linear-gradient(135deg, rgba(74,95,160,0.2), transparent)' },
  Slytherin:  { color: '#2a7c46', rank: 'Cunning', gradient: 'linear-gradient(135deg, rgba(42,124,70,0.2), transparent)' },
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

  const meta = HOUSE_META[user.house] || { color: '#6c3de8', rank: 'Apprentice', gradient: 'linear-gradient(135deg, rgba(108,61,232,0.2), transparent)' };

  if (loading) return (
    <div className="dash-loader">
      <div className="loader-cauldron">
        <div className="cauldron-bubble" />
        <div className="cauldron-bubble" />
        <div className="cauldron-bubble" />
      </div>
      <p className="loader-text">Loading...</p>
    </div>
  );

  const stats = [
    { label: 'Problems Solved', value: profile?.problems_solved ?? 0,     icon: <Zap size={20} /> },
    { label: 'Average Score',   value: `${profile?.average_score ?? 0}`,  icon: <Star size={20} /> },
    { label: 'Total Submissions',value: profile?.total_submissions ?? 0,  icon: <Compass size={20} /> },
    { label: 'House Rank',      value: meta.rank,                         icon: <Trophy size={20} /> },
  ];

  return (
    <div className="dashboard">
      {/* ── Hero banner ── */}
      <div className="dash-hero card-glass" style={{ backgroundImage: meta.gradient, borderColor: meta.color }}>
        <div className="hero-text">
          <h1 className="hero-greeting">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="hero-sub">Welcome to your Coding Dashboard.</p>
        </div>
        <div className="hero-house-icon">
          <HouseLogo house={user.house} size={80} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card card-glass">
            <div className="stat-icon-wrap" style={{ color: meta.color }}>
              <span className="stat-icon">{s.icon}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-body">
        <div className="dash-left">
        {/* ── House standings ── */}
        <div className="card house-standings">
          <div className="section-header">
            <h2 className="section-title">House Standings</h2>
            <button className="view-all-btn" onClick={() => onNavigate('leaderboards')}>View Leaderboards</button>
          </div>
          <div className="house-list">
            {houses.map((h, i) => {
              const m = HOUSE_META[h.house] || { color: '#6c3de8' };
              const isFirst = i === 0;
              const isUserHouse = h.house === user.house;
              return (
                <div key={h.house} className={`house-row ${isUserHouse ? 'my-house' : ''}`}>
                  <span className={`house-rank ${isFirst ? 'rank-first' : ''}`}>#{i + 1}</span>
                  <div className="house-icon-sm">
                    <HouseLogo house={h.house} size={28} />
                  </div>
                  <div className="house-bar-wrap">
                    <div className="house-bar-label">
                      <span className="house-name" style={{ color: m.color }}>{h.house} {isUserHouse && '(You)'}</span>
                      <span className="house-bar-score">{h.average_score.toFixed(1)} pts</span>
                    </div>
                    <div className="house-bar-track">
                      <div
                        className="house-bar-fill"
                        style={{ width: `${Math.min(100, (h.average_score / (houses[0]?.average_score || Math.max(1, h.average_score))) * 100)}%`, background: m.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Achievements ── */}
        <div className="achievements-card card-glass">
          <div className="achievements-header">
            <Award className="card-icon-gold" />
            <h2 className="card-title">Magical Achievements</h2>
          </div>
          <p className="card-sub">Badges earned through your coding trials.</p>

          <div className="badge-grid">
            {profile?.badges && profile.badges.map((b, i) => (
              <div key={i} className="badge-item scale-up">
                <MagicalBadge type={b.id || b} size="md" />
              </div>
            ))}
            {(!profile?.badges || profile.badges.length === 0) && (
              <div className="no-badges-msg">
                <span className="crystal-ball">🔮</span>
                <p>Your future achievements are yet to be revealed.</p>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* ── Right column ── */}
        <div className="dash-right">
          {/* Quick actions */}
          <div className="card quick-actions">
            <h2 className="section-title">Quick Links</h2>
            <div className="quick-links">
              <button className="q-link-item" onClick={() => onNavigate('code')}>
                <Code size={20} />
                <span>Full Practice</span>
              </button>
              <button className="q-link-item glow-primary" onClick={() => onNavigate('code')}>
                <Star size={20} />
                <span>Enter Test (Active 5-10PM)</span>
              </button>
              <button className="q-link-item" onClick={() => onNavigate('leaderboards')}>
                <Trophy size={20} />
                <span>Leaderboards</span>
              </button>
              {user.role === 'admin' && (
                <button className="q-link-item" onClick={() => onNavigate('admin')}>
                  <span className="action-icon">≡</span>
                  <span>Admin Panel</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent submissions */}
          <div className="card recent-subs">
            <h2 className="section-title">Recent Submissions</h2>
            {recentSubs.length === 0
              ? <p className="empty-state">No submissions yet. Visit the Code Editor!</p>
              : (
                <div className="sub-list">
                  {recentSubs.map(s => (
                    <div key={s._id} className="sub-row">
                      <div className="sub-info">
                        <span className="sub-title">{s.question_title}</span>
                        <span className={`badge badge-${(s.difficulty || '').toLowerCase()}`}>{s.difficulty}</span>
                      </div>
                      <div className="sub-meta">
                        <span className="sub-score" style={{ color: s.score >= 80 ? 'var(--success)' : s.score >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                          {s.score?.toFixed(1) ?? '0'} pts
                        </span>
                        <span className="sub-tests">{s.passed_tests}/{s.total_tests} pass</span>
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
