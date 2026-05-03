import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [barangays, setBarangays] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', barangay: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/barangays/').then(res => setBarangays(res.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match.'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to WAST0.')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Juan dela Cruz' },
    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'juan@example.com' },
    { label: 'Password', key: 'password', type: 'password', placeholder: '8+ characters' },
    { label: 'Confirm Password', key: 'confirm_password', type: 'password', placeholder: 'Repeat password' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1f0f 0%, #14532d 50%, #15803d 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: 'rgba(255,255,255,0.1)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 14px', border: '1px solid rgba(255,255,255,0.15)',
          }}>🗑️</div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'white', margin: '0 0 4px' }}>Create Account</h1>
          <p style={{ fontSize: 13, color: '#86efac', margin: 0 }}>Join your barangay's waste management system</p>
        </div>

        <div className="animate-fade-up delay-100" style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

          {/* Resident only notice */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>🏠</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Resident Registration</div>
              <div style={{ fontSize: 12, color: '#4ade80' }}>Barangay officials are added by administrators only</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {fields.map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ gridColumn: key === 'name' || key === 'email' ? '1 / -1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type} required
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="input"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Barangay <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <select
                value={form.barangay}
                onChange={e => setForm({ ...form, barangay: e.target.value })}
                className="input"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select your barangay...</option>
                {barangays.map(b => (
                  <option key={b.id} value={b.id}>{b.name} — {b.district}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create Resident Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Already have an account? </span>
            <Link to="/" style={{ fontSize: 13, color: '#15803d', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}