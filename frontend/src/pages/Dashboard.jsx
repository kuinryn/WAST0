// src/pages/Dashboard.jsx
// Integrated: v2 design + v1 backend API calls + role-aware content
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import WeatherWidget from '../components/WeatherWidget'
import { getSchedules, getAuditLogs, getUsers } from '../services/api'
import { useAuth } from '../context/AuthContext'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

// eslint-disable-next-line no-unused-vars
const STATUS_CONFIG = {
  collected: { label: 'Collected', bg: '#d1fae5', color: '#065f46', icon: '✅' },
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e', icon: '⏳' },
  missed: { label: 'Missed', bg: '#fee2e2', color: '#991b1b', icon: '❌' },
  scheduled: { label: 'Scheduled', bg: '#e0f2fe', color: '#0369a1', icon: '📅' },
}

const WASTE_ICONS = {
  biodegradable: '♻️',
  non_biodegradable: '🗑️',
  residual: '🪣',
  hazardous: '⚠️',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [userCount, setUserCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const queries = [
      getSchedules(user?.barangay ? { barangay: user.barangay } : {}).catch(() => ({ data: [] })),
    ]
    if (user?.role === 'super_admin') {
      queries.push(getAuditLogs().catch(() => ({ data: [] })))
      queries.push(getUsers().catch(() => ({ data: [] })))
    }
    Promise.all(queries).then(([schedRes, logsRes, usersRes]) => {
      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : [])
      if (logsRes) setRecentLogs(Array.isArray(logsRes.data) ? logsRes.data.slice(0, 5) : [])
      if (usersRes) setUserCount(Array.isArray(usersRes.data) ? usersRes.data.length : null)
    }).finally(() => setLoading(false))
  }, [user])

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long' })
  const todaySchedules = schedules.filter(s => s.collection_day === today)
  const totalSchedules = schedules.length

  const STAT_CARDS = [
    { label: 'Total Schedules', value: totalSchedules, icon: '📅', color: '#4caf74', bg: '#e8f5ee' },
    { label: "Today's Collections", value: todaySchedules.length, icon: '🗑️', color: '#059669', bg: '#d1fae5' },
    { label: 'Barangay', value: user?.barangay_name || (user?.role === 'super_admin' ? 'All' : '—'), icon: '🏘️', color: '#0369a1', bg: '#e0f2fe' },
    ...(userCount !== null ? [{ label: 'Total Users', value: userCount, icon: '👥', color: '#7c3aed', bg: '#ede9fe' }] : []),
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle="Here's what's happening with waste collection today"
      />

      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stats + Weather */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {STAT_CARDS.map((card, i) => (
              <div
                key={i}
                className="card animate-fade-in"
                style={{ padding: '18px 20px', animationDelay: `${i * 0.07}s` }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: card.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, marginBottom: 12,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>
                  {loading ? '…' : card.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>
          <WeatherWidget />
        </div>

        {/* Today's Schedules */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--charcoal)' }}>
              📅 {today}'s Collection Schedule
            </h3>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{todaySchedules.length} schedule{todaySchedules.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 10px' }} /> Loading…
            </div>
          ) : todaySchedules.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
              <p style={{ fontSize: 14 }}>No collections scheduled for today ({today})</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waste Type</th>
                  <th>Collection Day</th>
                  <th>Time</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {todaySchedules.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        {WASTE_ICONS[s.waste_type] || '🗑️'}
                        {s.waste_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td>{s.collection_day}</td>
                    <td>{s.collection_time?.slice(0, 5) || '—'}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: '#e8f5ee', color: 'var(--green-dark)',
                      }}>
                        {s.frequency === 'bi_weekly' ? 'Bi-weekly' : 'Weekly'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* All schedules summary */}
        {schedules.length > 0 && todaySchedules.length < schedules.length && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--charcoal)' }}>📋 All Active Schedules</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waste Type</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {schedules.slice(0, 8).map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>
                      {WASTE_ICONS[s.waste_type] || '🗑️'}{' '}
                      {s.waste_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </td>
                    <td>{s.collection_day}</td>
                    <td>{s.collection_time?.slice(0, 5) || '—'}</td>
                    <td>{s.frequency === 'bi_weekly' ? 'Bi-weekly' : 'Weekly'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Admin: recent audit logs */}
        {user?.role === 'super_admin' && recentLogs.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--charcoal)' }}>🕵️ Recent Activity</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Action</th><th>Resource</th><th>Time</th></tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{log.user || log.performed_by}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: '#e0f2fe', color: '#0369a1',
                      }}>{log.action}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{log.resource || log.model}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
