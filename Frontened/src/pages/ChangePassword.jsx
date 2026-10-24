import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { KeyRound, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Auth.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword: user?.mustChangePassword ? undefined : currentPassword,
        newPassword,
      });

      if (res.success) {
        await refreshUser();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <KeyRound size={24} color="white" />
          </div>
          <h2>Change Password</h2>
          <p>
            {user?.mustChangePassword
              ? 'Security requirement: You must change your temporary password before accessing the system.'
              : 'Update your corporate account password.'}
          </p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!user?.mustChangePassword && (
            <div className="form-field">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-field">
            <label>New Secret Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Updating Password...' : 'Save Password & Enter'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
