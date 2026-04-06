import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

interface UserStats {
  username: string;
  house: string;
  totalPoints: number;
  problemsSolved: number;
  houseRank: number;
  totalSubmissions: number;
  acceptanceRate: number;
}

interface Submission {
  id: string;
  problemId: number;
  problemTitle: string;
  language: string;
  verdict: string;
  score: number;
  submissionDate: string;
  runtime?: string;
  passedTests?: number;
  totalTests?: number;
}

interface LeaderboardEntry {
  username: string;
  totalScore: number;
  problemsSolved: number;
  houseRank: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'submissions'>('stats');

  const houseColors: Record<string, { bg: string; text: string; crest: string }> = {
    Gryffindor: { bg: '#8B0000', text: '#FFD700', crest: '🦁' },
    Slytherin: { bg: '#1a4d1a', text: '#C0C0C0', crest: '🐍' },
    Hufflepuff: { bg: '#DAA520', text: '#000000', crest: '🦡' },
    Ravenclaw: { bg: '#0047AB', text: '#FFD700', crest: '🦅' },
  };

  const verdictColors: Record<string, string> = {
    Accepted: '#10B981',
    'Wrong Answer': '#EF4444',
    'Runtime Error': '#F97316',
    'Time Limit Exceeded': '#F59E0B',
    Partial: '#8B5CF6',
    'Compilation Error': '#DC2626',
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        const house = localStorage.getItem('house') || 'Unknown';
        const token = localStorage.getItem('token');

        if (!userId) {
          navigate('/login');
          return;
        }

        // Fetch user stats from backend
        const statsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/users/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userStatsData = statsResponse.data.data || {};

        // Fetch leaderboard entry
        const leaderResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/leaderboards/entries?user_id=${userId}`
        );

        const leaderEntry = leaderResponse.data.data?.[0];

        setStats({
          username: username || 'Unknown',
          house: house,
          totalPoints: leaderEntry?.total_score || userStatsData.totalPoints || 0,
          problemsSolved: leaderEntry?.problems_solved || userStatsData.problemsSolved || 0,
          houseRank: userStatsData.houseRank || 0,
          totalSubmissions: userStatsData.totalSubmissions || 0,
          acceptanceRate: userStatsData.acceptanceRate || 0,
        });

        if (leaderEntry) {
          setLeaderboardRank(leaderEntry);
        }

        // Fetch user submissions
        const submissionsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/submissions?user_id=${userId}&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const submissionsData =
          submissionsResponse.data.data?.map((sub: any) => ({
            id: sub.id,
            problemId: sub.problem_id,
            problemTitle: sub.problem_title || `Problem ${sub.problem_id}`,
            language: sub.language,
            verdict: sub.verdict,
            score: sub.score,
            submissionDate: new Date(sub.submitted_at || sub.created_at).toLocaleString(),
            runtime: sub.runtime,
            passedTests: sub.passed_tests,
            totalTests: sub.total_tests,
          })) || [];

        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Use mock data if API fails
        const house = localStorage.getItem('house') || 'Gryffindor';
        setStats({
          username: localStorage.getItem('username') || 'Wizard',
          house: house,
          totalPoints: 45,
          problemsSolved: 4,
          houseRank: 2,
          totalSubmissions: 8,
          acceptanceRate: 50,
        });
        setSubmissions([
          {
            id: '1',
            problemId: 1,
            problemTitle: 'Two Sum',
            language: 'Python',
            verdict: 'Accepted',
            score: 10,
            submissionDate: new Date().toLocaleString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Fetching your magical stats...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="profile-error">Failed to load profile</div>;
  }

  const houseStyle = houseColors[stats.house] || houseColors['Gryffindor'];

  return (
    <div className="profile-container">
      {/* Header with House Crest */}
      <div
        className="profile-header"
        style={{ backgroundColor: houseStyle.bg, color: houseStyle.text }}
      >
        <div className="profile-crest">
          <span className="crest-emoji">{houseStyle.crest}</span>
          <h1 className="profile-house">{stats.house}</h1>
        </div>

        <div className="profile-username">
          <h2>{stats.username}</h2>
          <p className="profile-tagline">Wizard Code Champion</p>
        </div>

        <button
          className="profile-logout-btn"
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <p className="stat-label">Total Points</p>
            <p className="stat-value">{stats.totalPoints}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <p className="stat-label">Problems Solved</p>
            <p className="stat-value">{stats.problemsSolved}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <p className="stat-label">House Rank</p>
            <p className="stat-value">#{stats.houseRank || 'N/A'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Acceptance Rate</p>
            <p className="stat-value">{stats.acceptanceRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          📝 Submissions ({submissions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'stats' && (
          <div className="stats-view">
            <div className="stat-box">
              <h3>📚 Learning Summary</h3>
              <div className="summary-content">
                <p>
                  <strong>Total Submissions:</strong> {stats.totalSubmissions}
                </p>
                <p>
                  <strong>Problems Solved:</strong> {stats.problemsSolved}/8
                </p>
                <p>
                  <strong>Points Earned:</strong> {stats.totalPoints}
                </p>
                <p>
                  <strong>House:</strong> {stats.house} {houseStyle.crest}
                </p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(stats.problemsSolved / 8) * 100}%`,
                      backgroundColor: houseStyle.bg,
                    }}
                  ></div>
                </div>
                <p className="progress-text">
                  {stats.problemsSolved} of 8 problems completed
                </p>
              </div>
            </div>

            {leaderboardRank && (
              <div className="stat-box">
                <h3>🥇 Leaderboard Position</h3>
                <div className="leaderboard-card">
                  <p>
                    <strong>{leaderboardRank.username}</strong>
                  </p>
                  <p className="leaderboard-stats">
                    <span>{leaderboardRank.total_score} points</span>
                    <span>·</span>
                    <span>{leaderboardRank.problems_solved} problems</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="submissions-view">
            {submissions.length === 0 ? (
              <div className="no-submissions">
                <p>🧙‍♂️ No submissions yet. Start coding!</p>
              </div>
            ) : (
              <div className="submissions-list">
                {submissions.map((sub) => (
                  <div key={sub.id} className="submission-card">
                    <div className="submission-header">
                      <h4 className="submission-title">{sub.problemTitle}</h4>
                      <span
                        className="submission-verdict"
                        style={{
                          backgroundColor: verdictColors[sub.verdict] || '#9CA3AF',
                        }}
                      >
                        {sub.verdict}
                      </span>
                    </div>

                    <div className="submission-meta">
                      <span className="meta-item">
                        <strong>Language:</strong> {sub.language}
                      </span>
                      <span className="meta-item">
                        <strong>Score:</strong> {sub.score} pts
                      </span>
                      <span className="meta-item">
                        <strong>Date:</strong> {sub.submissionDate}
                      </span>
                    </div>

                    {sub.totalTests && (
                      <div className="submission-tests">
                        <p>
                          Test Cases: {sub.passedTests}/{sub.totalTests} passed
                        </p>
                        <div className="test-progress">
                          <div
                            className="test-fill"
                            style={{
                              width: `${((sub.passedTests || 0) / (sub.totalTests || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
