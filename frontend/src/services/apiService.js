/**
 * CODUKU API Service
 * Centralized API calls to FastAPI microservices via NGINX gateway
 * Base URL: http://localhost/api/v1 (or configured via REACT_APP_API_URL)
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost/api/v1';

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
    const error = await response.json().catch(() => ({}));
    throw error;
  }
  return response.json();
};

/**
 * ============= AUTH ENDPOINTS =============
 */
export const authAPI = {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   * @param {Object} data - { email, username, password, house }
   */
  register: async (data) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        username: data.username || data.email.split('@')[0],
        password: data.password,
        house: data.house || 'gryffindor'
      })
    });
    return handleResponse(response);
  },

  /**
   * Login user
   * POST /api/v1/auth/login
   * @param {Object} data - { email, password }
   */
  login: async (data) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password
      })
    });
    return handleResponse(response);
  },

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  }
};

/**
 * ============= PROBLEMS / QUESTIONS ENDPOINTS =============
 */
export const problemAPI = {
  /**
   * Get all problems
   * GET /api/v1/questions or /api/v1/problems
   * @param {number} limit - Max results (default 100)
   * @param {number} offset - Offset for pagination (default 0)
   */
  getAll: async (limit = 100, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    const response = await fetch(`${API_BASE}/questions?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  /**
   * Get specific problem with test cases
   * GET /api/v1/questions/{id} or /api/v1/problems/{id}
   * @param {number} problemId - Problem ID
   */
  getById: async (problemId) => {
    const response = await fetch(`${API_BASE}/questions/${problemId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  }
};

/**
 * ============= SUBMISSION ENDPOINTS =============
 */
export const submissionAPI = {
  /**
   * Submit code for evaluation
   * POST /api/v1/submissions
   * @param {number} problemId - Problem ID
   * @param {string} language - Language (python3, cpp, java, javascript, etc.)
   * @param {string} sourceCode - Source code to evaluate
   */
  submit: async (problemId, language, sourceCode) => {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        source_code: sourceCode
      })
    });
    return handleResponse(response);
  },

  /**
   * Get submission status by ID
   * GET /api/v1/submissions/{submissionId}
   * @param {string} submissionId - Submission ID
   */
  getStatus: async (submissionId) => {
    const response = await fetch(`${API_BASE}/submissions/${submissionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return handleResponse(response);
  },

  /**
   * Poll submission status until complete
   * Helper function that polls every 500ms up to 120 times (60 seconds)
   * @param {string} submissionId - Submission ID
   * @param {number} maxAttempts - Max polling attempts (default 120)
   * @param {number} interval - Poll interval in ms (default 500)
   */
  pollStatus: async (submissionId, maxAttempts = 120, interval = 500) => {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await submissionAPI.getStatus(submissionId);
      
      // Check if submission is complete (not pending)
      if (result.status && result.status !== 'pending') {
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    // Timeout: return last status
    return submissionAPI.getStatus(submissionId);
  }
};

/**
 * ============= LEADERBOARD ENDPOINTS =============
 */
export const leaderboardAPI = {
  /**
   * Get global leaderboard
   * GET /api/v1/leaderboards/global
   * @param {number} limit - Max results (default 100)
   */
  getGlobal: async (limit = 100) => {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE}/leaderboards/global?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  },

  /**
   * Get house-wise leaderboards
   * GET /api/v1/leaderboards/houses
   */
  getHouses: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/houses`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse(response);
  }
};

/**
 * ============= MENTOR / AI ENDPOINTS (Future) =============
 */
export const mentorAPI = {
  /**
   * Get AI hint for a problem
   * POST /api/v1/mentor/hint
   * @param {number} problemId - Problem ID
   * @param {string} language - Programming language
   * @param {string} code - Current code (optional)
   */
  getHint: async (problemId, language, code = '') => {
    const response = await fetch(`${API_BASE}/mentor/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: code
      })
    });
    return handleResponse(response);
  },

  /**
   * Get AI code analysis
   * POST /api/v1/mentor/analyze-code
   */
  analyzeCode: async (problemId, language, code) => {
    const response = await fetch(`${API_BASE}/mentor/analyze-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        problem_id: problemId,
        language: language,
        code: code
      })
    });
    return handleResponse(response);
  }
};

/**
 * ============= WEBSOCKET MANAGER =============
 * Connect to real-time updates for leaderboard, submissions, etc.
 */
export const wsManager = {
  /**
   * Create WebSocket connection for real-time updates
   * @param {string} userId - User ID
   * @param {Function} onMessage - Callback for messages
   * @param {Function} onStatusUpdated - Callback for submission status updates
   */
  connect: (userId, onMessage = null, onStatusUpdated = null) => {
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname + (window.location.port ? `:${window.location.port}` : '');
    const wsUrl = `${wsProto}://${wsHost}/ws/leaderboard?user_id=${userId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected to leaderboard');
      // Subscribe to leaderboard updates
      ws.send(JSON.stringify({ type: 'subscribe_leaderboard' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Call custom message handler
        if (onMessage) onMessage(data);

        // Handle specific message types
        if (data.type === 'leaderboard_update' && onStatusUpdated) {
          onStatusUpdated(data);
        }
      } catch (e) {
        console.error('❌ Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    return ws;
  },

  /**
   * Send ping to keep connection alive
   */
  ping: (ws) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
};

/**
 * ============= LANGUAGE SUPPORT =============
 */
export const languages = {
  python3: { id: 71, icon: '🐍', name: 'Python', monacoLang: 'python' },
  cpp: { id: 54, icon: '⚙️', name: 'C++', monacoLang: 'cpp' },
  java: { id: 62, icon: '☕', name: 'Java', monacoLang: 'java' },
  javascript: { id: 63, icon: '⚡', name: 'JavaScript', monacoLang: 'javascript' },
  go: { id: 60, icon: '🐹', name: 'Go', monacoLang: 'go' },
  rust: { id: 73, icon: '🦀', name: 'Rust', monacoLang: 'rust' },
  c: { id: 50, icon: '📝', name: 'C', monacoLang: 'c' },
  csharp: { id: 51, icon: '#️⃣', name: 'C#', monacoLang: 'csharp' },
  ruby: { id: 72, icon: '💎', name: 'Ruby', monacoLang: 'ruby' },
  php: { id: 68, icon: '🐘', name: 'PHP', monacoLang: 'php' }
};

/**
 * ============= CODE TEMPLATES =============
 */
export const codeTemplates = {
  python3: `# Write your Python solution here\n\ndef solve():\n    pass\n\nsolve()\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    \n    return 0;\n}\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your Java solution here\n        \n    }\n}\n`,
  javascript: `// Write your JavaScript solution here\n\nfunction solve() {\n    \n}\n\nsolve();\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go solution here\n}\n`,
  rust: `fn main() {\n    // Write your Rust solution here\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    return 0;\n}\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Write your C# solution here\n    }\n}\n`,
  ruby: `# Write your Ruby solution here\n\ndef solve\n  \nend\n\nsolve\n`,
  php: `<?php\n// Write your PHP solution here\n\n?>\n`
};

export default {
  authAPI,
  problemAPI,
  submissionAPI,
  leaderboardAPI,
  mentorAPI,
  wsManager,
  languages,
  codeTemplates
};
