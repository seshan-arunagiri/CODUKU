import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Play, Send, Clock, Zap, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertCircle, Sparkles, BookOpen, Terminal,
} from 'lucide-react';
import { submissionAPI, problemAPI, languages, codeTemplates } from '../services/apiService';
import { useAuthStore } from '../store/authStore';
import '../styles/CodeArena.css';

/**
 * 🪄 CODUKU Code Arena — LeetCode-Level Editor with Harry Potter Magic
 * Split-screen: Left (Problems) | Center (Description + Editor) | Right (Results)
 * Run = sample tests only, Submit = all tests (sample + hidden)
 * Confetti on Accepted, house theming, smooth animations
 */

// ===== CONFETTI ANIMATION =====
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const colors = [
    '#d32f2f', '#ffd54f', '#fff9c4',
    '#f57f17', '#fbc02d', '#ffeb3b',
    '#1565c0', '#7c4dff', '#90caf9',
    '#00695c', '#26a69a', '#80cbc4',
    '#ffd700', '#ff6b6b', '#c084fc',
  ];

  const particles = [];
  for (let i = 0; i < 300; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 6 + 3,
      w: Math.random() * 12 + 4,
      h: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 18,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 220;

  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rotation += p.rotationSpeed;
      if (frame > maxFrames * 0.7) p.opacity -= 0.025;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (frame < maxFrames) requestAnimationFrame(animate);
    else canvas.remove();
  }
  requestAnimationFrame(animate);
}

// ===== HOUSE COLOR THEMES =====
const HOUSE_THEMES = {
  gryffindor: { primary: '#c8102e', secondary: '#f5c518', glow: 'rgba(200,16,46,0.3)', name: 'Gryffindor' },
  hufflepuff: { primary: '#e4a800', secondary: '#2d2d2d', glow: 'rgba(228,168,0,0.3)', name: 'Hufflepuff' },
  ravenclaw: { primary: '#0e4d92', secondary: '#cd7f32', glow: 'rgba(14,77,146,0.3)', name: 'Ravenclaw' },
  slytherin: { primary: '#1a7a3a', secondary: '#a8b5c8', glow: 'rgba(26,122,58,0.3)', name: 'Slytherin' },
};

/**
 * Map backend status to capitalized verdict for display
 */
function normalizeVerdict(status) {
  if (!status) return 'Unknown';
  const map = {
    'accepted': 'Accepted',
    'wrong_answer': 'Wrong Answer',
    'wrong answer': 'Wrong Answer',
    'runtime_error': 'Runtime Error',
    'runtime error': 'Runtime Error',
    'time_limit_exceeded': 'Time Limit Exceeded',
    'time limit exceeded': 'Time Limit Exceeded',
    'memory_limit_exceeded': 'Memory Limit Exceeded',
    'compilation_error': 'Compilation Error',
    'compilation error': 'Compilation Error',
    'partial': 'Partial',
    'partially correct': 'Partial',
    'system_error': 'System Error',
    'error': 'Error',
    'pending': 'Pending',
  };
  return map[status.toLowerCase()] || status;
}

