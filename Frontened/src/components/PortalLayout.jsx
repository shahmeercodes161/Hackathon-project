import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../utils/roleAccess';
import {
  Compass,
  Users,
  CalendarDays,
  Building,
  FileBarChart,
  Sparkles,
  Settings,
  Search,
  HelpCircle,
  Bell,
  LogOut,
  User,
  Shield,
  CreditCard,
  CalendarCheck,
  Megaphone,
} from 'lucide-react';
import './PortalLayout.css';

export default function PortalLayout({ children, onOpenAi }) {
  const { user, role, companyName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials for avatar badge e.g. "AD" or "SS"
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="figma-portal-shell">
      {/* 1. Left Dark Navy Sidebar */}
      <aside className="figma-sidebar">
        {/* Brand Logo */}
        <div className="figma-brand-box">
          <div className="figma-brand-logo">H</div>
          <span className="figma-brand-name">HCM Lite</span>
        </div>

        {/* Section 1: People Operations */}
        <div className="figma-nav-section">
          <span className="figma-nav-header">PEOPLE OPERATIONS</span>
          <nav className="figma-nav-list">
            {canAccessRoute(role, '/dashboard') && (
              <Link
                to="/dashboard"
                className={`figma-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <Compass size={18} className="nav-icon" />
                <span>Overview</span>
              </Link>
            )}

            {canAccessRoute(role, '/employees') && (
              <Link
                to="/employees"
                className={`figma-nav-item ${isActive('/employees') ? 'active' : ''}`}
              >
                <Users size={18} className="nav-icon" />
                <span>Employees</span>
              </Link>
            )}

            {canAccessRoute(role, '/leaves') && (
              <Link
                to="/leaves"
                className={`figma-nav-item ${isActive('/leaves') ? 'active' : ''}`}
              >
                <CalendarDays size={18} className="nav-icon" />
                <span>Leave Management</span>
              </Link>
            )}

            {canAccessRoute(role, '/attendance') && (
              <Link
                to="/attendance"
                className={`figma-nav-item ${isActive('/attendance') ? 'active' : ''}`}
              >
                <CalendarCheck size={18} className="nav-icon" />
                <span>Attendance</span>
              </Link>
            )}

            {role === 'admin' && canAccessRoute(role, '/org-setup') && (
              <Link
                to="/org-setup"
                className={`figma-nav-item ${isActive('/org-setup') ? 'active' : ''}`}
              >
                <Building size={18} className="nav-icon" />
                <span>Departments</span>
              </Link>
            )}

            {canAccessRoute(role, '/payroll') && (
              <Link
                to="/payroll"
                className={`figma-nav-item ${isActive('/payroll') ? 'active' : ''}`}
              >
                <FileBarChart size={18} className="nav-icon" />
                <span>Reports</span>
              </Link>
            )}

            <button
              type="button"
              className="figma-nav-item figma-ai-trigger-nav"
              onClick={onOpenAi}
            >
              <Sparkles size={18} className="nav-icon sparkle" />
              <span>AI Assistant</span>
            </button>
          </nav>
        </div>

        {/* Section 2: Workspace */}
        <div className="figma-nav-section">
          <span className="figma-nav-header">WORKSPACE</span>
          <nav className="figma-nav-list">
            {canAccessRoute(role, '/announcements') && (
              <Link
                to="/announcements"
                className={`figma-nav-item ${isActive('/announcements') ? 'active' : ''}`}
              >
                <Megaphone size={18} className="nav-icon" />
                <span>Announcements</span>
              </Link>
            )}

            {role === 'admin' && canAccessRoute(role, '/audit-logs') && (
              <Link
                to="/audit-logs"
                className={`figma-nav-item ${isActive('/audit-logs') ? 'active' : ''}`}
              >
                <Shield size={18} className="nav-icon" />
                <span>Audit Logs</span>
              </Link>
            )}

            {role === 'admin' && canAccessRoute(role, '/org-setup') && (
              <Link
                to="/org-setup"
                className={`figma-nav-item ${location.pathname === '/org-setup' ? 'active' : ''}`}
              >
                <Settings size={18} className="nav-icon" />
                <span>Settings</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom Workspace Card */}
        <div className="figma-sidebar-bottom-card">
          <div className="bottom-card-title">Your workspace</div>
          <div className="bottom-card-sub">{companyName || 'Set up your company to begin'}</div>
        </div>
      </aside>

      {/* 2. Main Portal Right Area */}
      <div className="figma-main-area">
        {/* Top Header */}
        <header className="figma-topbar">
          <div className="topbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
          </div>

          <div className="topbar-right-actions">
            <button
              className="topbar-help-link"
              onClick={onOpenAi}
              title="Help & Questions"
            >
              <HelpCircle size={15} />
              <span>Help</span>
            </button>

            {/* Sparkle Quick Action */}
            <button
              className="topbar-ai-sparkle-btn"
              onClick={onOpenAi}
              title="Open HCM AI Assistant"
            >
              <Sparkles size={16} />
            </button>

            {/* User Profile Avatar with dropdown */}
            <div className="topbar-user-wrapper">
              <button
                className="topbar-avatar-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={user?.name || 'Account Menu'}
              >
                {getInitials(user?.name)}
              </button>

              {showUserMenu && (
                <div className="topbar-user-dropdown">
                  <div className="dropdown-user-header">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <span className="dropdown-role-tag">{role?.toUpperCase()}</span>
                  </div>
                  <hr />
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/change-password"
                    className="dropdown-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={15} />
                    <span>Change Password</span>
                  </Link>
                  <hr />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="figma-content-canvas">
          {children}
        </main>
      </div>
    </div>
  );
}
