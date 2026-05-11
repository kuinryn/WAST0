import { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const WASTE_COLORS = {
  biodegradable: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' },
  non_biodegradable: { bg: '#fefce8', border: '#fde68a', text: '#a16207', dot: '#eab308' },
  residual: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', dot: '#94a3b8' },
  hazardous: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
}

const WASTE_EMOJIS = {
  biodegradable: '♻️',
  non_biodegradable: '🗑️',
  residual: '🪣',
  hazardous: '⚠️',
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function buildGoogleCalendarUrl(schedule) {
  const label = schedule.waste_type.replace('_', ' ')
  const emoji = WASTE_EMOJIS[schedule.waste_type] || '🗑️'
  const barangay = schedule.barangay_name || ''

  // Find next occurrence of the collection day
  const dayIndex = DAY_ORDER.indexOf(schedule.collection_day)
  const today = new Date()
  const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1 // 0=Mon
  let daysAhead = dayIndex - todayDay
  if (daysAhead <= 0) daysAhead += 7
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + daysAhead)

  const [hh, mm] = (schedule.collection_time || '08:00').split(':')
  startDate.setHours(parseInt(hh), parseInt(mm), 0, 0)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const rruleDays = { Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH', Friday: 'FR', Saturday: 'SA', Sunday: 'SU' }
  const freq = schedule.frequency === 'bi_weekly' ? 'WEEKLY;INTERVAL=2' : 'WEEKLY'
  const rrule = `RRULE:FREQ=${freq};BYDAY=${rruleDays[schedule.collection_day]}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${emoji} ${label.charAt(0).toUpperCase() + label.slice(1)} Collection — Brgy. ${barangay}`,
    dates: `${fmt(startDate)}/${fmt(endDate)}`,
    details: `Waste Type: ${label}\nBarangay: ${barangay}\nFrequency: ${schedule.frequency.replace('_', '-')}\n\nManaged by WaST0`,
    recur: rrule,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function ICalButton({ scheduleId, barangayId, variant = 'single' }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const url =
        variant === 'all'
          ? `/schedules/barangay/${barangayId}/ical/`
          : `/schedules/${scheduleId}/ical/`
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/calendar' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = variant === 'all' ? 'wasto-all-schedules.ics' : 'wasto-schedule.ics'
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Calendar file downloaded!')
    } catch {
      toast.error('Could not download calendar file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download .ics for Apple Calendar, Outlook, etc."
      style={{
        padding: '5px 10px', borderRadius: 7,
        border: '1px solid #d1d5db',
        background: '#f9fafb', color: '#374151',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '⏳' : '📅'} .ics
    </button>
  )
}

function SyncButton({ scheduleId, onSynced }) {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    try {
      await api.post(`/schedules/${scheduleId}/sync/`)
      toast.success('Synced to Google Calendar!')
      if (onSynced) onSynced()
    } catch (e) {
      const msg = e?.response?.data?.error || 'Sync failed. Check Google service account config.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      title="Sync this schedule to your connected Google Calendar"
      style={{
        padding: '5px 10px', borderRadius: 7,
        border: '1px solid #bfdbfe',
        background: '#eff6ff', color: '#1d4ed8',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '⏳' : '🗓️'} Sync
    </button>
  )
}

export default function ScheduleTable({ schedules, onEdit, onDelete, onRefresh, canEdit }) {
  if (!schedules || schedules.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>No schedules found for this barangay.</p>
      </div>
    )
  }

  const sorted = [...schedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.collection_day) - DAY_ORDER.indexOf(b.collection_day)
  )

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #f1f5f9' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
            {['Waste Type', 'Day', 'Time', 'Frequency', 'Calendar'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '10px 16px',
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
            {canEdit && (
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const colors = WASTE_COLORS[s.waste_type] || WASTE_COLORS.residual
            const emoji = WASTE_EMOJIS[s.waste_type] || '🗑️'
            const gcalUrl = buildGoogleCalendarUrl(s)

            return (
              <tr key={s.id}
                style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Waste Type */}
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    color: colors.text, fontWeight: 600, fontSize: 12,
                  }}>
                    <span>{emoji}</span>
                    {s.waste_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </td>

                {/* Day */}
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                  {s.collection_day}
                </td>

                {/* Time */}
                <td style={{ padding: '12px 16px', color: '#374151' }}>
                  {(() => {
                    try {
                      const [h, m] = s.collection_time.split(':')
                      const d = new Date()
                      d.setHours(parseInt(h), parseInt(m))
                      return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
                    } catch { return s.collection_time }
                  })()}
                </td>

                {/* Frequency */}
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {s.frequency === 'bi_weekly' ? 'Bi-Weekly' : 'Weekly'}
                </td>

                {/* Calendar actions */}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Add to Google Calendar (opens google.com) */}
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Add this recurring schedule to your Google Calendar"
                      style={{
                        padding: '5px 10px', borderRadius: 7,
                        border: '1px solid #fecdd3',
                        background: '#fff1f2', color: '#e11d48',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#e11d48" strokeWidth="2"/>
                        <line x1="3" y1="9" x2="21" y2="9" stroke="#e11d48" strokeWidth="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="#e11d48" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="#e11d48" strokeWidth="2"/>
                      </svg>
                      Google Cal
                    </a>

                    {/* Download .ics */}
                    <ICalButton scheduleId={s.id} variant="single" />

                    {/* Server-side sync (official/admin only) */}
                    {canEdit && (
                      <SyncButton scheduleId={s.id} onSynced={onRefresh} />
                    )}

                    {/* Sync status indicator */}
                    {s.has_calendar_event && (
                      <span title={`Synced${s.last_synced_at ? ': ' + new Date(s.last_synced_at).toLocaleString('en-PH') : ''}`}
                        style={{ fontSize: 14, cursor: 'help' }}>✅</span>
                    )}
                  </div>
                </td>

                {/* Edit/Delete (official/admin only) */}
                {canEdit && (
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => onEdit(s)}
                        style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        Edit
                      </button>
                      <button onClick={() => onDelete(s)}
                        style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Named export for barangay-wide .ics download
export function BarangayICalButton({ barangayId, barangayName }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/schedules/barangay/${barangayId}/ical/`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/calendar' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `wasto-${barangayName || 'barangay'}-schedules.ics`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('All schedules downloaded as .ics!')
    } catch {
      toast.error('Could not download calendar file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download all schedules as .ics for Apple Calendar, Outlook, etc."
      style={{
        padding: '9px 16px', borderRadius: 10,
        border: '1.5px solid #d1d5db',
        background: 'white', color: '#374151',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '⏳' : '📅'} Export .ics
    </button>
  )
}
