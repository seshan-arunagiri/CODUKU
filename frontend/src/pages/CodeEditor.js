import React, { useState, useEffect, useCallback } from 'react';
import './CodeEditor.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULT_CODE = `def solution(*args):
    # Write your solution here
    pass
`;

export default function CodeEditor({ user, token }) {
  const [questions, setQuestions]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [code, setCode]             = useState(DEFAULT_CODE);
  const [language]                  = useState('python');
  const [result, setResult]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingQ, setLoadingQ]     = useState(true);
  const [filterDiff, setFilterDiff] = useState('');
  const [error, setError]           = useState('');

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

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const selectQuestion = async (q) => {
    setSelected(null);
    setResult(null);
    setError('');
    setCode(DEFAULT_CODE);
    try {
      const res  = await fetch(`${API}/api/questions/${q._id}`, { headers });
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      setError('Failed to load question.');
    }
  };

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
      <aside className="editor-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">💻 Problems</h2>
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
          ? <div className="sidebar-loading">Loading…</div>
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

      {/* ── Main area ── */}
      <div className="editor-main">
        {!selected ? (
          <div className="editor-placeholder">
            <div className="placeholder-icon">👈</div>
            <h3>Select a problem to start coding</h3>
            <p>Choose a problem from the list on the left</p>
          </div>
        ) : (
          <>
            {/* Problem description */}
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

            {/* Code editor */}
            <div className="code-panel card">
              <div className="code-header">
                <span className="code-lang">🐍 Python</span>
                <button
                  className="btn btn-primary submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? '⏳ Running…' : '▶ Run & Submit'}
                </button>
              </div>
              <textarea
                className="code-area"
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                rows={18}
              />
            </div>

            {/* Results */}
            {error && <div className="result-error card">⚠️ {error}</div>}

            {result && (
              <div className="result-panel card">
                <div className="result-summary">
                  <div className={`result-badge ${result.passed_tests === result.total_tests ? 'accepted' : 'partial'}`}>
                    {result.passed_tests === result.total_tests ? '✅ Accepted' : '⚠️ Partial'}
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
                      <span className="test-status">{r.passed ? '✅' : '❌'}</span>
                      <span className="test-label">Test {i + 1}</span>
                      {!r.passed && (
                        <div className="test-details">
                          {r.error
                            ? <span className="test-error">{r.error}</span>
                            : <span className="test-diff">Expected: {JSON.stringify(r.expected)} | Got: {JSON.stringify(r.actual)}</span>
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
