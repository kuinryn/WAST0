import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import api from '../api/axios'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import WeatherAlertBanner from '../components/WeatherAlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    if (!user?.barangay) {
      const timeout = window.setTimeout(() => {
        if (isMounted) setLoading(false)
      }, 0)
      return () => {
        isMounted = false
        window.clearTimeout(timeout)
      }
    }
    Promise.all([
      api.get(`/schedules/?barangay=${user.barangay}`),
      api.get(`/weather/alerts/?barangay=${user.barangay}`),
      api.get('/notifications/'),
    ]).then(([scheduleRes, alertRes, notificationRes]) => {
      if (!isMounted) return
      setSchedules(scheduleRes.data)
      setAlerts(alertRes.data)
      setNotifications(notificationRes.data)
    }).catch(() => {}).finally(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [user])

  if (loading) return <LoadingSpinner />

  const latestAlert = alerts[0] || null
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="hero-inner">
          <div>
            <p className="eyebrow">{today}</p>
            <h1 className="hero-title">Hello, {user?.name?.split(' ')[0] || 'Resident'}</h1>
            <p className="hero-copy">Your collection schedule, local weather alerts, and notification history in one place.</p>
          </div>
        </div>
      </section>

      <div className="page-inner">
        <div className="stats-grid">
          {[
            { label: 'Schedules', value: schedules.length },
            { label: 'Weather alerts', value: alerts.length },
            { label: 'Notifications', value: notifications.length },
          ].map(item => (
            <div key={item.label} className="stat-card">
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <WeatherAlertBanner alert={latestAlert} />

        {!user?.barangay && (
          <div className="surface" style={{ padding: 18, marginBottom: 22, background: '#fefce8', borderColor: '#fde68a' }}>
            <p style={{ color: '#92400e', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              <strong>No barangay assigned.</strong> Please contact your barangay administrator so schedules can appear here.
            </p>
          </div>
        )}

        <section className="card" style={{ padding: 24 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Collection Schedule</h2>
              <p className="section-copy">Your barangay's current waste collection timetable.</p>
            </div>
            {user?.barangay && schedules.length > 0 && (
              <BarangayICalButton barangayId={user.barangay} barangayName={user.barangay_name || ''} />
            )}
          </div>
          <ScheduleTable schedules={schedules} canEdit={false} />
        </section>

        {notifications.length > 0 && (
          <section className="card" style={{ padding: 24, marginTop: 18 }}>
            <div className="section-header">
              <h2 className="section-title">Recent Notifications</h2>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {notifications.slice(0, 5).map(notification => (
                <div key={notification.id} className="surface" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>Weather alert notification</span>
                  <span className={`badge ${notification.status === 'sent' ? 'badge-green' : 'badge-red'}`}>{notification.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
