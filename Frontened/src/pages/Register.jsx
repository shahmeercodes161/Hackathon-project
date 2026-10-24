import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  AlertCircle,
  Shield,
  Briefcase,
  User,
  Check,
  Building,
  Hash,
  Phone,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import './Auth.css';

export default function Register() {
  const [role, setRole] = useState('employee'); // 'admin' | 'hr' | 'employee'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Role-specific fields
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');

  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  // Set default department & title on role switch
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setLocalError('');
    if (newRole === 'hr') {
      setDepartment('Human Resources');
      setDesignation('People Operations Specialist');
    } else if (newRole === 'employee') {
      setDepartment('Engineering');
      setDesignation('Software Engineer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      department: role === 'admin' ? 'Executive Leadership' : department,
      designation: role === 'admin' ? 'Company Administrator' : designation,
      employeeCode: employeeCode.trim() || undefined,
      phone: phone.trim(),
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page">
      <div className="glass-card auth-card" style={{ maxWidth: '580px', width: '100%' }}>
        <div className="auth-header">
          <div className="auth-icon-badge">
            <UserPlus size={26} />
          </div>
          <h2 className="auth-title">Join Your Organization</h2>
          <p className="auth-subtitle">Select your corporate role to set up your enterprise access</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="role-selector-container">
          <label className="form-label" style={{ marginBottom: '0.65rem' }}>Select Account Role</label>
          <div className="role-selector-grid">
            <button
              type="button"
              className={`role-option-card ${role === 'employee' ? 'selected' : ''}`}
              onClick={() => handleRoleChange('employee')}
            >
              <div className="role-option-header">
                <User size={18} className="role-opt-icon blue" />
                <span className="role-opt-title">Employee</span>
                {role === 'employee' && <Check size={16} className="role-opt-check" />}
              </div>
              <p className="role-opt-desc">Self-service attendance, leave requests, and payslip access.</p>
            </button>

            <button
              type="button"
              className={`role-option-card ${role === 'hr' ? 'selected' : ''}`}
              onClick={() => handleRoleChange('hr')}
            >
              <div className="role-option-header">
                <Briefcase size={18} className="role-opt-icon purple" />
                <span className="role-opt-title">HR Manager</span>
                {role === 'hr' && <Check size={16} className="role-opt-check" />}
              </div>
              <p className="role-opt-desc">People operations, leave approvals, employee directory, and payroll drafts.</p>
            </button>

            <button
              type="button"
              className={`role-option-card ${role === 'admin' ? 'selected' : ''}`}
              onClick={() => handleRoleChange('admin')}
            >
              <div className="role-option-header">
                <Shield size={18} className="role-opt-icon red" />
                <span className="role-opt-title">Administrator</span>
                {role === 'admin' && <Check size={16} className="role-opt-check" />}
              </div>
              <p className="role-opt-desc">Full company policy, office geofence settings, audit trails, and payroll lock.</p>
            </button>
          </div>
        </div>

        {displayError && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.25rem' }}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Legal Name <span className="text-danger">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Work Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="alex.m@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role specific inputs */}
          {role !== 'admin' && (
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-dept">
                  Department
                </label>
                {role === 'hr' ? (
                  <input
                    id="reg-dept"
                    type="text"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                ) : (
                  <select
                    id="reg-dept"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Engineering">Engineering & Technology</option>
                    <option value="Product">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Growth & Marketing</option>
                    <option value="Sales">Enterprise Sales</option>
                    <option value="Finance">Finance & Accounting</option>
                    <option value="Operations">Operations & Logistics</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-title">
                  Job Title / Designation
                </label>
                <input
                  id="reg-title"
                  type="text"
                  className="form-input"
                  placeholder={role === 'hr' ? 'e.g. HR Generalist' : 'e.g. Frontend Developer'}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>
            </div>
          )}

          {role !== 'admin' && (
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-code">
                  Employee ID Code <small style={{ color: '#94a3b8' }}>(Optional)</small>
                </label>
                <input
                  id="reg-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. EMP-1042 (Auto-generated if blank)"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  Phone Number <small style={{ color: '#94a3b8' }}>(Optional)</small>
                </label>
                <input
                  id="reg-phone"
                  type="text"
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="text-danger">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', height: '46px', fontSize: '0.98rem' }}
          >
            {isSubmitting ? 'Creating Enterprise Account...' : `Register as ${role.toUpperCase()}`}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In to Enterprise Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
