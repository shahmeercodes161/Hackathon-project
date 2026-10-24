import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, isAuthenticated, isSetupComplete, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        const origin = location.state?.from?.pathname || '/dashboard';
        navigate(origin, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in both email and password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      if (result.user?.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        const destination = location.state?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
      }
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <LogIn size={26} />
          </div>
          <h2 className="auth-title">HCM Lite Portal</h2>
          <p className="auth-subtitle">Sign in as Admin, HR, or Employee</p>
        </div>

        {!isSetupComplete && (
          <div className="setup-banner-prompt">
            <Building2 size={18} />
            <div>
              <strong>Fresh Installation Detected!</strong>
              <p>System starts empty. Use First-Run Setup to configure company & Admin.</p>
            </div>
            <Link to="/setup" className="setup-link-btn">Launch Setup</Link>
          </div>
        )}

        {displayError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Corporate Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@hcm.local or employee email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem', height: '46px', fontSize: '0.96rem' }}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Enterprise Portal'}
          </button>
        </form>

        <p className="auth-footer-text" style={{ marginTop: '1.25rem' }}>
          Don't have an enterprise account?{' '}
          <Link to="/register" className="auth-link">
            Create an Account
          </Link>
        </p>

        <div className="judge-demo-box">
          <span className="judge-demo-label">Quick Testing Credentials:</span>
          <div className="judge-pills">
            <button
              type="button"
              className="judge-pill-btn"
              onClick={() => handleQuickFill('admin@hcm.local', 'adminpassword123')}
            >
              Default Admin
            </button>
            <Link to="/setup" className="judge-pill-btn setup">
              Company Onboarding Wizard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
