import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { leaderboardAPI, problemAPI } from '../services/apiService';
import '../styles/DashboardPage.css';

const houseConfig = {
  gryffindor: { emoji: '🦁', name: 'Gryffindor', color: '#dc2626', motto: 'Where dwell the brave at heart' },
  hufflepuff: { emoji: '🦡', name: 'Hufflepuff', color: '#eab308', motto: 'Where they are just and loyal' },
  ravenclaw: { emoji: '🦅', name: 'Ravenclaw', color: '#2563eb', motto: 'Where the wise will always find their kind' },
  slytherin: { emoji: '🐍', name: 'Slytherin', color: '#16a34a', motto: 'Where the ambitious will achieve greatness' },
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
      const [problemsRes, globalRes, housesRes] = await Promise.all([
        problemAPI.getAll(100, 0),
        leaderboardAPI.getGlobal(5),
        leaderboardAPI.getHouses(),
      ]);

      setProblems(problemsRes.problems || problemsRes.data || []);
      setLeaderboard(globalRes.leaderboard || []);
      setHouseBoard(housesRes || {});
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
        <p>Loading your dashboard...</p>
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
              <span className="stat-label">Total Score</span>
            </div>
            <div className="banner-stat">
              <span className="stat-value">{user?.problems_solved || 0}</span>
              <span className="stat-label">Solved</span>
            </div>
            <div className="banner-stat">
              <span className="stat-value">#1</span>
              <span className="stat-label">Rank</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="dash-grid">
        <div className="dash-card action-card" onClick={() => navigate('/editor')}>
          <div className="action-icon">💻</div>
          <h3>Start Coding</h3>
          <p>Solve problems and earn points</p>
          <span className="action-arrow">→</span>
        </div>
        <div className="dash-card action-card" onClick={() => navigate('/leaderboard')}>
          <div className="action-icon">🏆</div>
          <h3>Leaderboards</h3>
          <p>See how you rank globally</p>
          <span className="action-arrow">→</span>
        </div>
      </div>

      {/* Problems + Top Coders */}
      <div className="dash-two-col">
        {/* Available Problems */}
        <div className="dash-card">
          <div className="card-header">
            <h2>📚 Available Problems</h2>
            <button className="card-action-btn" onClick={() => navigate('/editor')}>
              Solve Now →
            </button>
          </div>
          <div className="problems-table">
            {problems.length === 0 ? (
              <p className="empty-text">No problems available yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Difficulty</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((p, idx) => (
                    <tr key={p.id} className="animate-fade-in">
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
        <div className="dash-card">
          <div className="card-header">
            <h2>🔥 Top Coders</h2>
            <button className="card-action-btn" onClick={() => navigate('/leaderboard')}>
              View All →
            </button>
          </div>
          <div className="top-coders">
            {leaderboard.length === 0 ? (
              <p className="empty-text">No submissions yet. Be the first!</p>
            ) : (
              leaderboard.map((entry, idx) => (
                <div key={idx} className="coder-row animate-fade-in">
                  <div className="coder-rank">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${(entry.rank || idx + 1)}`}
                  </div>
                  <div className="coder-info">
                    <span className="coder-name">{entry.user_id || 'Anonymous'}</span>
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
        <div className="dash-card">
          <div className="card-header">
            <h2>🏰 House Standings</h2>
          </div>
          <div className="house-standings">
            {Object.entries(houseBoard).map(([houseName, houseData], idx) => {
              const cfg = houseConfig[houseName.toLowerCase()] || {};
              return (
                <div
                  key={houseName}
                  className="house-standing-card animate-fade-in"
                  style={{ '--house-color': cfg.color || '#7c3aed' }}
                >
                  <div className="house-emoji-lg">{cfg.emoji || '🏰'}</div>
                  <h3>{cfg.name || houseName}</h3>
                  <div className="house-standing-stats">
                    <div>
                      <strong>{houseData.total_score || 0}</strong>
                      <span>Score</span>
                    </div>
                    <div>
                      <strong>{houseData.leaderboard?.length || 0}</strong>
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
