# 🏢 HCM Lite — AI-Assisted Human Capital Management System

> **Saylani Hackathon 2026** &bull; Zaitoon Ashraf IT Park  
> **Challenge:** Build an AI-assisted HR system for Admin, HR, and Employees.  
> **Core Principle:** Starts 100% empty with zero dummy data. All metrics, KPIs, and AI answers are computed in real-time from live operational activity.

---

## 🌟 Executive Summary & Architecture

HCM Lite is an enterprise-grade Human Capital Management platform covering all **9 modules** (25 functionalities) and **+10 bonus points** defined in the Saylani Hackathon Brief.

### The 3 Access Levels & Server-Side RBAC

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Admin** | Company Level | First-run setup, office hours & 15m grace rule, geofence radius, create HR accounts, finalize & lock monthly payroll, view immutable audit logs, company-wide AI assistant. |
| **HR** | People Operations | Register employees (auto-provisions login with temporary password), CSV dry-run import/export, daily operations board, approve/reject attendance corrections, approve leaves with comments, prepare monthly payroll drafts. |
| **Employee** | Self-Service | Web check-in/out, camera + GPS geofenced check-in, personal attendance history, Smart Leave in plain words / Roman Urdu, download confidential PDF payslips, personal profile contact edit, AI assistant scoped to own data. |

---

## ⚡ Quick Start Guide (Run in Under 2 Minutes)

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI or Local MongoDB instance

---

### Step 1: Configure Backend Environment

Open `Backened/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.lplhbwy.mongodb.net/
JWT_SECRET=your_jwt_secret_key_here
AI_API_KEY=your_optional_llm_key_here
```

> [!IMPORTANT]
> **MongoDB Atlas Network Whitelist:**
> If using MongoDB Atlas, ensure your current IP address is whitelisted in MongoDB Atlas:
> **Atlas Dashboard $\rightarrow$ Security $\rightarrow$ Network Access $\rightarrow$ Add IP Address $\rightarrow$ Allow Access from Anywhere (`0.0.0.0/0`) $\rightarrow$ Confirm**.

---

### Step 2: Start the Backend API

Open a terminal in the root or `Backened/` directory:

```bash
cd Backened
npm run dev
# Server will start on: http://localhost:5000
```

---

### Step 3: Start the Frontend Application

Open a second terminal in the `Frontened/` directory:

```bash
cd Frontened
npm run dev
# Frontend will launch on: http://localhost:5173
```

---

## 🎬 5-Minute Live Judging Demo Walkthrough

Follow these 5 steps to verify all core flows and scoring criteria during the judging evaluation:

### Step 1: First-Run Setup (System starts empty)
1. Navigate to `http://localhost:5173/`.
2. Click **"🚀 Launch First-Run Setup"** (or `/setup`).
3. Fill in company profile (Saylani Systems Ltd), office hours (**09:00 AM**, grace **15 min**, half-day under **5h**), office geofence (**150m** radius at Zaitoon Ashraf IT Park), and register Master Admin credentials.
4. Click **"Initialize & Launch Company Portal"**. Admin is immediately logged in!
5. Navigate to **Org Setup** $\rightarrow$ **HR Logins** tab and provision an HR account (e.g. `sara.hr@saylani.org` / `hrpassword123`).

### Step 2: HR Employee Registration & First Login
1. Log out of Admin and sign in as **HR** (`sara.hr@saylani.org`).
2. Navigate to **Employees** $\rightarrow$ Click **"Register Employee"**.
3. Register employee (e.g. Ali Khan, code `EMP-001`, Basic Salary: `80,000`). Notice:
   - Gross is automatically calculated as `PKR 120,000` (1.5 $\times$ Basic, 40% HRA, 10% Medical).
   - Temporary login credentials are automatically generated (`ali.khan@company.com` / `welcome123`).
4. Log out and sign in as **Employee** (`ali.khan@company.com`).
5. Notice the system prompts for a mandatory **Password Change on First Sign-In**. Set a new password and enter the dashboard.
6. Click **"CHECK IN NOW"** on the dashboard. Notice server timestamp and status.

### Step 3: Smart Leave in Plain Words & HR Approval
1. While logged in as the employee, navigate to **Leaves**.
2. Under the **AI Smart Leave Assistant**, enter plain text:
   > *"Need next Monday and Tuesday off for my sister's wedding"*
3. Click **"Parse & Auto-Fill"**. The AI extracts `{ type: 'Casual', startDate: '...', endDate: '...', reason: 'sister wedding' }` and populates the form!
4. Click **"Submit Leave Application"**. Notice working days are automatically calculated skipping weekends and public holidays. Overlap and over-balance checks strictly return 422 if violated.
5. Log out and sign in as **HR**.
6. Open **Leaves** $\rightarrow$ Under **HR Approval Inbox**, view Ali's request $\rightarrow$ Enter comment *"Approved, enjoy the wedding"* $\rightarrow$ Click **Approve**.

