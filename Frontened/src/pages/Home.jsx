import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Layers, Sparkles, CheckCircle2, ArrowRight, Server, Terminal } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import './Home.css';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  useEffect(() => {
    // Ping root endpoint of backend
    const checkBackend = async () => {
      try {
        const rootUrl = API_BASE_URL.replace('/api', '') || 'http://localhost:5000';
        const res = await fetch(rootUrl);
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Hackathon Ready Boilerplate</span>
        </div>

        <h1 className="hero-title">
          Build Your Winning Idea <br />
          <span className="hero-gradient">Fast & Without Friction</span>
        </h1>

        <p className="hero-subtitle">
          Authentication, responsive Navbar & Footer, and clean MVC backend are already set up.
          Focus 100% on building your hackathon problem statement!
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <span>Go to Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                <span>Get Started</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Backend Connectivity Status Pill */}
        <div className="status-pill">
          <Server size={15} />
          <span>Backend API Status:</span>
          {backendStatus === 'online' && (
            <span className="status-tag status-green">
              <span className="pulse-mini"></span> Online (Port 5000)
            </span>
          )}
          {backendStatus === 'offline' && (
            <span className="status-tag status-amber">
              ⚠️ Start backend: `npm run dev` in Backened folder
            </span>
          )}
          {backendStatus === 'checking' && (
            <span className="status-tag status-gray">Checking...</span>
          )}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="features-grid">
        <div className="glass-card feature-card">
          <div className="feature-icon-wrapper icon-indigo">
            <ShieldCheck size={26} />
          </div>
          <h3 className="feature-title">Complete Authentication</h3>
          <p className="feature-desc">
            Production-ready JWT authentication with bcrypt password hashing,
            protected routes, and token persistence in localStorage.
          </p>
          <ul className="feature-checklist">
            <li><CheckCircle2 size={16} /> Register & Login endpoints</li>
            <li><CheckCircle2 size={16} /> Protected route wrappers</li>
            <li><CheckCircle2 size={16} /> User Context hook (`useAuth`)</li>
          </ul>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-wrapper icon-purple">
            <Layers size={26} />
          </div>
          <h3 className="feature-title">Clean MVC Architecture</h3>
          <p className="feature-desc">
            Organized folder structure. Separate folders for Models, Controllers,
            Routes, Middlewares, and Components for effortless scaling.
          </p>
          <ul className="feature-checklist">
            <li><CheckCircle2 size={16} /> Backend: `Backened/` (MVC)</li>
            <li><CheckCircle2 size={16} /> Frontend: `Frontened/src/`</li>
            <li><CheckCircle2 size={16} /> Ready for your custom models & APIs</li>
          </ul>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-wrapper icon-emerald">
            <Terminal size={26} />
          </div>
          <h3 className="feature-title">Pre-built UI Shell</h3>
          <p className="feature-desc">
            Modern, responsive Navbar with active links & user avatar badge,
            along with a comprehensive Footer and flexible design system.
          </p>
          <ul className="feature-checklist">
            <li><CheckCircle2 size={16} /> Responsive Mobile Drawer</li>
            <li><CheckCircle2 size={16} /> Dynamic Auth State Navbar</li>
            <li><CheckCircle2 size={16} /> Clean Glassmorphism & Micro-animations</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
