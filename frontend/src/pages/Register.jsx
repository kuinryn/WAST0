// src/pages/Register.jsx
// Integrated: v1 backend fields (name, email, password, confirm_password) + v2 visual design
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBarangays } from '../services/api'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [barangays, setBarangays] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    barangay: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getBarangays().then(r => setBarangays(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        barangay: form.barangay || undefined,
      })
      toast.success('Account created! Welcome to Project Wasto.')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg = data
        ? Object.values(data).flat().join(' ')
        : 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const f = (field, val) => setForm((p) => ({ ...p, [field]: val }))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5ee 0%, #d4f1e8 50%, #e0f4f3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ position: 'fixed', top: -80, right: -80, width: 300, height: 300, background: 'rgba(76,175,116,0.12)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -60, left: -60, width: 240, height: 240, background: 'rgba(59,174,160,0.1)', borderRadius: '50%', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '36px',
          boxShadow: '0 24px 60px rgba(28,43,30,0.12)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img
              src="/logo.png"
              alt="Project Wasto"
              style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 16, marginBottom: 12, boxShadow: '0 8px 24px rgba(76,175,116,0.25)' }}
              onError={e => { e.target.style.display = 'none' }}
            />
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--charcoal)' }}>Create Resident Account</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Join Project Wasto as a Resident</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'var(--charcoal)' }}>Full Name</label>
              <input
                className="input-field"
                placeholder="Juan Dela Cruz"
                value={form.name}
                onChange={e => f('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'var(--charcoal)' }}>Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="juan@example.com"
                value={form.email}
                onChange={e => f('email', e.target.value)}
                required
              />
            </div>

            {barangays.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'var(--charcoal)' }}>Barangay (optional)</label>
                <select
                  className="input-field"
                  value={form.barangay}
                  onChange={e => f('barangay', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">— Select your barangay —</option>
                  {barangays.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'var(--charcoal)' }}>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => f('password', e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'var(--charcoal)' }}>Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.confirm_password}
                onChange={e => f('confirm_password', e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 15, marginTop: 6 }}
            >
              {loading ? <div className="spinner" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--green-dark)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 16, opacity: 0.7 }}>
          © {new Date().getFullYear()} Project Wasto · Waste Management System
        </p>
      </div>
    </div>
  )
}
