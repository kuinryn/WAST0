import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import WeatherAlertBanner from '../components/WeatherAlertBanner'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'

const EMPTY_FORM = {
  waste_type: 'biodegradable',
  collection_day: 'Monday',
  collection_time: '08:00',
  frequency: 'weekly',
  calendar_sync_enabled: true,
}

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
  const [bulkSyncing, setBulkSyncing] = useState(false)

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
    setForm({
      waste_type: s.waste_type,
      collection_day: s.collection_day,
      collection_time: s.collection_time,
      frequency: s.frequency,
      calendar_sync_enabled: s.calendar_sync_enabled !== false,
    })
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
    } catch {
      toast.error('Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/schedules/${deleteTarget.id}/`)
      toast.success('Schedule deleted.')
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const handleFetchWeather = async () => {
    try {
      await api.post('/weather/fetch/', { barangay_id: user.barangay })
      toast.success('Weather data refreshed!')
      fetchData()
    } catch {
      toast.error('Could not fetch weather data.')
    }
  }

  const handleBulkSync = async () => {
    setBulkSyncing(true)
    try {
      const res = await api.post('/schedules/sync-all/', { barangay_id: user.barangay })
      toast.success(res.data.message || 'All schedules synced!')
      fetchData()
    } catch (e) {
      const msg = e?.response?.data?.error || 'Bulk sync failed. Check Google service account config.'
      toast.error(msg)
    } finally {
      setBulkSyncing(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const syncedCount = schedules.filter(s => s.has_calendar_event).length

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
            <p style={{ fontSize: 14, color: '#93c5fd', margin: 0 }}>Manage waste collection schedules and sync to Google Calendar</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
            { label: 'Total Schedules', value: schedules.length, icon: '📋', color: '#f0f9ff', border: '#bae6fd' },
            { label: 'Active Alerts', value: alerts.length, icon: '⚠️', color: alerts.length > 0 ? '#fef2f2' : '#f0fdf4', border: alerts.length > 0 ? '#fecaca' : '#bbf7d0' },
            { label: 'Calendar Synced', value: `${syncedCount}/${schedules.length}`, icon: '🗓️', color: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Barangay', value: barangayName, icon: '📍', small: true, color: '#f8fafc', border: '#e2e8f0' },
          ].map(({ label, value, icon, small, color, border }) => (
            <div key={label} className="card" style={{ padding: '20px 22px', background: color, borderColor: border }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: small ? 16 : 26, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Serif Display, serif', wordBreak: 'break-word' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <WeatherAlertBanner alert={alerts[0]} />

        {/* Google Calendar Setup Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1.5px solid #bfdbfe', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🗓️</span>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, color: '#1e40af', margin: 0 }}>
                Google Calendar Integration
              </h3>
            </div>
            <p style={{ fontSize: 12, color: '#3b82f6', margin: 0 }}>
              {syncedCount > 0
                ? `${syncedCount} schedule${syncedCount !== 1 ? 's' : ''} synced to Google Calendar. Residents can also add schedules directly from the calendar buttons below.`
                : 'Sync schedules to Google Calendar so residents get automatic reminders. Each schedule also has a direct "Add to Google Calendar" button.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Bulk sync to server-side Google Calendar */}
            <button
              onClick={handleBulkSync}
              disabled={bulkSyncing}
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: '#1d4ed8', color: 'white', fontSize: 12, fontWeight: 600,
                cursor: bulkSyncing ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif', opacity: bulkSyncing ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {bulkSyncing ? '⏳ Syncing...' : '🔄 Sync All to Calendar'}
            </button>

            {/* Download all schedules as .ics */}
            {user?.barangay && (
              <BarangayICalButton barangayId={user.barangay} barangayName={barangayName} />
            )}
          </div>
        </div>

        {/* Schedules table */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#0f172a', margin: '0 0 4px' }}>
                Collection Schedules
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Use the calendar buttons on each row to add schedules to Google Calendar or download as .ics
              </p>
            </div>
            <button onClick={openAdd} style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: '#14532d', color: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>+ Add Schedule</button>
          </div>
          <ScheduleTable
            schedules={schedules}
            canEdit={true}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onRefresh={fetchData}
          />
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
                { label: 'Waste Type', key: 'waste_type', options: [['biodegradable','♻️ Biodegradable'],['non_biodegradable','🗑️ Non-Biodegradable'],['residual','🪣 Residual'],['hazardous','⚠️ Hazardous']] },
                { label: 'Collection Day', key: 'collection_day', options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => [d,d]) },
                { label: 'Frequency', key: 'frequency', options: [['weekly','Weekly — Every week'],['bi_weekly','Bi-Weekly — Every 2 weeks']] },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={SELECT_STYLE}>
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Collection Time</label>
                <input type="time" value={form.collection_time} onChange={e => setForm({ ...form, collection_time: e.target.value })} className="input" />
              </div>

              {/* Google Calendar sync toggle */}
              <div style={{ marginBottom: 22, padding: '14px 16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.calendar_sync_enabled}
                    onChange={e => setForm({ ...form, calendar_sync_enabled: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>🗓️ Sync to Google Calendar</div>
                    <div style={{ fontSize: 11, color: '#0284c7', marginTop: 1 }}>
                      Automatically create/update a recurring event in Google Calendar
                    </div>
                  </div>
                </label>
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
          message={`Delete the ${deleteTarget.waste_type.replace('_', ' ')} schedule on ${deleteTarget.collection_day}? This will also remove it from Google Calendar.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
