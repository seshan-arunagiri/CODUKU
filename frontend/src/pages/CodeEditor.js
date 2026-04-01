import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import './CodeEditor.css';
import { runCode } from '../services/pistonService';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULT_CODE = {
  python:     `def solution(*args):\n    # Write your code here\n    pass\n`,
  java:       `import java.util.*;\n\npublic class Solution {\n    public static Object solution(Object... args) {\n        // Write your code here\n        return null;\n    }\n}\n`,
  c:          `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n`,
  cpp:        `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n`,
  javascript: `function solution() {\n    // Write your code here\n}\n`,
  go:         `package main\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n    fmt.Println("Hello from Go!")\n}\n`,
  rust:       `fn main() {\n    // Write your code here\n    println!("Hello from Rust!");\n}\n`,
  ruby:       `def solution(*args)\n    # Write your code here\nend\n`,
  csharp:     `using System;\n\nclass Solution {\n    static void Main(string[] args) {\n        // Write your code here\n    }\n}\n`,
};

const LANG_LABELS = {
  python:     'Python',
  java:       'Java',
  c:          'C',
  cpp:        'C++',
  javascript: 'JavaScript',
  go:         'Go',
  rust:       'Rust',
  ruby:       'Ruby',
  csharp:     'C#',
};

export default function CodeEditor({ user, token, initialQuestionId = null, competitionMode = false }) {
  const [questions, setQuestions]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [code, setCode]             = useState(DEFAULT_CODE.python);
  const [language, setLanguage]     = useState('python');
  const [result, setResult]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQ, setLoadingQ]     = useState(true);
  const [filterDiff, setFilterDiff] = useState('');
  const [error, setError]           = useState('');

  // Piston "Test Spell" state
  const [testOutput, setTestOutput] = useState(null);
  const [testing, setTesting]       = useState(false);
  const [testError, setTestError]   = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchQuestions = useCallback(async () => {
    setLoadingQ(true);
    try {
      const url = filterDiff
        ? `${API}/api/questions?difficulty=${filterDiff}`
        : `${API}/api/questions`;
      const res  = await fetch(url, { headers });
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQ(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterDiff]);

  useEffect(() => { 
    if (competitionMode && initialQuestionId) {
      // Direct load competition q
      const qObj = questions.find(q => q._id === initialQuestionId);
      if (qObj) selectQuestion(qObj);
    } else {
      fetchQuestions(); 
    }
  }, [fetchQuestions, competitionMode, initialQuestionId]);

  // Anti-Cheat logic
  useEffect(() => {
    if (!competitionMode) return;
    
    const handleVis = () => {
      if (document.hidden) {
        alert("🧙‍♂️ The Great Hall warns you: Tab switching is strictly forbidden during a competition! Further attempts will be reported.");
      }
    };
    
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, [competitionMode]);

  const selectQuestion = async (q) => {
    setSelected(null);
    setResult(null);
    setTestOutput(null);
    setError('');
    setTestError('');
    setCode(DEFAULT_CODE[language]);
    try {
      const res  = await fetch(`${API}/api/questions/${q._id}`, { headers });
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      setError('Failed to load the problem.');
    }
  };

  // ── Test Spell via Piston API (free, no backend) ──
  const handleTestSpell = async () => {
    setTesting(true);
    setTestOutput(null);
    setTestError('');
    const { stdout, stderr, error: pistonErr } = await runCode(language, code, '', token);
    if (pistonErr) {
      setTestError(pistonErr);
    } else {
      setTestOutput({ stdout, stderr });
    }
    setTesting(false);
  };

  // ── Official Submit for Scoring ──
  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const res  = await fetch(`${API}/api/submit`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: selected._id, code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const diffClass = (d) => ({ Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[d] || '');

  return (
    <div className="editor-layout">
      {/* ── Sidebar: question list ── */}
      {!competitionMode && (
        <aside className="editor-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Problems</h2>
            <div className="diff-filters">
              {['', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  className={`diff-btn ${filterDiff === d ? 'active' : ''}`}
                  onClick={() => setFilterDiff(d)}
                >
                  {d || 'All'}
                </button>
              ))}
            </div>
          </div>

        {loadingQ
          ? <div className="sidebar-loading">Loading problems...</div>
          : questions.length === 0
            ? <div className="sidebar-empty">No problems found.</div>
            : (
              <div className="q-list">
                {questions.map(q => (
                  <div
                    key={q._id}
                    className={`q-item ${selected?._id === q._id ? 'active' : ''}`}
                    onClick={() => selectQuestion(q)}
                  >
                    <div className="q-item-top">
                      <span className="q-title">{q.title}</span>
                      <span className={`badge ${diffClass(q.difficulty)}`}>{q.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
        }
        </aside>
      )}

      {/* ── Main area ── */}
      <div className={`editor-main ${competitionMode ? 'full-width' : ''}`}>
        {!selected ? (
          <div className="editor-placeholder">
            <div className="placeholder-icon">💻</div>
            <h3>Select a Problem</h3>
            <p>Choose a problem from the list on the left to begin coding</p>
            <div className="placeholder-sparkles">
              {[...Array(5)].map((_, i) => <span key={i} className="sparkle" style={{ '--si': i }} />)}
            </div>
          </div>
        ) : (
          <>
            <Split
              className="split-horizontal"
              direction="horizontal"
              sizes={[40, 60]}
              minSize={300}
              gutterSize={8}
              style={{ display: 'flex', width: '100%', height: '100%' }}
            >
              {/* Problem Description Pane */}
              <div className="problem-panel card">
                <div className="problem-header">
                  <h2 className="problem-title">{selected.title}</h2>
                  <div className="problem-meta">
                    <span className={`badge ${diffClass(selected.difficulty)}`}>{selected.difficulty}</span>
                    <span className="meta-chip">⏱ {selected.time_limit}s</span>
                    <span className="meta-chip">💾 {selected.memory_limit}MB</span>
                  </div>
                </div>
                <p className="problem-desc">{selected.description}</p>

                {selected.sample_test_cases && selected.sample_test_cases.length > 0 && (
                  <div className="sample-cases">
                    <h4 className="sample-title">Sample Input</h4>
                    {selected.sample_test_cases.map((tc, i) => (
                      <div key={i} className="sample-case">
                        <code className="sample-input">
                          {typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code + Console Pane */}
              <div className="right-panel" style={{ height: '100%' }}>
                {!(error || result || testOutput || testError) ? (
                  <div className="code-panel card" style={{ height: '100%' }}>
                    {CodePanelContent()}
                  </div>
                ) : (
                  <Split
                    direction="vertical"
                    sizes={[60, 40]}
                    minSize={80}
                    gutterSize={8}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div className="code-panel card" style={{ height: '100%' }}>
                      {CodePanelContent()}
                    </div>
                    <div className="result-panel-container card" style={{ height: '100%', overflowY: 'auto' }}>
                      {error && <div className="result-error">Error: {error}</div>}
                      {testError && <div className="result-error">Test Error: {testError}</div>}
                      {testOutput && TestOutputContent()}
                      {result && ResultPanelContent()}
                    </div>
                  </Split>
                )}
              </div>
            </Split>
          </>
        )}
      </div>
    </div>
  );

  function CodePanelContent() {
    return (
      <>
        <div className="code-header">
          <select
            className="input-field lang-select"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode(DEFAULT_CODE[e.target.value]);
            }}
          >
            {Object.entries(LANG_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <div className="code-actions">
            <button
              className="btn btn-test"
              onClick={handleTestSpell}
              disabled={testing}
              title="Run code instantly via free Piston API (no scoring)"
            >
              {testing ? 'Testing...' : 'Run Code'}
            </button>
            <button
              className="btn btn-primary submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              title="Submit for official scoring"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        <div className="editor-wrapper">
          <Editor
            language={language === 'c' || language === 'cpp' ? 'cpp' : language === 'csharp' ? 'csharp' : language}
            theme="vs-dark"
            value={code}
            onChange={val => setCode(val)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              roundedSelection: false,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'gutter',
              smoothScrolling: true,
            }}
          />
        </div>
      </>
    );
  }

  function TestOutputContent() {
    const hasStdout = testOutput.stdout && testOutput.stdout.trim();
    const hasStderr = testOutput.stderr && testOutput.stderr.trim();
    return (
      <div className="test-output-panel">
        <div className="test-output-header">
          <span className="test-output-badge">Run Result</span>
          <span className="test-output-note">Free preview — not scored</span>
        </div>
        {hasStdout && (
          <div className="test-output-block stdout">
            <div className="output-label">stdout</div>
            <pre className="output-pre">{testOutput.stdout}</pre>
          </div>
        )}
        {hasStderr && (
          <div className="test-output-block stderr">
            <div className="output-label">stderr</div>
            <pre className="output-pre output-err">{testOutput.stderr}</pre>
          </div>
        )}
        {!hasStdout && !hasStderr && (
          <p className="output-empty">Code ran with no output.</p>
        )}
      </div>
    );
  }

  function ResultPanelContent() {
    const allPassed = result.passed_tests === result.total_tests;
    return (
      <div className="result-panel">
        <div className="result-summary">
          <div className={`result-badge ${allPassed ? 'accepted' : 'partial'}`}>
            {allPassed ? 'Accepted' : 'Partial'}
          </div>
          <div className="result-stats">
            <span>Score: <strong>{result.score?.toFixed(2)}</strong></span>
            <span>Tests: <strong>{result.passed_tests}/{result.total_tests}</strong></span>
            <span>Time: <strong>{result.execution_time}s</strong></span>
          </div>
        </div>

        <div className="test-results">
          {result.execution_result?.map((r, i) => (
            <div key={i} className={`test-row ${r.passed ? 'pass' : 'fail'}`}>
              <span className="test-status">{r.passed ? 'Pass' : 'Fail'}</span>
              <span className="test-label">Test {i + 1}</span>
              {!r.passed && (
                <div className="test-details">
                  {r.error
                    ? <span className="test-error"><strong>Error:</strong> {r.error}</span>
                    : <span className="test-diff">Expected: {JSON.stringify(r.expected)} | Got: {JSON.stringify(r.actual)}</span>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
