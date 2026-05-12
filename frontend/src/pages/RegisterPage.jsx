import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match.'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created. Welcome to WAST0.')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      const message = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div className="animate-fade-up" style={{ textAlign: 'center', color: 'white', marginBottom: 24 }}>
          <span className="brand-mark" style={{ marginBottom: 14, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)' }}>W</span>
          <h1 className="hero-title" style={{ marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: '#bbf7d0', margin: 0, fontSize: 14 }}>Resident access for schedules and weather alerts.</p>
        </div>

        <div className="auth-card animate-fade-up delay-100">
          <div className="surface" style={{ padding: 16, marginBottom: 22, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#15803d', margin: '0 0 4px' }}>Resident registration</p>
            <p style={{ fontSize: 12, color: '#15803d', margin: 0 }}>Barangay officials are created by system administrators.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Full name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Juan dela Cruz" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Email address</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="juan@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Password</label>
                <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder="8+ characters" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Confirm password</label>
                <input type="password" required value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} className="input" placeholder="Repeat password" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Barangay</label>
              <select value={form.barangay} onChange={e => setForm({ ...form, barangay: e.target.value })} className="input">
                <option value="">Select your barangay</option>
                {barangays.map(barangay => (
                  <option key={barangay.id} value={barangay.id}>{barangay.name} - {barangay.district}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create resident account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', margin: '20px 0 0', paddingTop: 18, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b' }}>
            Already have an account? <Link to="/" style={{ color: '#15803d', fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
