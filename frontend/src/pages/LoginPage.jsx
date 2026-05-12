import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'

const ROLES = [
  { key: 'guest', label: 'Guest', desc: 'Browse public barangay schedules', accent: '#64748b' },
  { key: 'resident', label: 'Resident', desc: 'View assigned schedules and alerts', accent: '#15803d' },
  { key: 'official', label: 'Barangay Official', desc: 'Manage barangay collection schedules', accent: '#1d4ed8' },
  { key: 'super_admin', label: 'Super Admin', desc: 'Manage users, barangays, and audits', accent: '#dc2626' },
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

  const handleRoleSelect = (role) => {
    if (role.key === 'guest') { navigate('/browse'); return }
    setSelectedRole(role)
    setForm({ email: '', password: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const expectedRole = ROLE_MAP[selectedRole.key]
      if (user.role !== expectedRole) {
        toast.error(`This account is registered as ${user.role}. Choose the matching sign-in option.`)
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

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div className="animate-fade-up" style={{ textAlign: 'center', color: 'white', marginBottom: 24 }}>
          <span className="brand-mark" style={{ marginBottom: 14, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)' }}>W</span>
          <h1 className="hero-title" style={{ marginBottom: 6 }}>WAST0</h1>
          <p style={{ color: '#bbf7d0', margin: 0, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Barangay Waste Collection Scheduler
          </p>
        </div>

        <div className="auth-card animate-fade-up delay-100">
          {!selectedRole ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <h2 className="section-title">Choose your access</h2>
                <p className="section-copy">Start with the role that matches your account.</p>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {ROLES.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className="surface"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: 16,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    <span>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{role.label}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>{role.desc}</span>
                    </span>
                    <span style={{ color: role.accent, fontWeight: 900 }}>→</span>
                  </button>
                ))}
              </div>

              <p style={{ textAlign: 'center', margin: '22px 0 0', paddingTop: 18, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
                No resident account? <Link to="/register" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'none' }}>Register here</Link>
              </p>
            </>
          ) : (
            <div className="animate-slide-in">
              <button type="button" onClick={() => setSelectedRole(null)} style={{ background: 'none', border: 'none', padding: 0, marginBottom: 18, color: '#64748b', font: '700 13px DM Sans, sans-serif', cursor: 'pointer' }}>
                ← Back to roles
              </button>

              <div className="surface" style={{ padding: 16, marginBottom: 20, borderColor: selectedRole.accent }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: selectedRole.accent, margin: '0 0 4px' }}>{selectedRole.label}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{selectedRole.desc}</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Email address</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="you@example.com" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Password</label>
                  <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Signing in...' : `Sign in as ${selectedRole.label}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
