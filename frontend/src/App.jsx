// src/App.jsx
// Integrated: v1 routing structure (roles/browse) + v2 components and pages
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Schedules from './pages/Schedules'
import AuditLogs from './pages/AuditLogs'
import Residents from './pages/Residents'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import GuestBrowse from './pages/GuestBrowse'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <img src="/logo.png" alt="Project Wasto" style={{ width: 70, height: 70, borderRadius: 16, objectFit: 'cover' }} className="animate-float" />
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading Project Wasto…</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const TOAST_OPTS = {
  style: {
    borderRadius: '12px',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
  },
  success: { iconTheme: { primary: '#4caf74', secondary: 'white' } },
  error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={TOAST_OPTS} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<GuestBrowse />} />

          {/* Protected routes with sidebar layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="schedules" element={<Schedules />} />
            <Route
              path="audit"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'official']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="residents"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'official']}>
                  <Residents />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'official']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
