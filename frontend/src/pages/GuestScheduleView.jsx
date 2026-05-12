import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import WeatherAlertBanner from '../components/WeatherAlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/useAuth'

export default function GuestScheduleView() {
  const { user } = useAuth()
  const [barangays, setBarangays] = useState([])
  const [selectedBarangay, setSelectedBarangay] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [schedules, setSchedules] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/barangays/').then(res => setBarangays(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBarangay) return
    const scheduleRequest = api.get(`/schedules/?barangay=${selectedBarangay}`)
    const alertRequest = user ? api.get(`/weather/alerts/?barangay=${selectedBarangay}`) : Promise.resolve({ data: [] })

    Promise.all([scheduleRequest, alertRequest])
      .then(([scheduleRes, alertRes]) => {
        setSchedules(scheduleRes.data)
        setAlerts(alertRes.data)
      })
      .catch(() => {
        setSchedules([])
        setAlerts([])
      })
      .finally(() => setLoading(false))
  }, [selectedBarangay, user])

  const handleSelectBarangay = (event) => {
    const nextBarangay = event.target.value
    setSelectedBarangay(nextBarangay)
    setLoading(!!nextBarangay)
    if (!nextBarangay) {
      setSchedules([])
      setAlerts([])
    }
    const barangay = barangays.find(item => item.id === nextBarangay)
    setSelectedName(barangay?.name || '')
  }

  const dashboardPath = user?.role === 'super_admin' ? '/admin' : user?.role === 'official' ? '/official' : '/dashboard'

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="hero-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ width: '100%', maxWidth: 680 }}>
            <p className="eyebrow" style={{ justifyContent: 'center' }}>Public schedule</p>
            <h1 className="hero-title">Waste Collection Schedules</h1>
            <p className="hero-copy" style={{ margin: '0 auto 24px' }}>
              Select a barangay to view its collection timetable and, when signed in, recent weather alerts.
            </p>
            <select value={selectedBarangay} onChange={handleSelectBarangay} className="input" style={{ maxWidth: 460, background: 'white' }}>
              <option value="">Select a barangay</option>
              {barangays.map(barangay => (
                <option key={barangay.id} value={barangay.id}>{barangay.name} - {barangay.district}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div style={{ background: user ? '#eff6ff' : '#fefce8', borderBottom: `1px solid ${user ? '#bfdbfe' : '#fde68a'}`, padding: '12px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: user ? '#1e40af' : '#92400e', margin: 0 }}>
            {user ? `Signed in as ${user.name || user.email}.` : 'Register as a resident to receive weather-aware schedule updates.'}
          </p>
          <Link to={user ? dashboardPath : '/register'} className={`btn-inline ${user ? 'blue' : 'primary'}`} style={{ padding: '7px 13px' }}>
            {user ? 'Go to dashboard' : 'Register free'}
          </Link>
        </div>
      </div>

      <div className="page-inner">
        {!selectedBarangay ? (
          <div className="empty-state">
            <strong>Select a barangay</strong>
            Choose from the dropdown above to see collection schedules.
          </div>
        ) : loading ? (
          <LoadingSpinner label="Loading schedules..." />
        ) : (
          <>
            <div className="section-header">
              <div>
                <h2 className="section-title">Barangay {selectedName}</h2>
                <p className="section-copy">{schedules.length} active collection schedule{schedules.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {schedules.length > 0 && (
                  <BarangayICalButton barangayId={selectedBarangay} barangayName={selectedName} />
                )}
                {!user && <Link to="/register" className="btn-inline primary">Get weather alerts</Link>}
              </div>
            </div>

            <WeatherAlertBanner alert={alerts[0]} />

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{schedules.length}</div>
                <div className="stat-label">Schedules</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{user ? alerts.length : '-'}</div>
                <div className="stat-label">Weather alerts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 20 }}>{selectedName}</div>
                <div className="stat-label">Selected barangay</div>
              </div>
            </div>

            <ScheduleTable schedules={schedules} canEdit={false} />
          </>
        )}
      </div>
    </div>
  )
}
