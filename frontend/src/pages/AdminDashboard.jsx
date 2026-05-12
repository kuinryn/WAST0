import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const TABS = [
  { key: 'barangays', label: 'Barangays' },
  { key: 'users', label: 'Users' },
  { key: 'audit', label: 'Audit Logs' },
]

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  official: 'Barangay Official',
  resident: 'Resident',
}

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'resident',
  barangay: '',
  is_active: true,
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('barangays')
  const [barangays, setBarangays] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingBarangay, setEditingBarangay] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ name: '', district: '' })
  const [userForm, setUserForm] = useState(emptyUserForm)

  const fetchAll = () => {
    Promise.all([
      api.get('/barangays/'),
      api.get('/auth/users/'),
      api.get('/audit/'),
    ]).then(([b, u, a]) => {
      setBarangays(b.data)
      setUsers(u.data)
      setLogs(a.data)
    }).catch(() => {
      toast.error('Failed to load admin data.')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    let isMounted = true
    Promise.all([
      api.get('/barangays/'),
      api.get('/auth/users/'),
      api.get('/audit/'),
    ]).then(([b, u, a]) => {
      if (!isMounted) return
      setBarangays(b.data)
      setUsers(u.data)
      setLogs(a.data)
    }).catch(() => {
      if (isMounted) toast.error('Failed to load admin data.')
    }).finally(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [])

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

  const resetUserForm = () => {
    setEditingUser(null)
    setUserForm(emptyUserForm)
  }

  const openUserEditor = (user) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      barangay: user.barangay || '',
      is_active: user.is_active,
    })
    setShowUserModal(true)
  }

  const handleUserSave = async (e) => {
    e.preventDefault()
    const payload = {
      ...userForm,
      barangay: userForm.barangay || null,
    }
    if (editingUser && !payload.password) delete payload.password

    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}/`, payload)
        toast.success('User updated!')
      } else {
        await api.post('/auth/users/', payload)
        toast.success('User created!')
      }
      setShowUserModal(false); resetUserForm(); fetchAll()
    } catch (error) {
      const detail = error.response?.data
      const message = typeof detail === 'string'
        ? detail
        : Object.values(detail || {})?.flat?.()?.[0] || 'Failed to save user.'
      toast.error(message)
    }
  }

  const handleUserDelete = async () => {
    try {
      await api.delete(`/auth/users/${deleteUserTarget.id}/`)
      toast.success('User deleted.')
      setDeleteUserTarget(null); fetchAll()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user.')
    }
  }

  const handleUserStatusToggle = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}/`, { is_active: !user.is_active })
      toast.success(user.is_active ? 'User deactivated.' : 'User activated.')
      fetchAll()
    } catch { toast.error('Failed to update user status.') }
  }

  if (loading) return <LoadingSpinner />

  const ACTION_COLORS = { POST: 'badge-green', DELETE: 'badge-red', PUT: 'badge-blue', PATCH: 'badge-blue' }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #450a0a, #dc2626)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span className="badge badge-red" style={{ marginBottom: 8, display: 'inline-block' }}>Super Admin</span>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'white', margin: '0 0 4px' }}>System Administration</h1>
          <p style={{ fontSize: 14, color: '#fca5a5', margin: 0 }}>Full system access for barangays, users, and audit logs</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Barangays', value: barangays.length, color: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Users', value: users.length, color: '#eff6ff', border: '#bfdbfe' },
            { label: 'Audit Entries', value: logs.length, color: '#fef2f2', border: '#fecaca' },
            { label: 'System Status', value: 'Online', color: '#f0fdf4', border: '#bbf7d0' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className="card" style={{ padding: '20px 22px', background: color, borderColor: border }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Serif Display, serif' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 6, borderRadius: 14, width: 'fit-content', flexWrap: 'wrap' }}>
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

        {tab === 'users' && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: 0 }}>Users ({users.length})</h2>
              <button onClick={() => { resetUserForm(); setShowUserModal(true) }}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#14532d', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                + Add User
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Name', 'Email', 'Role', 'Barangay', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>{user.name}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{user.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${user.role === 'super_admin' ? 'badge-red' : user.role === 'official' ? 'badge-blue' : 'badge-green'}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{user.barangay_name || '-'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${user.is_active ? 'badge-green' : 'badge-slate'}`}>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => openUserEditor(user)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                          <button onClick={() => handleUserStatusToggle(user)}
                            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setDeleteUserTarget(user)}
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

      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 460, padding: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 20px' }}>
              {editingUser ? 'Edit User' : 'Add User'}
            </h2>
            <form onSubmit={handleUserSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Name</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="input" placeholder="Full name" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Email</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="input" placeholder="email@example.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Password {editingUser && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank to keep current)</span>}
                </label>
                <input type="password" required={!editingUser} minLength={8} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="input" placeholder="At least 8 characters" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="input">
                    <option value="resident">Resident</option>
                    <option value="official">Barangay Official</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Status</label>
                  <select value={userForm.is_active ? 'active' : 'inactive'} onChange={e => setUserForm({ ...userForm, is_active: e.target.value === 'active' })} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Barangay</label>
                <select value={userForm.barangay} onChange={e => setUserForm({ ...userForm, barangay: e.target.value })} className="input">
                  <option value="">No barangay</option>
                  {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => { setShowUserModal(false); resetUserForm() }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
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

      {deleteUserTarget && (
        <ConfirmModal
          message={`Delete user "${deleteUserTarget.name}"? This cannot be undone.`}
          onConfirm={handleUserDelete}
          onCancel={() => setDeleteUserTarget(null)}
        />
      )}
    </div>
  )
}
