import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { leaderboardAPI, wsManager } from '../services/apiService';
import '../styles/LeaderboardPage.css';

const houseConfig = {
  gryffindor: { emoji: '🦁', color: '#dc2626' },
  hufflepuff: { emoji: '🦡', color: '#eab308' },
  ravenclaw: { emoji: '🦅', color: '#2563eb' },
  slytherin: { emoji: '🐍', color: '#16a34a' },
};

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [houseBoard, setHouseBoard] = useState({});
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const wsRef = React.useRef(null);

  const fetchLeaderboards = useCallback(async () => {
    try {
      setLoading(true);
      const [globalRes, houseRes] = await Promise.all([
        leaderboardAPI.getGlobal(100),
        leaderboardAPI.getHouses(),
      ]);
      setLeaderboard(globalRes.leaderboard || []);
      setHouseBoard(houseRes || {});
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchLeaderboards();

    // Connect to WebSocket for real-time updates
    if (user?.id) {
      wsRef.current = wsManager.connect(user.id, null, () => {
        // Refresh leaderboard on update
        fetchLeaderboards();
      });
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, user, navigate, fetchLeaderboards]);

  if (loading) {
    return (
      <div className="lb-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leaderboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lb-page">
      <div className="lb-header">
        <h1>🏆 Leaderboards</h1>
        <p>Rankings update in real-time after every submission <span className="live-dot">🟢 Live</span></p>
      </div>

      <div className="lb-tabs">
        <button
          className={`lb-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          👥 Global Rankings
        </button>
        <button
          className={`lb-tab ${activeTab === 'houses' ? 'active' : ''}`}
          onClick={() => setActiveTab('houses')}
        >
          🏰 House Cup
        </button>
      </div>

      {/* Global Rankings */}
      {activeTab === 'global' && (
        <div className="lb-card animate-fade-in">
          {leaderboard.length === 0 ? (
            <div className="lb-empty">
              <p>No submissions yet. Be the first to climb the ranks!</p>
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Coder</th>
                  <th>House</th>
                  <th style={{ width: '100px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const houseKey = (entry.house || 'gryffindor').toLowerCase();
                  const hi = houseConfig[houseKey] || { emoji: '🏰', color: '#7c3aed' };
                  const isMe = user && (entry.user_id === user.id || entry.user_id === user.username);

                  return (
                    <tr
                      key={idx}
                      className={`lb-row animate-fade-in ${isMe ? 'my-row' : ''}`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <td className="rank-cell">
                        {idx === 0 ? <span className="medal gold">🥇</span> :
                         idx === 1 ? <span className="medal silver">🥈</span> :
                         idx === 2 ? <span className="medal bronze">🥉</span> :
                         <span className="rank-num">#{idx + 1}</span>}
                      </td>
                      <td className="name-cell">
                        <span className="coder-name">{entry.user_id || 'Anonymous'}</span>
                        {isMe && <span className="you-badge">YOU</span>}
                      </td>
                      <td>
                        <span className="house-badge" style={{ '--house-color': hi.color }}>
                          {hi.emoji} {entry.house || '—'}
                        </span>
                      </td>
                      <td className="score-cell">{entry.score || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* House Standings */}
      {activeTab === 'houses' && (
        <div className="house-cup animate-fade-in">
          {Object.keys(houseBoard).length === 0 ? (
            <div className="lb-empty">
              <p>House data coming soon!</p>
            </div>
          ) : (
            Object.entries(houseBoard).map(([houseName, houseData], idx) => {
              const houseKey = houseName.toLowerCase();
              const hi = houseConfig[houseKey] || { emoji: '🏰', color: '#7c3aed' };

              return (
                <div
                  key={houseName}
                  className="house-cup-card animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s`, '--house-color': hi.color }}
                >
                  <div className="house-cup-emoji">{hi.emoji}</div>
                  <h2>{houseName.charAt(0).toUpperCase() + houseName.slice(1)}</h2>
                  <div className="house-cup-score">
                    <div className="score-item">
                      <span className="score-label">Total Score</span>
                      <span className="score-value">{houseData.total_score || 0}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Members</span>
                      <span className="score-value">{houseData.leaderboard?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
