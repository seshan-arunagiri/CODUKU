import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userAPI, problemAPI, leaderboardAPI, houseAPI } from '../services/apiService';
import '../styles/DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  
  const [userStats, setUserStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [houseInfo, setHouseInfo] = useState(null);
  const [houseAchievements, setHouseAchievements] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // House colors and emoji
  const houseColors = {
    gryffindor: { primary: '#DC143C', emoji: '🦁' },
    hufflepuff: { primary: '#FFD700', emoji: '🦡' },
    ravenclaw: { primary: '#4169E1', emoji: '🦅' },
    slytherin: { primary: '#228B22', emoji: '🐍' }
  };

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [token, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats
      const stats = await userAPI.getStats(token);
      setUserStats(stats);
      
      // Fetch user profile
      const profile = await userAPI.getProfile(token);
      setUserProfile(profile);
      
      // Fetch house info
      if (user?.house) {
        const house = await houseAPI.getHouse(user.house, token);
        setHouseInfo(house);
        
        const achievements = await houseAPI.getAchievements(user.house, token);
        setHouseAchievements(achievements);
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProblem = () => {
    navigate('/editor');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const house = user?.house || 'gryffindor';
  const houseColor = houseColors[house];

  return (
    <div className="dashboard-container">
      {/* Error notification */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Header with user greeting */}
      <section className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userProfile?.name || user?.username}! {houseColor?.emoji}</h1>
          <p className="tagline">Keep solving problems and climbing the leaderboard!</p>
        </div>
        
        <button onClick={logout} className="logout-btn">Logout</button>
      </section>

      {/* Main content grid */}
      <div className="dashboard-grid">
        {/* Left column - Stats & House */}
        <div className="left-column">
          {/* Quick Stats Card */}
          <section className="stats-card">
            <h2>🎯 Your Stats</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{userProfile?.rank || '-'}</div>
                <div className="stat-label">Global Rank</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{userStats?.total_score || 0}</div>
                <div className="stat-label">Total Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{userStats?.problems_solved || 0}</div>
                <div className="stat-label">Problems Solved</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{userStats?.submissions || 0}</div>
                <div className="stat-label">Submissions</div>
              </div>
            </div>
          </section>

          {/* House Card */}
          <section className="house-card" style={{ borderLeft: `4px solid ${houseColor?.primary}` }}>
            <h2>🏰 {houseInfo?.name ? houseInfo.name.charAt(0).toUpperCase() + houseInfo.name.slice(1) : 'Your House'}</h2>
            <p className="house-description">{houseInfo?.description || 'Join your house and compete!'}</p>
            
            <div className="house-stats">
              <div className="house-stat">
                <span className="label">Members</span>
                <span className="value">{houseInfo?.member_count || 0}</span>
              </div>
              <div className="house-stat">
                <span className="label">House Score</span>
                <span className="value">{houseInfo?.total_score || 0}</span>
              </div>
              <div className="house-stat">
                <span className="label">Avg Score</span>
                <span className="value">{houseInfo?.average_score || 0}</span>
              </div>
            </div>

            <button onClick={() => navigate(`/leaderboard?house=${house}`)} className="view-house-btn">
              View House Leaderboard →
            </button>
          </section>

          {/* Achievements */}
          {houseAchievements.length > 0 && (
            <section className="achievements-card">
              <h2>🏆 House Achievements</h2>
              <div className="achievements-list">
                {houseAchievements.slice(0, 3).map((achievement, idx) => (
                  <div key={idx} className="achievement-item">
                    <span className="achievement-icon">{achievement.icon}</span>
                    <div className="achievement-info">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column - Quick actions & recommendations */}
        <div className="right-column">
          {/* Quick Start Section */}
          <section className="quick-start-card">
            <h2>⚡ Quick Start</h2>
            <div className="quick-actions">
              <button onClick={handleSkipProblem} className="action-btn primary">
                <span className="action-icon">💻</span>
                <span>Start Coding</span>
              </button>
              <button onClick={() => navigate('/leaderboard')} className="action-btn secondary">
                <span className="action-icon">🏆</span>
                <span>View Leaderboards</span>
              </button>
              <button onClick={() => navigate('/editor')} className="action-btn secondary">
                <span className="action-icon">📝</span>
                <span>Practice Problems</span>
              </button>
            </div>
          </section>

          {/* Performance Card */}
          <section className="performance-card">
            <h2>📊 Performance Breakdown</h2>
            <div className="performance-stats">
              <div className="performance-item">
                <span className="label">Accepted</span>
                <span className="value">{userStats?.accepted_submissions || 0}</span>
              </div>
              <div className="performance-item">
                <span className="label">Wrong Answer</span>
                <span className="value">{userStats?.wrong_answer || 0}</span>
              </div>
              <div className="performance-item">
                <span className="label">Runtime Errors</span>
                <span className="value">{userStats?.runtime_errors || 0}</span>
              </div>
              <div className="performance-item">
                <span className="label">Time Limit Exceeded</span>
                <span className="value">{userStats?.time_limit_exceeded || 0}</span>
              </div>
            </div>
          </section>

          {/* Languages Used */}
          {userStats?.languages_used && userStats.languages_used.length > 0 && (
            <section className="languages-card">
              <h2>🔧 Languages Used</h2>
              <div className="language-tags">
                {userStats.languages_used.map((lang, idx) => (
                  <span key={idx} className="language-tag">{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Motivational Message */}
          <section className="motivation-card">
            <h2>💪 Keep Going!</h2>
            <p>
              {userStats?.problems_solved % 10 === 0 
                ? 'Wow! You've solved a milestone number of problems! 🎉' 
                : `Solve ${10 - (userStats?.problems_solved % 10)} more problems to reach the next milestone!`}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
