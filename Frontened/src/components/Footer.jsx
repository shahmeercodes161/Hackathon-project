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
              <span>HCM Lite &bull; Enterprise People Operations</span>
            </div>
            <p className="footer-desc">
              AI-assisted Human Capital Management platform engineered for corporate leadership, HR teams,
              and employee self-service. Real-time data, automated payroll, and intelligent workflows.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Workspaces</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard">Executive Dashboard</Link></li>
              <li><Link to="/employees">Employee Directory & Profiles</Link></li>
              <li><Link to="/attendance">Attendance & Shift Board</Link></li>
              <li><Link to="/payroll">Payroll & Tax Engine</Link></li>
              <li><Link to="/register">Create Enterprise Account</Link></li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div className="footer-col">
            <h4 className="footer-heading">Security & Architecture</h4>
            <ul className="footer-links-static">
              <li>🛡️ Multi-tier Role Based Access (RBAC)</li>
              <li>🤖 Autonomous AI Workforce Intelligence</li>
              <li>📍 GPS Office Geofence Verification</li>
              <li>🔒 Immutable Cryptographic Audit Logs</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {currentYear} HCM Lite Enterprise Systems. All rights reserved.
          </p>
          <div className="footer-badge">
            <span className="status-dot"></span>
            <span>Enterprise Cloud: <strong>Active & Secure</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