### Step 4: AI KPI Summary & Monthly Payroll Run
1. While logged in as HR, go to **Dashboard**.
2. Click **"AI KPI Summary"**. The AI assistant analyzes real DB metrics and prints 3–5 sharp insight bullets.
3. Click the floating **Ask AI Assistant** drawer and ask:
   > *"Who is on leave today?"*
   > The assistant inspects the database and gives the exact real-time answer!
4. Navigate to **Payroll** $\rightarrow$ Click **"Prepare Monthly Payroll Draft"** $\rightarrow$ Select current month $\rightarrow$ Click **"Calculate Draft"**.
5. Inspect the itemized table: basic, HRA (40%), Medical (10%), gross, working days, attendance deductions, tax slab calculation, and net take-home pay.
6. Log out and sign in as **Admin**.
7. Navigate to **Payroll** $\rightarrow$ Click **"Finalize & Lock Payroll"**. The month is now permanently locked and cannot be edited.

### Step 5: Payslip PDF, Colleague Salary Refusal & Audit Log
1. Sign in as **Employee** (`ali.khan@company.com`).
2. Navigate to **Payroll** $\rightarrow$ Click **"View / Print PDF"**. View the formatted payslip document with print/save PDF capability.
3. Open the **AI Assistant** drawer and ask:
   > *"What is my colleague's salary?"*
   > **Guardrail Response:** The assistant **politely refuses**, stating that company privacy policies restrict salary disclosures to personal views and authorized HR/Admin management.
4. Log back in as **Admin** and open **Audit Logs**. Inspect the immutable record of all creation, approval, and finalization actions along with Before/After JSON states!

---

## 🏆 Checklist: 25 Core Functionalities & +10 Bonus Points

- [x] **01 First-run setup:** Company profile & Admin account wizard
- [x] **02 Auth:** Login, logout, change password, first-login password change
- [x] **03 Company settings:** Office hours (09:00), grace (15m), weekend, location & radius (150m)
- [x] **04 Org setup:** Departments, designations, leave types (14, 8, 10, unlimited), public holidays
- [x] **05 User management:** Create HR logins, deactivate or reset any login
- [x] **06 Register employee:** Job details + salary structure $\rightarrow$ auto-creates user login
- [x] **07 Employee directory:** Server-side search & filters; Employee 360 profile
- [x] **08 CSV import/export:** Dry-run error report (row + field + reason) and bulk commit
- [x] **09 Web check-in/out:** Server stamps time; duplicate check-in returns HTTP 409
- [x] **10 Attendance board:** Daily attendance board for HR/Admin and personal calendar
- [x] **11 Attendance correction:** Employee requests with reason; HR approves/rejects
- [x] **12 Leave application:** Balance check & overlap check returns HTTP 422
- [x] **13 Leave review:** HR approves or rejects with custom comment
- [x] **14 Salary structure:** Gross = 1.5 $\times$ Basic (HRA 40%, Medical 10%)
- [x] **15 Monthly payroll:** HR creates and reviews draft with deductions & tax
- [x] **16 Finalize payroll:** Admin locks month; finalized runs are immutable
- [x] **17 Payslips:** PDF printable layout with itemized earnings & deductions
- [x] **18 Dashboards:** Aggregated KPIs and charts for Admin, HR, and Employee
- [x] **19 AI Assistant:** Tool calling (`get_headcount`, `get_attendance_summary`, `get_late_comers`, `get_leave_summary`, `get_my_leave_balance`, `get_payroll_summary`, `search_employees`)
- [x] **20 AI Dashboard summary:** 'Summarize' button gives 3–5 sharp insight bullets
- [x] **21 Smart leave:** Plain text $\rightarrow$ pre-filled leave form
- [x] **22 Policy Q&A:** Answers attendance, grace cutoff, half-day, and tax slab rules
- [x] **23 Announcements:** Priority broadcast notices on all dashboards
- [x] **24 Notifications:** In-app alerts for leave approvals and payslip readiness
- [x] **25 Audit log:** Immutable log with actor, action, entity, before/after JSON
- [x] **⭐ Bonus (+10 pts):** Camera check-in with simulated/webcam face detection + GPS geolocation (Haversine formula $\le$ 150m)
- [x] **⭐ Bonus (+10 pts):** Late penalty rule (3 lates = 0.5 day deduction)
- [x] **⭐ Bonus (+10 pts):** Roman Urdu AI Natural Language understanding
- [x] **⭐ Bonus (+10 pts):** Premium Dark Mode glassmorphism UI & responsive design

---

## 🔒 Security & RBAC Enforcement

- Passwords hashed using industry-standard `bcryptjs` (salt rounds: 10).
- All requests verified with signed JWT tokens (`Bearer <token>`).
- Strict server-side role and data-scope guards:
  - An Employee's queries are strictly bound to their own `employeeId`.
  - The AI Assistant inherits the exact permission level of the active user.
  - Colleague salary requests are politely rejected.
- Audit logs are immutable and can only be accessed by the Admin.

---

**Developed for the Saylani Hackathon 2026.**
