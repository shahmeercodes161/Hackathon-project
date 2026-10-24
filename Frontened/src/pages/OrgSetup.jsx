import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orgService, authService } from '../services/api';
import {
  Settings,
  Building,
  Briefcase,
  Calendar,
  Clock,
  UserPlus,
  Trash2,
  CheckCircle2,
  X,
  Shield,
  KeyRound,
} from 'lucide-react';
import './OrgSetup.css';

export default function OrgSetup() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'departments', 'leaveTypes', 'holidays', 'hrLogins'
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: '' });

  // Data states
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [users, setUsers] = useState([]);

  // New item states
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '' });
  const [newLeaveType, setNewLeaveType] = useState({ name: '', code: '', quota: 10, isPaid: true });
  const [newHoliday, setNewHoliday] = useState({ title: '', date: '', description: '' });
  const [newHr, setNewHr] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, ltRes, hRes] = await Promise.all([
        orgService.getSettings(),
        orgService.getDepartments(),
        orgService.getLeaveTypes(),
        orgService.getHolidays(),
      ]);
      if (sRes.success) setSettings(sRes.settings);
      if (dRes.success) setDepartments(dRes.departments || []);
      if (ltRes.success) setLeaveTypes(ltRes.leaveTypes || []);
      if (hRes.success) setHolidays(hRes.holidays || []);

      if (role === 'admin') {
        const uRes = await authService.listUsers();
        if (uRes.success) setUsers(uRes.users || []);
      }
    } catch (err) {
      console.error('Org load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await orgService.updateSettings(settings);
      if (res.success) {
        setAlert({ text: 'Company settings updated successfully!', type: 'success' });
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to save settings', type: 'error' });
    }
  };

  // Add Department
  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      const res = await orgService.createDepartment(newDept);
      if (res.success) {
        setAlert({ text: 'Department added!', type: 'success' });
        setNewDept({ name: '', code: '', description: '' });
        loadAllData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to add department', type: 'error' });
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await orgService.deleteDepartment(id);
      loadAllData();
    } catch (err) {
      setAlert({ text: err.message || 'Failed to delete', type: 'error' });
    }
  };

  // Add Leave Type
  const handleAddLeaveType = async (e) => {
    e.preventDefault();
    try {
      const res = await orgService.createLeaveType(newLeaveType);
      if (res.success) {
        setAlert({ text: 'Leave type added!', type: 'success' });
        setNewLeaveType({ name: '', code: '', quota: 10, isPaid: true });
        loadAllData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to add leave type', type: 'error' });
    }
  };

  // Add Holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      const res = await orgService.createHoliday(newHoliday);
      if (res.success) {
        setAlert({ text: 'Public holiday added!', type: 'success' });
        setNewHoliday({ title: '', date: '', description: '' });
        loadAllData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to add holiday', type: 'error' });
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await orgService.deleteHoliday(id);
      loadAllData();
    } catch (err) {
      setAlert({ text: err.message || 'Failed to delete holiday', type: 'error' });
    }
  };

  // Create HR User (Admin only)
  const handleCreateHr = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.createHr(newHr);
      if (res.success) {
        setAlert({ text: `HR user ${newHr.email} created successfully!`, type: 'success' });
        setNewHr({ name: '', email: '', password: '' });
        loadAllData();
      }
    } catch (err) {
      setAlert({ text: err.message || 'Failed to create HR account', type: 'error' });
    }
  };

  // Toggle User Active
  const handleToggleUser = async (id) => {
    try {
      await authService.toggleStatus(id);
      loadAllData();
    } catch (err) {
      setAlert({ text: err.message || 'Status toggle failed', type: 'error' });
    }
  };

  return (
    <div className="org-setup-container">
      <div className="org-setup-header">
        <h1>Organization Setup & Master Rules</h1>
        <p>Configure company policies, departments, leave quotas, holidays, and user logins.</p>
      </div>

      {alert.text && (
        <div className={`org-alert-banner ${alert.type}`}>
          {alert.text}
        </div>
      )}

      {/* Tabs */}
      <div className="org-tabs-bar">
        <button className={`org-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Building size={16} /> Office Rules & Policy
        </button>
        <button className={`org-tab-btn ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')}>
          <Briefcase size={16} /> Departments ({departments.length})
        </button>
        <button className={`org-tab-btn ${activeTab === 'leaveTypes' ? 'active' : ''}`} onClick={() => setActiveTab('leaveTypes')}>
          <Calendar size={16} /> Leave Quotas ({leaveTypes.length})
        </button>
        <button className={`org-tab-btn ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>
          <Clock size={16} /> Public Holidays ({holidays.length})
        </button>
        {role === 'admin' && (
          <button className={`org-tab-btn ${activeTab === 'hrLogins' ? 'active' : ''}`} onClick={() => setActiveTab('hrLogins')}>
            <Shield size={16} /> HR Logins ({users.filter((u) => u.role === 'hr').length})
          </button>
        )}
      </div>

      {/* TAB 1: Settings Form */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="org-tab-card">
          <h3>Company Office Configuration</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Company Legal Name</label>
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Official Email</label>
              <input
                type="email"
                value={settings.companyEmail || ''}
                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-3" style={{ marginTop: '1rem' }}>
            <div className="form-field">
              <label>Office Start Time</label>
              <input
                type="time"
                value={settings.officeHours?.start || '09:00'}
                onChange={(e) => setSettings({ ...settings, officeHours: { ...settings.officeHours, start: e.target.value } })}
              />
            </div>
            <div className="form-field">
              <label>Grace Cutoff (Minutes)</label>
              <input
                type="number"
                value={settings.officeHours?.graceMinutes ?? 15}
                onChange={(e) => setSettings({ ...settings, officeHours: { ...settings.officeHours, graceMinutes: Number(e.target.value) } })}
              />
              <small>Late flagged after 09:15 AM</small>
            </div>
            <div className="form-field">
              <label>Half-Day Threshold (Hours)</label>
              <input
                type="number"
                value={settings.officeHours?.halfDayHours ?? 5}
                onChange={(e) => setSettings({ ...settings, officeHours: { ...settings.officeHours, halfDayHours: Number(e.target.value) } })}
              />
              <small>Under 5 hours</small>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '1rem' }}>
            <div className="form-field">
              <label>Geofence Radius (Meters)</label>
              <input
                type="number"
                value={settings.location?.radiusMeters ?? 150}
                onChange={(e) => setSettings({ ...settings, location: { ...settings.location, radiusMeters: Number(e.target.value) } })}
              />
            </div>
            <div className="form-field">
              <label>Late Penalty Rule</label>
              <select
                value={settings.latePenaltyRule ? 'true' : 'false'}
                onChange={(e) => setSettings({ ...settings, latePenaltyRule: e.target.value === 'true' })}
              >
                <option value="true">Enabled (3 lates = 0.5 day deduction)</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="att-btn primary">Save Configuration</button>
          </div>
        </form>
      )}

      {/* TAB 2: Departments */}
      {activeTab === 'departments' && (
        <div className="org-tab-card">
          <div className="two-col-layout">
            <form onSubmit={handleAddDept} className="create-sub-form">
              <h4>Create New Department</h4>
              <div className="form-field">
                <label>Department Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Quality Assurance"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Department Code *</label>
                <input
                  type="text"
                  placeholder="e.g. QA"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="att-btn primary full">Add Department</button>
            </form>

            <div className="items-list-col">
              <h4>Active Departments ({departments.length})</h4>
              <div className="items-list">
                {departments.map((d) => (
                  <div key={d._id} className="org-item-row">
                    <div>
                      <strong>{d.name}</strong>
                      <span className="code-badge" style={{ marginLeft: '8px' }}>{d.code}</span>
                    </div>
                    {role === 'admin' && (
                      <button className="delete-icon-btn" onClick={() => handleDeleteDept(d._id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Leave Quotas */}
      {activeTab === 'leaveTypes' && (
        <div className="org-tab-card">
          <div className="two-col-layout">
            <form onSubmit={handleAddLeaveType} className="create-sub-form">
              <h4>Add Custom Leave Type</h4>
              <div className="form-field">
                <label>Leave Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Paternity Leave"
                  value={newLeaveType.name}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Yearly Quota (Days) *</label>
                <input
                  type="number"
                  value={newLeaveType.quota}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, quota: Number(e.target.value) })}
                  required
                />
              </div>
              <button type="submit" className="att-btn primary full">Add Leave Policy</button>
            </form>

            <div className="items-list-col">
              <h4>Registered Leave Types & Quotas</h4>
              <div className="items-list">
                {leaveTypes.map((lt) => (
                  <div key={lt._id} className="org-item-row">
                    <div>
                      <strong>{lt.name} Leave</strong>
                      <span className="text-muted" style={{ marginLeft: '12px' }}>
                        Quota: <strong>{lt.isUnlimited ? 'Unlimited' : `${lt.quota} days`}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Public Holidays */}
      {activeTab === 'holidays' && (
        <div className="org-tab-card">
          <div className="two-col-layout">
            <form onSubmit={handleAddHoliday} className="create-sub-form">
              <h4>Register Public Holiday</h4>
              <div className="form-field">
                <label>Holiday Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Eid-ul-Fitr / Independence Day"
                  value={newHoliday.title}
                  onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Date (YYYY-MM-DD) *</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="att-btn primary full">Register Holiday</button>
            </form>

            <div className="items-list-col">
              <h4>Registered Public Holidays ({holidays.length})</h4>
              <div className="items-list">
                {holidays.length === 0 ? (
                  <p className="empty-sub">No public holidays added yet.</p>
                ) : (
                  holidays.map((h) => (
                    <div key={h._id} className="org-item-row">
                      <div>
                        <strong>{h.title}</strong>
                        <span className="date-badge" style={{ marginLeft: '8px' }}>{h.date}</span>
                      </div>
                      <button className="delete-icon-btn" onClick={() => handleDeleteHoliday(h._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HR Logins (Admin Only) */}
      {activeTab === 'hrLogins' && role === 'admin' && (
        <div className="org-tab-card">
          <div className="two-col-layout">
            <form onSubmit={handleCreateHr} className="create-sub-form">
              <h4>Provision HR Manager Account</h4>
              <div className="form-field">
                <label>HR Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sara Ahmed"
                  value={newHr.name}
                  onChange={(e) => setNewHr({ ...newHr, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>HR Email (Login) *</label>
                <input
                  type="email"
                  placeholder="sara.hr@company.com"
                  value={newHr.email}
                  onChange={(e) => setNewHr({ ...newHr, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Initial Password *</label>
                <input
                  type="password"
                  placeholder="Secret password"
                  value={newHr.password}
                  onChange={(e) => setNewHr({ ...newHr, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="att-btn primary full">Create HR User</button>
            </form>

            <div className="items-list-col">
              <h4>All System User Logins ({users.length})</h4>
              <div className="items-list">
                {users.map((u) => (
                  <div key={u._id} className="org-item-row">
                    <div>
                      <strong>{u.name}</strong>
                      <span className={`pill-role ${u.role}`} style={{ marginLeft: '8px' }}>{u.role}</span>
                      <small style={{ display: 'block', color: '#64748b' }}>{u.email}</small>
                    </div>
                    {u.role !== 'admin' && (
                      <button
                        className={`status-toggle-btn ${u.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleUser(u._id)}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
