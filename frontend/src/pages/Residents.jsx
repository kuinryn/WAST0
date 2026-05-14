// src/pages/Residents.jsx
// Integrated: v2 design + v1 backend (admin user management)
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getUsers, createUser, updateUser, deleteUser, getBarangays } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_STYLE = {
  super_admin: { label: 'Super Admin', color: '#dc2626', bg: '#fff1f2' },
  official: { label: 'Brgy. Official', color: '#1d4ed8', bg: '#eff6ff' },
  resident: { label: 'Resident', color: '#2d7a4f', bg: '#e8f5ee' },
}

function UserModal({ user: editUser, barangays, users, onClose, onSave }) {
  const isNew = !editUser?.id
  const [form, setForm] = useState(editUser || {
    name: '', email: '', password: '', role: 'resident', barangay: '', is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (form.role === 'official' && form.barangay && form.is_active) {
      const hasActiveOfficial = users.some(user => (
        user.role === 'official'
        && user.is_active
        && String(user.barangay || '') === String(form.barangay)
        && user.id !== editUser?.id
      ))
      if (hasActiveOfficial) {
        toast.error('This barangay already has an active official account.')
        return
      }
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (!payload.barangay) delete payload.barangay
      if (isNew) {
        const { data } = await createUser(payload)
        toast.success('User created!')
        onSave(data, true)
      } else {
        const { data } = await updateUser(editUser.id, payload)
        toast.success('User updated!')
        onSave(data, false)
      }
      onClose()
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to save'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{isNew ? '➕ Add User' : '✏️ Edit User'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Full Name *</label>
            <input className="input-field" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Juan Dela Cruz" required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => f('email', e.target.value)} placeholder="juan@example.com" required />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>
              Password {!isNew && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(leave blank to keep)</span>}
            </label>
            <input type="password" className="input-field" value={form.password} onChange={e => f('password', e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Role</label>
              <select className="input-field" value={form.role} onChange={e => f('role', e.target.value)}>
                <option value="resident">Resident</option>
                <option value="official">Brgy. Official</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Barangay</label>
              <select className="input-field" value={form.barangay || ''} onChange={e => f('barangay', e.target.value)}>
                <option value="">— None —</option>
                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => f('is_active', e.target.checked)} />
            <label htmlFor="isActive" style={{ fontSize: 13, cursor: 'pointer' }}>Active account</label>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              {saving ? 'Saving…' : isNew ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Residents() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [barangayFilter, setBarangayFilter] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    Promise.all([
      getUsers().catch(() => ({ data: [] })),
      getBarangays().catch(() => ({ data: [] })),
    ]).then(([u, b]) => {
      setUsers(Array.isArray(u.data) ? u.data : [])
      setBarangays(Array.isArray(b.data) ? b.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = (saved, isNew) => {
    if (isNew) setUsers(p => [saved, ...p])
    else setUsers(p => p.map(u => u.id === saved.id ? saved : u))
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id)
      setUsers(p => p.filter(u => u.id !== deleteTarget.id))
      toast.success('User deleted')
    } catch { toast.error('Failed to delete user') }
    finally { setDeleteTarget(null) }
  }

  const visibleUsers = me?.role === 'official'
    ? users.filter(u => u.role === 'resident' && String(u.barangay || '') === String(me.barangay || ''))
    : users
  const registeredResidentCount = visibleUsers.filter(u => u.role === 'resident').length

  const filtered = visibleUsers.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false
    if (barangayFilter && String(u.barangay || '') !== barangayFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.role?.includes(q)
      || u.barangay_name?.toLowerCase().includes(q)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={me?.role === 'super_admin' ? 'Users' : 'Residents'} subtitle={me?.role === 'super_admin' ? 'Manage all system users' : 'Residents registered in your barangay'} />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {me?.role === 'official' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#e8f5ee',
                color: '#2d7a4f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                marginBottom: 12,
              }}>
                RR
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2d7a4f', lineHeight: 1 }}>
                {loading ? '...' : registeredResidentCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Registered Residents in {me?.barangay_name || 'your barangay'}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="input-field" placeholder="Search name, email, role, barangay..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          {me?.role === 'super_admin' && (
            <>
              <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 190 }}>
                <option value="">All roles</option>
                <option value="resident">Resident</option>
                <option value="official">Barangay Official</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <select className="input-field" value={barangayFilter} onChange={e => setBarangayFilter(e.target.value)} style={{ maxWidth: 220 }}>
                <option value="">All barangays</option>
                {barangays.map(barangay => <option key={barangay.id} value={barangay.id}>{barangay.name}</option>)}
              </select>
            </>
          )}
          {me?.role === 'super_admin' && (
            <button className="btn-primary" onClick={() => { setEditUser(null); setShowModal(true) }} style={{ marginLeft: 'auto' }}>
              ➕ Add User
            </button>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <p>{search || roleFilter || barangayFilter ? 'No users match your filters' : 'No users found'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Barangay</th>
                  <th>Status</th>
                  {me?.role === 'super_admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rs = ROLE_STYLE[u.role] || { label: u.role, color: '#374151', bg: '#f3f4f6' }
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color }}>
                          {rs.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{u.barangay_name || '—'}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: u.is_active ? '#d1fae5' : '#f3f4f6', color: u.is_active ? '#065f46' : '#6b7280' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {me?.role === 'super_admin' && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setEditUser(u); setShowModal(true) }} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Edit</button>
                            <button onClick={() => setDeleteTarget(u)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <UserModal user={editUser} barangays={barangays} users={users} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Delete User?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>This will permanently delete <strong>{deleteTarget.name}</strong>'s account.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
