import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService, aiService } from '../services/api';
import {
  CalendarDays,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import './Leaves.css';

export default function Leaves() {
  const { role } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState({});
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Smart Leave NLP input
  const [smartPrompt, setSmartPrompt] = useState('');
  const [smartLoading, setSmartLoading] = useState(false);

  // Apply Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // HR Review
  const [reviewComment, setReviewComment] = useState({});

  // Alert State
  const [alert, setAlert] = useState({ text: '', type: '' });

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'admin' || role === 'hr') {
        const [pendingRes, myRes] = await Promise.all([
          leaveService.getPending(),
          leaveService.getMy(),
        ]);
        if (pendingRes.success) setPendingLeaves(pendingRes.leaves || []);
        if (myRes.success) {
          setLeaves(myRes.leaves || []);
          setBalances(myRes.balances || {});
        }
      } else {
        const res = await leaveService.getMy();
        if (res.success) {
          setLeaves(res.leaves || []);
          setBalances(res.balances || {});
        }
      }
    } catch (err) {
      console.error('Fetch leaves error:', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // AI Smart Leave Extractor
  const handleSmartLeaveParse = async (e) => {
    e.preventDefault();
    if (!smartPrompt.trim()) return;

    setSmartLoading(true);
    setAlert({ text: '', type: '' });

    try {
      const res = await aiService.smartLeave(smartPrompt);
      if (res.success && res.prefilledForm) {
        setLeaveForm({
          leaveType: res.prefilledForm.type || 'Casual',
          startDate: res.prefilledForm.startDate || '',
          endDate: res.prefilledForm.endDate || '',
          reason: res.prefilledForm.reason || '',
        });
        setAlert({
          text: `✨ Smart Leave parsed successfully! Form pre-filled for ${res.prefilledForm.type} leave (${res.prefilledForm.startDate} to ${res.prefilledForm.endDate}). Please review & submit.`,
          type: 'success',
        });
      }
    } catch (err) {
      setAlert({ text: err.message || 'Smart Leave parser error', type: 'error' });
    } finally {
      setSmartLoading(false);
    }
  };

  // Submit Leave Application
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setAlert({ text: '', type: '' });

    try {
      const res = await leaveService.apply(leaveForm);
      if (res.success) {
        setAlert({ text: res.message || 'Leave application submitted!', type: 'success' });
        setLeaveForm({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
        setSmartPrompt('');
        fetchLeaveData();
      }
    } catch (err) {
      // Handles 422 Overlap or Overbalance
      setAlert({ text: err.message || 'Leave application failed', type: 'error' });
    }
  };

  // HR Review Action
  const handleReview = async (id, action) => {
    try {
      const comment = reviewComment[id] || '';
      const res = await leaveService.review(id, { action, hrComment: comment });
      if (res.success) {
        setAlert({ text: res.message || `Leave ${action}d!`, type: 'success' });
        fetchLeaveData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Review failed', type: 'error' });
    }
  };

  // Cancel Leave (Employee)
  const handleCancel = async (id) => {
    try {
      const res = await leaveService.cancel(id);
      if (res.success) {
        setAlert({ text: 'Leave cancelled successfully', type: 'success' });
        fetchLeaveData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Cancellation failed', type: 'error' });
    }
  };

  return (
    <div className="leaves-container">
      {/* Page Header (Figma Screen 03) */}
      <div className="figma-page-header">
        <div>
          <h1 className="figma-page-title">Leave management</h1>
          <p className="figma-page-subtitle">Review requests and keep leave decisions in one place.</p>
        </div>
        <Link to="/org-setup" className="figma-btn-white-outline">
          Leave policy settings
        </Link>
      </div>

      {alert.text && (
        <div className={`leaves-alert-banner ${alert.type}`}>
          {alert.text}
        </div>
      )}

      {/* 3 Metric Cards (Figma Screen 03) */}
      <div className="figma-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="figma-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="metric-label" style={{ fontSize: '0.86rem', color: '#64748b' }}>Pending</span>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 6px', background: '#fef3c7', color: '#b45309', borderRadius: '4px' }}>
              LIVE COUNT
            </span>
          </div>
          <div className="metric-value" style={{ margin: 0, fontSize: '2rem' }}>
            {pendingLeaves.length}
          </div>
        </div>

        <div className="figma-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="metric-label" style={{ fontSize: '0.86rem', color: '#64748b' }}>Approved</span>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 6px', background: '#d1fae5', color: '#047857', borderRadius: '4px' }}>
              LIVE COUNT
            </span>
          </div>
          <div className="metric-value" style={{ margin: 0, fontSize: '2rem' }}>
            {myLeaves.filter(l => l.status === 'approved').length}
          </div>
        </div>

        <div className="figma-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="metric-label" style={{ fontSize: '0.86rem', color: '#64748b' }}>Rejected</span>
            <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 6px', background: '#ffe4e6', color: '#be123c', borderRadius: '4px' }}>
              LIVE COUNT
            </span>
          </div>
          <div className="metric-value" style={{ margin: 0, fontSize: '2rem' }}>
            {myLeaves.filter(l => l.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Main Leave Requests Card (Figma Screen 03) */}
      <div className="figma-white-card" style={{ marginBottom: '1.75rem', padding: '1.75rem' }}>
        <div className="card-header-clean">
          <div>
            <h3 className="card-title">Leave requests</h3>
            <p className="card-subtitle">Review employee leave submissions and record decisions.</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button className="figma-btn-purple" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
            Pending
          </button>
          <button className="figma-btn-white-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
            Approved
          </button>
          <button className="figma-btn-white-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
            Rejected
          </button>
        </div>

        {/* Leave Table or Empty State */}
        {pendingLeaves.length === 0 ? (
          <div className="figma-empty-state-box" style={{ padding: '3rem 1rem' }}>
            <div className="empty-state-icon-pill" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 className="empty-state-title">No leave requests</h4>
            <p className="empty-state-desc">When employees submit leave requests, they'll appear here.</p>
          </div>
        ) : (
          <div className="emp-table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>LEAVE TYPE</th>
                  <th>DATES</th>
                  <th>DURATION</th>
                  <th>STATUS</th>
                  {(role === 'admin' || role === 'hr') && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <strong>{l.employeeId?.fullName || 'Employee'}</strong>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{l.employeeId?.department}</div>
                    </td>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate} to {l.endDate}</td>
                    <td>{l.workingDaysCount} working day(s)</td>
                    <td><span className="pending-pill">Pending Review</span></td>
                    {(role === 'admin' || role === 'hr') && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="emp-btn secondary"
                            onClick={() => handleReview(l._id, 'reject')}
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          >
                            Reject
                          </button>
                          <button
                            className="figma-btn-purple"
                            onClick={() => handleReview(l._id, 'approve')}
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '1.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
          Approvals are based on your configured HR policy
        </div>
      </div>

      {/* Smart Leave NLP & Application Grid */}
      <div className="leaves-two-col">
        {/* Smart Leave Assistant */}
        <div className="leave-section-card smart-card">
          <div className="smart-card-header">
            <div className="smart-title-box">
              <Sparkles size={20} className="sparkle-anim" />
              <h3>AI Smart Leave Assistant</h3>
            </div>
            <span className="ai-gen-label">AI NLP Parser</span>
          </div>
          <p className="smart-sub">
            Type your leave request in plain words or Roman Urdu (e.g., <em>&ldquo;Need next Monday and Tuesday off for my sister&apos;s wedding&rdquo;</em> or <em>&ldquo;Kal bukhar ki wajah se chutti chahiye&rdquo;</em>).
          </p>

          <form onSubmit={handleSmartLeaveParse} className="smart-form">
            <div className="smart-input-row">
              <input
                type="text"
                placeholder="Type your leave request in plain natural words..."
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
              />
              <button type="submit" className="smart-btn" disabled={smartLoading || !smartPrompt.trim()}>
                {smartLoading ? 'Extracting...' : 'Parse & Auto-Fill'}
                <Send size={14} />
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="smart-sample-chips">
            <button
              className="sample-chip"
              onClick={() => setSmartPrompt("Need next Monday and Tuesday off for my sister's wedding")}
            >
              &ldquo;Need next Monday and Tuesday off for wedding&rdquo;
            </button>
            <button
              className="sample-chip"
              onClick={() => setSmartPrompt("Need tomorrow off due to high fever and doctor appointment")}
            >
              &ldquo;Tomorrow off due to fever&rdquo;
            </button>
          </div>
        </div>

        {/* Regular Application Form */}
        <div className="leave-section-card">
          <h3>Apply for Leave</h3>
          <form onSubmit={handleApplyLeave} className="apply-form">
            <div className="form-field">
              <label>Leave Classification *</label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                required
              >
                <option value="Casual">Casual Leave (Quota: 10)</option>
                <option value="Sick">Sick Leave (Quota: 8)</option>
                <option value="Annual">Annual Vacation (Quota: 14)</option>
                <option value="Unpaid">Unpaid Leave (Unlimited)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>End Date *</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Justification / Reason *</label>
              <input
                type="text"
                placeholder="Provide details for HR review..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="att-btn primary full">
              Submit Leave Application
            </button>
          </form>
        </div>
      </div>

      {/* My Leave Requests History */}
      <div className="leave-section-card">
        <h3>My Leave Requests History</h3>
        {leaves.length === 0 ? (
          <p className="empty-sub">No personal leave requests submitted yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Working Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>HR Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td><strong>{l.leaveType}</strong></td>
                    <td>{l.startDate} to {l.endDate}</td>
                    <td>{l.workingDaysCount} day(s)</td>
                    <td>{l.reason}</td>
                    <td><span className={`status-tag status-${l.status}`}>{l.status}</span></td>
                    <td>{l.hrComment || '—'}</td>
                    <td>
                      {l.status === 'pending' && (
                        <button className="cancel-leave-btn" onClick={() => handleCancel(l._id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
