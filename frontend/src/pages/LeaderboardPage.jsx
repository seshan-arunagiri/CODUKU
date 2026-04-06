import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { leaderboardAPI, wsManager } from '../services/apiService';
import '../styles/LeaderboardPage.css';

const houseConfig = {
  gryffindor: { emoji: '🦁', color: '#c8102e', name: 'Gryffindor' },
  hufflepuff: { emoji: '🦡', color: '#e4a800', name: 'Hufflepuff' },
  ravenclaw: { emoji: '🦅', color: '#0e4d92', name: 'Ravenclaw' },
  slytherin: { emoji: '🐍', color: '#1a7a3a', name: 'Slytherin' },
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
      const [globalRes, houseRes] = await Promise.allSettled([
        leaderboardAPI.getGlobal(100),
        leaderboardAPI.getHouses(),
      ]);

      if (globalRes.status === 'fulfilled') {
        const data = globalRes.value;
        setLeaderboard(data.leaderboard || data.users || []);
      }
      if (houseRes.status === 'fulfilled') {
        const hData = houseRes.value;
        setHouseBoard(hData?.houses || hData || {});
      }
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

    // Connect WebSocket for real-time updates
    if (user?.id) {
      try {
        wsRef.current = wsManager.connect(user.id, null, () => {
          fetchLeaderboards();
        });
      } catch (e) {
        // WebSocket connection is optional
      }
    }

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, [token, user, navigate, fetchLeaderboards]);

  if (loading) {
    return (
      <div className="lb-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Summoning rankings...</p>
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
          id="tab-global"
        >
          👥 Global
        </button>
        <button
          className={`lb-tab ${activeTab === 'houses' ? 'active' : ''}`}
          onClick={() => setActiveTab('houses')}
          id="tab-houses"
        >
          🏰 Houses
        </button>
      </div>

      {/* Global Rankings */}
      {activeTab === 'global' && (
        <div className="lb-card animate-fade-in">
          {leaderboard.length === 0 ? (
            <div className="lb-empty">
              <p>No submissions yet. Be the first wizard to claim the throne!</p>
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Wizard</th>
                  <th>House</th>
                  <th style={{ width: '100px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const houseKey = (entry.house || 'gryffindor').toLowerCase();
                  const hi = houseConfig[houseKey] || { emoji: '🏰', color: '#7c3aed', name: 'Unknown' };
                  const isMe = user && (
                    entry.user_id === user.id || 
                    entry.user_id === user.username ||
                    entry.username === user.username
                  );

                  return (
                    <tr
                      key={idx}
                      className={`lb-row animate-fade-in ${isMe ? 'my-row' : ''}`}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <td className="rank-cell">
                        {idx === 0 ? <span className="medal gold">🥇</span> :
                         idx === 1 ? <span className="medal silver">🥈</span> :
                         idx === 2 ? <span className="medal bronze">🥉</span> :
                         <span className="rank-num">#{idx + 1}</span>}
                      </td>
                      <td className="name-cell">
                        <span className="coder-name">
                          {entry.username || entry.user_id || 'Anonymous'}
                        </span>
                        {isMe && <span className="you-badge">YOU</span>}
                      </td>
                      <td>
                        <span className="house-badge" style={{ '--house-color': hi.color }}>
                          {hi.emoji} {hi.name}
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

      {/* House Cup */}
      {activeTab === 'houses' && (
        <div className="house-cup animate-fade-in">
          {Object.keys(houseBoard).length === 0 ? (
            <div className="lb-empty" style={{ gridColumn: '1 / -1' }}>
              <p>House data coming soon! Submit solutions to earn points for your house.</p>
            </div>
          ) : (
            Object.entries(houseBoard)
              .sort(([, a], [, b]) => (b.total_score || 0) - (a.total_score || 0))
              .map(([houseName, houseData], idx) => {
                const houseKey = houseName.toLowerCase();
                const hi = houseConfig[houseKey] || { emoji: '🏰', color: '#7c3aed', name: houseName };

                return (
                  <div
                    key={houseName}
                    className="house-cup-card animate-fade-in-up"
                    style={{ 
                      animationDelay: `${idx * 0.12}s`, 
                      '--house-color': hi.color 
                    }}
                  >
                    <div className="house-cup-emoji">{hi.emoji}</div>
                    <h2>{hi.name}</h2>
                    <div className="house-cup-score">
                      <div className="score-item">
                        <span className="score-label">Total Score</span>
                        <span className="score-value">{houseData.total_score || 0}</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Members</span>
                        <span className="score-value">
                          {houseData.leaderboard?.length || houseData.members || 0}
                        </span>
                      </div>
                    </div>

                    {/* House leaderboard preview */}
                    {houseData.leaderboard && houseData.leaderboard.length > 0 && (
                      <div style={{ 
                        marginTop: '16px', 
                        width: '100%', 
                        borderTop: '1px solid var(--border-subtle)', 
                        paddingTop: '12px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {houseData.leaderboard.slice(0, 3).map((member, mIdx) => (
                          <div key={mIdx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 0',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}>
                            <span>
                              {mIdx === 0 ? '🥇' : mIdx === 1 ? '🥈' : '🥉'}{' '}
                              {member.username || member.user_id}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                              {member.score || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
