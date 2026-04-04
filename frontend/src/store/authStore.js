import { create } from 'zustand';

/**
 * Zustand Auth Store
 * Manages user authentication state and JWT token
 */
export const useAuthStore = create((set, get) => ({
  // State
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,

  // Actions
  login: (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({
      token,
      user: {
        id: userData.user_id || userData.id,
        username: userData.username,
        email: userData.email || '',
        house: userData.house || 'gryffindor',
        total_score: userData.total_score || 0,
        problems_solved: userData.problems_solved || 0
      },
      error: null
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      error: null
    });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  updateUser: (userData) => {
    set(state => ({
      user: {
        ...state.user,
        ...userData
      }
    }));
    localStorage.setItem('user', JSON.stringify(get().user));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
}));
