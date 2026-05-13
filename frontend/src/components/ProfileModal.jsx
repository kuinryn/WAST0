import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth()
  const [barangays, setBarangays] = useState([])
  const [form, setForm] = useState({ name: user?.name || '', barangay: user?.barangay || '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/barangays/').then(res => setBarangays(res.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name cannot be empty.'); return }
    setLoading(true)
    try {
      await updateProfile({ name: form.name, barangay: form.barangay || null })
      toast.success('Profile updated successfully!')
      onClose()
    } catch (err) {
      const data = err.response?.data
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Update failed.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Overlay style
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  }

  const modalStyle = {
    background: 'white', borderRadius: 20, padding: 32,
    width: '100%', maxWidth: 440,
    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
    position: 'relative',
  }

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #14532d, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'white',
            }}>
              👤
            </div>
            <div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#0f172a', margin: 0 }}>
                Edit Profile
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Full Name
            </label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Juan dela Cruz"
              required
            />
          </div>

          {/* Barangay */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Barangay{' '}
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>(change if you moved)</span>
            </label>
            <select
              className="input"
              value={form.barangay}
              onChange={e => setForm({ ...form, barangay: e.target.value })}
              style={{ cursor: 'pointer' }}
            >
              <option value="">— No barangay selected —</option>
              {barangays.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.district}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              ℹ️ Changing your barangay updates which schedules and alerts you see.
            </p>
          </div>

          {/* Read-only info */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Role</span>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '2px 10px',
                background: '#dcfce7', color: '#15803d', borderRadius: 20,
              }}>
                {user?.role === 'resident' ? 'Resident' : user?.role}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>
              Role and email cannot be changed here.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: 'white',
                cursor: 'pointer', fontSize: 14, color: '#64748b', fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
