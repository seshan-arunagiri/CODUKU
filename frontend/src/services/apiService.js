/**
 * CODUKU API Service
 * Centralized API calls to FastAPI backend
 * Works in both dev mode (proxy via CRA) and production (through NGINX)
 */

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

/**
 * Get JWT token from localStorage
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Handle API responses uniformly
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw error;
  }
  return response.json();
};

/**
 * ============= AUTH ENDPOINTS =============
 */
export const authAPI = {
  register: async (data) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        name: data.username || data.email.split('@')[0],
        username: data.username || data.email.split('@')[0],
        password: data.password,
        house: data.house || 'gryffindor',
      }),
    });
    return handleResponse(response);
  },

  login: async (data) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

/**
 * ============= PROBLEMS / QUESTIONS ENDPOINTS =============
 * Backend serves both /api/v1/problems and /api/v1/questions
 */
export const problemAPI = {
  getAll: async (limit = 100, offset = 0) => {
    // Try /problems first, fallback to /questions
    try {
      const response = await fetch(`${API_BASE}/problems`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (response.ok) return handleResponse(response);
    } catch (e) { /* fall through */ }

    // Fallback to /questions endpoint
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  getById: async (problemId) => {
    try {
      const response = await fetch(`${API_BASE}/problems/${problemId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      if (response.ok) return handleResponse(response);
    } catch (e) { /* fall through */ }

    const response = await fetch(`${API_BASE}/questions/${problemId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

/**
 * ============= SUBMISSION ENDPOINTS =============
 */
export const submissionAPI = {
  /**
   * Submit code for FULL evaluation (all test cases, score counted)
   */
  submit: async (problemId, language, sourceCode, userInfo = {}) => {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: sourceCode,
        user_id: userInfo.id || userInfo.user_id || 'anonymous',
        username: userInfo.username || userInfo.name || 'Anonymous',
        house: userInfo.house || 'gryffindor',
      }),
    });
    return handleResponse(response);
  },

  /**
   * Run code against SAMPLE test cases only (no score, no persistence)
   */
  run: async (problemId, language, sourceCode) => {
    const response = await fetch(`${API_BASE}/submissions/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: sourceCode,
      }),
    });
    return handleResponse(response);
  },

  /**
   * Get submission status by ID
   */
  getStatus: async (submissionId) => {
    const response = await fetch(`${API_BASE}/submissions/${submissionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  /**
   * Get all submissions for current user
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  /**
   * Poll submission status until complete
   */
  pollStatus: async (submissionId, maxAttempts = 120, interval = 500) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await submissionAPI.getStatus(submissionId);
        // submission is complete when status is not 'pending'
        if (result && result.status && result.status !== 'pending') {
          return result;
        }
      } catch (error) {
        console.warn('Poll attempt failed:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    // Timeout — return final status
    return submissionAPI.getStatus(submissionId);
  },
};

/**
 * ============= LEADERBOARD ENDPOINTS =============
 */
export const leaderboardAPI = {
  getGlobal: async (limit = 100) => {
    const response = await fetch(`${API_BASE}/leaderboards/global`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  getHouses: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/houses`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  getHouseMembers: async (houseName) => {
    const response = await fetch(`${API_BASE}/leaderboards/house/${houseName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

/**
 * ============= MENTOR / AI ENDPOINTS =============
 */
export const mentorAPI = {
  getHint: async (problemId, language, code = '') => {
    const response = await fetch(`${API_BASE}/mentor/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: code,
      }),
    });
    return handleResponse(response);
  },

  analyzeCode: async (problemId, language, code) => {
    const response = await fetch(`${API_BASE}/mentor/analyze-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: code,
      }),
    });
    return handleResponse(response);
  },
};

/**
 * ============= WEBSOCKET MANAGER =============
 */
export const wsManager = {
  connect: (userId, onMessage = null, onStatusUpdated = null) => {
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname + (window.location.port ? `:${window.location.port}` : '');
    const wsUrl = `${wsProto}://${wsHost}/ws/leaderboard?user_id=${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('✅ WebSocket connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
        if ((data.type === 'leaderboard_update' || data.event === 'leaderboard_update') && onStatusUpdated) {
          onStatusUpdated(data);
        }
      } catch (e) { /* ignore */ }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return ws;
  },
  ping: (ws) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  },
};

/**
 * ============= LANGUAGE SUPPORT =============
 */
export const languages = [
  { value: 'python3', id: 71, icon: '🐍', label: 'Python 3', monacoLang: 'python' },
  { value: 'cpp', id: 54, icon: '⚙️', label: 'C++', monacoLang: 'cpp' },
  { value: 'java', id: 62, icon: '☕', label: 'Java', monacoLang: 'java' },
  { value: 'javascript', id: 63, icon: '⚡', label: 'JavaScript', monacoLang: 'javascript' },
  { value: 'c', id: 50, icon: '📝', label: 'C', monacoLang: 'c' },
  { value: 'csharp', id: 51, icon: '#️⃣', label: 'C#', monacoLang: 'csharp' },
  { value: 'go', id: 60, icon: '🐹', label: 'Go', monacoLang: 'go' },
  { value: 'rust', id: 73, icon: '🦀', label: 'Rust', monacoLang: 'rust' },
];

/**
 * ============= CODE TEMPLATES =============
 */
export const codeTemplates = {
  python3: `# Write your Python solution here\nimport sys\n\ndef solve():\n    # Read input using input() or sys.stdin\n    line = input()\n    print(line)\n\nsolve()\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    \n    return 0;\n}\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java solution here\n    }\n}\n`,
  javascript: `// Write your JavaScript solution here\nconst readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n    // Process input from lines[]\n});\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    return 0;\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Write your C# solution here\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go solution here\n}\n`,
  rust: `use std::io;\n\nfn main() {\n    // Write your Rust solution here\n}\n`,
};

export default {
  authAPI,
  problemAPI,
  submissionAPI,
  leaderboardAPI,
  mentorAPI,
  wsManager,
  languages,
  codeTemplates,
};
