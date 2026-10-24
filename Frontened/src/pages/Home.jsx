import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Bot,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import './Home.css';

export default function Home() {
  const { isAuthenticated, isSetupComplete, role } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Saylani Hackathon 2026 &bull; HCM Lite</span>
        </div>

        <h1 className="hero-title">
          AI-Assisted Human Capital Management <br />
          <span className="hero-gradient">For Admin, HR, and Employees</span>
        </h1>

        <p className="hero-subtitle">
          Built completely from scratch with zero pre-loaded data. The system starts empty:
          Admin sets up company rules, HR registers employees, and an intelligent AI assistant
          answers real-time queries directly from live operational data.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <span>Open My Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : !isSetupComplete ? (
            <Link to="/setup" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <span>🚀 Launch First-Run Setup</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">
                <span>Sign In to Portal</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/setup" className="btn btn-secondary btn-lg">
                First-Run Wizard
              </Link>
            </>
          )}
        </div>

        {/* 3 Roles Architecture Overview */}
        <div className="roles-strip">
          <div className="role-strip-item">
            <span className="strip-badge red">ADMIN</span>
            <strong>Company Level</strong>
            <p>Setup company, office hours, geofence radius, HR logins, lock finalized payroll & inspect audit logs.</p>
          </div>
          <div className="role-strip-item">
            <span className="strip-badge purple">HR</span>
            <strong>People Operations</strong>
            <p>Register employees, CSV dry-run import, daily attendance board, leave approvals & prepare monthly payroll draft.</p>
          </div>
          <div className="role-strip-item">
            <span className="strip-badge blue">EMPLOYEE</span>
            <strong>Self-Service</strong>
            <p>Web/Camera check-in, Smart Leave in plain words, personal attendance calendar & confidential PDF payslips.</p>
          </div>
        </div>
      </section>

      {/* 9 Modules Matrix */}
      <section className="modules-overview-section">
        <div className="section-heading-center">
          <h2>All 9 Functional Modules Implemented</h2>
          <p>Every business rule from the challenge brief faithfully enforced server-side.</p>
        </div>

        <div className="modules-grid-3">
          <div className="glass-card module-card">
            <div className="mod-icon blue"><Lock size={22} /></div>
            <h3>M1: Auth & Access</h3>
            <p>JWT login, bcrypt hashing, 3 roles with strict server-side data scope guard, and first-sign-in password change rule.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon purple"><Building size={22} /></div>
            <h3>M2: Organization Setup</h3>
            <p>09:00 start, 15m grace (late &gt; 09:15), half-day under 5h, weekend Sat-Sun, and office geofence radius.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon green"><Users size={22} /></div>
            <h3>M3: Employees Directory</h3>
            <p>Directory search & filters, Employee 360 profile, automated login creation, and CSV import with dry-run error report.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon orange"><CalendarCheck size={22} /></div>
            <h3>M4: Attendance Engine</h3>
            <p>Server-stamped time, 409 conflict for duplicate daily check-in, daily operations board, and bonus camera/GPS check-in.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon emerald"><CalendarDays size={22} /></div>
            <h3>M5: Leave Management</h3>
            <p>Working days only (skips weekends/holidays), strict 422 overlap/over-balance checks, and HR approval with comments.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon red"><CreditCard size={22} /></div>
            <h3>M6: Payroll Lite</h3>
            <p>Gross = 1.5x Basic, joiner proration, attendance & late penalty deductions, tax slabs, and Admin locking finalization.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon blue"><Activity size={22} /></div>
            <h3>M7: Dynamic Dashboards</h3>
            <p>Aggregated metrics for Admin, HR, and Employee. Real-time headcount, attrition YTD, attendance rate, and top late-comers.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon purple"><Bot size={22} /></div>
            <h3>M8: AI Assistant</h3>
            <p>Role-scoped tool calling (refuses colleague salary for employees), dashboard KPI summarizer, and Smart Leave NLP parser.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon green"><ShieldCheck size={22} /></div>
            <h3>M9: Comms & Audit Trail</h3>
            <p>Company announcements feed, in-app notifications, and immutable audit logs with before/after state diff tracking.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
