import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardService, attendanceService, aiService } from '../services/api';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Clock,
  TrendingUp,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Filter,
  UserCheck,
  Building,
  BellRing,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ onOpenAi }) {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');

  // AI Summary state
  const [aiSummary, setAiSummary] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Check-in action state (for Employee)
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'admin') {
        const res = await dashboardService.getAdmin({
          department: selectedDept,
          month: selectedMonth,
        });
        if (res.success) setData(res);
      } else if (role === 'hr') {
        const res = await dashboardService.getHr({ department: selectedDept });
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
  }, [role, selectedDept, selectedMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // AI Summarize feature
  const handleSummarize = async () => {
    if (!data?.kpis || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await aiService.summarize(data.kpis);
      if (res.success) {
        setAiSummary(res.bullets || []);
      }
    } catch (err) {
      console.error('Summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Employee Check-In / Check-Out
  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await attendanceService.checkIn({ source: 'web' });
      setActionMessage({ text: res.message || 'Checked in successfully!', type: 'success' });
      loadDashboardData();
    } catch (err) {
      setActionMessage({ text: err.message || 'Check-in failed.', type: 'error' });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckInLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const res = await attendanceService.checkOut();
      setActionMessage({ text: res.message || 'Checked out successfully!', type: 'success' });
      loadDashboardData();
    } catch (err) {
      setActionMessage({ text: err.message || 'Check-out failed.', type: 'error' });
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="dash-loading-wrapper">
        <div className="dash-spinner"></div>
        <p>Aggregating live organizational data from database...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Top Banner */}
      <div className="dash-top-banner">
        <div className="dash-title-group">
          <h1>Welcome back, {user?.name}</h1>
          <p className="dash-subtitle">
            Role: <strong>{role?.toUpperCase()}</strong> &bull; Enterprise Operations & People Management Portal
          </p>
        </div>

        {/* Global AI Action & Filters */}
        <div className="dash-actions-bar">
          {(role === 'admin' || role === 'hr') && (
            <>
              <div className="filter-select-wrapper">
                <Filter size={14} className="filter-icon" />
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <button
                className="dash-summarize-btn"
                onClick={handleSummarize}
                disabled={isSummarizing}
              >
                <Sparkles size={16} />
                {isSummarizing ? 'Analyzing...' : 'AI KPI Summary'}
              </button>
            </>
          )}

          <button className="dash-ai-chat-btn" onClick={onOpenAi}>
            <Sparkles size={16} /> Ask AI Assistant
          </button>
        </div>
      </div>

      {/* AI Summary Bullets Card (if triggered) */}
      {aiSummary.length > 0 && (
        <div className="ai-summary-card">
          <div className="ai-summary-header">
            <div className="ai-summary-tag">
              <Sparkles size={16} />
              <span>AI Executive Insights (from real DB metrics)</span>
            </div>
            <span className="ai-gen-label">AI-generated</span>
          </div>
          <div className="ai-bullets-list">
            {aiSummary.map((b, idx) => (
              <div key={idx} className="ai-bullet-item">
                <CheckCircle2 size={16} className="bullet-check" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ADMIN DASHBOARD --- */}
      {role === 'admin' && data && (
        <div className="admin-dash-view">
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-box blue">
                <Users size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Active Headcount</span>
                <span className="kpi-value">{data.kpis?.headcount || 0}</span>
                <span className="kpi-meta">Filtered by {selectedDept}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box green">
                <TrendingUp size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Attrition Rate (YTD)</span>
                <span className="kpi-value">{data.kpis?.attritionRate || '0.0%'}</span>
                <span className="kpi-meta">Exits &divide; Avg Headcount</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box purple">
                <CreditCard size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Monthly Payroll Cost</span>
                <span className="kpi-value">
                  PKR {Number(data.kpis?.payrollCost || 0).toLocaleString()}
                </span>
                <span className="kpi-meta">Month: {data.kpis?.activePayrollMonth}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box orange">
                <Building size={22} />
              </div>
              <div className="kpi-info">
                <span className="kpi-label">Average Salary</span>
                <span className="kpi-value">
                  PKR {Number(data.kpis?.avgSalary || 0).toLocaleString()}
                </span>
                <span className="kpi-meta">Per active employee</span>
              </div>
            </div>
          </div>

          {/* Charts & Distributions */}
          <div className="dash-row-2">
            {/* Headcount by Dept */}
            <div className="dash-card">
              <h3>Headcount by Department</h3>
              <div className="bar-list">
                {data.headcountByDept?.length === 0 ? (
                  <p className="empty-sub">No department data recorded yet.</p>
                ) : (
                  data.headcountByDept?.map((d) => (
                    <div key={d.department} className="bar-row">
                      <div className="bar-label-group">
                        <span className="bar-name">{d.department}</span>
                        <span className="bar-count">{d.count} employee(s)</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill blue"
                          style={{
                            width: `${Math.min(100, (d.count / Math.max(1, data.kpis.headcount)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payroll by Dept */}
            <div className="dash-card">
              <h3>Payroll Cost by Department</h3>
              <div className="bar-list">
                {data.payrollByDept?.length === 0 ? (
                  <p className="empty-sub">Run monthly payroll to view departmental cost distribution.</p>
                ) : (
                  data.payrollByDept?.map((d) => (
                    <div key={d.department} className="bar-row">
                      <div className="bar-label-group">
                        <span className="bar-name">{d.department}</span>
                        <span className="bar-count">PKR {d.gross?.toLocaleString()}</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill purple"
                          style={{
                            width: `${Math.min(100, (d.gross / Math.max(1, data.kpis.payrollCost)) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audit Feed */}
          <div className="dash-card full-width">
            <div className="card-header-flex">
              <h3>Immutable Audit Feed (Recent Activity)</h3>
              <span className="audit-secure-badge">
                <ShieldAlert size={14} /> Server Verified
              </span>
            </div>
            <div className="table-responsive">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Actor</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.auditFeed?.slice(0, 6).map((log) => (
                    <tr key={log._id}>
                      <td><strong>{log.actor?.name}</strong></td>
                      <td><span className={`pill-role ${log.actor?.role}`}>{log.actor?.role}</span></td>
                      <td><span className="action-tag">{log.action}</span></td>
                      <td>{log.entity}</td>
                      <td>{log.description}</td>
                      <td>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- HR DASHBOARD --- */}
      {role === 'hr' && data && (
        <div className="hr-dash-view">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-box blue"><Users size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Total Headcount</span>
                <span className="kpi-value">{data.kpis?.headcount || 0}</span>
                <span className="kpi-meta">Active workforce</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box green"><UserCheck size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Present Today</span>
                <span className="kpi-value">{data.kpis?.presentToday || 0}</span>
                <span className="kpi-meta">Checked-in on time</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box orange"><AlertTriangle size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Late Today</span>
                <span className="kpi-value">{data.kpis?.lateToday || 0}</span>
                <span className="kpi-meta">After 09:15 AM grace</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box purple"><CalendarDays size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">On Leave Today</span>
                <span className="kpi-value">{data.kpis?.onLeaveToday || 0}</span>
                <span className="kpi-meta">Approved leave requests</span>
              </div>
            </div>
          </div>

          <div className="dash-row-2">
            {/* Top Late Comers */}
            <div className="dash-card">
              <h3>Top Late-Comers This Month</h3>
              {data.topLateComers?.length === 0 ? (
                <p className="empty-sub">No repeat late check-ins recorded.</p>
              ) : (
                <div className="list-styled">
                  {data.topLateComers?.map((c, i) => (
                    <div key={c._id} className="list-item-styled">
                      <div className="item-rank">#{i + 1}</div>
                      <div className="item-main">
                        <span className="item-title">{c.name}</span>
                        <span className="item-sub">{c.department}</span>
                      </div>
                      <span className="late-badge">{c.lateCount} late arrivals</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave by Type */}
            <div className="dash-card">
              <h3>Leave Utilization by Type</h3>
              {data.leaveByType?.length === 0 ? (
                <p className="empty-sub">No leaves taken this year.</p>
              ) : (
                <div className="bar-list">
                  {data.leaveByType?.map((l) => (
                    <div key={l.type} className="bar-row">
                      <div className="bar-label-group">
                        <span className="bar-name">{l.type} Leave</span>
                        <span className="bar-count">{l.totalDays} day(s) taken</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill green"
                          style={{ width: `${Math.min(100, (l.totalDays / 20) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- EMPLOYEE DASHBOARD --- */}
      {role === 'employee' && data && (
        <div className="employee-dash-view">
          {actionMessage.text && (
            <div className={`action-banner ${actionMessage.type}`}>
              {actionMessage.text}
            </div>
          )}

          {/* Check-in Widget */}
          <div className="checkin-hero-card">
            <div className="checkin-info-col">
              <span className="hero-tag">ATTENDANCE WORKSTATION</span>
              <h2>Daily Web Check-In</h2>
              <p>
                Standard start is <strong>09:00 AM</strong> with a 15-minute grace window. Check-ins after 09:15 AM are flagged as <strong>Late</strong>.
              </p>
              {data.todayAttendance ? (
                <div className="today-att-status">
                  <div className="status-pill-badge">
                    Status: <strong className={`status-${data.todayAttendance.status}`}>{data.todayAttendance.status.toUpperCase()}</strong>
                  </div>
                  <div className="timestamp-details">
                    <span>In: {new Date(data.todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {data.todayAttendance.checkOut && (
                      <span> &bull; Out: {new Date(data.todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({data.todayAttendance.workHours} hrs)</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="no-att-warning">You have not marked attendance today.</p>
              )}
            </div>

            <div className="checkin-btn-col">
              {!data.todayAttendance ? (
                <button
                  className="big-check-btn checkin"
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                >
                  <Clock size={28} />
                  <span>{checkInLoading ? 'Stamping Server Time...' : 'CHECK IN NOW'}</span>
                </button>
              ) : !data.todayAttendance.checkOut ? (
                <button
                  className="big-check-btn checkout"
                  onClick={handleCheckOut}
                  disabled={checkInLoading}
                >
                  <Clock size={28} />
                  <span>{checkInLoading ? 'Calculating Hours...' : 'CHECK OUT'}</span>
                </button>
              ) : (
                <div className="completed-day-badge">
                  <CheckCircle2 size={32} color="#10b981" />
                  <span>Attendance Completed for Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-box blue"><Clock size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Hours This Week</span>
                <span className="kpi-value">{data.hoursThisWeek || 0} / 40h</span>
                <span className="kpi-meta">Target: 40 hrs</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box orange"><AlertTriangle size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Late Count This Month</span>
                <span className="kpi-value">{data.lateCountThisMonth || 0}</span>
                <span className="kpi-meta">Penalty: 3 lates = 0.5 day</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box green"><CalendarDays size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Casual Leaves Left</span>
                <span className="kpi-value">{data.leaveBalances?.Casual?.remaining ?? 10}</span>
                <span className="kpi-meta">Out of 10 days quota</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-box purple"><CalendarDays size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-label">Sick Leaves Left</span>
                <span className="kpi-value">{data.leaveBalances?.Sick?.remaining ?? 8}</span>
                <span className="kpi-meta">Out of 8 days quota</span>
              </div>
            </div>
          </div>

          {/* Last Payslip & Announcements */}
          <div className="dash-row-2">
            <div className="dash-card">
              <h3>Latest Finalized Payslip</h3>
              {data.lastPayslip ? (
                <div className="payslip-snapshot">
                  <div className="payslip-snapshot-row">
                    <span>Month:</span>
                    <strong>{data.lastPayslip.month}</strong>
                  </div>
                  <div className="payslip-snapshot-row">
                    <span>Gross Salary:</span>
                    <span>PKR {data.lastPayslip.gross?.toLocaleString()}</span>
                  </div>
                  <div className="payslip-snapshot-row">
                    <span>Deductions:</span>
                    <span className="red">- PKR {data.lastPayslip.totalDeductions?.toLocaleString()}</span>
                  </div>
                  <div className="payslip-snapshot-row">
                    <span>Income Tax:</span>
                    <span className="red">- PKR {data.lastPayslip.monthlyTax?.toLocaleString()}</span>
                  </div>
                  <div className="payslip-snapshot-row total">
                    <span>Net Take-Home Pay:</span>
                    <strong className="green">PKR {data.lastPayslip.netPay?.toLocaleString()}</strong>
                  </div>
                </div>
              ) : (
                <p className="empty-sub">No payslips finalized for your account yet.</p>
              )}
            </div>

            <div className="dash-card">
              <h3>Company Announcements</h3>
              {data.announcements?.length === 0 ? (
                <p className="empty-sub">No recent announcements.</p>
              ) : (
                <div className="ann-list">
                  {data.announcements?.map((a) => (
                    <div key={a._id} className="ann-item">
                      <div className="ann-item-top">
                        <span className="ann-title">{a.title}</span>
                        <span className={`ann-priority ${a.priority}`}>{a.priority}</span>
                      </div>
                      <p className="ann-desc">{a.content}</p>
                      <small className="ann-date">Posted by {a.postedBy} on {new Date(a.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
