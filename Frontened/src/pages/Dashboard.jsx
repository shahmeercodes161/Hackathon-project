import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { User, Shield, Key, Sparkles, RefreshCw, CheckCircle, Code } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const handleTestAuth = async () => {
    setLoadingProfile(true);
    setTestStatus(null);
    try {
      const res = await authService.getMe();
      setProfileData(res.user);
      setTestStatus({ success: true, message: 'Protected API call verified successfully!' });
    } catch (err) {
      setTestStatus({ success: false, message: err.message });
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="glass-card welcome-banner">
        <div className="banner-left">
          <div className="banner-avatar">
            <User size={36} />
          </div>
          <div>
            <div className="banner-greeting">Welcome back,</div>
            <h1 className="banner-name">{user?.name}</h1>
            <p className="banner-email">{user?.email}</p>
          </div>
        </div>

        <div className="banner-badge">
          <Shield size={16} />
          <span>Role: <strong>{user?.role?.toUpperCase()}</strong></span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Hackathon Workspace Placeholder Card */}
        <div className="glass-card main-workspace-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Sparkles size={20} className="icon-glow" />
              <h2>Hackathon Canvas Area</h2>
            </div>
            <span className="pill-badge">Ready for tomorrow</span>
          </div>

          <p className="workspace-intro">
            This is your main project workspace! When your hackathon topic or problem statement
            is assigned tomorrow, you can easily replace this section with your core application components:
          </p>

          <div className="ideas-grid">
            <div className="idea-box">
              <Code size={20} />
              <h4>AI / ML Tool</h4>
              <p>Plug in LLM chat, text generation, image recognition or sentiment analysis.</p>
            </div>
            <div className="idea-box">
              <Code size={20} />
              <h4>Management Dashboard</h4>
              <p>Add data tables, charts, CRUD operations, or live metrics.</p>
            </div>
            <div className="idea-box">
              <Code size={20} />
              <h4>Realtime Service</h4>
              <p>Add WebSockets, live alerts, notifications, or geolocation tracking.</p>
            </div>
          </div>
        </div>

        {/* Auth Verification & Token Inspector */}
        <div className="glass-card token-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <Key size={18} />
              <h3>Auth Token & API Test</h3>
            </div>
          </div>

          <p className="token-desc">
            Your JWT token is saved in <code>localStorage</code> and automatically included
            in API request headers.
          </p>

          <button
            onClick={handleTestAuth}
            className="btn btn-secondary w-full"
            disabled={loadingProfile}
          >
            <RefreshCw size={16} className={loadingProfile ? 'spin-icon' : ''} />
            <span>{loadingProfile ? 'Calling API...' : 'Test Protected API (/me)'}</span>
          </button>

          {testStatus && (
            <div className={`alert ${testStatus.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '1rem' }}>
              {testStatus.success && <CheckCircle size={16} />}
              <span>{testStatus.message}</span>
            </div>
          )}

          {profileData && (
            <div className="json-preview">
              <pre>{JSON.stringify(profileData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
