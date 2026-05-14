// src/pages/Login.jsx
// Integrated: v1 role-selection UX + v2 visual design
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLES = [
  {
    key: 'guest',
    label: 'Guest',
    desc: 'Browse public barangay waste schedules',
    icon: '👁️',
    color: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1',
  },
  {
    key: 'resident',
    label: 'Resident',
    desc: 'View your assigned collection schedule & alerts',
    icon: '🏠',
    color: '#2d7a4f',
    bg: '#e8f5ee',
    border: '#4caf74',
  },
  {
    key: 'official',
    label: 'Barangay Official',
    desc: 'Manage barangay collection schedules',
    icon: '🏛️',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#3b82f6',
  },
  {
    key: 'super_admin',
    label: 'Super Admin',
    desc: 'Manage all users, barangays and audit logs',
    icon: '🛡️',
    color: '#dc2626',
    bg: '#fff1f2',
    border: '#f87171',
  },
]

const ROLE_REDIRECT = {
  resident: '/dashboard',
  official: '/dashboard',
  super_admin: '/dashboard',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleRoleSelect = (role) => {
    if (role.key === 'guest') {
      navigate('/browse')
      return
    }
    setSelectedRole(role)
    setForm({ email: '', password: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      // Role validation — ensure the user logs in via the correct role button
      if (selectedRole && user.role !== selectedRole.key) {
        toast.error(
          `This account is registered as "${user.role}". Please choose the matching sign-in option.`
        )
        localStorage.clear()
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${user.name?.split(' ')[0] || user.email}!`)
      navigate(ROLE_REDIRECT[user.role] || '/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Invalid email or password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5ee 0%, #d4f1e8 50%, #e0f4f3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, background: 'rgba(76,175,116,0.12)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 260, height: 260, background: 'rgba(59,174,160,0.1)', borderRadius: '50%', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Logo + Title */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/logo.png"
            alt="Project Wasto"
            className="animate-float"
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 20, marginBottom: 14, boxShadow: '0 8px 24px rgba(76,175,116,0.3)' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--charcoal)', marginBottom: 4 }}>
            <span style={{ color: 'var(--green-dark)' }}>Project </span>
            <span style={{ color: 'var(--teal)' }}>Wasto</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Barangay Waste Collection Management</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(28,43,30,0.12)',
          border: '1px solid var(--border)',
        }}>
          {!selectedRole ? (
            /* Role Selection Screen */
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--charcoal)', marginBottom: 6 }}>
                  Sign in as…
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Choose the role that matches your account
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ROLES.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      background: role.bg,
                      border: `1.5px solid ${role.border}`,
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${role.border}44` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                  >
                    <span style={{
                      width: 44, height: 44, flexShrink: 0,
                      background: 'white', borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}>
                      {role.icon}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: role.color, marginBottom: 2 }}>
                        {role.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                        {role.desc}
                      </span>
                    </span>
                    <span style={{ color: role.color, fontSize: 18, fontWeight: 900 }}>→</span>
                  </button>
                ))}
              </div>

              <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--muted)', paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                No account?{' '}
                <Link to="/register" style={{ color: 'var(--green-dark)', fontWeight: 700, textDecoration: 'none' }}>
                  Register as Resident
                </Link>
              </p>
            </>
          ) : (
            /* Login Form */
            <div className="animate-slide-in">
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                style={{
                  background: 'none', border: 'none', padding: '0 0 18px',
                  color: 'var(--muted)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                ← Back to roles
              </button>

              {/* Selected role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', marginBottom: 24,
                background: selectedRole.bg,
                border: `1.5px solid ${selectedRole.border}`,
                borderRadius: 14,
              }}>
                <span style={{ fontSize: 22 }}>{selectedRole.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: selectedRole.color }}>
                    {selectedRole.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedRole.desc}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 6, display: 'block' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 6, display: 'block' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-field"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                      }}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}
                >
                  {loading ? <div className="spinner" /> : null}
                  {loading ? 'Signing in…' : `Sign in as ${selectedRole.label}`}
                </button>
              </form>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 20, opacity: 0.7 }}>
          © {new Date().getFullYear()} Project Wasto · Waste Management System
        </p>
      </div>
    </div>
  )
}
