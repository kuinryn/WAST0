import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
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
  const [fetchingWeather, setFetchingWeather] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const barangayId = user?.barangay

  const fetchData = useCallback(() => {
    if (!barangayId) {
      window.setTimeout(() => setLoading(false), 0)
      return
    }
    Promise.all([
      api.get(`/schedules/?barangay=${barangayId}`),
      api.get(`/weather/alerts/?barangay=${barangayId}`),
      api.get('/barangays/'),
    ]).then(([scheduleRes, alertRes, barangayRes]) => {
      setSchedules(scheduleRes.data)
      setAlerts(alertRes.data)
      const found = barangayRes.data.find(barangay => barangay.id === barangayId)
      setBarangayName(found?.name || 'Your Barangay')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [barangayId])

  useEffect(() => {
    const timeout = window.setTimeout(() => fetchData(), 0)
    return () => window.clearTimeout(timeout)
  }, [fetchData])

  const openAdd = () => { setEditingSchedule(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (schedule) => {
    setEditingSchedule(schedule)
    setForm({
      waste_type: schedule.waste_type,
      collection_day: schedule.collection_day,
      collection_time: schedule.collection_time,
      frequency: schedule.frequency,
      calendar_sync_enabled: schedule.calendar_sync_enabled !== false,
    })
    setShowModal(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, barangay: barangayId }
      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}/`, payload)
        toast.success('Schedule updated.')
      } else {
        await api.post('/schedules/', payload)
        toast.success('Schedule created.')
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
    setFetchingWeather(true)
    try {
      await api.post('/weather/fetch/', { barangay_id: barangayId })
      toast.success('Weather data refreshed.')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not fetch weather data.')
    } finally {
      setFetchingWeather(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    try {
      const response = await api.post('/schedules/sync-all/', { barangay_id: barangayId })
      toast.success(response.data.message || 'Schedules synced.')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not sync schedules.')
    } finally {
      setSyncingAll(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page-shell">
      <section className="page-hero blue">
        <div className="hero-inner">
          <div>
            <p className="eyebrow">Barangay Official</p>
            <h1 className="hero-title">Barangay {barangayName}</h1>
            <p className="hero-copy">Manage collection schedules and refresh weather signals for residents.</p>
          </div>
          <div className="hero-actions">
            <button type="button" onClick={handleFetchWeather} disabled={fetchingWeather} className="btn-inline ghost">
              {fetchingWeather ? 'Refreshing...' : 'Refresh weather'}
            </button>
            <button type="button" onClick={openAdd} className="btn-inline light">Add schedule</button>
          </div>
        </div>
      </section>

      <div className="page-inner">
        <div className="stats-grid">
          {[
            { label: 'Total schedules', value: schedules.length },
            { label: 'Active alerts', value: alerts.length },
            { label: 'Barangay', value: barangayName || '-' },
          ].map(item => (
            <div key={item.label} className="stat-card">
              <div className="stat-value" style={{ fontSize: item.label === 'Barangay' ? 20 : 28 }}>{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <WeatherAlertBanner alert={alerts[0]} />

        <section className="card" style={{ padding: 24 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Collection Schedules</h2>
              <p className="section-copy">Edit the timetable residents see for this barangay.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {barangayId && schedules.length > 0 && (
                <BarangayICalButton barangayId={barangayId} barangayName={barangayName} />
              )}
              <button type="button" onClick={handleSyncAll} disabled={syncingAll || schedules.length === 0} className="btn-inline blue">
                {syncingAll ? 'Syncing...' : 'Sync all'}
              </button>
              <button type="button" onClick={openAdd} className="btn-inline primary">Add schedule</button>
            </div>
          </div>
          <ScheduleTable schedules={schedules} canEdit={true} onEdit={openEdit} onDelete={setDeleteTarget} onRefresh={fetchData} />
        </section>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h2 className="section-title" style={{ marginBottom: 20 }}>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</h2>
            <form onSubmit={handleSave}>
              {[
                { label: 'Waste Type', key: 'waste_type', options: [['biodegradable','Biodegradable'],['non_biodegradable','Non-biodegradable'],['residual','Residual'],['hazardous','Hazardous']] },
                { label: 'Collection Day', key: 'collection_day', options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => [day, day]) },
                { label: 'Frequency', key: 'frequency', options: [['weekly','Weekly'],['bi_weekly','Bi-weekly']] },
              ].map(({ label, key, options }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input">
                    {options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Collection Time</label>
                <input type="time" value={form.collection_time} onChange={e => setForm({ ...form, collection_time: e.target.value })} className="input" />
              </div>
              <label className="surface" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12, marginBottom: 22, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.calendar_sync_enabled}
                  onChange={e => setForm({ ...form, calendar_sync_enabled: e.target.checked })}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Sync this schedule to Google Calendar</span>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
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
