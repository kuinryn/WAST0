import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLES = [
  {
    key: 'guest',
    label: 'Guest',
    desc: 'Browse schedules without an account',
    icon: '👤',
    accent: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1',
    hoverBorder: '#94a3b8',
  },
  {
    key: 'resident',
    label: 'Resident',
    desc: 'View schedules & receive weather alerts',
    icon: '🏠',
    accent: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    hoverBorder: '#4ade80',
  },
  {
    key: 'official',
    label: 'Barangay Admin',
    desc: 'Manage your barangay\'s collection schedules',
    icon: '🏛️',
    accent: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    hoverBorder: '#60a5fa',
  },
  {
    key: 'super_admin',
    label: 'Super Admin',
    desc: 'Full system access and user management',
    icon: '⚙️',
    accent: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    hoverBorder: '#f87171',
  },
]

const ROLE_MAP = {
  guest: null,
  resident: 'resident',
  official: 'official',
  super_admin: 'super_admin',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [hoveredRole, setHoveredRole] = useState(null)

  const handleRoleSelect = (role) => {
    if (role.key === 'guest') { navigate('/browse'); return }
    setSelectedRole(role)
    setForm({ email: '', password: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)

      // ✅ ROLE RESTRICTION — check if user's actual role matches selected role
      const expectedRole = ROLE_MAP[selectedRole.key]
      if (user.role !== expectedRole) {
        const ROLE_LABELS = {
          resident: 'Resident',
          official: 'Barangay Admin',
          super_admin: 'Super Admin',
        }
        toast.error(
          `Access denied. Your account is registered as "${ROLE_LABELS[user.role] || user.role}". Please select the correct role.`,
          { duration: 5000 }
        )
        // Log them back out
        localStorage.clear()
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${user.name || user.email}!`)
      if (user.role === 'super_admin') navigate('/admin')
      else if (user.role === 'official') navigate('/official')
      else navigate('/dashboard')
    } catch {
      toast.error('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const role = selectedRole

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1f0f 0%, #14532d 50%, #15803d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background circles */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: 'rgba(255,255,255,0.1)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
          }}>🗑️</div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: 'white', margin: '0 0 6px' }}>WAST0</h1>
          <p style={{ fontSize: 13, color: '#86efac', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Barangay Waste Collection Scheduler
          </p>
        </div>

        {/* Card */}
        <div className="animate-fade-up delay-100" style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          {!selectedRole ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 20 }}>
                Sign in as
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ROLES.map((r, i) => (
                  <button
                    key={r.key}
                    onClick={() => handleRoleSelect(r)}
                    onMouseEnter={() => setHoveredRole(r.key)}
                    onMouseLeave={() => setHoveredRole(null)}
                    className={`animate-fade-up delay-${(i + 1) * 100}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 14,
                      border: `2px solid ${hoveredRole === r.key ? r.hoverBorder : r.border}`,
                      background: hoveredRole === r.key ? r.bg : 'white',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', transform: hoveredRole === r.key ? 'translateX(4px)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: r.bg, border: `1.5px solid ${r.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.desc}</div>
                    </div>
                    <div style={{ color: r.accent, fontSize: 18, fontWeight: 300 }}>›</div>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>No account? </span>
                <Link to="/register" style={{ fontSize: 13, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>
                  Register as Resident
                </Link>
              </div>
            </>
          ) : (
            <div className="animate-slide-in">
              {/* Back button */}
              <button onClick={() => setSelectedRole(null)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#94a3b8', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20,
                fontFamily: 'DM Sans, sans-serif',
              }}>
                ← Back to roles
              </button>

              {/* Selected role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: role.bg, border: `1.5px solid ${role.border}`,
                marginBottom: 24,
              }}>
                <span style={{ fontSize: 24 }}>{role.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: role.accent }}>{role.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{role.desc}</div>
                </div>
              </div>

              {/* Role restriction notice */}
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span>⚠️</span>
                <span>You must sign in with a <strong>{role.label}</strong> account. Using a different role's credentials will be denied.</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
                  <input
                    type="password" required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Verifying...' : `Sign in as ${role.label}`}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>No account? </span>
                <Link to="/register" style={{ fontSize: 13, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>
                  Register as Resident
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="animate-fade-up delay-300" style={{ textAlign: 'center', fontSize: 12, color: 'rgba(134,239,172,0.6)', marginTop: 20 }}>
          City Government of Davao — Waste Management Division
        </p>
      </div>
    </div>
  )
}