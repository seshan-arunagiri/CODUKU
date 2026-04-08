import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from './Profile.module.css';
import SubmissionDetailModal from '@/components/SubmissionDetailModal';

interface UserStats {
  username: string;
  house: string;
  total_points: number;
  problems_solved: number;
  submission_count: number;
  acceptance_rate: number;
  rank: number;
}

interface Submission {
  submission_id: string;
  problem_id: number;
  problem_name: string;
  verdict: string;
  score: number;
  language: string;
  submitted_at: string;
  test_cases_passed: number;
  test_cases_total: number;
}

interface HouseInfo {
  gryffindor: { color: string; bgColor: string; emoji: string };
  slytherin: { color: string; bgColor: string; emoji: string };
  hufflepuff: { color: string; bgColor: string; emoji: string };
  ravenclaw: { color: string; bgColor: string; emoji: string };
}

const HOUSE_INFO: HouseInfo = {
  gryffindor: { color: '#DC143C', bgColor: '#8B0000', emoji: '🦁' },
  slytherin: { color: '#00AA00', bgColor: '#004400', emoji: '🐍' },
  hufflepuff: { color: '#FFD700', bgColor: '#4A4A00', emoji: '🦡' },
  ravenclaw: { color: '#4169E1', bgColor: '#191970', emoji: '🦅' },
};

