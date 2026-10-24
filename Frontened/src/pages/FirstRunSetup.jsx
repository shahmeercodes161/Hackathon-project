import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupService } from '../services/api';
import { Building2, Clock, MapPin, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import './FirstRunSetup.css';

export default function FirstRunSetup() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [formData, setFormData] = useState({
    companyName: 'Saylani Systems Ltd',
    companyEmail: 'admin@saylani.org',
    officeStart: '09:00',
    officeEnd: '18:00',
    graceMinutes: 15,
    halfDayHours: 5,
    officeAddress: 'Zaitoon Ashraf IT Park, Karachi',
    latitude: 24.8607,
    longitude: 67.0011,
    radiusMeters: 150,
    adminName: 'Lead Admin',
    adminEmail: 'admin@hcm.local',
    adminPassword: 'adminpassword123',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        {error && <div className="setup-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
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
                />
                <small>Standard: 09:00 AM</small>
              </div>
              <div className="form-group">
                <label>Grace Period (Minutes)</label>
                <input
                  type="number"
                  name="graceMinutes"
                  value={formData.graceMinutes}
                  onChange={handleChange}
                  required
                />
                <small>Late after 09:15 AM</small>
              </div>
              <div className="form-group">
                <label>Half-Day Threshold</label>
                <input
                  type="number"
                  name="halfDayHours"
                  value={formData.halfDayHours}
                  onChange={handleChange}
                  required
                />
                <small>Under 5 hours</small>
              </div>
            </div>
          </div>

          {/* Section 3: Geofencing Location */}
          <div className="setup-section">
            <div className="section-title">
              <MapPin size={18} className="section-icon" />
              <h3>3. Office Location & Geofence (Bonus)</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Office Address / Venue</label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Geofence Radius (Meters)</label>
                <input
                  type="number"
                  name="radiusMeters"
                  value={formData.radiusMeters}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Office Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Office Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Master Administrator Account */}
          <div className="setup-section">
            <div className="section-title">
              <ShieldCheck size={18} className="section-icon" />
              <h3>4. Master Administrator Account</h3>
            </div>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Admin Full Name</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email (Login)</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Master Password</label>
                <input
                  type="password"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="setup-submit-btn" disabled={loading}>
            {loading ? 'Initializing System...' : 'Initialize & Launch Company Portal'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
