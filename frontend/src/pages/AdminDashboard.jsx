import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const TABS = [
  { key: 'barangays', label: '🏘️ Barangays' },
  { key: 'users', label: '👥 Users' },
  { key: 'audit', label: '📋 Audit Logs' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('barangays')
  const [barangays, setBarangays] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingBarangay, setEditingBarangay] = useState(null)
  const [form, setForm] = useState({ name: '', district: '' })

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/barangays/'),
      api.get('/audit/'),
    ]).then(([b, a]) => {
      setBarangays(b.data)
      setLogs(a.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingBarangay) {
        await api.put(`/barangays/${editingBarangay.id}/`, form)
        toast.success('Barangay updated!')
      } else {
        await api.post('/barangays/', form)
        toast.success('Barangay created!')
      }
      setShowModal(false); setForm({ name: '', district: '' }); setEditingBarangay(null)
      fetchAll()
    } catch { toast.error('Failed to save.') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/barangays/${deleteTarget.id}/`)
      toast.success('Barangay deleted.')
      setDeleteTarget(null); fetchAll()
    } catch { toast.error('Failed to delete.') }
  }

  if (loading) return <LoadingSpinner />

  const ACTION_COLORS = { POST: 'badge-green', DELETE: 'badge-red', PUT: 'badge-blue', PATCH: 'badge-blue' }

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #450a0a, #dc2626)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="badge badge-red" style={{ marginBottom: 8, display: 'inline-block' }}>⚙️ Super Admin</span>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'white', margin: '0 0 4px' }}>System Administration</h1>
          <p style={{ fontSize: 14, color: '#fca5a5', margin: 0 }}>Full system access — manage barangays, users, and audit logs</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Barangays', value: barangays.length, icon: '🏘️', color: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Audit Entries', value: logs.length, icon: '📋', color: '#fef2f2', border: '#fecaca' },
            { label: 'System Status', value: 'Online', icon: '🟢', color: '#f0fdf4', border: '#bbf7d0' },
          ].map(({ label, value, icon, color, border }) => (
            <div key={label} className="card" style={{ padding: '20px 22px', background: color, borderColor: border }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Serif Display, serif' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 6, borderRadius: 14, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#0f172a' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Barangays Tab */}
        {tab === 'barangays' && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: 0 }}>Barangays ({barangays.length})</h2>
              <button onClick={() => { setEditingBarangay(null); setForm({ name: '', district: '' }); setShowModal(true) }}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#14532d', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                + Add Barangay
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Barangay Name', 'District', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {barangays.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{b.name}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{b.district}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditingBarangay(b); setForm({ name: b.name, district: b.district }); setShowModal(true) }}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                          <button onClick={() => setDeleteTarget(b)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 12px' }}>User Management</h2>
            <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                ⚠️ For security, user management is handled through the Django Admin Panel. Barangay officials must be created by administrators only.
              </p>
            </div>
            <a href="http://127.0.0.1:8000/admin/accounts/customuser/" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 10, background: '#0f172a', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Open Django Admin Panel →
            </a>
          </div>
        )}

        {/* Audit Tab */}
        {tab === 'audit' && (
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 20px' }}>Audit Logs ({logs.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['User', 'Action', 'Target', 'Timestamp'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{l.user_name}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${ACTION_COLORS[l.action] || 'badge-slate'}`}>{l.action}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{l.target_table}</td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 12 }}>{new Date(l.performed_at).toLocaleString('en-PH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Barangay Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 20px' }}>
              {editingBarangay ? 'Edit Barangay' : 'Add Barangay'}
            </h2>
            <form onSubmit={handleSave}>
              {[
                { label: 'Barangay Name', key: 'name', placeholder: 'e.g. Buhangin' },
                { label: 'District', key: 'district', placeholder: 'e.g. District 3' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <input type="text" required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input" placeholder={placeholder} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete barangay "${deleteTarget.name}"? This will remove all its schedules.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}