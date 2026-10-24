import { Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <Sparkles size={18} className="brand-glow-icon" />
              <span>HCM Lite &bull; Saylani Hackathon</span>
            </div>
            <p className="footer-desc">
              AI-assisted Human Capital Management System engineered for Admin, HR, and Employee self-service.
              Zero dummy data; 100% computed from live operational activity.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Workspaces</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard">Operational Dashboard</Link></li>
              <li><Link to="/employees">Employee Directory & 360</Link></li>
              <li><Link to="/attendance">Attendance Board</Link></li>
              <li><Link to="/payroll">Payroll Lite Engine</Link></li>
              <li><Link to="/setup">First-Run Setup Wizard</Link></li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="footer-col">
            <h4 className="footer-heading">Hackathon Specs</h4>
            <ul className="footer-links-static">
              <li>📍 Zaitoon Ashraf IT Park</li>
              <li>🤖 Tool-calling AI Assistant (M8)</li>
              <li>⚡ Strict Server-side RBAC Scope</li>
              <li>🔒 Immutable Audit Log Trail</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {currentYear} HCM Lite &bull; Built with precision for the Saylani Hackathon.
          </p>
          <div className="footer-badge">
            <span className="status-dot"></span>
            <span>API Server: <strong>http://localhost:5000</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
