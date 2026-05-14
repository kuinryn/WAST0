// src/pages/AuditLogs.jsx
// Integrated: v2 design + v1 backend audit endpoint
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getAuditLogs } from '../services/api'

const ACTION_STYLE = {
  CREATE: { bg: '#d1fae5', color: '#065f46' },
  UPDATE: { bg: '#e0f2fe', color: '#0369a1' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
  LOGIN: { bg: '#ede9fe', color: '#5b21b6' },
  LOGOUT: { bg: '#f3f4f6', color: '#374151' },
  VIEW: { bg: '#fef3c7', color: '#92400e' },
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    getAuditLogs()
      .then(r => setLogs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    if (filterAction !== 'all' && l.action !== filterAction) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (l.user || l.performed_by || '')?.toLowerCase().includes(q) ||
        (l.detail || l.description || '')?.toLowerCase().includes(q) ||
        (l.resource || l.model || '')?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="📋 Audit Logs" subtitle="System activity and change history" />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input-field"
            placeholder="🔍 Search user, detail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <select className="input-field" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="all">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {filtered.length} log{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading audit logs…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <p>{search || filterAction !== 'all' ? 'No logs match your filters' : 'No audit logs yet'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Detail</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const as = ACTION_STYLE[log.action] || { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={log.id || i}>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {log.user || log.performed_by || '—'}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: as.bg, color: as.color }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.resource || log.model || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.detail || log.description || '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-PH', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        }) : '—'}
                      </td>
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
