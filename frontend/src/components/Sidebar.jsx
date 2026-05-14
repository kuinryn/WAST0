// src/components/Sidebar.jsx
// Integrated: role-aware navigation (v1 logic) + v2 visual design
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ALL_NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', roles: ['resident', 'official', 'super_admin'] },
  { to: '/schedules', icon: '📅', label: 'Schedules', roles: ['resident', 'official', 'super_admin'] },
  { to: '/residents', icon: '👥', label: 'Residents', roles: ['official', 'super_admin'] },
  { to: '/reports', icon: '📊', label: 'Reports', roles: ['super_admin'] },
  { to: '/audit', icon: '📋', label: 'Audit Logs', roles: ['super_admin'] },
  { to: '/settings', icon: '⚙️', label: 'Settings', roles: ['resident', 'official', 'super_admin'] },
]

const ROLE_BADGE = {
  super_admin: { label: 'Super Admin', color: '#dc2626', bg: '#fff1f2' },
  official: { label: 'Brgy. Official', color: '#1d4ed8', bg: '#eff6ff' },
  resident: { label: 'Resident', color: '#2d7a4f', bg: '#e8f5ee' },
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = ALL_NAV
    .filter(item => !item.roles || item.roles.includes(user?.role))
    .map(item => {
      if (item.to === '/residents' && user?.role === 'super_admin') return { ...item, label: 'Users' }
      if (item.to === '/schedules' && user?.role === 'super_admin') return { ...item, label: 'Barangays' }
      return item
    })
  const roleBadge = ROLE_BADGE[user?.role]

  return (
    <aside
      style={{
        width: collapsed ? 68 : 240,
        minHeight: '100vh',
        background: 'white',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <img
          src="/logo.png"
          alt="Project Wasto"
          style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: 'var(--green-light)' }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.parentElement.querySelector('.logo-fallback').style.display = 'flex'
          }}
        />
        <div
          className="logo-fallback"
          style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 14,
          }}
        >W</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green-dark)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>PROJECT</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--teal)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>WASTO</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 14,
            padding: '4px 6px',
            borderRadius: 6,
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && roleBadge && (
        <div style={{ padding: '10px 14px 0' }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            background: roleBadge.bg, color: roleBadge.color,
          }}>
            {roleBadge.label}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            title={collapsed ? label : ''}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && user && (
          <div style={{ padding: '8px 10px', marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>
              {user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{
            width: '100%',
            border: 'none',
            background: 'none',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--danger)',
            cursor: 'pointer',
          }}
          title={collapsed ? 'Logout' : ''}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
