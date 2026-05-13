import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import api from '../api/axios'
import toast from 'react-hot-toast'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import { WeatherUpdates } from '../components/WeatherAlertBanner'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'

const EMPTY_FORM = {
  waste_types: ['biodegradable'],
  collection_day: 'Monday',
  collection_time: '08:00',
  frequency: 'weekly',
  calendar_sync_enabled: true,
}

const WASTE_OPTIONS = [
  ['biodegradable', 'Biodegradable'],
  ['non_biodegradable', 'Non-biodegradable'],
  ['residual', 'Residual'],
  ['hazardous', 'Hazardous'],
]

export default function OfficialDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [weatherUpdates, setWeatherUpdates] = useState(null)
  const [barangayName, setBarangayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [fetchingWeather, setFetchingWeather] = useState(false)
  const barangayId = user?.barangay

  const fetchData = useCallback(() => {
    if (!barangayId) {
      window.setTimeout(() => setLoading(false), 0)
      return
    }
    Promise.all([
      api.get(`/schedules/?barangay=${barangayId}`),
      api.get('/barangays/'),
      api.get(`/weather/tomorrow-recommendation/?barangay=${barangayId}`).catch(() => ({ data: null })),
      api.get(`/weather/updates/?barangay=${barangayId}`).catch(() => ({ data: null })),
    ]).then(([scheduleRes, barangayRes, recommendationRes, weatherUpdateRes]) => {
      setSchedules(scheduleRes.data)
      setRecommendation(recommendationRes.data)
      setWeatherUpdates(weatherUpdateRes.data)
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
      waste_types: [schedule.waste_type],
      collection_day: schedule.collection_day,
      collection_time: schedule.collection_time,
      frequency: schedule.frequency,
      calendar_sync_enabled: schedule.calendar_sync_enabled !== false,
    })
    setShowModal(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (!form.waste_types.length) {
      toast.error('Select at least one waste type.')
      return
    }
    setSaving(true)
    try {
      const { waste_types, ...scheduleForm } = form
      if (editingSchedule) {
        const payload = { ...scheduleForm, waste_type: waste_types[0], barangay: barangayId }
        await api.put(`/schedules/${editingSchedule.id}/`, payload)
        toast.success('Schedule updated.')
      } else {
        await Promise.all(waste_types.map(wasteType => api.post('/schedules/', {
          ...scheduleForm,
          waste_type: wasteType,
          barangay: barangayId,
        })))
        toast.success(waste_types.length === 1 ? 'Schedule created.' : 'Schedules created.')
      }
      setShowModal(false)
      setForm(EMPTY_FORM)
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

  const openReschedule = () => {
    const date = new Date()
    date.setDate(date.getDate() + 2)
    setRescheduleDate(date.toISOString().slice(0, 10))
    setRescheduleOpen(true)
  }

  const handleWeatherAction = async (action, selectedDate = null) => {
    if (!recommendation?.schedules?.length) {
      toast.error('No collection schedule for tomorrow.')
      return
    }

    try {
      await Promise.all(recommendation.schedules.map(schedule => api.post(`/schedules/${schedule.id}/weather-action/`, {
        action,
        weather_recommendation: recommendation.weather.recommendation,
        ...(selectedDate ? { reschedule_date: selectedDate } : {}),
      })))
      toast.success('Tomorrow schedule updated.')
      setRescheduleOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update tomorrow schedule.')
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
          </div>
        </div>
      </section>

      <div className="page-inner">
        <div className="stats-grid">
          {[
            { label: 'Total schedules', value: schedules.length },
            { label: 'Barangay', value: barangayName || '-' },
          ].map(item => (
            <div key={item.label} className="stat-card">
              <div className="stat-value" style={{ fontSize: item.label === 'Barangay' ? 20 : 28 }}>{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <WeatherUpdates updates={weatherUpdates} title="Barangay Weather Updates" />

        {recommendation?.weather && (
          <section className="card weather-panel">
            <div className="section-header">
              <div>
                <h2 className="section-title">Tomorrow Weather</h2>
                <p className="section-copy">
                  Review the forecast before confirming tomorrow's collection plan.
                </p>
              </div>
              <span className={`badge ${recommendation.weather.recommendation === 'cancel' ? 'badge-red' : recommendation.weather.recommendation === 'postpone' ? 'badge-amber' : 'badge-green'}`}>
                {recommendation.weather.recommendation === 'cancel' ? 'Cancel collection' : recommendation.weather.recommendation === 'postpone' ? 'Postpone collection' : 'Continue collection'}
              </span>
            </div>
            <div className="weather-metrics">
              <div className="weather-metric">
                <div className="metric-label">Condition</div>
                <div className="metric-value">{recommendation.weather.condition}</div>
              </div>
              <div className="weather-metric">
                <div className="metric-label">Rain chance</div>
                <div className="metric-value">{recommendation.weather.rain_probability}%</div>
              </div>
              <div className="weather-metric">
                <div className="metric-label">Expected rain</div>
                <div className="metric-value">{recommendation.weather.rain_volume_mm} mm</div>
              </div>
            </div>
            <p style={{ marginTop: 0, color: '#475569', fontSize: 14 }}>{recommendation.weather.reason}</p>
            <div className="decision-bar">
              <button type="button" onClick={() => handleWeatherAction('continue')} className="btn-inline primary">Continue</button>
              <button type="button" onClick={openReschedule} className="btn-inline blue">Reschedule</button>
              <button type="button" onClick={() => handleWeatherAction('cancel')} className="btn-danger" style={{ padding: '8px 14px' }}>Cancel</button>
            </div>
          </section>
        )}

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
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Waste Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {WASTE_OPTIONS.map(([value, label]) => {
                    const checked = form.waste_types.includes(value)
                    return (
                      <label key={value} className="surface" style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 10, cursor: 'pointer' }}>
                        <input
                          type={editingSchedule ? 'radio' : 'checkbox'}
                          name={editingSchedule ? 'waste_type' : undefined}
                          checked={checked}
                          onChange={e => {
                            const nextWasteTypes = editingSchedule
                              ? [value]
                              : e.target.checked
                              ? [...form.waste_types, value]
                              : form.waste_types.filter(wasteType => wasteType !== value)
                            setForm({ ...form, waste_types: nextWasteTypes })
                          }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              {[
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

      {rescheduleOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <h2 className="section-title" style={{ marginBottom: 8 }}>Choose New Collection Date</h2>
            <p className="section-copy" style={{ marginBottom: 18 }}>
              This will mark tomorrow's collection as postponed and show the new date to residents.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>New collection date</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={event => setRescheduleDate(event.target.value)}
              className="input"
              style={{ marginBottom: 22 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setRescheduleOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button
                type="button"
                onClick={() => handleWeatherAction('reschedule', rescheduleDate)}
                disabled={!rescheduleDate}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
