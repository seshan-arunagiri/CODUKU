import React, { useState, useEffect } from 'react';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CodeEditor from './pages/CodeEditor';
import Leaderboards from './pages/Leaderboards';
import AdminPanel from './pages/AdminPanel';
import TeacherDashboard from './pages/TeacherDashboard';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export { API };

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
      if (parsedUser.role === 'teacher') {
        setPage('teacher');
      }
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

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ch_token');
    localStorage.removeItem('ch_user');
    setPage('dashboard');
  };

  if (loading) return (
    <div className="app-loader">
      <div className="loader-spinner"></div>
      <p>Loading CodeHouses…</p>
    </div>
  );

  if (!user || !token) return <AuthPage onLogin={handleLogin} />;

  let navItems = [];
  if (user.role === 'teacher') {
    navItems = [
      { id: 'teacher', label: '🧑‍🏫 Dashboard' }
    ];
  } else if (user.role === 'admin') {
    navItems = [
      { id: 'dashboard',    label: '🏠 Dashboard' },
      { id: 'code',         label: '💻 Problems' },
      { id: 'leaderboards', label: '🏆 Leaderboards' },
      { id: 'admin', label: '⚙️ Admin' }
    ];
  } else {
    navItems = [
      { id: 'dashboard',    label: '🏠 Dashboard' },
      { id: 'code',         label: '💻 Problems' },
      { id: 'leaderboards', label: '🏆 Leaderboards' },
    ];
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard user={user} token={token} onNavigate={setPage} />;
      case 'code':         return <CodeEditor user={user} token={token} />;
      case 'leaderboards': return <Leaderboards user={user} token={token} />;
      case 'admin':        return user.role === 'admin' ? <AdminPanel user={user} token={token} /> : null;
      case 'teacher':      return user.role === 'teacher' ? <TeacherDashboard user={user} token={token} /> : null;
      default:             return user.role === 'teacher' ? <TeacherDashboard user={user} token={token} /> : <Dashboard user={user} token={token} onNavigate={setPage} />;
    }
  };

  const houseColors = {
    Gryffindor: '#ae0001',
    Hufflepuff:  '#ecb939',
    Ravenclaw:   '#0e1a40',
    Slytherin:   '#1a472a',
  };
  const houseColor = houseColors[user.house] || '#6c3de8';

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🏰</span>
          <span className="brand-name">CodeHouses</span>
        </div>

        <div className="navbar-links">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
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
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