function CodeArena() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const userHouse = user?.house?.toLowerCase() || 'gryffindor';
  const houseTheme = HOUSE_THEMES[userHouse] || HOUSE_THEMES.gryffindor;

  // State
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [problemsError, setProblemsError] = useState(null);
  const [descCollapsed, setDescCollapsed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hint, setHint] = useState(null);

  const editorRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

  // Redirect if not authenticated
  useEffect(() => {
    if (!token || !user) navigate('/');
  }, [token, user, navigate]);

  // Fetch problems on mount
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setProblemsError(null);
        const res = await problemAPI.getAll(100, 0);
        let problemList = res.problems || res.data || (Array.isArray(res) ? res : []);
        if (!Array.isArray(problemList)) problemList = [];

        setProblems(problemList);
        if (problemList.length > 0) {
          setSelectedProblem(problemList[0]);
          setCode(codeTemplates[language] || '# Write your code here\n');
        } else {
          setProblemsError('No problems available yet. Check back soon!');
        }
      } catch (error) {
        console.error('Failed to fetch problems:', error);
        setProblemsError('Failed to load problems. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change selected problem
  const handleProblemChange = (problem) => {
    setSelectedProblem(problem);
    setCode(codeTemplates[language] || '# Write your code here\n');
    setRunResult(null);
    setSubmitResult(null);
    setHint(null);
  };

  // Change language
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(codeTemplates[lang] || `// Write your ${lang} code here\n`);
  };

  // === RUN (sample test cases only) ===
  const handleRun = async () => {
    if (!selectedProblem || !code.trim()) return;
    setIsRunning(true);
    setRunResult(null);
    setSubmitResult(null);

    try {
      const result = await submissionAPI.run(selectedProblem.id, language, code);
      // Backend returns: { status, verdict, passed, total, test_cases: [{test_case_number, input, expected_output, actual_output, passed, runtime_ms, memory_mb, error}] }
      // Normalize to frontend shape: { passed, total, results: [{verdict, input, expected, output, time, memory}] }
      const rawCases = result.test_cases || [];
      const normalizedResults = rawCases.map((tc) => ({
        verdict: tc.passed ? 'Accepted' : (tc.error ? 'Runtime Error' : 'Wrong Answer'),
        input: tc.input || '',
        expected: tc.expected_output || '',
        output: tc.actual_output || (tc.error ? `Error: ${tc.error}` : '(empty)'),
        time: tc.runtime_ms != null ? (tc.runtime_ms / 1000).toFixed(3) : null,
        memory: tc.memory_mb != null ? Math.round(tc.memory_mb) : null,
      }));

      setRunResult({
        passed: result.passed ?? rawCases.filter(tc => tc.passed).length,
        total: result.total ?? rawCases.length,
        results: normalizedResults,
        type: 'run',
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Run failed:', error);
      setRunResult({
        error: true,
        message: error.detail || error.message || 'Run failed. Check your code.',
        type: 'run',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // === SUBMIT (full evaluation — sample + hidden) ===
  const handleSubmit = async () => {
    if (!selectedProblem || !code.trim()) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setRunResult(null);

    try {
      const res = await submissionAPI.submit(selectedProblem.id, language, code, user);
      // Backend returns: { status: "success", submission: { submission_id, verdict, passed_test_cases, total_test_cases, score, ... } }
      const submission = res.submission || res;
      const verdict = normalizeVerdict(submission.verdict || submission.status || '');

      setSubmitResult({
        verdict,
        test_cases_passed: submission.passed_test_cases ?? submission.test_cases_passed ?? 0,
        test_cases_total: submission.total_test_cases ?? submission.test_cases_total ?? 0,
        score: submission.score || 0,
        message: submission.compilation_error || '',
        execution_time_ms: submission.runtime_ms || 0,
        submitted: true,
        type: 'submit',
        timestamp: new Date().toLocaleTimeString(),
      });

      if (verdict === 'Accepted') launchConfetti();
    } catch (error) {
      console.error('Submit failed:', error);
      let errMsg = typeof error.detail === 'string' ? error.detail : 'Submission failed.';
      if (Array.isArray(error.detail)) {
        errMsg = error.detail.map(e => String(e.msg)).join(', ');
      } else if (error.message) {
        errMsg = error.message;
      }
      setSubmitResult({
        error: true,
        message: errMsg,
        type: 'submit',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // === AI Hint ===
  const handleAskHint = async () => {
    if (!selectedProblem) return;
    setHintLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mentor/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problem_id: selectedProblem.id, language, code }),
      });
      if (res.ok) {
        const data = await res.json();
        setHint(data.hint || data.message || 'Think about the problem step by step. What data structure would help?');
      } else {
        setHint('💡 Think about the problem step by step. What data structure or algorithm would help you solve it efficiently?');
      }
    } catch {
      setHint('💡 Break the problem into smaller parts. Try to identify the pattern and think about edge cases.');
    } finally {
      setHintLoading(false);
    }
  };

  const currentResult = submitResult || runResult;

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="arena-loading">
        <div className="loader"></div>
        <p>Loading magical challenges...</p>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (!selectedProblem && problemsError) {
    return (
      <div className="arena-error">
        <AlertCircle size={48} />
        <h2>⚠️ {problemsError}</h2>
        <button onClick={() => window.location.reload()} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="code-arena-container" style={{ '--house-accent': houseTheme.primary, '--house-glow': houseTheme.glow }}>
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="arena-header"
      >
        <div className="header-left">
          <Zap className="header-icon" size={24} />
          <h1>⚡ Code Arena</h1>
        </div>
        <div className="header-right">
          {/* Language Selector */}
          <select
            className="language-selector"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            id="language-select"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>

          {/* AI Hint Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-hint"
            onClick={handleAskHint}
            disabled={hintLoading || !selectedProblem}
            title="Ask AI Mentor for a hint"
          >
            <Sparkles size={16} />
            {hintLoading ? 'Thinking...' : 'Hint'}
          </motion.button>

          {/* Run Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-run"
            onClick={handleRun}
            disabled={isRunning || !selectedProblem}
            id="btn-run"
          >
            <Play size={16} />
            {isRunning ? 'Running...' : 'Run'}
          </motion.button>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedProblem}
            id="btn-submit"
          >
            <Send size={16} />
            {isSubmitting ? 'Judging...' : 'Submit'}
          </motion.button>
        </div>
      </motion.div>

      {/* ===== MAIN LAYOUT — 3-COLUMN SPLIT ===== */}
      <div className="arena-layout">
        {/* ── LEFT PANEL — PROBLEM LIST ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="panel left-panel"
        >
          <div className="panel-header">
            <BookOpen size={20} className="header-icon" />
            <h2>Problems</h2>
            <span className="badge">{problems.length}</span>
          </div>
          <div className="problems-list">
            {problems.map((problem) => (
              <motion.div
                key={problem.id}
                whileHover={{ x: 4 }}
                onClick={() => handleProblemChange(problem)}
                className={`problem-item ${selectedProblem?.id === problem.id ? 'active' : ''}`}
              >
                <div className="problem-content">
                  <div className="problem-title">
                    <span className="problem-id">#{problem.id}</span> {problem.title}
                  </div>
                  <div className="problem-meta">
                    <span className={`difficulty ${(problem.difficulty || 'easy').toLowerCase()}`}>
                      {problem.difficulty || 'Easy'}
                    </span>
                    <span className="points">⭐ {problem.points || problem.score || 10}</span>
                  </div>
                </div>
                {selectedProblem?.id === problem.id && (
                  <ChevronRight size={18} className="selected-icon" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── CENTER PANEL — DESCRIPTION + EDITOR ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel center-panel"
        >
          {selectedProblem && (
            <>
              {/* Problem Description */}
              <div className={`problem-section ${descCollapsed ? 'collapsed' : ''}`}>
                <div className="section-header" onClick={() => setDescCollapsed(!descCollapsed)} style={{ cursor: 'pointer' }}>
                  <BookOpen size={16} />
                  <span>📖 {selectedProblem.title}</span>
                  <span className={`difficulty ${(selectedProblem.difficulty || 'easy').toLowerCase()}`} style={{ marginLeft: 8 }}>
                    {selectedProblem.difficulty}
                  </span>
                  <span style={{ marginLeft: 'auto' }}>
                    {descCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </span>
                </div>
                {!descCollapsed && (
                  <div className="section-content description-content">
                    <p className="description-text" style={{ whiteSpace: 'pre-line' }}>
                      {selectedProblem.description}
                    </p>

                    {selectedProblem.constraints && (
                      <div className="constraints-box">
                        <strong>Constraints:</strong> {selectedProblem.constraints}
                      </div>
                    )}

                    {selectedProblem.test_cases && selectedProblem.test_cases.length > 0 && (
                      <div className="examples-section">
                        <h3>Examples</h3>
                        {selectedProblem.test_cases.slice(0, 3).map((tc, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="example-block"
                          >
                            <div className="example-section">
                              <span className="label">Input:</span>
                              <code>{tc.input}</code>
                            </div>
                            <div className="example-section">
                              <span className="label">Output:</span>
                              <code>{tc.output || tc.expected}</code>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* AI Hint Display */}
                    <AnimatePresence>
                      {hint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="hint-box"
                        >
                          <div className="hint-header">
                            <Sparkles size={14} /> AI Mentor Hint
                          </div>
                          <p>{hint}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Code Editor */}
              <div className="editor-section">
                <div className="section-header editor-header">
                  <Terminal size={16} />
                  <span>💻 Code Editor</span>
                  <span className="lang-badge">{languages.find(l => l.value === language)?.label || language}</span>
                </div>
                <Editor
                  ref={editorRef}
                  height="100%"
                  language={languages.find(l => l.value === language)?.monacoLang || 'python'}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                    fontLigatures: true,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    wordWrap: 'on',
                    tabSize: 4,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    renderLineHighlight: 'all',
                    bracketPairColorization: { enabled: true },
                    padding: { top: 12 },
                  }}
                />
              </div>
            </>
          )}
        </motion.div>

        {/* ── RIGHT PANEL — RESULTS ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="panel right-panel"
        >
          <div className="panel-header">
            <Terminal size={20} className="header-icon" />
            <h2>Results</h2>
          </div>

          <div className="results-content">
            <AnimatePresence mode="wait">
              {/* Loading state */}
              {(isRunning || isSubmitting) && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="judging-state"
                >
                  <div className="judging-animation">
                    <div className="judging-spinner"></div>
                    <p>⚡ {isSubmitting ? 'Evaluating your spell...' : 'Running sample tests...'}</p>
                    <span className="judging-sub">
                      {isSubmitting ? 'Running against all test cases' : 'Testing with sample inputs'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Results Display */}
              {!isRunning && !isSubmitting && currentResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="results-display"
                >
                  {currentResult.error ? (
                    <div className="result-error">
                      <XCircle size={40} />
                      <h3>Error</h3>
                      <p>{currentResult.message}</p>
                    </div>
                  ) : (
                    <>
                      {/* === RUN RESULT === */}
                      {currentResult.type === 'run' && (
                        <div className="run-result">
                          <div className="result-summary-bar">
                            <div className={`summary-badge ${currentResult.passed === currentResult.total ? 'pass' : 'fail'}`}>
                              {currentResult.passed === currentResult.total ? (
                                <><CheckCircle size={18} /> All Passed</>
                              ) : (
                                <><XCircle size={18} /> {currentResult.passed}/{currentResult.total} Passed</>
                              )}
                            </div>
                            <span className="timestamp">
                              <Clock size={12} /> {currentResult.timestamp}
                            </span>
                          </div>

                          <div className="test-cases-results">
                            {currentResult.results &&
                              currentResult.results.map((res, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.08 }}
                                  className={`test-case-result ${(res.verdict || '').toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  <div className="tc-header">
                                    <span className="tc-number">Test Case {idx + 1}</span>
                                    <span className="tc-verdict">
                                      {res.verdict === 'Accepted' ? (
                                        <CheckCircle size={14} />
                                      ) : (
                                        <XCircle size={14} />
                                      )}
                                      {res.verdict}
                                    </span>
                                  </div>
                                  <div className="tc-content">
                                    <div className="tc-row">
                                      <strong>Input</strong>
                                      <code>{res.input}</code>
                                    </div>
                                    <div className="tc-row">
                                      <strong>Expected</strong>
                                      <code>{res.expected}</code>
                                    </div>
                                    <div className="tc-row">
                                      <strong>Output</strong>
                                      <code className={res.verdict === 'Accepted' ? 'output-pass' : 'output-fail'}>
                                        {res.output || '(empty)'}
                                      </code>
                                    </div>
                                    {res.time && res.time !== '0' && (
                                      <div className="tc-meta">
                                        ⏱ {res.time}s &nbsp;·&nbsp; 💾 {res.memory || '?'}KB
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* === SUBMIT RESULT === */}
                      {currentResult.type === 'submit' && (
                        <div className={`submit-result ${(currentResult.verdict || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="verdict-box"
                          >
                            <div className="verdict-icon">
                              {currentResult.verdict === 'Accepted' && <CheckCircle size={56} />}
                              {currentResult.verdict === 'Wrong Answer' && <XCircle size={56} />}
                              {currentResult.verdict === 'Partial' && <AlertCircle size={56} />}
                              {currentResult.verdict === 'Time Limit Exceeded' && <Clock size={56} />}
                              {currentResult.verdict === 'Runtime Error' && <AlertCircle size={56} />}
                              {currentResult.verdict === 'Compilation Error' && <XCircle size={56} />}
                              {currentResult.verdict === 'Error' && <XCircle size={56} />}
                            </div>
                            <h2 className="verdict-text">{currentResult.verdict}</h2>
                            <p className="passed-count">
                              {currentResult.message || `Passed ${currentResult.test_cases_passed}/${currentResult.test_cases_total} test cases`}
                            </p>
                            {currentResult.score !== undefined && currentResult.score > 0 && (
                              <p className="score-display">
                                +{currentResult.score} points ⭐
                              </p>
                            )}
                            {currentResult.execution_time_ms > 0 && (
                              <p className="time-display">
                                ⏱ {currentResult.execution_time_ms.toFixed(1)}ms
                              </p>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                /* Empty state */
                !isRunning && !isSubmitting && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="empty-state"
                  >
                    <Zap size={40} />
                    <p>✨ Click <strong>Run</strong> to test with sample cases</p>
                    <p>🚀 Click <strong>Submit</strong> for full evaluation</p>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default CodeArena;
