import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { commsService } from '../services/api';
import {
  Sparkles,
  Bell,
  LogOut,
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Settings,
  Megaphone,
  Shield,
  LayoutDashboard,
  Check,
  User as UserIcon,
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({ onOpenAi }) {
  const { user, role, isAuthenticated, isSetupComplete, companyName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const res = await commsService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await commsService.markNotificationRead(id);
      loadNotifications();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await commsService.markAllNotificationsRead();
      loadNotifications();
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="hcm-navbar">
      <div className="hcm-nav-container">
        {/* Brand */}
        <div className="hcm-nav-brand">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="hcm-logo-link">
            <div className="hcm-logo-badge">HCM</div>
            <div className="hcm-logo-text">
              <span className="hcm-logo-title">{companyName || 'HCM Lite'}</span>
              <span className="hcm-logo-sub">Enterprise Portal</span>
            </div>
          </Link>
          {role && <span className={`role-tag role-${role}`}>{role.toUpperCase()}</span>}
        </div>

        {/* Navigation Links based on role */}
        {isAuthenticated && (
          <div className="hcm-nav-menu">
            <Link to="/dashboard" className={`hcm-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>

            {(role === 'admin' || role === 'hr') && (
              <Link to="/employees" className={`hcm-nav-item ${isActive('/employees') ? 'active' : ''}`}>
                <Users size={16} /> Employees
              </Link>
            )}

            <Link to="/attendance" className={`hcm-nav-item ${isActive('/attendance') ? 'active' : ''}`}>
              <CalendarCheck size={16} /> Attendance
            </Link>

            <Link to="/leaves" className={`hcm-nav-item ${isActive('/leaves') ? 'active' : ''}`}>
              <CalendarDays size={16} /> Leaves
            </Link>

            <Link to="/payroll" className={`hcm-nav-item ${isActive('/payroll') ? 'active' : ''}`}>
              <CreditCard size={16} /> Payroll
            </Link>

            <Link to="/announcements" className={`hcm-nav-item ${isActive('/announcements') ? 'active' : ''}`}>
              <Megaphone size={16} /> Announcements
            </Link>

            {role === 'admin' && (
              <>
                <Link to="/org-setup" className={`hcm-nav-item ${isActive('/org-setup') ? 'active' : ''}`}>
                  <Settings size={16} /> Org Setup
                </Link>
                <Link to="/audit-logs" className={`hcm-nav-item ${isActive('/audit-logs') ? 'active' : ''}`}>
                  <Shield size={16} /> Audit Logs
                </Link>
              </>
            )}

            {role === 'employee' && (
              <Link to="/profile" className={`hcm-nav-item ${isActive('/profile') ? 'active' : ''}`}>
                <UserIcon size={16} /> Profile
              </Link>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="hcm-nav-actions">
          {isAuthenticated ? (
            <>
              {/* Ask AI Assistant Button */}
              <button className="hcm-ai-nav-btn" onClick={onOpenAi} title="Ask HCM AI Assistant">
                <Sparkles size={16} className="sparkle-anim" />
                <span>Ask AI</span>
              </button>

              {/* Notification Bell Dropdown */}
              <div className="notif-wrapper">
                <button
                  className="notif-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h4>Notifications ({unreadCount} new)</h4>
                      {unreadCount > 0 && (
                        <button className="mark-all-btn" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n._id}
                            className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleMarkRead(n._id)}
                          >
                            <div className="notif-item-title">{n.title}</div>
                            <div className="notif-item-desc">{n.message}</div>
                            <div className="notif-item-time">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Chip & Logout */}
              <div className="user-profile-chip">
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="guest-nav-links">
              {!isSetupComplete && (
                <Link to="/setup" className="setup-nav-btn">
                  🚀 First-Run Setup
                </Link>
              )}
              <Link to="/login" className="login-nav-btn">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
