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
          <span>Next-Generation HCM Cloud &bull; Unified People Operations</span>
        </div>

        <h1 className="hero-title">
          Intelligent Human Capital Management <br />
          <span className="hero-gradient">For Enterprise Leadership, HR & Teams</span>
        </h1>

        <p className="hero-subtitle">
          The all-in-one workforce operating system. Manage employee lifecycles, geofenced attendance,
          smart leave policies, automated tax & payroll, and conversational AI insights in real-time.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <span>Open My Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                <span>Get Started — Create Account</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In to Portal
              </Link>
              <Link to="/setup" className="btn btn-secondary btn-lg" style={{ opacity: 0.85 }}>
                Company Onboarding
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

      {/* Core Platform Capabilities */}
      <section className="modules-overview-section">
        <div className="section-heading-center">
          <span className="human-badge">Integrated Human Capital Suite</span>
          <h2>Everything You Need to Power Your Modern Workforce</h2>
          <p>From first-day onboarding to automated payroll, transparent attendance, and AI intelligence.</p>
        </div>

        <div className="modules-grid-3">
          <div className="glass-card module-card">
            <div className="mod-icon blue"><Lock size={22} /></div>
            <h3>Smart Security & Access</h3>
            <p>Role-governed authentication with enterprise data privacy, multi-tier permissions, and mandatory security on first sign-in.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon purple"><Building size={22} /></div>
            <h3>Company Workspace & Policy</h3>
            <p>Customize working hours, grace periods, weekend schedules, and precise GPS office geofence perimeters.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon green"><Users size={22} /></div>
            <h3>Employee Directory & Profiles</h3>
            <p>Comprehensive 360° employee records, department structures, rapid CSV bulk onboarding, and secure credential provisioning.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon orange"><CalendarCheck size={22} /></div>
            <h3>Attendance & Live Operations</h3>
            <p>One-tap check-in with GPS verification, anti-tamper server timestamps, and an interactive real-time company duty board.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon emerald"><CalendarDays size={22} /></div>
            <h3>Leave Management & Approvals</h3>
            <p>Effortless vacation and medical leave requests, automated quota balance tracking, holiday calendar sync, and manager approvals.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon red"><CreditCard size={22} /></div>
            <h3>Payroll & Tax Automation</h3>
            <p>Accurate salary calculation, tax bracket computation, joiner proration, attendance penalty deductions, and printable payslips.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon blue"><Activity size={22} /></div>
            <h3>Executive & Team Dashboards</h3>
            <p>Real-time analytics for headcount, monthly turnover, daily attendance percentages, and department-by-department breakdowns.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon purple"><Bot size={22} /></div>
            <h3>HCM AI Intelligence</h3>
            <p>Natural language AI assistant that interprets company policies, parses leave requests (Roman Urdu & English), and summarizes KPIs.</p>
          </div>

          <div className="glass-card module-card">
            <div className="mod-icon green"><ShieldCheck size={22} /></div>
            <h3>Announcements & Audit Trail</h3>
            <p>Company-wide broadcast messaging, real-time activity notifications, and an immutable audit log ensuring complete accountability.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
