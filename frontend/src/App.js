import React, { useState, useEffect } from 'react';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CodeEditor from './pages/CodeEditor';
import Leaderboards from './pages/Leaderboards';
import Badges from './pages/Badges';
import AdminPanel from './pages/AdminPanel';
import TeacherDashboard from './pages/TeacherDashboard';
import HouseLogo from './components/HouseLogo';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export { API };

// Magical nav labels per role
const NAV_STUDENT = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'code',         label: 'Code Editor' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'badges',       label: 'Badges' },
];
const NAV_ADMIN = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'code',         label: 'Code Editor' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'badges',       label: 'Badges' },
  { id: 'admin',        label: 'Admin Panel' },
];
const NAV_TEACHER = [
  { id: 'teacher', label: "Teacher Dashboard" },
];

function App() {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [page, setPage]       = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ch_token');
    const savedUser  = localStorage.getItem('ch_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'teacher') setPage('teacher');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('ch_token', accessToken);
    localStorage.setItem('ch_user', JSON.stringify(userData));
    setPage(userData.role === 'teacher' ? 'teacher' : 'dashboard');
  };

  const [compStatus, setCompStatus] = useState({ active: false, question_id: null });

  useEffect(() => {
    const checkComp = async () => {
      try {
        const res = await fetch(`${API}/api/competition/status`);
        const data = await res.json();
        setCompStatus(data);
      } catch (e) {
        console.error("Comp check failed", e);
      }
    };
    if (user) checkComp();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_user');
    setPage('dashboard');
  };

  const enterCompetition = () => {
    setPage('code');
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  };

  if (loading) return (
    <div className="app-loader">
      <div className="loader-cauldron">
        <div className="cauldron-bubble" />
        <div className="cauldron-bubble" />
        <div className="cauldron-bubble" />
      </div>
      <p className="loader-text">Brewing your session…</p>
    </div>
  );

  if (!user || !token) return <AuthPage onLogin={handleLogin} />;

  const navItems = user.role === 'teacher' ? NAV_TEACHER
    : user.role === 'admin' ? NAV_ADMIN
    : NAV_STUDENT;

  const houseColors = {
    Gryffindor: '#ae0001',
    Hufflepuff: '#ecb939',
    Ravenclaw:  '#6375d6',
    Slytherin:  '#2a7c46',
  };
  const houseColor = houseColors[user.house] || '#6c3de8';

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard user={user} token={token} onNavigate={setPage} />;
      case 'code':         return <CodeEditor user={user} token={token} initialQuestionId={compStatus.active ? compStatus.question_id : null} competitionMode={compStatus.active} />;
      case 'leaderboards': return <Leaderboards user={user} token={token} />;
      case 'badges':       return <Badges />;
      case 'admin':        return user.role === 'admin' ? <AdminPanel user={user} token={token} /> : null;
      case 'teacher':      return user.role === 'teacher' ? <TeacherDashboard user={user} token={token} /> : null;
      default:             return user.role === 'teacher'
        ? <TeacherDashboard user={user} token={token} />
        : <Dashboard user={user} token={token} onNavigate={setPage} />;
    }
  };

  return (
    <div className="app" data-house={user.house || 'default'}>
      {/* Background Animated Logo */}
      <div className="bg-house-logo" aria-hidden="true">
        <HouseLogo house={user.house} size={800} />
      </div>

      {/* ── Harry Potter Fantasy Elements ── */}
      <div className="golden-snitch" aria-hidden="true">
        <div className="snitch-wing left" />
        <div className="snitch-wing right" />
      </div>

      {/* Magical floating particles */}
      <div className="magic-particles" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <span key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      {/* ── Navbar ── */}
      <nav className="navbar" style={{ '--house-color': houseColor }}>
        <div className="navbar-brand">
          <HouseLogo house={user.house} size={48} />
          <span className="brand-name">Coduku</span>
        </div>

        <div className="navbar-links">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => !compStatus.active && setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="navbar-user">
          <div className="user-badge" style={{ borderColor: houseColor }}>
            <span className="user-avatar" style={{ background: houseColor }}>
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-house" style={{ color: houseColor }}>{user.house}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* ── Competition Mode Overlay ── */}
      {compStatus.active && page !== 'code' && (
        <div className="comp-overlay-lock">
          <div className="comp-lock-card card-glass">
            <h1 className="comp-lock-title">🧙‍♂️ Competition Active!</h1>
            <p className="comp-lock-msg">A special House Trial is underway ({compStatus.start_hour}:00 - {compStatus.end_hour}:00).</p>
            <p className="comp-lock-sub">All House Ranks are currently frozen and decided ONLY by this competition.</p>
            <button className="comp-start-btn" onClick={enterCompetition}>
              Enter Competition Mode
            </button>
            <p className="comp-lock-warning">Note: Fullscreen will be enforced during the trial.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
