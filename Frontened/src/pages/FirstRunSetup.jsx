import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupService } from '../services/api';
import {
  Building2,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  LogIn,
} from 'lucide-react';
import './FirstRunSetup.css';

export default function FirstRunSetup() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [alreadyConfigured, setAlreadyConfigured] = useState(false);
  const [existingCompany, setExistingCompany] = useState('');
  const [resetting, setResetting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: 'Apex Technologies Corp',
    companyEmail: 'contact@apexcorp.io',
    officeStart: '09:00',
    officeEnd: '18:00',
    graceMinutes: 15,
    halfDayHours: 5,
    officeAddress: 'Corporate Headquarters, Technology District',
    latitude: 24.8607,
    longitude: 67.0011,
    radiusMeters: 150,
    adminName: 'Lead Admin',
    adminEmail: 'admin@hcm.local',
    adminPassword: 'adminpassword123',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await setupService.getStatus();
      if (res.success && res.hasAdmin) {
        setAlreadyConfigured(true);
        if (res.companyName) setExistingCompany(res.companyName);
      } else {
        setAlreadyConfigured(false);
      }
    } catch {
      // ignore
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all data and re-initialize from an empty state?')) {
      return;
    }
    setResetting(true);
    setError('');
    try {
      const res = await setupService.reset();
      if (res.success) {
        setAlreadyConfigured(false);
        setError('');
        alert('System data has been wiped. You can now run initialization fresh.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset system data');
    } finally {
      setResetting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await setupService.init(formData);
      if (res.success && res.token && res.user) {
        setSession(res.token, res.user);
        navigate('/dashboard');
      } else {
        throw new Error(res.message || 'Setup initialization failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete first-run setup');
      if (err.message && err.message.toLowerCase().includes('already configured')) {
        setAlreadyConfigured(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page-wrapper">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-badge">FIRST-RUN WIZARD</div>
          <h1>System Initialization</h1>
          <p>
            Configure your enterprise settings and register the Master Administrator account.
            The system starts clean with zero preloaded data.
          </p>
        </div>

        {/* If already configured, show actionable banner */}
        {alreadyConfigured && (
          <div
            className="setup-already-configured-banner"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a5b4fc', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={20} />
              <strong style={{ fontSize: '1rem', color: '#fff' }}>
                System Already Initialized ({existingCompany || 'Active Organization'})
              </strong>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>
              An Administrator account is already registered in the system. You do not need to re-run setup.
              You can log in directly, or reset the system if you wish to test fresh initialization.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
                <LogIn size={16} />
                <span>Go to Sign In</span>
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={resetting}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                <RotateCcw size={16} />
                <span>{resetting ? 'Resetting...' : 'Reset & Start Fresh'}</span>
              </button>
            </div>
          </div>
        )}

        {error && !alreadyConfigured && <div className="setup-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form" style={{ opacity: alreadyConfigured ? 0.6 : 1 }}>
          {/* Section 1: Company Profile */}
          <div className="setup-section">
            <div className="section-title">
              <Building2 size={18} className="section-icon" />
              <h3>1. Company Profile</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Legal Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Official Company Email</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Office Hours & Rules */}
          <div className="setup-section">
            <div className="section-title">
              <Clock size={18} className="section-icon" />
              <h3>2. Office Hours & Attendance Rules</h3>
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Work Start Time</label>
                <input
                  type="time"
                  name="officeStart"
                  value={formData.officeStart}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Grace Period (Minutes)</label>
                <input
                  type="number"
                  name="graceMinutes"
                  value={formData.graceMinutes}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Half-Day Threshold (Hours)</label>
                <input
                  type="number"
                  name="halfDayHours"
                  value={formData.halfDayHours}
                  onChange={handleChange}
                  min="1"
                  max="12"
                  required
                  disabled={alreadyConfigured}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geofence Location */}
          <div className="setup-section">
            <div className="section-title">
              <MapPin size={18} className="section-icon" />
              <h3>3. Office Location & Geofence (Attendance Radius)</h3>
            </div>
            <div className="form-grid">
              <div className="form-group span-2">
                <label>Physical Office Address</label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Latitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Longitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group span-2">
                <label>Allowed Check-In Geofence Radius (Meters)</label>
                <input
                  type="number"
                  name="radiusMeters"
                  value={formData.radiusMeters}
                  onChange={handleChange}
                  min="10"
                  max="5000"
                  required
                  disabled={alreadyConfigured}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Master Administrator */}
          <div className="setup-section">
            <div className="section-title">
              <ShieldCheck size={18} className="section-icon" />
              <h3>4. Master Administrator Account</h3>
            </div>
            <div className="form-grid">
              <div className="form-group span-2">
                <label>Admin Full Name</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Admin Email Address</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                  disabled={alreadyConfigured}
                />
              </div>
            </div>
          </div>

          <div className="setup-actions">
            {!alreadyConfigured ? (
              <button type="submit" className="btn btn-primary setup-submit-btn" disabled={loading}>
                <span>{loading ? 'Initializing System...' : 'Complete System Initialization'}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary setup-submit-btn">
                <span>Go to Sign In</span>
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
