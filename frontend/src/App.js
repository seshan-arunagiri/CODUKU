import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CodeEditor from './pages/CodeEditor';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css';

/**
 * Floating magical particles background
 */
function MagicParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
      size: `${2 + Math.random() * 3}px`,
      opacity: 0.15 + Math.random() * 0.3,
      color: ['#8b5cf6', '#d946ef', '#3b82f6', '#f59e0b', '#34d399'][Math.floor(Math.random() * 5)],
    }));
  }, []);

  return (
    <div className="magic-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Navigation Bar Component
 */
function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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

  const navLinks = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/editor', icon: '⚔️', label: 'Code Arena' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('/dashboard')}>
        <span className="nav-logo">⚡</span>
        <span className="nav-title">CODUKU</span>
      </div>
      <div className="nav-links">
        {navLinks.map(link => (
          <button 
            key={link.path}
            onClick={() => navigate(link.path)} 
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </button>
        ))}
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
        <button onClick={handleLogout} className="nav-logout-btn" id="logout-btn">
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
      <MagicParticles />
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
