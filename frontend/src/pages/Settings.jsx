// src/pages/Settings.jsx
// Integrated: v2 design + v1 backend profile update
import { useState } from 'react'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, patchProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      await patchProfile({ name })
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const roleBadge = {
    super_admin: { label: 'Super Admin', color: '#dc2626', bg: '#fff1f2' },
    official: { label: 'Brgy. Official', color: '#1d4ed8', bg: '#eff6ff' },
    resident: { label: 'Resident', color: '#2d7a4f', bg: '#e8f5ee' },
  }[user?.role] || { label: user?.role, color: '#374151', bg: '#f3f4f6' }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="⚙️ Settings" subtitle="Account and system preferences" />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>

        {/* Profile Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20, color: 'var(--charcoal)' }}>👤 Profile</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 16px', background: 'var(--cream)', borderRadius: 12 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 20, fontWeight: 800, flexShrink: 0,
            }}>
              {(user?.name?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{user?.email}</div>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700, background: roleBadge.bg, color: roleBadge.color }}>
                {roleBadge.label}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Full Name</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Email Address</label>
            <input
              className="input-field"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Email cannot be changed</p>
          </div>

          {user?.barangay_name && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Barangay</label>
              <input
                className="input-field"
                value={user.barangay_name}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? <><div className="spinner" /> Saving…</> : '💾 Save Changes'}
          </button>
        </div>

        {/* Account Info */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--charcoal)' }}>ℹ️ Account Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Role', value: roleBadge.label },
              { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
