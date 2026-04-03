import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CodeEditor from './pages/CodeEditor';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css';

/**
 * Navigation Bar Component
 */
function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const houseEmoji = {
    gryffindor: '🦁',
    hufflepuff: '🦡',
    ravenclaw: '🦅',
    slytherin: '🐍'
  };

  const userHouse = user?.house?.toLowerCase() || 'gryffindor';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="nav-logo">⚡</span>
        <span className="nav-title">CODUKU</span>
      </div>
      <div className="nav-links">
        <button onClick={() => navigate('/dashboard')} className="nav-link">
          <span className="nav-icon">🏠</span>
          Dashboard
        </button>
        <button onClick={() => navigate('/editor')} className="nav-link">
          <span className="nav-icon">💻</span>
          Code Arena
        </button>
        <button onClick={() => navigate('/leaderboard')} className="nav-link">
          <span className="nav-icon">🏆</span>
          Leaderboard
        </button>
      </div>
      <div className="nav-user">
        {user && (
          <>
            <span className={`user-badge house-${userHouse}`}>
              {houseEmoji[userHouse]} {user.username || 'Wizard'}
            </span>
            <span className="user-score">⭐ {user.total_score || 0}</span>
          </>
        )}
        <button onClick={handleLogout} className="nav-logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

/**
 * Protected Layout Wrapper
 */
function ProtectedLayout({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

/**
 * Main App Component
 */
function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedLayout>
              <CodeEditor />
            </ProtectedLayout>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedLayout>
              <LeaderboardPage />
            </ProtectedLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
