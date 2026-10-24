import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AiAssistantDrawer from './components/AiAssistantDrawer';
import { Sparkles } from 'lucide-react';

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
      <Navbar onOpenAi={() => setAiDrawerOpen(true)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<FirstRunSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onOpenAi={() => setAiDrawerOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <Leaves />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <Payroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-setup"
            element={
              <ProtectedRoute>
                <OrgSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating AI Assistant Trigger */}
      {isAuthenticated && (
        <button
          className="ai-floating-trigger"
          onClick={() => setAiDrawerOpen(true)}
          title="Open AI Assistant"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* AI Assistant Slide-out Drawer */}
      <AiAssistantDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />

      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
