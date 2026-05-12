import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useState, useRef, useEffect } from 'react'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  official: 'Barangay Official',
  resident: 'Resident',
}

const ROLE_BADGES = {
  super_admin: 'badge-red',
  official: 'badge-blue',
  resident: 'badge-green',
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const dashboardLink = user?.role === 'super_admin'
    ? '/admin'
    : user?.role === 'official'
      ? '/official'
      : user
        ? '/dashboard'
        : '/'

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  const navLinks = [
    { to: '/browse', label: 'Public schedules', show: true },
    { to: dashboardLink, label: 'My dashboard', show: !!user },
  ].filter(link => link.show)

  return (
    <header style={{
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to={dashboardLink} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand-mark" style={{ width: 36, height: 36 }}>W</span>
            <div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 19, color: '#14532d', lineHeight: 1 }}>WAST0</div>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Davao City</div>
            </div>
          </Link>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOpen(prev => !prev)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: open ? '#f1f5f9' : 'white',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                color: '#334155',
                fontWeight: 900,
                fontSize: 18,
              }}
              aria-label="Open navigation menu"
            >
              {open ? '×' : '≡'}
            </button>

            {open && (
              <div className="surface animate-fade-up" style={{
                position: 'absolute',
                top: 52,
                right: 0,
                width: 280,
                overflow: 'hidden',
              }}>
                <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                  {user ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{user.name || user.email}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{user.email}</div>
                      <span className={`badge ${ROLE_BADGES[user.role] || 'badge-slate'}`}>{ROLE_LABELS[user.role] || user.role}</span>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Welcome</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Sign in to manage your schedules.</div>
                    </>
                  )}
                </div>

                <nav style={{ padding: '8px 0' }}>
                  {navLinks.map(({ to, label }) => {
                    const active = location.pathname === to
                    return (
                      <Link
                        key={to}
                        to={to}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          fontSize: 13,
                          fontWeight: active ? 800 : 600,
                          color: active ? '#14532d' : '#334155',
                          background: active ? '#f0fdf4' : 'transparent',
                          textDecoration: 'none',
                          borderLeft: active ? '3px solid #14532d' : '3px solid transparent',
                        }}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </nav>

                <div style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
                  {user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        font: '700 13px DM Sans, sans-serif',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link to="/" style={{ display: 'block', padding: '10px 16px', color: '#14532d', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
                      <Link to="/register" style={{ display: 'block', padding: '10px 16px', color: '#1d4ed8', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Register</Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
