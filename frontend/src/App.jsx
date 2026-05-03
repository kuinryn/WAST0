import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import GuestScheduleView from './pages/GuestScheduleView'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResidentDashboard from './pages/ResidentDashboard'
import OfficialDashboard from './pages/OfficialDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UnauthorizedPage from './pages/UnauthorizedPage'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/" />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - no layout header/footer */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Pages with Header + Footer */}
        <Route path="/browse" element={
          <Layout><GuestScheduleView /></Layout>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Layout><ResidentDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/official" element={
          <ProtectedRoute allowedRoles={['official']}>
            <Layout><OfficialDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}