export default function Profile() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState('All');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('All');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  useEffect(() => {
    if (!token || !user) {
      router.push('/');
      return;
    }

    fetchUserProfile();
    fetchSubmissions();
  }, [token, user]);

  // Filter submissions based on selected filters
  useEffect(() => {
    let filtered = submissions;

    if (selectedVerdictFilter !== 'All') {
      filtered = filtered.filter(s => s.verdict === selectedVerdictFilter);
    }

    if (selectedLanguageFilter !== 'All') {
      filtered = filtered.filter(s => s.language === selectedLanguageFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, selectedVerdictFilter, selectedLanguageFilter]);

  const fetchUserProfile = async () => {
    try {
      const userData = JSON.parse(user || '{}');
      const response = await axios.get('/api/v1/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats({
        username: userData.username,
        house: userData.house,
        total_points: response.data.total_points || 0,
        problems_solved: response.data.problems_solved || 0,
        submission_count: response.data.submission_count || 0,
        acceptance_rate: response.data.acceptance_rate || 0,
        rank: response.data.rank || 999,
      });
    } catch (err: any) {
      logger.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(user || '{}');
      const response = await axios.get('/api/v1/users/submissions', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });

      const subs = response.data.submissions.map((sub: any) => ({
        submission_id: sub.submission_id,
        problem_id: sub.problem_id,
        problem_name: sub.problem_name || 'Unknown Problem',
        verdict: sub.verdict,
        score: sub.score,
        language: sub.language,
        submitted_at: sub.submitted_at,
        test_cases_passed: sub.test_cases_passed || 0,
        test_cases_total: sub.test_cases_total || 0,
      }));

      setSubmissions(subs);
      setFilteredSubmissions(subs);
    } catch (err: any) {
      logger.error('Failed to fetch submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Accepted':
        return '#22c55e';
      case 'Wrong Answer':
        return '#ef4444';
      case 'Runtime Error':
        return '#f97316';
      case 'Time Limit Exceeded':
        return '#eab308';
      case 'Compilation Error':
        return '#d946ef';
      case 'Partially Correct':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const getHouseStyle = () => {
    if (!stats) return HOUSE_INFO.gryffindor;
    const houseLower = stats.house.toLowerCase();
    return HOUSE_INFO[houseLower as keyof HouseInfo] || HOUSE_INFO.gryffindor;
  };

  if (loading && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Loading your magical profile...</p>
        </div>
      </div>
    );
  }

  const houseStyle = getHouseStyle();

  return (
    <div className={styles.container}>
      {/* Header with House Crest */}
      <div
        className={styles.header}
        style={{
          borderBottomColor: houseStyle.color,
          backgroundColor: houseStyle.bgColor + '20',
        }}
      >
        <div className={styles.crest}>
          <div
            className={styles.crestIcon}
            style={{ fontSize: '3rem' }}
          >
            {houseStyle.emoji}
          </div>
          <div className={styles.houseName} style={{ color: houseStyle.color }}>
            {stats?.house}
          </div>
        </div>

        <div className={styles.userInfo}>
          <h1 className={styles.username}>{stats?.username}</h1>
          <div className={styles.housePoints} style={{ color: houseStyle.color }}>
            🏆 House Member
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderTopColor: houseStyle.color }}>
          <div className={styles.statValue} style={{ color: houseStyle.color }}>
            {stats?.total_points || 0}
          </div>
          <div className={styles.statLabel}>Total Points</div>
        </div>

        <div className={styles.statCard} style={{ borderTopColor: houseStyle.color }}>
          <div className={styles.statValue} style={{ color: houseStyle.color }}>
            {stats?.problems_solved || 0}
          </div>
          <div className={styles.statLabel}>Problems Solved</div>
        </div>

        <div className={styles.statCard} style={{ borderTopColor: houseStyle.color }}>
          <div className={styles.statValue} style={{ color: houseStyle.color }}>
            #{stats?.rank || 'N/A'}
          </div>
          <div className={styles.statLabel}>House Rank</div>
        </div>

        <div className={styles.statCard} style={{ borderTopColor: houseStyle.color }}>
          <div className={styles.statValue} style={{ color: houseStyle.color }}>
            {stats?.acceptance_rate || 0}%
          </div>
          <div className={styles.statLabel}>Acceptance Rate</div>
        </div>
      </div>

      {/* Submission History */}
      <div className={styles.submissionsSection}>
        <h2 className={styles.sectionTitle}>Submission History</h2>

        {/* Filters */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Verdict:</label>
            <select
              value={selectedVerdictFilter}
              onChange={e => setSelectedVerdictFilter(e.target.value)}
              className={styles.filterSelect}
              style={{ borderColor: houseStyle.color }}
            >
              <option>All</option>
              <option>Accepted</option>
              <option>Wrong Answer</option>
              <option>Runtime Error</option>
              <option>Time Limit Exceeded</option>
              <option>Compilation Error</option>
              <option>Partially Correct</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Language:</label>
            <select
              value={selectedLanguageFilter}
              onChange={e => setSelectedLanguageFilter(e.target.value)}
              className={styles.filterSelect}
              style={{ borderColor: houseStyle.color }}
            >
              <option>All</option>
              <option>python</option>
              <option>java</option>
              <option>cpp</option>
              <option>javascript</option>
              <option>go</option>
              <option>rust</option>
              <option>csharp</option>
            </select>
          </div>

          <div className={styles.submissionCount}>
            {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p>No submissions found. Start solving problems!</p>
          </div>
        ) : (
          <div className={styles.submissionsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell} style={{ flex: 2 }}>
                Problem
              </div>
              <div className={styles.tableCell} style={{ flex: 1 }}>
                Verdict
              </div>
              <div className={styles.tableCell} style={{ flex: 1 }}>
                Language
              </div>
              <div className={styles.tableCell} style={{ flex: 1 }}>
                Score
              </div>
              <div className={styles.tableCell} style={{ flex: 1 }}>
                Tests
              </div>
              <div className={styles.tableCell} style={{ flex: 1.5 }}>
                Date
              </div>
              <div className={styles.tableCell} style={{ flex: 0.8 }}>
                Action
              </div>
            </div>

            {filteredSubmissions.map(submission => (
              <div key={submission.submission_id} className={styles.tableRow}>
                <div className={styles.tableCell} style={{ flex: 2 }}>
                  <span className={styles.problemName}>
                    #{submission.problem_id}
                  </span>
                </div>

                <div className={styles.tableCell} style={{ flex: 1 }}>
                  <span
                    className={styles.verdictBadge}
                    style={{
                      backgroundColor: getVerdictColor(submission.verdict) + '20',
                      color: getVerdictColor(submission.verdict),
                      borderColor: getVerdictColor(submission.verdict),
                    }}
                  >
                    {submission.verdict}
                  </span>
                </div>

                <div className={styles.tableCell} style={{ flex: 1 }}>
                  <span className={styles.language}>{submission.language}</span>
                </div>

                <div className={styles.tableCell} style={{ flex: 1 }}>
                  <span className={styles.score}>{submission.score}</span>
                </div>

                <div className={styles.tableCell} style={{ flex: 1 }}>
                  <span className={styles.tests}>
                    {submission.test_cases_passed}/{submission.test_cases_total}
                  </span>
                </div>

                <div className={styles.tableCell} style={{ flex: 1.5 }}>
                  <span className={styles.date}>
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>

                <div className={styles.tableCell} style={{ flex: 0.8 }}>
                  <button
                    className={styles.viewButton}
                    onClick={() => handleViewDetails(submission)}
                    style={{ color: houseStyle.color }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubmission(null);
          }}
          houseColor={houseStyle.color}
        />
      )}
    </div>
  );
}

// Simple logger for debugging
const logger = {
  error: (msg: string, err: any) => console.error(`[Profile] ${msg}`, err),
  info: (msg: string, data?: any) => console.log(`[Profile] ${msg}`, data),
};
