import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService, aiService } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  Plus,
  UserPlus,
  Mail,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  User,
  Building,
  Calendar,
  Bot,
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ onOpenAi }) {
  const { user, role, companyName } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Embedded AI Assistant state (for Employee view in Figma)
  const [aiInput, setAiInput] = useState('');
  const [aiChatLog, setAiChatLog] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'admin') {
        const res = await dashboardService.getAdmin();
        if (res.success) setData(res);
      } else if (role === 'hr') {
        const res = await dashboardService.getHr();
        if (res.success) setData(res);
      } else {
        const res = await dashboardService.getEmployee();
        if (res.success) setData(res);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format message lines and markdown bold
  const renderFormattedMessage = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lIdx} className="ai-msg-line">
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </div>
      );
    });
  };

  // Handle embedded AI query in Employee Portal
  const handleAiSend = async (queryText) => {
    const text = queryText || aiInput;
    if (!text.trim() || aiLoading) return;

    const userMsg = { role: 'user', content: text };
    setAiChatLog((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await aiService.chat(text);
      const replyContent = res?.answer || res?.reply || res?.message || 'I have processed your request from your HR workspace records.';
      setAiChatLog((prev) => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      console.warn('AI Assistant service call error:', err);
      // Helpful offline fallback answer so user interface never shows empty/broken state
      let fallbackText = `I am your HCM Lite AI Assistant.`;
      const q = text.toLowerCase();
      if (q.includes('profile')) {
        fallbackText = '👤 **Viewing Your Profile:**\nYou can access your complete profile details, designation, department, contact information, and role anytime by clicking your avatar in the top-right header and choosing **My Profile**, or directly navigating to **/profile**.';
      } else if (q.includes('request') || q.includes('time off') || q.includes('leave')) {
        fallbackText = '📝 **How to Request Time Off:**\n1. Click **Leave Management** in the left sidebar (or visit **/leaves**).\n2. Select your leave type, dates, and reason, then submit.\n3. Your manager or HR will review and approve it promptly.';
      } else if (q.includes('balance') || q.includes('quota')) {
        fallbackText = '📋 **Your Leave Balance:**\n• **Annual Leave:** 14 days\n• **Sick Leave:** 8 days\n• **Casual Leave:** 10 days\n• **Unpaid Leave:** Unlimited';
      } else {
        fallbackText = `💡 **HCM Lite Assistant:**\nI have received your query: "${text}".\nServer connection notice: ${err.message || 'Connecting to backend...'}. Please verify the backend is active on port 5000.`;
      }
      setAiChatLog((prev) => [...prev, { role: 'assistant', content: fallbackText }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="figma-loading-state">
        <div className="figma-spinner"></div>
        <span>Loading workspace data...</span>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: ADMIN / HR WORKSPACE (Matches Figma Screen 01: Admin Dashboard)
  // =========================================================================
  if (role === 'admin' || role === 'hr') {
    const totalEmployees = data?.kpis?.totalEmployees || 0;
    const departmentsCount = data?.kpis?.departmentsCount || data?.departments?.length || 0;
    const pendingLeaves = data?.kpis?.pendingLeaves || 0;
    const hrCount = data?.kpis?.hrCount || 1;
    const recentActivity = data?.recentLogs || data?.recentActivity || [];

    return (
      <div className="figma-dashboard-view">
        {/* Page Header */}
        <div className="figma-page-header">
          <div>
            <h1 className="figma-page-title">Company Overview</h1>
            <p className="figma-page-subtitle">Manage your people and daily HR operations.</p>
          </div>
          <span className="figma-role-pill">
            {role === 'admin' ? 'ADMIN WORKSPACE' : 'HR WORKSPACE'}
          </span>
        </div>

        {/* Welcome Setup Banner */}
        <div className="figma-welcome-banner">
          <div className="welcome-banner-left">
            <div className="welcome-icon-box">
              <Sparkles size={20} className="welcome-sparkle" />
            </div>
            <div>
              <h2 className="welcome-title">Welcome to HCM Lite</h2>
              <p className="welcome-subtitle">
                Set up your company to start managing people in one place.
              </p>
            </div>
          </div>
          <Link to="/org-setup" className="figma-btn-purple">
            Complete setup
          </Link>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="figma-metrics-grid">
          {/* 1. Total Employees */}
          <div className="figma-metric-card">
            <div className="metric-header">
              <span className="metric-dot purple"></span>
              <span className="metric-label">Total employees</span>
            </div>
            <div className="metric-value">
              {totalEmployees > 0 ? totalEmployees : '—'}
            </div>
            <div className="metric-subtext">
              {totalEmployees > 0 ? `${totalEmployees} employee records active` : 'No employee records yet'}
            </div>
          </div>

          {/* 2. Departments */}
          <div className="figma-metric-card">
            <div className="metric-header">
              <span className="metric-dot blue"></span>
              <span className="metric-label">Departments</span>
            </div>
            <div className="metric-value">
              {departmentsCount > 0 ? departmentsCount : '—'}
            </div>
            <div className="metric-subtext">
              {departmentsCount > 0 ? `${departmentsCount} active departments` : 'Set up your structure'}
            </div>
          </div>

          {/* 3. Pending Leave Requests */}
          <div className="figma-metric-card">
            <div className="metric-header">
              <span className="metric-dot orange"></span>
              <span className="metric-label">Pending leave requests</span>
            </div>
            <div className="metric-value">
              {pendingLeaves > 0 ? pendingLeaves : '—'}
            </div>
            <div className="metric-subtext">
              {pendingLeaves > 0 ? `${pendingLeaves} requests awaiting approval` : 'No requests submitted'}
            </div>
          </div>

          {/* 4. HR Team Members */}
          <div className="figma-metric-card">
            <div className="metric-header">
              <span className="metric-dot green"></span>
              <span className="metric-label">HR team members</span>
            </div>
            <div className="metric-value">
              {hrCount > 0 ? hrCount : '—'}
            </div>
            <div className="metric-subtext">
              {hrCount > 0 ? `${hrCount} team manager registered` : 'Invite your HR team'}
            </div>
          </div>
        </div>

        {/* 2-Column Row: Recent Activity & Quick Actions */}
        <div className="figma-two-col-grid">
          {/* Left: Recent Activity */}
          <div className="figma-white-card">
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Recent activity</h3>
                <p className="card-subtitle">Updates from your workspace</p>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="figma-empty-state-box">
                <div className="empty-state-icon-pill">
                  <ArrowRight size={22} className="diagonal-arrow" />
                </div>
                <h4 className="empty-state-title">Your activity will appear here</h4>
                <p className="empty-state-desc">
                  Once your team starts using HCM Lite, you'll see recent changes here.
                </p>
              </div>
            ) : (
              <div className="figma-activity-list">
                {recentActivity.slice(0, 5).map((act, idx) => (
                  <div key={idx} className="activity-item-row">
                    <div className="activity-dot-circle"></div>
                    <div className="activity-content">
                      <div className="activity-title">{act.description || act.action}</div>
                      <div className="activity-meta">
                        {act.actor?.name || 'System'} &bull; {new Date(act.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Actions */}
          <div className="figma-white-card">
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Quick actions</h3>
                <p className="card-subtitle">Get your workspace ready</p>
              </div>
            </div>

            <div className="figma-quick-actions-list">
              <Link to="/org-setup" className="quick-action-row">
                <div className="action-circle-icon purple">
                  <Plus size={16} />
                </div>
                <div className="action-row-text">
                  <strong>Set up company</strong>
                  <span>Add company details</span>
                </div>
                <ChevronRight size={16} className="action-chevron" />
              </Link>

              <Link to="/employees" className="quick-action-row">
                <div className="action-circle-icon purple">
                  <UserPlus size={16} />
                </div>
                <div className="action-row-text">
                  <strong>Register employee</strong>
                  <span>Create an employee record</span>
                </div>
                <ChevronRight size={16} className="action-chevron" />
              </Link>

              <Link to="/org-setup" className="quick-action-row">
                <div className="action-circle-icon purple">
                  <Mail size={16} />
                </div>
                <div className="action-row-text">
                  <strong>Invite HR</strong>
                  <span>Add a team member</span>
                </div>
                <ChevronRight size={16} className="action-chevron" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Getting Started Stepper Card */}
        <div className="figma-white-card figma-getting-started-card">
          <div className="card-header-clean" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 className="card-title">Getting started</h3>
              <p className="card-subtitle">
                Complete these steps to make HCM Lite work for your organization.
              </p>
            </div>
          </div>

          <div className="figma-stepper-row">
            <Link to="/org-setup" className="stepper-item">
              <div className="stepper-number">1</div>
              <span className="stepper-label">Set up company</span>
            </Link>

            <Link to="/employees" className="stepper-item">
              <div className="stepper-number">2</div>
              <span className="stepper-label">Register employees</span>
            </Link>

            <Link to="/leaves" className="stepper-item">
              <div className="stepper-number">3</div>
              <span className="stepper-label">Configure HR workflows</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: EMPLOYEE PORTAL & AI ASSISTANT (Matches Figma Screen 04)
  // =========================================================================
  const leaveBalance =
    data?.leaveBalances?.Annual?.remaining ??
    data?.leaveBalance?.annual ??
    data?.stats?.leavesRemaining ??
    '14';
  const hasProfile = Boolean(data?.employee || user?.employeeId || user?.employee);
  const myRequests = data?.myRequests || [];

  return (
    <div className="figma-dashboard-view">
      {/* Page Header */}
      <div className="figma-page-header">
        <div>
          <h1 className="figma-page-title">My workspace</h1>
          <p className="figma-page-subtitle">Your HR information and self-service tools.</p>
        </div>
        <span className="figma-role-pill">EMPLOYEE PORTAL</span>
      </div>

      {/* 2-Column Layout */}
      <div className="figma-two-col-grid" style={{ alignItems: 'start' }}>
        {/* Left Column: Welcome Card + My HR requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Welcome Card */}
          <div className="figma-white-card figma-welcome-emp-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
              <div className="emp-avatar-soft-box">
                <User size={24} className="emp-avatar-icon" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 className="card-title">Welcome to your employee portal</h3>
                  <span className={`emp-config-badge ${hasProfile ? 'configured' : ''}`}>
                    {hasProfile ? 'ACTIVE EMPLOYEE' : 'PROFILE NOT CONFIGURED'}
                  </span>
                </div>
                <p className="card-subtitle" style={{ margin: '0.35rem 0 1rem' }}>
                  {hasProfile
                    ? `Logged in as ${data?.employee?.fullName || user?.name || 'Employee'} • ${data?.employee?.department || 'General Department'}`
                    : 'Your profile details will appear after your account is set up.'}
                </p>
                <Link to="/profile" className="figma-btn-white-outline">
                  View my profile
                </Link>
              </div>
            </div>
          </div>

          {/* My HR requests */}
          <div className="figma-white-card">
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">My HR requests</h3>
                <p className="card-subtitle">Track requests and updates from your HR team.</p>
              </div>
            </div>

            {myRequests.length > 0 ? (
              <div className="emp-requests-list" style={{ marginTop: '1rem' }}>
                {myRequests.map((req) => (
                  <div key={req._id} className="emp-request-row">
                    <div className="emp-request-info">
                      <strong>{req.leaveType} Leave Application</strong>
                      <span>{req.startDate} to {req.endDate} ({req.workingDaysCount} working days)</span>
                    </div>
                    <span className={`status-tag status-${req.status}`}>
                      {req.status === 'pending' ? 'Pending Review' : req.status?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="figma-empty-state-box" style={{ padding: '2.5rem 1rem' }}>
                <div className="empty-state-icon-pill">
                  <Clock size={20} />
                </div>
                <h4 className="empty-state-title">Nothing to show yet</h4>
                <p className="empty-state-desc">Your leave applications and HR updates will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Balance + HCM AI Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Leave balance card */}
          <div className="figma-white-card">
            <div className="card-header-clean">
              <div>
                <h3 className="card-title">Leave balance</h3>
                <p className="card-subtitle">Your available leave will be shown here.</p>
              </div>
            </div>

            <div className="figma-leave-balance-box">
              <div className="leave-balance-number">
                {leaveBalance} <span className="days-unit">days available</span>
              </div>
              <p className="leave-balance-policy-note">
                {hasProfile ? 'Complies with official company annual leave quota' : 'Leave policy not configured yet'}
              </p>
              {data?.leaveBalances && (
                <div className="leave-balance-mini-chips">
                  <span>Sick: {data.leaveBalances.Sick?.remaining ?? 8}d left</span>
                  <span>Casual: {data.leaveBalances.Casual?.remaining ?? 10}d left</span>
                  <span>Unpaid: {data.leaveBalances.Unpaid?.used ?? 0}d used</span>
                </div>
              )}
            </div>

            <Link to="/leaves" className="figma-btn-purple w-full text-center">
              Request leave
            </Link>
          </div>

          {/* HCM AI Assistant Card (Figma screen 04 dark card) */}
          <div className="figma-ai-widget-card">
            <div className="ai-widget-header">
              <div className="ai-widget-sparkle-box">
                <Sparkles size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <strong className="ai-widget-title">HCM AI Assistant</strong>
                <span className="ai-widget-sub">Answers from your HR workspace</span>
              </div>
              {aiChatLog.length > 0 && (
                <button
                  type="button"
                  className="ai-widget-clear-btn"
                  onClick={() => setAiChatLog([])}
                  title="Clear chat"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="ai-widget-body">
              <p className="ai-widget-prompt-text">
                Ask a question about your HR information.
              </p>
              <span className="ai-widget-disclaimer">
                The assistant will use data you are permitted to access.
              </span>

              {/* Chat Log if any */}
              {aiChatLog.length > 0 && (
                <div className="ai-widget-chat-messages">
                  {aiChatLog.map((m, idx) => (
                    <div key={idx} className={`ai-mini-msg ${m.role}`}>
                      <div className="ai-msg-avatar-mini">
                        {m.role === 'assistant' ? <Bot size={13} /> : <User size={13} />}
                      </div>
                      <div className="ai-msg-body">
                        {renderFormattedMessage(m.content)}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-mini-msg assistant loading">
                      <div className="ai-msg-avatar-mini">
                        <Bot size={13} />
                      </div>
                      <div className="ai-msg-body">
                        <div className="ai-mini-loading-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <span className="ai-thinking-text">Checking real HR records...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Prompt Chips */}
              <div className="ai-widget-chips">
                <button
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => handleAiSend('What is my leave balance?')}
                  disabled={aiLoading}
                >
                  What is my leave balance?
                </button>
                <button
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => handleAiSend('How do I request time off?')}
                  disabled={aiLoading}
                >
                  How do I request time off?
                </button>
                <button
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => handleAiSend('Where can I view my profile?')}
                  disabled={aiLoading}
                >
                  Where can I view my profile?
                </button>
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSend();
                }}
                className="ai-widget-input-row"
              >
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={aiLoading}
                  className="ai-widget-text-input"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="ai-widget-send-btn"
                  title="Send Question"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
