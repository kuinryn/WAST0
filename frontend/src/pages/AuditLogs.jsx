import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getAuditLogs } from '../services/api'
import { formatDateTime } from '../utils/format'

const ACTION_STYLE = {
  POST: { bg: '#d1fae5', color: '#065f46' },
  PUT: { bg: '#e0f2fe', color: '#0369a1' },
  PATCH: { bg: '#e0f2fe', color: '#0369a1' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterResource, setFilterResource] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    getAuditLogs()
      .then(response => setLogs(Array.isArray(response.data) ? response.data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const resources = [...new Set(logs.map(log => log.resource || log.target_table).filter(Boolean))]
  const actions = [...new Set(logs.map(log => log.action).filter(Boolean))]
  const filtered = logs.filter(log => {
    const resource = log.resource || log.target_table || ''
    const date = log.date || (log.performed_at ? new Date(log.performed_at).toISOString().split('T')[0] : '')
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (filterResource !== 'all' && resource !== filterResource) return false
    if (filterDate && date !== filterDate) return false
    if (!search) return true
    const query = search.toLowerCase()
    return [log.user_name, resource, log.detail, log.target_id].filter(Boolean).join(' ').toLowerCase().includes(query)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="Audit Logs" subtitle="System activity and change history" />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="input-field" placeholder="Search user or resource..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          <select className="input-field" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="all">All actions</option>
            {actions.map(action => <option key={action} value={action}>{action}</option>)}
          </select>
          <select className="input-field" value={filterResource} onChange={e => setFilterResource(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="all">All resources</option>
            {resources.map(resource => <option key={resource} value={resource}>{resource}</option>)}
          </select>
          <input className="input-field" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: 180 }} />
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{filtered.length} log{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading audit logs...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <p>{search || filterAction !== 'all' || filterResource !== 'all' || filterDate ? 'No logs match your filters' : 'No audit logs yet'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const style = ACTION_STYLE[log.action] || { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{log.user_name || '-'}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: style.bg, color: style.color }}>{log.action}</span></td>
                      <td style={{ fontSize: 12 }}>{log.resource || log.target_table || '-'}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{log.date || '-'}</td>
                      <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{log.time || formatDateTime(log.timestamp || log.performed_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
