import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService, orgService } from '../services/api';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building,
  KeyRound,
} from 'lucide-react';
import './Employees.css';

export default function Employees() {
  const { role } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [show360Modal, setShow360Modal] = useState(false);
  const [selected360, setSelected360] = useState(null);
  const [loading360, setLoading360] = useState(false);

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: 'Male',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 80000,
    temporaryPassword: 'welcome123',
  });
  const [registerSuccessData, setRegisterSuccessData] = useState(null);
  const [registerError, setRegisterError] = useState('');

  // CSV Dry-Run State
  const [csvRawText, setCsvRawText] = useState('');
  const [dryRunReport, setDryRunReport] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMessage, setCsvMessage] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAll({
        search,
        department: selectedDept,
        page,
        limit: 15,
      });
      if (res.success) {
        setEmployees(res.employees || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, page]);

  useEffect(() => {
    fetchEmployees();
    orgService.getDepartments().then((res) => {
      if (res.success) setDepartments(res.departments || []);
    });
  }, [fetchEmployees]);

  // Open 360 Profile
  const handleOpen360 = async (id) => {
    setShow360Modal(true);
    setLoading360(true);
    try {
      const res = await employeeService.get360(id);
      if (res.success) {
        setSelected360(res);
      }
    } catch (err) {
      console.error('360 profile error:', err);
    } finally {
      setLoading360(false);
    }
  };

  // Submit Register Employee
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccessData(null);

    try {
      const res = await employeeService.register(registerForm);
      if (res.success) {
        setRegisterSuccessData(res);
        fetchEmployees();
      }
    } catch (err) {
      setRegisterError(err.message || 'Registration failed');
    }
  };

  // Dry-Run CSV Parser & Validator
  const handleDryRunCsv = async () => {
    if (!csvRawText.trim()) return;
    setCsvLoading(true);
    setDryRunReport(null);
    setCsvMessage('');

    try {
      const lines = csvRawText.trim().split('\n');
      if (lines.length < 2) {
        setCsvMessage('CSV must include a header line and at least one data row.');
        setCsvLoading(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || '';
        });
        rows.push(obj);
      }

      const res = await employeeService.dryRunCsv(rows);
      if (res.success) {
        setDryRunReport(res);
      }
    } catch (err) {
      setCsvMessage(err.message || 'Dry-run validation error');
    } finally {
      setCsvLoading(false);
    }
  };

  // Commit CSV
  const handleCommitCsv = async () => {
    if (!dryRunReport?.validRows?.length) return;
    setCsvLoading(true);
    try {
      const res = await employeeService.commitCsv(dryRunReport.validRows);
      if (res.success) {
        setCsvMessage(`Successfully committed ${res.count} employee(s)!`);
        setDryRunReport(null);
        setCsvRawText('');
        fetchEmployees();
      }
    } catch (err) {
      setCsvMessage(err.message || 'CSV commit failed');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="employees-container">
      {/* Header */}
      <div className="emp-header">
        <div>
          <h1>Employee Directory</h1>
          <p>Complete lifecycle management, server-side search, Employee 360 profile, and CSV tools.</p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <div className="emp-actions">
            <a href={employeeService.exportCsvUrl()} className="emp-btn secondary">
              <Download size={16} /> Export CSV
            </a>
            <button className="emp-btn secondary" onClick={() => setShowCsvModal(true)}>
              <FileSpreadsheet size={16} /> Import CSV
            </button>
            <button className="emp-btn primary" onClick={() => {
              setRegisterSuccessData(null);
              setRegisterError('');
              setShowRegisterModal(true);
            }}>
              <UserPlus size={16} /> Register Employee
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="emp-controls">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, employee code, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select value={selectedDept} onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}>
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="emp-table-wrapper">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Joining Date</th>
              <th>Status</th>
              {(role === 'admin' || role === 'hr') && <th>Gross Salary</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="table-empty">Loading directory records...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty">No employees found. Register an employee to get started.</td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e._id}>
                  <td><span className="code-badge">{e.employeeCode}</span></td>
                  <td>
                    <div className="emp-name-col">
                      <span className="emp-full-name">{e.fullName || `${e.firstName} ${e.lastName}`}</span>
                      <span className="emp-email-sub">{e.email}</span>
                    </div>
                  </td>
                  <td>{e.department}</td>
                  <td>{e.designation}</td>
                  <td>{e.joiningDate}</td>
                  <td><span className={`status-tag status-${e.status}`}>{e.status}</span></td>
                  {(role === 'admin' || role === 'hr') && (
                    <td><strong>PKR {e.salaryStructure?.gross?.toLocaleString() || '—'}</strong></td>
                  )}
                  <td>
                    <button className="view-360-btn" onClick={() => handleOpen360(e._id)}>
                      <Eye size={14} /> 360 View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Employee</h3>
              <button className="modal-close-btn" onClick={() => setShowRegisterModal(false)}><X size={18} /></button>
            </div>

            {registerError && <div className="modal-error-banner">{registerError}</div>}

            {registerSuccessData ? (
              <div className="register-success-view">
                <CheckCircle2 size={44} color="#10b981" />
                <h4>Employee Registered Successfully!</h4>
                <p>An automated user login account has been provisioned with a temporary password.</p>
                <div className="credentials-box">
                  <div className="cred-row"><span>Login Email:</span> <strong>{registerSuccessData.tempLogin?.email}</strong></div>
                  <div className="cred-row"><span>Temporary Password:</span> <code>{registerSuccessData.tempLogin?.temporaryPassword}</code></div>
                  <div className="cred-row"><span>First Sign-in Rule:</span> <span className="amber">Password change mandatory on first login</span></div>
                </div>
                <button className="emp-btn primary" onClick={() => setShowRegisterModal(false)}>Close & Continue</button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Employee Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-001"
                      value={registerForm.employeeCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, employeeCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Corporate Email *</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Department *</label>
                    <select
                      value={registerForm.department}
                      onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Designation *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Software Engineer"
                      value={registerForm.designation}
                      onChange={(e) => setRegisterForm({ ...registerForm, designation: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Joining Date *</label>
                    <input
                      type="date"
                      value={registerForm.joiningDate}
                      onChange={(e) => setRegisterForm({ ...registerForm, joiningDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Basic Salary (PKR) *</label>
                    <input
                      type="number"
                      value={registerForm.basicSalary}
                      onChange={(e) => setRegisterForm({ ...registerForm, basicSalary: Number(e.target.value) })}
                      required
                    />
                    <small>
                      Gross auto-calculated: <strong>PKR {Math.round(registerForm.basicSalary * 1.5).toLocaleString()}</strong> (Basic + 40% HRA + 10% Medical)
                    </small>
                  </div>
                </div>

                <div className="form-field">
                  <label>Initial Temporary Password</label>
                  <input
                    type="text"
                    value={registerForm.temporaryPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, temporaryPassword: e.target.value })}
                    required
                  />
                  <small>Employee must change this password upon first sign-in.</small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="emp-btn secondary" onClick={() => setShowRegisterModal(false)}>Cancel</button>
                  <button type="submit" className="emp-btn primary">Complete Registration</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CSV Dry-Run & Import Modal */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Employee CSV Import (with Dry-Run Validation)</h3>
              <button className="modal-close-btn" onClick={() => setShowCsvModal(false)}><X size={18} /></button>
            </div>

            <p className="modal-info">
              Paste CSV records below. The dry-run engine checks required fields, email format, duplicate codes/emails, known departments, ISO dates, and positive salaries.
            </p>

            <textarea
              className="csv-textarea"
              placeholder={`employeeCode,firstName,lastName,email,phone,gender,department,designation,joiningDate,basicSalary\nEMP-101,Ali,Khan,ali.khan@company.com,03001234567,Male,Engineering,Frontend Engineer,2026-10-01,100000\nEMP-102,Sara,Ahmed,sara.ahmed@company.com,03009876543,Female,Human Resources,HR Executive,2026-10-01,90000`}
              rows={6}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
            />

            <div className="csv-actions-bar">
              <button className="emp-btn secondary" onClick={handleDryRunCsv} disabled={csvLoading}>
                {csvLoading ? 'Validating...' : 'Run Dry-Run Check'}
              </button>

              {dryRunReport && (
                <button
                  className="emp-btn primary"
                  onClick={handleCommitCsv}
                  disabled={csvLoading || dryRunReport.errors?.length > 0}
                >
                  Commit Import ({dryRunReport.validCount} valid rows)
                </button>
              )}
            </div>

            {csvMessage && <div className="modal-error-banner">{csvMessage}</div>}

            {dryRunReport && (
              <div className="dryrun-report-container">
                <h4>Dry-Run Validation Report</h4>
                <div className="dryrun-summary">
                  <span>Total Rows: <strong>{dryRunReport.totalRows}</strong></span>
                  <span className="green">Valid Rows: <strong>{dryRunReport.validCount}</strong></span>
                  <span className="red">Errors Found: <strong>{dryRunReport.errorCount}</strong></span>
                </div>

                {dryRunReport.errors?.length > 0 ? (
                  <div className="error-table-wrapper">
                    <table className="error-table">
                      <thead>
                        <tr>
                          <th>Row #</th>
                          <th>Field</th>
                          <th>Validation Error Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunReport.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td>Row {err.row}</td>
                            <td><code>{err.field}</code></td>
                            <td className="red">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="dryrun-all-good">
                    <CheckCircle2 size={20} color="#10b981" />
                    <span>All rows validated successfully! Ready to commit into database.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee 360 View Drawer */}
      {show360Modal && (
        <div className="modal-overlay" onClick={() => setShow360Modal(false)}>
          <div className="modal-card wide drawer-style" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee 360 Profile</h3>
              <button className="modal-close-btn" onClick={() => setShow360Modal(false)}><X size={18} /></button>
            </div>

            {loading360 || !selected360 ? (
              <div className="dash-loading-wrapper">
                <div className="dash-spinner"></div>
                <p>Loading 360 profile details...</p>
              </div>
            ) : (
              <div className="profile-360-body">
                {/* Profile Header */}
                <div className="profile-360-header">
                  <div className="profile-avatar-circle">
                    {selected360.profile?.firstName?.[0]}{selected360.profile?.lastName?.[0]}
                  </div>
                  <div>
                    <h2>{selected360.profile?.fullName}</h2>
                    <span className="emp-role-pill">{selected360.profile?.designation} &bull; {selected360.profile?.department}</span>
                    <p className="emp-code-sub">Code: {selected360.profile?.employeeCode} &bull; Email: {selected360.profile?.email}</p>
                  </div>
                </div>

                {/* Salary Breakdown (Gross = 1.5 * Basic) */}
                <div className="profile-section-card">
                  <h4>Salary Structure Breakdown (M6 Formula)</h4>
                  <div className="salary-pills-grid">
                    <div className="salary-pill"><span>Basic Base (100%):</span> <strong>PKR {selected360.profile?.salaryStructure?.basic?.toLocaleString()}</strong></div>
                    <div className="salary-pill"><span>HRA (40%):</span> <strong>PKR {selected360.profile?.salaryStructure?.hra?.toLocaleString()}</strong></div>
                    <div className="salary-pill"><span>Medical (10%):</span> <strong>PKR {selected360.profile?.salaryStructure?.medical?.toLocaleString()}</strong></div>
                    <div className="salary-pill highlight"><span>Gross Salary (1.5 &times; Basic):</span> <strong>PKR {selected360.profile?.salaryStructure?.gross?.toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* Leave Balances */}
                <div className="profile-section-card">
                  <h4>Leave Quotas & Balances</h4>
                  <div className="leave-pill-grid">
                    {selected360.leaveBalances && Object.entries(selected360.leaveBalances).map(([type, b]) => (
                      <div key={type} className="leave-balance-box">
                        <span className="leave-box-type">{type}</span>
                        <span className="leave-box-remain">{b.remaining ?? '—'}</span>
                        <small>Quota: {b.quota} &bull; Used: {b.used}</small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Attendance */}
                <div className="profile-section-card">
                  <h4>Recent Attendance Logs</h4>
                  {selected360.recentAttendance?.length === 0 ? (
                    <p className="empty-sub">No recent attendance recorded.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected360.recentAttendance.map((a) => (
                            <tr key={a._id}>
                              <td>{a.date}</td>
                              <td><span className={`status-tag status-${a.status}`}>{a.status}</span></td>
                              <td>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td>{a.workHours || 0} hrs</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
