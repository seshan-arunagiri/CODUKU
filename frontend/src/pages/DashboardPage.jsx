import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { leaderboardAPI, problemAPI } from '../services/apiService';
import '../styles/DashboardPage.css';

const houseConfig = {
  gryffindor: { 
    emoji: '🦁', 
    name: 'Gryffindor', 
    color: '#c8102e', 
    motto: 'Where dwell the brave at heart',
    icon: '⚔️'
  },
  hufflepuff: { 
    emoji: '🦡', 
    name: 'Hufflepuff', 
    color: '#e4a800', 
    motto: 'Where they are just and loyal',
    icon: '🌻'
  },
  ravenclaw: { 
    emoji: '🦅', 
    name: 'Ravenclaw', 
    color: '#0e4d92', 
    motto: 'Where the wise will always find their kind',
    icon: '📚'
  },
  slytherin: { 
    emoji: '🐍', 
    name: 'Slytherin', 
    color: '#1a7a3a', 
    motto: 'Where the ambitious achieve greatness',
    icon: '🐍'
  },
};

function DashboardPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [houseBoard, setHouseBoard] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [problemsRes, globalRes, housesRes] = await Promise.allSettled([
        problemAPI.getAll(100, 0),
        leaderboardAPI.getGlobal(5),
        leaderboardAPI.getHouses(),
      ]);

      if (problemsRes.status === 'fulfilled') {
        const data = problemsRes.value;
        setProblems(data.problems || data.data || (Array.isArray(data) ? data : []));
      }
      if (globalRes.status === 'fulfilled') {
        const data = globalRes.value;
        setLeaderboard(data.leaderboard || data.users || []);
      }
      if (housesRes.status === 'fulfilled') {
        setHouseBoard(housesRes.value || {});
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner"></div>
        <p>Summoning your dashboard...</p>
      </div>
    );
  }

  const userHouse = user?.house?.toLowerCase() || 'gryffindor';
  const house = houseConfig[userHouse] || houseConfig.gryffindor;

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="dash-banner" style={{ '--house-color': house.color }}>
        <div className="banner-content">
          <div className="banner-text">
            <h1>
              Welcome back, <span className="banner-name">{user?.username || 'Wizard'}</span> ⚡
            </h1>
            <p className="banner-motto">
              {house.emoji} {house.name} — "{house.motto}"
            </p>
          </div>
          <div className="banner-stats">
            <div className="banner-stat">
              <span className="stat-value">{user?.total_score || 0}</span>
              <span className="stat-label">Score</span>
            </div>
            <div className="banner-stat">
              <span className="stat-value">{user?.problems_solved || 0}</span>
              <span className="stat-label">Solved</span>
            </div>
            <div className="banner-stat">
              <span className="stat-value">—</span>
              <span className="stat-label">Rank</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="dash-grid">
        <div className="dash-card action-card" onClick={() => navigate('/editor')} id="action-code-arena">
          <div className="action-icon">⚔️</div>
          <h3>Enter Code Arena</h3>
          <p>Solve challenges, earn points, win glory for {house.name}</p>
          <span className="action-arrow">→</span>
        </div>
        <div className="dash-card action-card" onClick={() => navigate('/leaderboard')} id="action-leaderboards">
          <div className="action-icon">🏆</div>
          <h3>Leaderboards</h3>
          <p>See how you rank globally & in the House Cup</p>
          <span className="action-arrow">→</span>
        </div>
      </div>

      {/* Problems + Top Coders */}
      <div className="dash-two-col">
        {/* Available Problems */}
        <div className="dash-card" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h2>📚 Challenges</h2>
            <button className="card-action-btn" onClick={() => navigate('/editor')}>
              Solve Now →
            </button>
          </div>
          <div className="problems-table">
            {problems.length === 0 ? (
              <p className="empty-text">No challenges available yet. Check back soon!</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Challenge</th>
                    <th>Difficulty</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.slice(0, 8).map((p, idx) => (
                    <tr 
                      key={p.id} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
                      onClick={() => navigate('/editor')}
                    >
                      <td className="problem-title-cell">{p.title}</td>
                      <td>
                        <span className={`diff-badge ${(p.difficulty || 'easy').toLowerCase()}`}>
                          {p.difficulty || 'Easy'}
                        </span>
                      </td>
                      <td className="score-cell">{p.score || 0} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Coders */}
        <div className="dash-card" style={{ animationDelay: '0.15s' }}>
          <div className="card-header">
            <h2>🔥 Top Wizards</h2>
            <button className="card-action-btn" onClick={() => navigate('/leaderboard')}>
              View All →
            </button>
          </div>
          <div className="top-coders">
            {leaderboard.length === 0 ? (
              <p className="empty-text">No submissions yet. Be the first to rise!</p>
            ) : (
              leaderboard.map((entry, idx) => (
                <div key={idx} className="coder-row animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <div className="coder-rank">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${(entry.rank || idx + 1)}`}
                  </div>
                  <div className="coder-info">
                    <span className="coder-name">{entry.username || entry.user_id || 'Anonymous'}</span>
                    <span className="coder-house">{entry.house || '—'}</span>
                  </div>
                  <div className="coder-score">{entry.score || 0} pts</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* House Standings */}
      {Object.keys(houseBoard).length > 0 && (
        <div className="dash-card" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h2>🏰 House Cup Standings</h2>
          </div>
          <div className="house-standings">
            {Object.entries(houseBoard).map(([houseName, houseData], idx) => {
              const cfg = houseConfig[houseName.toLowerCase()] || {};
              return (
                <div
                  key={houseName}
                  className="house-standing-card animate-fade-in"
                  style={{ 
                    '--house-color': cfg.color || '#7c3aed',
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div className="house-emoji-lg">{cfg.emoji || '🏰'}</div>
                  <h3>{cfg.name || houseName}</h3>
                  <div className="house-standing-stats">
                    <div>
                      <strong>{houseData.total_score || 0}</strong>
                      <span>Score</span>
                    </div>
                    <div>
                      <strong>{houseData.leaderboard?.length || houseData.members || 0}</strong>
                      <span>Members</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
