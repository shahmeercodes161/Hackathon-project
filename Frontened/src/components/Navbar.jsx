import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, LogIn, UserPlus, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon">
            <Zap size={22} className="brand-svg" />
          </div>
          <span className="brand-text">
            Hack<span className="gradient-text">Project</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="desktop-nav">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Home
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <LayoutDashboard size={17} style={{ marginRight: '6px' }} />
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="desktop-actions">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-badge">
                <div className="avatar-circle">
                  <User size={15} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role || 'User'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Log out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary">
                <UserPlus size={16} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}

          <div className="mobile-divider"></div>

          {isAuthenticated ? (
            <div className="mobile-user-section">
              <div className="mobile-user-name">
                Signed in as <strong>{user?.name}</strong> ({user?.email})
              </div>
              <button onClick={handleLogout} className="btn btn-danger w-full">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="mobile-auth-btns">
              <Link
                to="/login"
                className="btn btn-secondary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={16} /> Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus size={16} /> Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
