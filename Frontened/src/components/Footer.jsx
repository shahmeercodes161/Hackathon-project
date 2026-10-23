import { Heart, Code, Sparkles } from 'lucide-react';
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
              <span>Hackathon Starter</span>
            </div>
            <p className="footer-desc">
              Rapid prototyping boilerplate built for speed, clean MVC architecture,
              and seamless authentication.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="footer-col">
            <h4 className="footer-heading">Architecture</h4>
            <ul className="footer-links-static">
              <li>⚡ React 19 + Vite</li>
              <li>🛡️ Express + JWT Auth</li>
              <li>📦 MongoDB / Mongoose</li>
              <li>✨ Clean MVC Modular Pattern</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {currentYear} Built with <Heart size={14} className="heart-icon" /> for the Hackathon.
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
