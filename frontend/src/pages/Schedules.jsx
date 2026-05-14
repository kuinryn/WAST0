// src/pages/Schedules.jsx
// Integrated: v2 design + v1 backend schedule fields (waste_type, collection_day, collection_time, frequency)
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getBarangays } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const WASTE_TYPES = ['biodegradable', 'non_biodegradable', 'residual', 'hazardous']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WASTE_STYLE = {
  biodegradable: { label: 'Biodegradable', icon: '♻️', bg: '#d1fae5', color: '#065f46' },
  non_biodegradable: { label: 'Non-Biodegradable', icon: '🗑️', bg: '#fef3c7', color: '#92400e' },
  residual: { label: 'Residual', icon: '🪣', bg: '#f3f4f6', color: '#374151' },
  hazardous: { label: 'Hazardous', icon: '⚠️', bg: '#fee2e2', color: '#991b1b' },
}

function ScheduleModal({ schedule, barangays, userBarangay, onClose, onSave }) {
  const isNew = !schedule?.id
  const [form, setForm] = useState(schedule || {
    waste_types: ['biodegradable'],
    collection_day: 'Monday',
    collection_time: '08:00',
    frequency: 'weekly',
    calendar_sync_enabled: true,
    barangay: userBarangay || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSave = async () => {
    const selectedWasteTypes = isNew ? form.waste_types || [] : [form.waste_type]
    if (!selectedWasteTypes.length || !form.collection_day || !form.collection_time) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const { waste_types, ...scheduleForm } = form
        const responses = await Promise.all(waste_types.map(wasteType => createSchedule({
          ...scheduleForm,
          waste_type: wasteType,
        })))
        toast.success(waste_types.length === 1 ? 'Schedule created!' : 'Schedules created!')
        onSave(responses.map(response => response.data), true)
      } else {
        const { data } = await updateSchedule(schedule.id, form)
        toast.success('Schedule updated!')
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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--charcoal)' }}>
            {isNew ? '➕ New Schedule' : '✏️ Edit Schedule'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {barangays.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Barangay *</label>
              <select className="input-field" value={form.barangay} onChange={e => f('barangay', e.target.value)}>
                <option value="">— Select barangay —</option>
                {barangays.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Waste Type *</label>
            {isNew ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                {WASTE_TYPES.map(t => {
                  const checked = form.waste_types?.includes(t)
                  return (
                    <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...(form.waste_types || []), t]
                            : (form.waste_types || []).filter(wasteType => wasteType !== t)
                          f('waste_types', next)
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{WASTE_STYLE[t]?.label || t}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <select className="input-field" value={form.waste_type} onChange={e => f('waste_type', e.target.value)}>
                {WASTE_TYPES.map(t => (
                  <option key={t} value={t}>{WASTE_STYLE[t]?.label || t}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Day *</label>
              <select className="input-field" value={form.collection_day} onChange={e => f('collection_day', e.target.value)}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Time *</label>
              <input type="time" className="input-field" value={form.collection_time} onChange={e => f('collection_time', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Frequency</label>
            <select className="input-field" value={form.frequency} onChange={e => f('frequency', e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="bi_weekly">Bi-weekly</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="calSync" checked={form.calendar_sync_enabled} onChange={e => f('calendar_sync_enabled', e.target.checked)} />
            <label htmlFor="calSync" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
              Sync to Google Calendar
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              {saving ? <><div className="spinner" /> Saving…</> : isNew ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Schedules() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalSchedule, setModalSchedule] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const canEdit = user?.role === 'official' || user?.role === 'super_admin'

  useEffect(() => {
    const params = user?.barangay ? { barangay: user.barangay } : {}
    Promise.all([
      getSchedules(params).catch(() => ({ data: [] })),
      canEdit ? getBarangays().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([schedRes, barRes]) => {
      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : [])
      setBarangays(Array.isArray(barRes.data) ? barRes.data : [])
    }).finally(() => setLoading(false))
  }, [user, canEdit])

  const openAdd = () => { setModalSchedule(null); setShowModal(true) }
  const openEdit = (s) => { setModalSchedule(s); setShowModal(true) }

  const handleSave = (saved, isNew) => {
    if (isNew) setSchedules(p => [...(Array.isArray(saved) ? saved : [saved]), ...p])
    else setSchedules(p => p.map(s => s.id === saved.id ? saved : s))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSchedule(deleteTarget.id)
      setSchedules(p => p.filter(s => s.id !== deleteTarget.id))
      toast.success('Schedule deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteTarget(null)
    }
  }

  const filtered = schedules.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.waste_type?.includes(q) ||
      s.collection_day?.toLowerCase().includes(q) ||
      s.barangay_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="📅 Schedules" subtitle="Waste collection schedule management" />

      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input-field"
            placeholder="🔍 Search by type, day, barangay…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          {canEdit && (
            <button className="btn-primary" onClick={openAdd} style={{ marginLeft: 'auto' }}>
              ➕ New Schedule
            </button>
          )}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading schedules…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <p>{search ? 'No schedules match your search' : 'No schedules yet'}</p>
              {canEdit && !search && (
                <button className="btn-primary" onClick={openAdd} style={{ marginTop: 16 }}>
                  ➕ Add First Schedule
                </button>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waste Type</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Frequency</th>
                  {user?.role === 'super_admin' && <th>Barangay</th>}
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const wt = WASTE_STYLE[s.waste_type] || { label: s.waste_type, icon: '🗑️', bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                          <span style={{ padding: '3px 8px', background: wt.bg, borderRadius: 8, fontSize: 14 }}>{wt.icon}</span>
                          <span style={{ color: wt.color }}>{wt.label}</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.collection_day}</td>
                      <td>{s.collection_time?.slice(0, 5) || '—'}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#e8f5ee', color: 'var(--green-dark)' }}>
                          {s.frequency === 'bi_weekly' ? 'Bi-weekly' : 'Weekly'}
                        </span>
                      </td>
                      {user?.role === 'super_admin' && <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.barangay_name || s.barangay}</td>}
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => openEdit(s)}
                              style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                            >
                              Delete
                            </button>
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
        <ScheduleModal
          schedule={modalSchedule}
          barangays={user?.role === 'super_admin' ? barangays : []}
          userBarangay={user?.barangay}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Delete Schedule?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              This will remove the {WASTE_STYLE[deleteTarget.waste_type]?.label} schedule on {deleteTarget.collection_day}s.
            </p>
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
