import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const WASTE_BADGES = {
  biodegradable: 'badge-green',
  non_biodegradable: 'badge-amber',
  residual: 'badge-slate',
  hazardous: 'badge-red',
}

const WASTE_LABELS = {
  biodegradable: 'Biodegradable',
  non_biodegradable: 'Non-biodegradable',
  residual: 'Residual',
  hazardous: 'Hazardous',
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function formatCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildGoogleCalendarUrl(schedule) {
  const dayIndex = DAY_ORDER.indexOf(schedule.collection_day)
  const today = new Date()
  const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1
  let daysAhead = dayIndex - todayDay
  if (daysAhead <= 0) daysAhead += 7

  const startDate = new Date(today)
  startDate.setDate(today.getDate() + daysAhead)
  const [hours, minutes] = (schedule.collection_time || '08:00').split(':')
  startDate.setHours(Number(hours), Number(minutes), 0, 0)

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
  const rruleDays = { Monday: 'MO', Tuesday: 'TU', Wednesday: 'WE', Thursday: 'TH', Friday: 'FR', Saturday: 'SA', Sunday: 'SU' }
  const interval = schedule.frequency === 'bi_weekly' ? ';INTERVAL=2' : ''
  const wasteLabel = WASTE_LABELS[schedule.waste_type] || schedule.waste_type

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${wasteLabel} Collection - Barangay ${schedule.barangay_name || ''}`,
    dates: `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`,
    details: `Waste Type: ${wasteLabel}\nBarangay: ${schedule.barangay_name || ''}\nFrequency: ${schedule.frequency.replace('_', '-')}\n\nManaged by Wasto`,
    recur: `RRULE:FREQ=WEEKLY${interval};BYDAY=${rruleDays[schedule.collection_day]}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function ICalButton({ scheduleId }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/schedules/${scheduleId}/ical/`, { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([response.data], { type: 'text/calendar' }))
      link.download = 'wasto-schedule.ics'
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Calendar reminder downloaded.')
    } catch {
      toast.error('Could not download calendar reminder.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={loading} className="btn-inline" style={{ padding: '6px 12px' }}>
      {loading ? 'Downloading...' : 'Download reminder'}
    </button>
  )
}

function SyncButton({ scheduleId, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    try {
      await api.post(`/schedules/${scheduleId}/sync/`)
      toast.success('Schedule synced.')
      onRefresh?.()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not sync schedule.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleSync} disabled={loading} className="btn-inline blue" style={{ padding: '6px 12px' }}>
      {loading ? 'Syncing...' : 'Sync'}
    </button>
  )
}

export function BarangayICalButton({ barangayId, barangayName }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/schedules/barangay/${barangayId}/ical/`, { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([response.data], { type: 'text/calendar' }))
      link.download = `wasto-${barangayName || 'barangay'}-schedules.ics`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Calendar reminders downloaded.')
    } catch {
      toast.error('Could not download calendar reminders.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleDownload} disabled={loading} className="btn-inline blue">
      {loading ? 'Downloading...' : 'Download all reminders'}
    </button>
  )
}

export default function ScheduleTable({ schedules, onEdit, onDelete, onRefresh, canEdit }) {
  if (!schedules || schedules.length === 0) {
    return (
      <div className="empty-state">
        <strong>No schedules yet</strong>
        Collection schedules will appear here once they are added.
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Waste Type</th>
            <th>Collection Day</th>
            <th>Time</th>
            <th>Frequency</th>
            <th>Calendar</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>
                <span className={`badge ${WASTE_BADGES[schedule.waste_type] || 'badge-slate'}`}>
                  {WASTE_LABELS[schedule.waste_type] || schedule.waste_type}
                </span>
              </td>
              <td style={{ fontWeight: 700, color: '#0f172a' }}>{schedule.collection_day}</td>
              <td>{schedule.collection_time}</td>
              <td style={{ textTransform: 'capitalize' }}>{schedule.frequency.replace('_', '-')}</td>
              <td>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a
                    href={buildGoogleCalendarUrl(schedule)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-inline primary"
                    style={{ padding: '6px 12px', textDecoration: 'none' }}
                  >
                    Add to Google Calendar
                  </a>
                  <ICalButton scheduleId={schedule.id} />
                  {canEdit && <SyncButton scheduleId={schedule.id} onRefresh={onRefresh} />}
                  {schedule.has_calendar_event && <span className="badge badge-green">Synced</span>}
                </div>
              </td>
              {canEdit && (
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => onEdit(schedule)} className="btn-inline blue" style={{ padding: '6px 12px' }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => onDelete(schedule)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
