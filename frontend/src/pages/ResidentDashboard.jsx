import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ScheduleTable from '../components/ScheduleTable'
import WeatherAlertBanner from '../components/WeatherAlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.barangay) { setLoading(false); return }
    Promise.all([
      api.get(`/schedules/?barangay=${user.barangay}`),
      api.get(`/weather/alerts/?barangay=${user.barangay}`),
      api.get('/notifications/'),
    ]).then(([s, a, n]) => {
      setSchedules(s.data)
      setAlerts(a.data)
      setNotifications(n.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingSpinner />

  const latestAlert = alerts[0] || null
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Top banner */}
      <div style={{ background: 'linear-gradient(135deg, #0a1f0f, #14532d)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{today}</p>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: 'white', margin: '0 0 6px' }}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#86efac', margin: 0 }}>
            Here's your barangay's waste collection schedule and weather alerts.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Collection Schedules', value: schedules.length, icon: '📋', color: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Weather Alerts', value: alerts.length, icon: '🌧️', color: '#eff6ff', border: '#bfdbfe' },
            { label: 'Notifications', value: notifications.length, icon: '🔔', color: '#fefce8', border: '#fde68a' },
          ].map(({ label, value, icon, color, border }) => (
            <div key={label} className="card" style={{ padding: '20px 22px', background: color, borderColor: border }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Serif Display, serif' }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Weather alert */}
        <WeatherAlertBanner alert={latestAlert} />

        {/* No barangay warning */}
        {!user?.barangay && (
          <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: '#92400e', margin: 0 }}>
              ⚠️ <strong>No barangay assigned.</strong> Please contact your barangay administrator to be assigned to a barangay.
            </p>
          </div>
        )}

        {/* Schedule */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#0f172a', margin: '0 0 6px' }}>
            Collection Schedule
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>
            Your barangay's current waste collection timetable
          </p>
          <ScheduleTable schedules={schedules} canEdit={false} />
        </div>

        {/* Recent notifications */}
        {notifications.length > 0 && (
          <div className="card" style={{ padding: 28, marginTop: 20 }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#0f172a', margin: '0 0 20px' }}>Recent Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#f8fafc', borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{n.status === 'sent' ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 13, color: '#334155' }}>Weather alert notification</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(n.sent_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}