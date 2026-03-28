import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import './CodeEditor.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DEFAULT_CODE = {
  python: `def solution(*args):\n    # Write your solution here\n    pass\n`,
  java: `import java.util.*;\n\npublic class Solution {\n    public static Object solution(Object... args) {\n        // Write your solution here\n        return null;\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  javascript: `function solution() {\n    // Write your solution here\n}\n`,
  go: `package main\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n}\n`,
  rust: `fn main() {\n    // Write your solution here\n}\n`,
  ruby: `def solution(*args)\n    # Write your solution here\nend\n`,
  csharp: `using System;\n\nclass Solution {\n    static void Main(string[] args) {\n        // Write your solution here\n    }\n}\n`,
};

export default function CodeEditor({ user, token }) {
  const [questions, setQuestions]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [code, setCode]             = useState(DEFAULT_CODE.python);
  const [language, setLanguage]     = useState('python');
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
    setCode(DEFAULT_CODE[language]);
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
            <Split 
              className="split-horizontal" 
              direction="horizontal" 
              sizes={[40, 60]} 
              minSize={300} 
              gutterSize={8} 
              style={{ display: 'flex', width: '100%', height: '100%' }}
            >
              {/* Problem description Pane */}
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
                {!(error || result) ? (
                  /* If no results, Code Editor takes full right panel */
                  <div className="code-panel card" style={{ height: '100%' }}>
                    {CodePanelContent()}
                  </div>
                ) : (
                  /* If results exist, Split vertically */
                  <Split 
                    direction="vertical" 
                    sizes={[65, 35]} 
                    minSize={100} 
                    gutterSize={8}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div className="code-panel card" style={{ height: '100%' }}>
                      {CodePanelContent()}
                    </div>

                    <div className="result-panel-container card" style={{ height: '100%', overflowY: 'auto' }}>
                      {error && <div className="result-error">⚠️ {error}</div>}
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

  // Helper renderers
  function CodePanelContent() {
    return (
      <>
        <div className="code-header">
          <select
            className="input-field"
            style={{ width: 'auto', padding: '0.2rem 0.5rem', fontWeight: 'bold' }}
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setCode(DEFAULT_CODE[e.target.value]);
            }}
          >
            <option value="python">🐍 Python</option>
            <option value="java">☕ Java</option>
            <option value="c">🅒 C</option>
            <option value="cpp">🟦 C++</option>
            <option value="javascript">🟨 JS</option>
            <option value="go">🐹 Go</option>
            <option value="rust">⚙️ Rust</option>
            <option value="ruby">💎 Ruby</option>
            <option value="csharp">🟣 C#</option>
          </select>
          <button
            className="btn btn-primary submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '⏳ Running…' : '▶ Run & Submit'}
          </button>
        </div>
        <div className="editor-wrapper">
          <Editor
            language={language === 'c' || language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={val => setCode(val)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              scrollBeyondLastLine: false,
              roundedSelection: false,
              padding: { top: 16 }
            }}
          />
        </div>
      </>
    );
  }

  function ResultPanelContent() {
    return (
      <div className="result-panel">
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
    );
  }
}
