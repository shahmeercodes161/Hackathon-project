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
      {/* Header */}
      <div className="leaves-header">
        <div>
          <h1>Leave Management & Smart NLP</h1>
          <p>
            Working days only (skips weekends and registered public holidays). Strict 422 balance & overlap guards.
          </p>
        </div>
      </div>

      {alert.text && (
        <div className={`leaves-alert-banner ${alert.type}`}>
          {alert.text}
        </div>
      )}

      {/* Quotas & Balances Row */}
      <div className="leave-balance-grid">
        <div className="balance-card">
          <span className="balance-label">Annual Vacation</span>
          <span className="balance-value">{balances.Annual?.remaining ?? 14}</span>
          <small>Quota: 14 days &bull; Used: {balances.Annual?.used ?? 0}</small>
        </div>
        <div className="balance-card">
          <span className="balance-label">Sick Leave</span>
          <span className="balance-value">{balances.Sick?.remaining ?? 8}</span>
          <small>Quota: 8 days &bull; Used: {balances.Sick?.used ?? 0}</small>
        </div>
        <div className="balance-card">
          <span className="balance-label">Casual Leave</span>
          <span className="balance-value">{balances.Casual?.remaining ?? 10}</span>
          <small>Quota: 10 days &bull; Used: {balances.Casual?.used ?? 0}</small>
        </div>
        <div className="balance-card">
          <span className="balance-label">Unpaid Leave</span>
          <span className="balance-value">Unlimited</span>
          <small>Taken: {balances.Unpaid?.used ?? 0} days</small>
        </div>
      </div>

      {/* HR Pending Inbox (if Admin or HR) */}
      {(role === 'admin' || role === 'hr') && (
        <div className="leave-section-card">
          <div className="section-title-flex">
            <h3>HR Approval Inbox (Pending Requests)</h3>
            <span className="inbox-badge">{pendingLeaves.length} Pending</span>
          </div>

          {pendingLeaves.length === 0 ? (
            <p className="empty-sub">No pending leave requests requiring review.</p>
          ) : (
            <div className="pending-leaves-grid">
              {pendingLeaves.map((l) => (
                <div key={l._id} className="pending-leave-card">
                  <div className="pending-card-top">
                    <div>
                      <span className="emp-name-tag">{l.employeeId?.fullName} ({l.employeeId?.department})</span>
                      <h4 className="leave-type-head">{l.leaveType} Leave &bull; {l.workingDaysCount} Working Day(s)</h4>
                    </div>
                    <span className="pending-pill">Pending HR Review</span>
                  </div>

                  <p className="leave-date-range">
                    📅 From <strong>{l.startDate}</strong> to <strong>{l.endDate}</strong>
                  </p>
                  <p className="leave-reason-text">&ldquo;{l.reason}&rdquo;</p>

                  <div className="review-action-row">
                    <input
                      type="text"
                      placeholder="Optional HR comment..."
                      value={reviewComment[l._id] || ''}
                      onChange={(e) => setReviewComment({ ...reviewComment, [l._id]: e.target.value })}
                      className="comment-input"
                    />
                    <div className="review-btn-group">
                      <button className="reject-btn" onClick={() => handleReview(l._id, 'reject')}>
                        <X size={14} /> Reject
                      </button>
                      <button className="approve-btn" onClick={() => handleReview(l._id, 'approve')}>
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
