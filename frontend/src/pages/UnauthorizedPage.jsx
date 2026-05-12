import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function UnauthorizedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getDashboard = () => {
    if (!user) return '/'
    if (user.role === 'super_admin') return '/admin'
    if (user.role === 'official') return '/official'
    return '/dashboard'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1f0f, #14532d)', padding: 24,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '48px 40px',
        textAlign: 'center', maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: '#0f172a', margin: '0 0 10px' }}>Access Denied</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.7 }}>
          You don't have permission to view this page. Please make sure you're signed in with the correct account role.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user ? (
            <button onClick={() => navigate(getDashboard())} className="btn-primary">
              Go to My Dashboard
            </button>
          ) : (
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'block' }}>
              Sign In
            </Link>
          )}
          <Link to="/browse" style={{
            fontSize: 13, color: '#64748b', textDecoration: 'none',
            padding: '10px', borderRadius: 10, background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}>Browse Schedules as Guest</Link>
        </div>
      </div>
    </div>
  )
}
