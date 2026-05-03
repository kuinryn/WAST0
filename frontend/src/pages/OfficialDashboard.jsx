import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import ScheduleTable from '../components/ScheduleTable'
import WeatherAlertBanner from '../components/WeatherAlertBanner'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'

const EMPTY_FORM = { waste_type: 'biodegradable', collection_day: 'Monday', collection_time: '08:00', frequency: 'weekly' }

export default function OfficialDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [alerts, setAlerts] = useState([])
  const [barangayName, setBarangayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    if (!user?.barangay) return
    Promise.all([
      api.get(`/schedules/?barangay=${user.barangay}`),
      api.get(`/weather/alerts/?barangay=${user.barangay}`),
      api.get('/barangays/'),
    ]).then(([s, a, b]) => {
      setSchedules(s.data)
      setAlerts(a.data)
      const found = b.data.find(br => br.id === user.barangay)
      setBarangayName(found?.name || 'Your Barangay')
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [user])

  const openAdd = () => { setEditingSchedule(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (s) => {
    setEditingSchedule(s)
    setForm({ waste_type: s.waste_type, collection_day: s.collection_day, collection_time: s.collection_time, frequency: s.frequency })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, barangay: user.barangay }
      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}/`, payload)
        toast.success('Schedule updated!')
      } else {
        await api.post('/schedules/', payload)
        toast.success('Schedule created!')
      }
      setShowModal(false)
      fetchData()
    } catch { toast.error('Failed to save schedule.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/schedules/${deleteTarget.id}/`)
      toast.success('Schedule deleted.')
      setDeleteTarget(null)
      fetchData()
    } catch { toast.error('Failed to delete.') }
  }

  const handleFetchWeather = async () => {
    try {
      await api.post('/weather/fetch/', { barangay_id: user.barangay })
      toast.success('Weather data refreshed!')
      fetchData()
    } catch { toast.error('Could not fetch weather data.') }
  }

  if (loading) return <LoadingSpinner />

  const SELECT_STYLE = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #cbd5e1', fontSize: 14,
    fontFamily: 'DM Sans, sans-serif', background: 'white',
    color: '#0f172a', outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>🏛️ Barangay Official</span>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'white', margin: '0 0 4px' }}>
              Barangay {barangayName}
            </h1>
            <p style={{ fontSize: 14, color: '#93c5fd', margin: 0 }}>Manage your barangay's waste collection schedules</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleFetchWeather} style={{
              padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', backdropFilter: 'blur(8px)',
            }}>🌤️ Refresh Weather</button>
            <button onClick={openAdd} style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'white', color: '#1d4ed8', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>+ Add Schedule</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Schedules', value: schedules.length, icon: '📋' },
            { label: 'Active Alerts', value: alerts.length, icon: '⚠️' },
            { label: 'Barangay', value: barangayName, icon: '📍', small: true },
          ].map(({ label, value, icon, small }) => (
            <div key={label} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: small ? 16 : 26, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Serif Display, serif', wordBreak: 'break-word' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <WeatherAlertBanner alert={alerts[0]} />

        {/* Schedules table */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#0f172a', margin: 0 }}>Collection Schedules</h2>
            <button onClick={openAdd} style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: '#14532d', color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>+ Add Schedule</button>
          </div>
          <ScheduleTable schedules={schedules} canEdit={true} onEdit={openEdit} onDelete={setDeleteTarget} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-up" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, margin: '0 0 20px' }}>
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </h2>
            <form onSubmit={handleSave}>
              {[
                { label: 'Waste Type', key: 'waste_type', options: [['biodegradable','Biodegradable'],['non_biodegradable','Non-Biodegradable'],['residual','Residual'],['hazardous','Hazardous']] },
                { label: 'Collection Day', key: 'collection_day', options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => [d,d]) },
                { label: 'Frequency', key: 'frequency', options: [['weekly','Weekly'],['bi_weekly','Bi-Weekly']] },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={SELECT_STYLE}>
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Collection Time</label>
                <input type="time" value={form.collection_time} onChange={e => setForm({ ...form, collection_time: e.target.value })} className="input" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete the ${deleteTarget.waste_type.replace('_', ' ')} schedule on ${deleteTarget.collection_day}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}