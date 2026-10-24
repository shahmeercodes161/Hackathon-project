import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollService } from '../services/api';
import {
  CreditCard,
  Play,
  Lock,
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Building,
} from 'lucide-react';
import './Payroll.css';

export default function Payroll() {
  const { user, role } = useAuth();
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);

  // Run Draft Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [runLoading, setRunLoading] = useState(false);

  // Payslip View Modal
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipData, setPayslipData] = useState(null);

  // Alert State
  const [alert, setAlert] = useState({ text: '', type: '' });

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'admin' || role === 'hr') {
        const res = await payrollService.getRuns();
        if (res.success) {
          setRuns(res.runs || []);
          if (res.runs?.length > 0 && !selectedRun) {
            handleSelectRun(res.runs[0]._id);
          }
        }
      } else {
        const res = await payrollService.getMyPayslips();
        if (res.success) {
          setRuns(res.payslips || []);
        }
      }
    } catch (err) {
      console.error('Fetch payroll error:', err);
    } finally {
      setLoading(false);
    }
  }, [role, selectedRun]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Select a Run to view details
  const handleSelectRun = async (runId) => {
    try {
      const res = await payrollService.getRunDetails(runId);
      if (res.success) {
        setSelectedRun(res);
      }
    } catch (err) {
      console.error('Run details error:', err);
    }
  };

  // Run Monthly Payroll Draft (HR/Admin)
  const handleExecuteDraft = async (e) => {
    e.preventDefault();
    setRunLoading(true);
    setAlert({ text: '', type: '' });

    try {
      const res = await payrollService.runDraft(selectedMonth);
      if (res.success) {
        setAlert({ text: res.message || 'Payroll draft calculated successfully!', type: 'success' });
        setShowRunModal(false);
        fetchPayroll();
        if (res.run?._id) handleSelectRun(res.run._id);
      }
    } catch (err) {
      setAlert({ text: err.message || 'Payroll run failed', type: 'error' });
    } finally {
      setRunLoading(false);
    }
  };

  // Finalize Payroll (Admin Only)
  const handleFinalize = async (runId) => {
    if (!window.confirm('Are you sure you want to finalize this payroll run? This will lock the month permanently and notify all employees.')) {
      return;
    }

    try {
      const res = await payrollService.finalize(runId);
      if (res.success) {
        setAlert({ text: res.message || 'Payroll finalized and locked!', type: 'success' });
        fetchPayroll();
        if (selectedRun?.run?._id === runId) {
          handleSelectRun(runId);
        }
      }
    } catch (err) {
      setAlert({ text: err.message || 'Finalization failed', type: 'error' });
    }
  };

  // Open Payslip Printable Modal
  const handleViewPayslip = async (payslipId) => {
    try {
      const res = await payrollService.getPayslip(payslipId);
      if (res.success) {
        setPayslipData(res);
        setShowPayslipModal(true);
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to load payslip', type: 'error' });
    }
  };

  return (
    <div className="payroll-container">
      {/* Header */}
      <div className="payroll-header">
        <div>
          <h1>Payroll Lite & Tax Calculation</h1>
          <p>
            Gross = 1.5 &times; Basic (HRA 40%, Medical 10%). Slabs: 0% to 600k, 5% to 1.2M, 15% to 2.4M, 25% to 3.6M, 35% above.
          </p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <button className="att-btn primary" onClick={() => setShowRunModal(true)}>
            <Play size={16} /> Prepare Monthly Payroll Draft
          </button>
        )}
      </div>

      {alert.text && (
        <div className={`payroll-alert-banner ${alert.type}`}>
          {alert.text}
        </div>
      )}

      {/* ADMIN & HR VIEW */}
      {(role === 'admin' || role === 'hr') && (
        <div className="payroll-layout-grid">
          {/* Left Column: Payroll Runs History */}
          <div className="payroll-sidebar-card">
            <h3>Monthly Runs History</h3>
            {runs.length === 0 ? (
              <p className="empty-sub">No payroll runs generated yet. Click &ldquo;Prepare Monthly Payroll Draft&rdquo; above.</p>
            ) : (
              <div className="runs-list">
                {runs.map((r) => (
                  <div
                    key={r._id}
                    className={`run-item-card ${selectedRun?.run?._id === r._id ? 'active' : ''}`}
                    onClick={() => handleSelectRun(r._id)}
                  >
                    <div className="run-card-top">
                      <strong>Month: {r.month}</strong>
                      <span className={`run-status-badge ${r.status}`}>
                        {r.status === 'finalized' ? <Lock size={12} /> : null}
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="run-card-numbers">
                      <span>Employees: {r.totalEmployees}</span>
                      <span>Net: <strong>PKR {r.totalNet?.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Selected Run Itemized Payslips Table */}
          <div className="payroll-main-card">
            {selectedRun ? (
              <>
                <div className="run-details-header">
                  <div>
                    <h2>Payroll Summary: {selectedRun.run?.month}</h2>
                    <span className="run-meta-info">
                      Prepared by: {selectedRun.run?.preparedBy?.name || 'HR Team'} &bull; Status:{' '}
                      <strong className={`status-${selectedRun.run?.status}`}>{selectedRun.run?.status?.toUpperCase()}</strong>
                    </span>
                  </div>

                  {role === 'admin' && selectedRun.run?.status === 'draft' && (
                    <button
                      className="finalize-btn"
                      onClick={() => handleFinalize(selectedRun.run?._id)}
                    >
                      <Lock size={16} /> Finalize & Lock Payroll
                    </button>
                  )}
                </div>

                {/* Summary Metrics */}
                <div className="run-metrics-grid">
                  <div className="run-metric-box">
                    <span>Total Gross</span>
                    <strong>PKR {selectedRun.run?.totalGross?.toLocaleString()}</strong>
                  </div>
                  <div className="run-metric-box red">
                    <span>Attendance Deductions</span>
                    <strong>- PKR {selectedRun.run?.totalDeductions?.toLocaleString()}</strong>
                  </div>
                  <div className="run-metric-box amber">
                    <span>Income Tax Withheld</span>
                    <strong>- PKR {selectedRun.run?.totalTax?.toLocaleString()}</strong>
                  </div>
                  <div className="run-metric-box green highlight">
                    <span>Net Take-Home Payout</span>
                    <strong>PKR {selectedRun.run?.totalNet?.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Payslips Table */}
                <div className="table-responsive">
                  <table className="payroll-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Employee</th>
                        <th>Basic (PKR)</th>
                        <th>Gross (1.5x)</th>
                        <th>Working Days</th>
                        <th>Deductions</th>
                        <th>Monthly Tax</th>
                        <th>Net Salary</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRun.payslips?.map((ps) => (
                        <tr key={ps._id}>
                          <td><span className="code-badge">{ps.employeeId?.employeeCode}</span></td>
                          <td><strong>{ps.employeeId?.fullName}</strong></td>
                          <td>{ps.basic?.toLocaleString()}</td>
                          <td>{ps.proratedGross?.toLocaleString()}</td>
                          <td>{ps.presentDays} / {ps.workingDaysInMonth}</td>
                          <td className="red">{ps.totalDeductions > 0 ? `- ${ps.totalDeductions?.toLocaleString()}` : '0'}</td>
                          <td className="amber">{ps.monthlyTax > 0 ? `- ${ps.monthlyTax?.toLocaleString()}` : '0'}</td>
                          <td><strong className="green">PKR {ps.netPay?.toLocaleString()}</strong></td>
                          <td>
                            <button
                              className="view-payslip-action-btn"
                              onClick={() => handleViewPayslip(ps._id)}
                            >
                              <FileText size={14} /> Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="empty-sub">Select or prepare a payroll run to inspect itemized employee payslips.</p>
            )}
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW: My Payslips */}
      {role === 'employee' && (
        <div className="payroll-main-card">
          <h3>My Finalized Payslips</h3>
          {runs.length === 0 ? (
            <p className="empty-sub">No finalized payslips available for your account yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Gross Salary</th>
                    <th>Attendance Deductions</th>
                    <th>Income Tax</th>
                    <th>Net Payout</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((ps) => (
                    <tr key={ps._id}>
                      <td><strong>{ps.month}</strong></td>
                      <td>PKR {ps.gross?.toLocaleString()}</td>
                      <td className="red">- PKR {ps.totalDeductions?.toLocaleString()}</td>
                      <td className="amber">- PKR {ps.monthlyTax?.toLocaleString()}</td>
                      <td><strong className="green">PKR {ps.netPay?.toLocaleString()}</strong></td>
                      <td><span className={`run-status-badge ${ps.status}`}>{ps.status}</span></td>
                      <td>
                        <button
                          className="view-payslip-action-btn"
                          onClick={() => handleViewPayslip(ps._id)}
                        >
                          <FileText size={14} /> View / Print PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Prepare Draft Modal */}
      {showRunModal && (
        <div className="modal-overlay" onClick={() => setShowRunModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Run Monthly Payroll Draft</h3>
              <button className="modal-close-btn" onClick={() => setShowRunModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleExecuteDraft} className="modal-form">
              <p className="modal-info">
                This will calculate salary structures, working days, absent/unpaid deductions, late penalties, and tax slabs for all eligible active employees.
              </p>
              <div className="form-field">
                <label>Target Payroll Month (YYYY-MM) *</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="att-btn secondary" onClick={() => setShowRunModal(false)}>Cancel</button>
                <button type="submit" className="att-btn primary" disabled={runLoading}>
                  {runLoading ? 'Computing Numbers...' : 'Calculate Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip PDF Modal */}
      {showPayslipModal && payslipData && (
        <div className="modal-overlay" onClick={() => setShowPayslipModal(false)}>
          <div className="modal-card wide payslip-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h3>Confidential Payslip Document</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="att-btn primary" onClick={() => window.print()}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button className="modal-close-btn" onClick={() => setShowPayslipModal(false)}><X size={18} /></button>
              </div>
            </div>

            {/* Printable Payslip Layout */}
            <div className="printable-payslip" id="printable-payslip">
              <div className="slip-header">
                <div>
                  <h1>{payslipData.company?.name || 'Saylani HCM Inc.'}</h1>
                  <p>{payslipData.company?.address || 'Zaitoon Ashraf IT Park'}</p>
                </div>
                <div className="slip-title-box">
                  <h2>SALARY PAYSLIP</h2>
                  <span className="slip-month">Month: {payslipData.payslip?.month}</span>
                  <span className={`slip-lock-badge ${payslipData.payslip?.status}`}>
                    {payslipData.payslip?.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="slip-meta-grid">
                <div><span>Employee Name:</span> <strong>{payslipData.payslip?.employeeId?.fullName}</strong></div>
                <div><span>Employee Code:</span> <strong>{payslipData.payslip?.employeeId?.employeeCode}</strong></div>
                <div><span>Department:</span> <strong>{payslipData.payslip?.employeeId?.department}</strong></div>
                <div><span>Designation:</span> <strong>{payslipData.payslip?.employeeId?.designation}</strong></div>
                <div><span>Joining Date:</span> <span>{payslipData.payslip?.employeeId?.joiningDate}</span></div>
                <div><span>Working Days in Month:</span> <span>{payslipData.payslip?.workingDaysInMonth} days</span></div>
              </div>

              <div className="slip-tables-grid">
                {/* Earnings */}
                <table className="slip-table">
                  <thead>
                    <tr><th colSpan="2">EARNINGS</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Basic Salary</td><td>PKR {payslipData.payslip?.basic?.toLocaleString()}</td></tr>
                    <tr><td>House Rent Allowance (40%)</td><td>PKR {payslipData.payslip?.hra?.toLocaleString()}</td></tr>
                    <tr><td>Medical Allowance (10%)</td><td>PKR {payslipData.payslip?.medical?.toLocaleString()}</td></tr>
                    <tr className="subtotal"><td><strong>Gross Earnings (1.5x)</strong></td><td><strong>PKR {payslipData.payslip?.gross?.toLocaleString()}</strong></td></tr>
                  </tbody>
                </table>

                {/* Deductions */}
                <table className="slip-table">
                  <thead>
                    <tr><th colSpan="2">DEDUCTIONS & TAX</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Absent & Leave Deductions ({payslipData.payslip?.absentDays + payslipData.payslip?.unpaidLeaveDays} days)</td>
                      <td className="red">- PKR {payslipData.payslip?.leaveDeductions?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Late Penalty (3 lates = 0.5 day)</td>
                      <td className="red">- PKR {payslipData.payslip?.latePenaltyDeduction?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Income Tax ({payslipData.payslip?.taxSlab})</td>
                      <td className="red">- PKR {payslipData.payslip?.monthlyTax?.toLocaleString()}</td>
                    </tr>
                    <tr className="subtotal">
                      <td><strong>Total Deductions</strong></td>
                      <td className="red"><strong>- PKR {(payslipData.payslip?.totalDeductions + payslipData.payslip?.monthlyTax)?.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Pay Total Banner */}
              <div className="slip-net-banner">
                <span>NET TAKE-HOME SALARY</span>
                <h2>PKR {payslipData.payslip?.netPay?.toLocaleString()}</h2>
              </div>

              <div className="slip-footer">
                <small>Generated by HCM Lite Enterprise Payroll Engine &bull; Complies with Saylani Hackathon Business Rules & Tax Slabs.</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
