/**
 * CODUKU API Service
 * Centralized API calls to FastAPI microservices via NGINX gateway
 * Base URL: http://localhost/api/v1 (through NGINX on port 80)
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
 */
export const problemAPI = {
  getAll: async (limit = 100, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    const response = await fetch(`${API_BASE}/problems?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  getById: async (problemId) => {
    const response = await fetch(`${API_BASE}/problems/${problemId}`, {
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
  submit: async (problemId, language, sourceCode) => {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        source_code: sourceCode,
      }),
    });
    return handleResponse(response);
  },

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
        source_code: sourceCode,
      }),
    });
    return handleResponse(response);
  },

  getStatus: async (submissionId) => {
    const response = await fetch(`${API_BASE}/submissions/${submissionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  pollStatus: async (submissionId, maxAttempts = 60, interval = 1000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await submissionAPI.getStatus(submissionId);
      if (result.status && result.status !== 'pending') {
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return submissionAPI.getStatus(submissionId);
  },
};

/**
 * ============= LEADERBOARD ENDPOINTS =============
 */
export const leaderboardAPI = {
  getGlobal: async (limit = 100) => {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE}/leaderboards/global?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  getHouses: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/houses`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
        if (data.type === 'leaderboard_update' && onStatusUpdated) onStatusUpdated(data);
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
 * IMPORTANT: This is an ARRAY for easy .map() iteration in components
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
  python3: `# Write your Python solution here\nimport sys\n\ndef solve():\n    # Read input using input() or sys.stdin\n    pass\n\nsolve()\n`,
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
