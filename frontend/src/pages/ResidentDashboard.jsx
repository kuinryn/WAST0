import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import api from '../api/axios'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import WeatherAlertBanner, { WeatherUpdates } from '../components/WeatherAlertBanner'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [weatherUpdates, setWeatherUpdates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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
      api.get(`/weather/updates/?barangay=${user.barangay}`).catch(() => ({ data: null })),
    ]).then(([scheduleRes, alertRes, notificationRes, weatherUpdateRes]) => {
      if (!isMounted) return
      setSchedules(scheduleRes.data)
      setAlerts(alertRes.data)
      setNotifications(notificationRes.data)
      setWeatherUpdates(weatherUpdateRes.data)
    }).catch(() => {}).finally(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [user])

  if (loading) return <LoadingSpinner />

  const latestAlert = alerts[0] || null
  const unreadNotifications = notifications.filter(notification => !notification.is_read)
  const unreadCount = unreadNotifications.length
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const openNotifications = () => {
    setNotificationsOpen(true)
  }

  const markNotificationRead = async (notificationId) => {
    const readAt = new Date().toISOString()
    setNotifications(current => current.map(notification => (
      notification.id === notificationId ? { ...notification, is_read: true, read_at: readAt } : notification
    )))

    try {
      await api.post('/notifications/mark-read/', { notification_id: notificationId })
    } catch {
      setNotifications(current => current.map(notification => (
        notification.id === notificationId ? { ...notification, is_read: false, read_at: null } : notification
      )))
    }
  }

  const markAllNotificationsRead = async () => {
    if (!unreadCount) return

    const readAt = new Date().toISOString()
    setNotifications(current => current.map(notification => (
      notification.is_read ? notification : { ...notification, is_read: true, read_at: readAt }
    )))

    try {
      await api.post('/notifications/mark-read/', {})
    } catch {
      setNotifications(current => current.map(notification => (
        notification.read_at === readAt ? { ...notification, is_read: false, read_at: null } : notification
      )))
    }
  }

  const removeNotification = async (notificationId) => {
    const previous = notifications
    setNotifications(current => current.filter(notification => notification.id !== notificationId))

    try {
      await api.delete(`/notifications/${notificationId}/`)
    } catch {
      setNotifications(previous)
    }
  }

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
          <div className="stat-card">
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Schedules</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{weatherUpdates?.days?.[0]?.weather_type || 'Weather'}</div>
            <div className="stat-label">Today</div>
          </div>
          <button type="button" className="stat-card stat-card-button" onClick={openNotifications}>
            <div className="stat-value">{unreadCount}</div>
            <div className="stat-label">Unread notifications</div>
          </button>
        </div>

        <WeatherAlertBanner alert={latestAlert} />
        <WeatherUpdates updates={weatherUpdates} />

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

      </div>

      {notificationsOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-panel notification-modal">
            <div className="section-header">
              <div>
                <h2 className="section-title">Notifications</h2>
                <p className="section-copy">{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {unreadCount > 0 && (
                  <button type="button" className="btn-inline subtle" onClick={markAllNotificationsRead}>Mark all read</button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setNotificationsOpen(false)}>Close</button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">
                <strong>No notifications yet</strong>
                Schedule updates and weather alerts will appear here.
              </div>
            ) : (
              <div className="notification-list notification-modal-list">
                {notifications.map(notification => (
                  <div key={notification.id} className={`surface notification-item ${notification.is_read ? 'is-read' : 'is-unread'}`}>
                    <div>
                      <span className="notification-title">
                        {notification.title || 'Wasto notification'}
                        <span className={`badge ${notification.is_read ? 'badge-slate' : 'badge-amber'}`}>
                          {notification.is_read ? 'Read' : 'Unread'}
                        </span>
                      </span>
                      {notification.message && <span className="notification-message">{notification.message}</span>}
                      <span className="notification-meta">
                        {notification.sent_at ? new Date(notification.sent_at).toLocaleString('en-PH') : 'Delivery time unavailable'}
                      </span>
                    </div>
                    <div className="notification-actions">
                      <span className={`badge ${notification.category === 'schedule' ? 'badge-blue' : 'badge-green'}`}>
                        {notification.category || 'weather'}
                      </span>
                      {notification.is_read ? (
                        <button
                          type="button"
                          className="notification-remove"
                          onClick={() => removeNotification(notification.id)}
                          aria-label="Remove notification"
                        >
                          x
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-inline subtle"
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
