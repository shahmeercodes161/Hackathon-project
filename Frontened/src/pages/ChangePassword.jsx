import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import './ChangePassword.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Toggle password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { level: score, label: 'Fair', color: '#f59e0b' };
    return { level: score, label: 'Strong', color: '#10b981' };
  };

  const strength = passwordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-type carefully.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword: user?.mustChangePassword ? undefined : currentPassword,
        newPassword,
      });
      if (res.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chpwd-page">
      <div className="chpwd-card">
        {/* Header */}
        <div className="chpwd-header">
          <div className="chpwd-icon-ring">
            <KeyRound size={26} />
          </div>
          <h1 className="chpwd-title">
            {user?.mustChangePassword ? 'Set New Password' : 'Change Password'}
          </h1>
          <p className="chpwd-subtitle">
            {user?.mustChangePassword
              ? 'Your account requires a password reset before you can continue.'
              : 'Keep your account secure by updating your password regularly.'}
          </p>
        </div>

        {/* Security Notice Banner */}
        {user?.mustChangePassword && (
          <div className="chpwd-security-banner">
            <ShieldCheck size={16} />
            <span>Security requirement — default password must be changed before accessing your workspace.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="chpwd-error-box">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="chpwd-success-box">
            <CheckCircle2 size={18} />
            <span>Password updated! Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="chpwd-form">
          {/* Current Password (hidden if forced reset) */}
          {!user?.mustChangePassword && (
            <div className="chpwd-field">
              <label>Current Password</label>
              <div className="chpwd-input-wrap">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="chpwd-eye-btn"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="chpwd-field">
            <label>New Password</label>
            <div className="chpwd-input-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="chpwd-eye-btn"
                onClick={() => setShowNew((v) => !v)}
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Bar */}
            {newPassword && (
              <div className="chpwd-strength-bar-wrap">
                <div className="chpwd-strength-track">
                  <div
                    className="chpwd-strength-fill"
                    style={{
                      width: `${(strength.level / 5) * 100}%`,
                      background: strength.color,
                    }}
                  />
                </div>
                <span className="chpwd-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="chpwd-field">
            <label>Confirm New Password</label>
            <div className="chpwd-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="chpwd-eye-btn"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <span className="chpwd-mismatch">Passwords do not match</span>
            )}
            {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
              <span className="chpwd-match"><CheckCircle2 size={13} /> Passwords match</span>
            )}
          </div>

          {/* Submit Button with Loader */}
          <button
            type="submit"
            className="chpwd-submit-btn"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="chpwd-spinner" />
                Updating Password...
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                Done! Redirecting...
              </>
            ) : (
              'Save New Password'
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="chpwd-tips">
          <p>💡 Tips for a strong password:</p>
          <ul>
            <li>At least 10 characters long</li>
            <li>Mix uppercase, numbers &amp; symbols</li>
            <li>Never reuse old passwords</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
