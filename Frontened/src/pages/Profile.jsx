import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/api';
import { User, Phone, MapPin, Building, Briefcase, Mail, CheckCircle2 } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.employee) {
      setPhone(user.employee.phone || '');
      setAddress(user.employee.address || '');
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const res = await employeeService.update(user.employeeId, { phone, address });
      if (res.success) {
        setSuccess('Contact information updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const emp = user?.employee || {};

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-top-banner">
          <div className="profile-avatar-big">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-main-title">
            <h2>{user?.name}</h2>
            <span className="profile-sub-role">{emp.designation || user?.role?.toUpperCase()} &bull; {emp.department || 'Saylani HCM'}</span>
            <span className="profile-code-badge">{emp.employeeCode || 'ADMIN'}</span>
          </div>
        </div>

        {success && <div className="profile-alert-banner success">{success}</div>}
        {error && <div className="profile-alert-banner error">{error}</div>}

        <div className="profile-info-grid">
          <div className="info-block">
            <span className="info-label"><Mail size={14} /> Corporate Email</span>
            <span className="info-val">{user?.email}</span>
          </div>
          <div className="info-block">
            <span className="info-label"><Building size={14} /> Department</span>
            <span className="info-val">{emp.department || 'Headquarters'}</span>
          </div>
          <div className="info-block">
            <span className="info-label"><Briefcase size={14} /> Designation</span>
            <span className="info-val">{emp.designation || 'Administrator'}</span>
          </div>
          <div className="info-block">
            <span className="info-label">Joining Date</span>
            <span className="info-val">{emp.joiningDate || 'System Established'}</span>
          </div>
        </div>

        {/* Self-service phone and address editing */}
        <form onSubmit={handleUpdate} className="profile-edit-form">
          <h3>Self-Service Contact Details</h3>
          <p className="profile-desc">
            Per company security guidelines, employees are permitted to update their personal contact phone number and residential address.
          </p>

          <div className="form-field">
            <label><Phone size={14} /> Contact Phone Number</label>
            <input
              type="text"
              placeholder="+92 300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label><MapPin size={14} /> Residential / Mailing Address</label>
            <input
              type="text"
              placeholder="e.g. Block 4, Gulshan-e-Iqbal, Karachi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="att-btn primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
