import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { submissionAPI, problemAPI, languages, codeTemplates } from '../services/apiService';
import Editor from '@monaco-editor/react';
import '../styles/CodeEditor.css';

/**
 * Lightweight confetti effect — no external dependency needed
 */
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const particles = [];
  const colors = ['#8b5cf6', '#d946ef', '#f59e0b', '#34d399', '#3b82f6', '#ef4444', '#c4b5fd', '#fcd34d'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 180;

  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rotation += p.rotationSpeed;
      
      if (frame > maxFrames * 0.6) {
        p.opacity -= 0.02;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (frame < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
}

function CodeEditor() {
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
  const editorRef = useRef(null);

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await problemAPI.getAll(100, 0);
      const problemList = res.problems || res.data || (Array.isArray(res) ? res : []);
      setProblems(problemList);
      
      if (problemList.length > 0 && !selected) {
        setSelected(problemList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const fetchUserStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost/api/v1'}/auth/me`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (error) {
      // Stats are optional, fail silently
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchProblems();
    fetchUserStats();
  }, [token, navigate, fetchProblems, fetchUserStats]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(codeTemplates[lang] || '');
  };

  const handleSubmit = async () => {
    if (!code.trim() || !selected) {
      return;
    }

    setSubmitting(true);
    setResult(null);
    setAiFeedback('');

    try {
      const submitRes = await submissionAPI.submit(selected.id, language, code);
      const submissionId = submitRes.submission_id;

      // Poll for results
      const finalResult = await submissionAPI.pollStatus(submissionId, 120, 500);

      setResult({
        status: finalResult.status || 'pending',
        verdict: finalResult.verdict || finalResult.status,
        test_cases_passed: finalResult.test_cases_passed || 0,
        test_cases_total: finalResult.test_cases_total || 0,
        score: finalResult.score || 0,
        runtime_ms: finalResult.runtime_ms || null,
        memory_kb: finalResult.memory_kb || null,
        message: finalResult.message || 'Submission processed',
        details: finalResult.details || [],
        output: finalResult.output || '',
        expected_output: finalResult.expected_output || '',
      });

      // Confetti on accepted!
      if (finalResult.status === 'accepted' || finalResult.verdict === 'AC') {
        launchConfetti();
        fetchUserStats();
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: error.detail || error.message || 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskAI = async () => {
    if (!code.trim() || !selected) return;
    
    setAiLoading(true);
    setAiFeedback('');
    try {
      // Import mentorAPI from apiService if not already (it is imported at the top)
      const { mentorAPI } = await import('../services/apiService');
      const res = await mentorAPI.getHint(selected.id, language, code);
      setAiFeedback(res.analysis || res.hint || 'No specific hints yet. Keep trying!');
    } catch (err) {
      console.error('Mentor error:', err);
      setAiFeedback('🧙 The mentor is currently mediatating. Please try again later.');
    } finally {
      setAiLoading(false);
    }
  };

  const currentLang = languages[language] || languages.python3;

  const getResultIcon = (status) => {
    const icons = {
      'accepted': '✅',
      'wrong_answer': '❌',
      'runtime_error': '💥',
      'time_limit_exceeded': '⏱️',
      'memory_limit_exceeded': '💾',
      'compilation_error': '🔴',
      'error': '💥',
    };
    return icons[status] || '❓';
  };

  const getResultLabel = (status) => {
    const labels = {
      'accepted': 'Accepted!',
      'wrong_answer': 'Wrong Answer',
      'runtime_error': 'Runtime Error',
      'time_limit_exceeded': 'Time Limit Exceeded',
      'memory_limit_exceeded': 'Memory Limit Exceeded',
      'compilation_error': 'Compilation Error',
      'error': 'Error',
      'pending': 'Processing...',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="code-arena">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Summoning challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="code-arena">
      {/* Left sidebar: problems list */}
      <aside className="arena-sidebar" id="problem-sidebar">
        <div className="sidebar-header">
          <h3>📚 Problems</h3>
          {userStats && (
            <div className="sidebar-stats">
              <span className="mini-stat">⭐ {userStats.total_score || userStats.score || 0}</span>
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
                id={`problem-${p.id}`}
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

              {/* Sample test cases */}
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
                          <span className="case-label">Expected Output</span>
                          <pre>{tc.output || tc.expected_output || ''}</pre>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Examples (alternative format) */}
              {selected.examples && selected.examples.length > 0 && (
                <div className="sample-cases">
                  <h4>Examples</h4>
                  {selected.examples.map((ex, idx) => (
                    <div key={idx} className="sample-case">
                      <div className="case-block">
                        <span className="case-label">Input</span>
                        <pre>{ex.input}</pre>
                      </div>
                      <div className="case-block">
                        <span className="case-label">Output</span>
                        <pre>{ex.output}</pre>
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
                        id={`lang-${key}`}
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
                  id="submit-code-btn"
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
                  onMount={(editor) => { editorRef.current = editor; }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    bracketPairColorization: { enabled: true },
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    wordWrap: 'on',
                    tabSize: 4,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                  }}
                />
              </div>
            </div>

            {/* AI Mentor bar */}
            <div className="ai-assistant-panel">
              <button
                className="btn-ai"
                onClick={handleAskAI}
                disabled={aiLoading || !code}
                id="ai-mentor-btn"
              >
                {aiLoading ? '🧙 Thinking...' : '🧙 Ask AI Mentor'}
              </button>
              {aiFeedback && (
                <div className="ai-feedback-box">
                  {aiFeedback}
                </div>
              )}
            </div>

            {/* Results Display */}
            {result && (
              <div className={`result-panel result-${result.status}`} id="result-panel">
                <div className="result-header">
                  <span className="result-status-text">
                    {getResultIcon(result.status)} {getResultLabel(result.status)}
                  </span>
                  {result.score > 0 && (
                    <span className="result-score">+{result.score} pts</span>
                  )}
                </div>

                <p className="result-message">{result.message}</p>

                <div className="result-details">
                  {result.test_cases_total > 0 && (
                    <div className="result-detail">
                      <span className="detail-label">Test Cases</span>
                      <span className="detail-value">
                        {result.test_cases_passed}/{result.test_cases_total}
                      </span>
                    </div>
                  )}
                  {result.runtime_ms && (
                    <div className="result-detail">
                      <span className="detail-label">Runtime</span>
                      <span className="detail-value">{result.runtime_ms}ms</span>
                    </div>
                  )}
                  {result.memory_kb && (
                    <div className="result-detail">
                      <span className="detail-label">Memory</span>
                      <span className="detail-value">{result.memory_kb}KB</span>
                    </div>
                  )}
                </div>

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
            <p>👈 Select a challenge to begin your quest</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
