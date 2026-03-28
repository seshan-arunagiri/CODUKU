import React, { useState, useEffect, useCallback } from 'react';
import './Leaderboards.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HOUSE_META = {
  Gryffindor: { color: '#ae0001', icon: '🦁', gradient: 'linear-gradient(135deg,#ae0001,#d4af37)' },
  Hufflepuff:  { color: '#ecb939', icon: '🦡', gradient: 'linear-gradient(135deg,#ecb939,#e8832a)' },
  Ravenclaw:   { color: '#6375d6', icon: '🦅', gradient: 'linear-gradient(135deg,#222f5b,#6375d6)' },
  Slytherin:   { color: '#2a7c46', icon: '🐍', gradient: 'linear-gradient(135deg,#1a472a,#5d8a5e)' },
};

export default function Leaderboards({ user, token }) {
  const [tab, setTab]             = useState('global');   // 'global' | 'houses' | house name
  const [global, setGlobal]       = useState([]);
  const [houses, setHouses]       = useState([]);
  const [houseMembers, setMembers]= useState([]);
  const [loading, setLoading]     = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, hRes] = await Promise.all([
        fetch(`${API}/api/leaderboards/global`, { headers }),
        fetch(`${API}/api/leaderboards/houses`, { headers }),
      ]);
      const [g, h] = await Promise.all([gRes.json(), hRes.json()]);
      setGlobal(Array.isArray(g) ? g : []);
      setHouses(Array.isArray(h) ? h : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const viewHouse = async (houseName) => {
    setTab(houseName);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/leaderboards/house/${houseName}`, { headers });
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const rankMedal = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  return (
    <div className="lb-root">
      <h1 className="page-title">🏆 Leaderboards</h1>
      <p className="page-subtitle">See how you and your house stack up against the competition.</p>

      {/* Tabs */}
      <div className="lb-tabs">
        <button className={`lb-tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>
          🌍 Global
        </button>
        <button className={`lb-tab ${tab === 'houses' ? 'active' : ''}`} onClick={() => setTab('houses')}>
          🏰 Houses
        </button>
        {Object.values(HOUSE_META).map((m, i) => {
          const name = Object.keys(HOUSE_META)[i];
          return (
            <button
              key={name}
              className={`lb-tab ${tab === name ? 'active' : ''}`}
              style={tab === name ? { borderColor: m.color, color: m.color } : {}}
              onClick={() => viewHouse(name)}
            >
              {m.icon} {name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="lb-loading">
          <div className="loader-spinner"></div>
          <p>Loading leaderboard…</p>
        </div>
      ) : (
        <>
          {/* ── Global ── */}
          {tab === 'global' && (
            <div className="lb-table-wrap card">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>House</th>
                    <th>Avg Score</th>
                    <th>Solved</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {global.map(row => {
                    const m = HOUSE_META[row.house] || {};
                    const isMe = row.name === user.name;
                    return (
                      <tr key={row.rank} className={isMe ? 'my-row' : ''}>
                        <td className="rank-cell">{rankMedal(row.rank)}</td>
                        <td className="name-cell">
                          {row.name}
                          {isMe && <span className="you-badge">YOU</span>}
                        </td>
                        <td>
                          <span className="house-tag" style={{ color: m.color || '#a78bfa' }}>
                            {m.icon} {row.house}
                          </span>
                        </td>
                        <td className="score-cell">{row.average_score?.toFixed(1)}</td>
                        <td>{row.problems_solved}</td>
                        <td>{row.submissions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {global.length === 0 && <p className="lb-empty">No students yet.</p>}
            </div>
          )}

          {/* ── Houses ── */}
          {tab === 'houses' && (
            <div className="houses-grid">
              {houses.map(h => {
                const m = HOUSE_META[h.house] || { color: '#6c3de8', icon: '🏰', gradient: 'linear-gradient(135deg,#6c3de8,#a78bfa)' };
                return (
                  <div
                    key={h.house}
                    className="house-card"
                    style={{ '--hcolor': m.color }}
                    onClick={() => viewHouse(h.house)}
                  >
                    <div className="house-card-bg" style={{ background: m.gradient }} />
                    <div className="house-card-content">
                      <div className="hc-rank">{rankMedal(h.rank)}</div>
                      <div className="hc-icon">{m.icon}</div>
                      <h3 className="hc-name">{h.house}</h3>
                      <div className="hc-score">{h.average_score?.toFixed(1)} <span>pts avg</span></div>
                      <div className="hc-meta">
                        <span>👥 {h.members} members</span>
                        <span>📊 {h.total_score?.toFixed(0)} total</span>
                      </div>
                      <button className="hc-view-btn">View Members →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── House Members ── */}
          {!['global', 'houses'].includes(tab) && (
            <>
              <div className="house-member-header">
                <div className="house-back" onClick={() => setTab('houses')}>← Houses</div>
                <h2 style={{ color: HOUSE_META[tab]?.color }}>
                  {HOUSE_META[tab]?.icon} {tab} Members
                </h2>
              </div>
              <div className="lb-table-wrap card">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Avg Score</th>
                      <th>Solved</th>
                      <th>Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houseMembers.map(row => {
                      const isMe = row.name === user.name;
                      return (
                        <tr key={row.rank} className={isMe ? 'my-row' : ''}>
                          <td className="rank-cell">{rankMedal(row.rank)}</td>
                          <td className="name-cell">
                            {row.name}
                            {isMe && <span className="you-badge">YOU</span>}
                          </td>
                          <td className="score-cell">{row.average_score?.toFixed(1)}</td>
                          <td>{row.problems_solved}</td>
                          <td>{row.submissions}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {houseMembers.length === 0 && <p className="lb-empty">No members yet.</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
