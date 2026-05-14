// src/components/TopBar.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function TopBar({ title, subtitle }) {
  const { user } = useAuth()
  const [showNotif, setShowNotif] = useState(false)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

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

        {/* Notification bell */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          style={{
            position: 'relative',
            background: 'var(--green-light)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          🔔
          <span style={{
            position: 'absolute',
            top: 4, right: 4,
            width: 8, height: 8,
            background: 'var(--danger)',
            borderRadius: '50%',
            border: '2px solid white',
          }} />
        </button>

        {/* Avatar */}
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
            width: 300,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
              Notifications
            </div>
            <div style={{ padding: 16 }}>
              <NotifItem
                icon="🌧️"
                title="Weather Alert"
                msg="Rain expected tomorrow in Zone 3 — check collection schedule"
                time="Just now"
                color="#fee2e2"
              />
              <NotifItem
                icon="🗑️"
                title="Collection Tomorrow"
                msg="Barangay 12 collection scheduled for 7:00 AM"
                time="1h ago"
                color="#f0fdf4"
              />
              <NotifItem
                icon="✅"
                title="Collection Complete"
                msg="Zone 5 collection completed successfully"
                time="Yesterday"
                color="#f0fdf4"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function NotifItem({ icon, title, msg, time, color }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, background: color, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3 }}>{msg}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, opacity: 0.7 }}>{time}</div>
      </div>
    </div>
  )
}
