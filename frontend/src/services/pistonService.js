/**
 * pistonService.js
 * Free Piston API (https://emkc.org/api/v2/piston) wrapper.
 * Maps our internal language keys to Piston runtime names + versions.
 */

const BACKEND_API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Run code via our own local backend (which handles execution safely).
 * @param {string} language - one of our internal language keys
 * @param {string} code     - source code to execute
 * @param {string} stdin    - optional stdin input
 * @param {string} token    - auth token
 * @returns {{ stdout: string, stderr: string, output: string, error: string|null }}
 */
export async function runCode(language, code, stdin = '', token = '') {
  try {
    const res = await fetch(`${BACKEND_API}/api/execute`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        language,
        code,
        stdin,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { stdout: '', stderr: '', output: '', error: `Execution error (${res.status}): ${err}` };
    }

    const data = await res.json();
    const stdout = data.stdout || '';
    const stderr = data.stderr || '';
    const output = stdout || stderr || '(no output)';

    return { stdout, stderr, output, error: data.error };
  } catch (e) {
    return { stdout: '', stderr: '', output: '', error: `Network error: ${e.message}` };
  }
}


