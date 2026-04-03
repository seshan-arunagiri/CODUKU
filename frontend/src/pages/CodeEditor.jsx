import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { submissionAPI, problemAPI, languages, codeTemplates } from '../services/apiService';
import Editor from '@monaco-editor/react';
import '../styles/CodeEditor.css';

function CodeEditor() {
  // State management
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState(codeTemplates.python3);
  const [language, setLanguage] = useState('python3');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  /**
   * Fetch all problems
   */
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await problemAPI.getAll(100, 0);
      
      // Handle different response formats
      const problemList = res.problems || res.data || [];
      setProblems(problemList);
      
      // Auto-select first problem
      if (problemList.length > 0 && !selected) {
        setSelected(problemList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  /**
   * Get current user stats
   */
  const fetchUserStats = useCallback(async () => {
    try {
      // Note: This endpoint might not exist yet, so we try and fail gracefully
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost/api/v1'}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (error) {
      console.warn('Failed to fetch user stats (optional):', error);
    }
  }, [token]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchProblems();
    fetchUserStats();
  }, [token, navigate, fetchProblems, fetchUserStats]);

  /**
   * Handle language change
   */
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(codeTemplates[lang] || '');
  };

  /**
   * CRITICAL: Handle code submission
   */
  const handleSubmit = async () => {
    if (!code.trim() || !selected) {
      alert('Please write code and select a problem');
      return;
    }

    setSubmitting(true);
    setResult(null);
    setAiFeedback('');

    try {
      // Step 1: Submit code
      console.log('📤 Submitting code:', {
        problemId: selected.id,
        language,
        codeLength: code.length
      });

      const submitRes = await submissionAPI.submit(
        selected.id,
        language,
        code
      );

      const submissionId = submitRes.submission_id;
      console.log('✅ Submission received:', submissionId);

      // Step 2: Poll for results (up to 120 times, every 500ms = 60 seconds max)
      console.log('⏳ Polling for results...');
      const finalResult = await submissionAPI.pollStatus(submissionId, 120, 500);

      console.log('🎯 Got result:', finalResult);

      // Step 3: Display result
      setResult({
        status: finalResult.status || 'pending',
        test_cases_passed: finalResult.test_cases_passed || 0,
        test_cases_total: finalResult.test_cases_total || 0,
        score: finalResult.score || 0,
        message: finalResult.message || 'Submission processed',
        details: finalResult.details || []
      });

      // Refresh stats if submission was accepted
      if (finalResult.status === 'accepted') {
        fetchUserStats();
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      setResult({
        status: 'error',
        message: error.detail || error.message || 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Ask AI for code analysis (optional feature)
   */
  const handleAskAI = async () => {
    // This is optional - implement when mentor service is ready
    setAiLoading(true);
    setAiFeedback('');
    
    try {
      setAiFeedback('🤖 AI Mentor is processing your code... (coming soon)');
    } catch (err) {
      setAiFeedback('AI Mentor is currently unavailable. Try again later!');
    } finally {
      setAiLoading(false);
    }
  };

  const currentLang = languages[language] || languages.python3;

  if (loading) {
    return (
      <div className="code-arena">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-arena">
      {/* Left sidebar: problems list */}
      <aside className="arena-sidebar">
        <div className="sidebar-header">
          <h3>📚 Problems</h3>
          {userStats && (
            <div className="sidebar-stats">
              <span className="mini-stat">⭐ {userStats.total_score || 0}</span>
              <span className="mini-stat">✅ {userStats.problems_solved || 0}</span>
            </div>
          )}
        </div>

        <div className="problems-list">
          {problems.length === 0 ? (
            <p className="empty-problems">No problems available yet.</p>
          ) : (
            problems.map((p, idx) => (
              <button
                key={p.id}
                className={`problem-card ${selected?.id === p.id ? 'active' : ''}`}
                onClick={() => {
                  setSelected(p);
                  setResult(null);
                }}
                title={p.title}
              >
                <div className="problem-card-top">
                  <span className="problem-num">#{idx + 1}</span>
                  <span className={`diff-pill ${(p.difficulty || 'easy').toLowerCase()}`}>
                    {p.difficulty || 'Easy'}
                  </span>
                </div>
                <h4 className="problem-card-title">{p.title}</h4>
                <span className="problem-card-score">{p.score || 0} pts</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main editor area */}
      <div className="arena-main">
        {selected ? (
          <>
            {/* Problem description */}
            <div className="problem-desc-panel">
              <div className="problem-desc-header">
                <div>
                  <h2>{selected.title}</h2>
                  <div className="problem-desc-meta">
                    <span className={`diff-pill ${(selected.difficulty || 'easy').toLowerCase()}`}>
                      {selected.difficulty || 'Easy'}
                    </span>
                    <span className="meta-item">⏱️ {selected.time_limit || 5}s</span>
                    <span className="meta-item">💾 {selected.memory_limit || 256}MB</span>
                    <span className="meta-item">⭐ {selected.score || 0} pts</span>
                  </div>
                </div>
              </div>

              <p className="problem-desc-text">
                {selected.description || 'No description available.'}
              </p>

              {/* Show sample test cases if available */}
              {selected.test_cases && selected.test_cases.length > 0 && (
                <div className="sample-cases">
                  <h4>Sample Test Cases</h4>
                  {selected.test_cases
                    .filter(tc => tc.visible !== false)
                    .slice(0, 2)
                    .map((tc, idx) => (
                      <div key={idx} className="sample-case">
                        <div className="case-block">
                          <span className="case-label">Input</span>
                          <pre>{tc.input || tc.stdin || ''}</pre>
                        </div>
                        <div className="case-block">
                          <span className="case-label">Output</span>
                          <pre>{tc.output || tc.expected_output || ''}</pre>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Language selector + Editor */}
            <div className="editor-section">
              <div className="editor-toolbar">
                <div className="lang-tabs">
                  {['python3', 'cpp', 'java', 'javascript', 'go'].map(key => {
                    const lang = languages[key];
                    return (
                      <button
                        key={key}
                        className={`lang-tab ${language === key ? 'active' : ''}`}
                        onClick={() => handleLanguageChange(key)}
                        title={lang.name}
                      >
                        <span>{lang.icon}</span> {lang.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Evaluating...
                    </>
                  ) : (
                    <>✨ Submit Code</>
                  )}
                </button>
              </div>

              <div className="monaco-wrap">
                <Editor
                  height="100%"
                  language={currentLang.monacoLang}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v || '')}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    bracketPairColorization: { enabled: true },
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>

            {/* AI Assistant (optional) */}
            <div className="ai-assistant-panel">
              <button
                className="btn-ai"
                onClick={handleAskAI}
                disabled={aiLoading || !code}
              >
                {aiLoading ? '✨ AI is thinking...' : '✨ Ask AI Mentor'}
              </button>
              {aiFeedback && (
                <div className="ai-feedback-box">
                  <strong>🤖 Mentor:</strong> {aiFeedback}
                </div>
              )}
            </div>

            {/* Results Display */}
            {result && (
              <div className={`result-panel result-${result.status}`}>
                <div className="result-header">
                  <span className="result-status-text">
                    {result.status === 'accepted' ? '✅ Accepted!' :
                     result.status === 'wrong_answer' ? '❌ Wrong Answer' :
                     result.status === 'runtime_error' ? '💥 Runtime Error' :
                     result.status === 'time_limit_exceeded' ? '⏱️ Time Limit Exceeded' :
                     result.status === 'memory_limit_exceeded' ? '💾 Memory Limit Exceeded' :
                     result.status === 'error' ? '💥 Error' :
                     '❓ ' + result.status}
                  </span>
                  {result.score > 0 && (
                    <span className="result-score">+{result.score} pts</span>
                  )}
                </div>

                <p className="result-message">{result.message}</p>

                {result.test_cases_total > 0 && (
                  <div className="result-details">
                    <div className="result-detail">
                      <span className="detail-label">Test Cases Passed</span>
                      <span className="detail-value">
                        {result.test_cases_passed}/{result.test_cases_total}
                      </span>
                    </div>
                  </div>
                )}

                {result.details && result.details.length > 0 && (
                  <div className="result-test-details">
                    <h4>Test Case Details</h4>
                    {result.details.slice(0, 5).map((detail, idx) => (
                      <div key={idx} className="test-detail-item">
                        <strong>Test {idx + 1}:</strong> {detail.status || 'pending'}
                        {detail.time && <span> ({detail.time}ms)</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="no-problem-selected">
            <p>👈 Select a problem to start coding</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
