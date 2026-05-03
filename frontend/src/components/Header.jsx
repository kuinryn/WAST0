import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  official: 'Barangay Official',
  resident: 'Resident',
}

const ROLE_COLORS = {
  super_admin: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  official:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  resident:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    if (user.role === 'super_admin') return '/admin'
    if (user.role === 'official') return '/official'
    return '/dashboard'
  }

  const isActive = (path) => location.pathname === path

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  const navLinks = [
    { to: '/browse', label: '📋 Public Schedules', show: true },
    { to: getDashboardLink(), label: '🏠 My Dashboard', show: !!user },
    { to: '/admin', label: '⚙️ Admin Panel', show: user?.role === 'super_admin' },
  ].filter(l => l.show)

  const roleStyle = user ? ROLE_COLORS[user.role] : null

  return (
    <header style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link to={user ? getDashboardLink() : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, background: '#14532d',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20,
            }}>🗑️</div>
            <div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#14532d', lineHeight: 1 }}>WAST0</div>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Davao City</div>
            </div>
          </Link>

          {/* Hamburger */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(prev => !prev)}
              style={{
                width: 42, height: 42, borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                background: open ? '#f1f5f9' : 'white',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                transition: 'all 0.2s', padding: 0,
              }}
              aria-label="Menu"
            >
              {/* Hamburger lines — animate to X when open */}
              <span style={{
                display: 'block', width: 18, height: 2,
                background: '#334155', borderRadius: 2,
                transition: 'all 0.25s',
                transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2,
                background: '#334155', borderRadius: 2,
                transition: 'all 0.25s',
                opacity: open ? 0 : 1,
                transform: open ? 'scaleX(0)' : 'none',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2,
                background: '#334155', borderRadius: 2,
                transition: 'all 0.25s',
                transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }} />
            </button>

            {/* Dropdown */}
            {open && (
              <div style={{
                position: 'absolute', top: 52, right: 0,
                width: 260, background: 'white',
                borderRadius: 16, border: '1px solid #e2e8f0',
                boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                animation: 'fadeUp 0.2s ease forwards',
              }}>

                {/* User info section */}
                {user ? (
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                      {user.name || user.email}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{user.email}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      background: roleStyle.bg,
                      color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`,
                    }}>
                      {ROLE_LABELS[user.role]}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Welcome</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Sign in to access your dashboard</div>
                  </div>
                )}

                {/* Nav links */}
                <div style={{ padding: '8px 0' }}>
                  {navLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'block', padding: '10px 18px',
                        fontSize: 13, fontWeight: isActive(to) ? 700 : 500,
                        color: isActive(to) ? '#14532d' : '#334155',
                        background: isActive(to) ? '#f0fdf4' : 'transparent',
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                        borderLeft: isActive(to) ? '3px solid #14532d' : '3px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.background = 'transparent' }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Bottom section */}
                <div style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
                  {user ? (
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 18px',
                        background: 'none', border: 'none',
                        fontSize: 13, fontWeight: 500, color: '#dc2626',
                        cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  ) : (
                    <>
                      <Link to="/" onClick={() => setOpen(false)} style={{
                        display: 'block', padding: '10px 18px',
                        fontSize: 13, fontWeight: 600, color: '#14532d',
                        textDecoration: 'none', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >🔑 Sign In</Link>
                      <Link to="/register" onClick={() => setOpen(false)} style={{
                        display: 'block', padding: '10px 18px',
                        fontSize: 13, fontWeight: 600, color: '#1d4ed8',
                        textDecoration: 'none', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >✏️ Register as Resident</Link>
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