// src/components/TopBar.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationsRead } from '../services/api'

export default function TopBar({ title, subtitle }) {
  const { user } = useAuth()
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState('')

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const unreadCount = notifications.filter(item => !item.is_read).length

  const loadNotifications = async () => {
    if (!user) {
      setNotifications([])
      return
    }

    setLoadingNotifications(true)
    setNotificationError('')
    try {
      const { data } = await getNotifications()
      const items = Array.isArray(data) ? data : []
      setNotifications(items)
      return items
    } catch {
      setNotificationError('Notifications unavailable')
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.id])

  const handleNotificationToggle = async () => {
    const nextShow = !showNotif
    setShowNotif(nextShow)
    if (!nextShow) return

    const items = await loadNotifications()
    const hasUnread = (items || notifications).some(item => !item.is_read)
    if (hasUnread) {
      try {
        await markNotificationsRead()
        setNotifications(items => items.map(item => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })))
      } catch {
        // Keep unread markers when the backend cannot update them.
      }
    }
  }

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle || dateStr}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'none' }} className="md:block">{dateStr}</span>

        <button
          onClick={handleNotificationToggle}
          title="Notifications"
          style={{
            position: 'relative',
            background: 'var(--green-light)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--green-dark)',
          }}
        >
          Bell
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              background: 'var(--danger)',
              borderRadius: 999,
              border: '2px solid white',
              color: 'white',
              fontSize: 9,
              fontWeight: 800,
              lineHeight: '12px',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, var(--green-primary), var(--green-dark))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}>
          {(user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()}
        </div>

        {showNotif && (
          <div style={{
            position: 'absolute',
            top: 64, right: 28,
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 14,
            width: 320,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              Notifications
            </div>
            <div style={{ padding: 16, maxHeight: 360, overflowY: 'auto' }}>
              {loadingNotifications ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>Loading notifications...</div>
              ) : notificationError ? (
                <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center', padding: '12px 0' }}>{notificationError}</div>
              ) : notifications.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>No notifications yet</div>
              ) : (
                notifications.slice(0, 8).map(item => (
                  <NotifItem
                    key={item.id}
                    category={item.category}
                    title={item.title}
                    msg={item.message}
                    time={formatNotificationTime(item.sent_at)}
                    unread={!item.is_read}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function NotifItem({ category, title, msg, time, unread }) {
  const isWeather = category === 'weather'
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 36,
        height: 36,
        background: isWeather ? '#fee2e2' : '#f0fdf4',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 800,
        color: isWeather ? '#991b1b' : '#166534',
        flexShrink: 0,
      }}>
        {isWeather ? 'WX' : 'SCH'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflowWrap: 'anywhere' }}>{title}</span>
          {unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{msg}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, opacity: 0.7 }}>{time}</div>
      </div>
    </div>
  )
}

function formatNotificationTime(value) {
  if (!value) return ''
  const sentAt = new Date(value)
  if (Number.isNaN(sentAt.getTime())) return ''

  const diffMs = Date.now() - sentAt.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return sentAt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
