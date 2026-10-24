import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PortalLayout from './components/PortalLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistantDrawer from './components/AiAssistantDrawer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FirstRunSetup from './pages/FirstRunSetup';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import OrgSetup from './pages/OrgSetup';
import Announcements from './pages/Announcements';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

function AppContent() {
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* If not authenticated, render standard guest navbar */}
      {!isAuthenticated && <Navbar onOpenAi={() => setAiDrawerOpen(true)} />}

      <main className={isAuthenticated ? 'portal-main-wrapper' : 'main-content'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<FirstRunSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes inside Figma Portal Shell */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Dashboard onOpenAi={() => setAiDrawerOpen(true)} />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Employees />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Attendance />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Leaves />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Payroll />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-setup"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <OrgSetup />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Announcements />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <AuditLogs />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <Profile />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <PortalLayout onOpenAi={() => setAiDrawerOpen(true)}>
                  <ChangePassword />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAuthenticated && <Footer />}

      <AiAssistantDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
