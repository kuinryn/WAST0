// src/pages/Reports.jsx
// Integrated: v2 design + v1 backend schedule data
import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import { getSchedules } from '../services/api'
import { useAuth } from '../context/AuthContext'

const WASTE_ICONS = {
  biodegradable: { icon: '♻️', label: 'Biodegradable', color: '#065f46', bg: '#d1fae5' },
  non_biodegradable: { icon: '🗑️', label: 'Non-Biodegradable', color: '#92400e', bg: '#fef3c7' },
  residual: { icon: '🪣', label: 'Residual', color: '#374151', bg: '#f3f4f6' },
  hazardous: { icon: '⚠️', label: 'Hazardous', color: '#991b1b', bg: '#fee2e2' },
}

export default function Reports() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = user?.barangay ? { barangay: user.barangay } : {}
    getSchedules(params).then(r => setSchedules(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  // Compute breakdowns
  const byType = {}
  const byDay = {}
  schedules.forEach(s => {
    byType[s.waste_type] = (byType[s.waste_type] || 0) + 1
    byDay[s.collection_day] = (byDay[s.collection_day] || 0) + 1
  })

  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="📊 Reports" subtitle="Schedule analytics and summaries" />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Total Schedules', value: schedules.length, icon: '📅', color: '#4caf74', bg: '#e8f5ee' },
            { label: 'Weekly', value: schedules.filter(s => s.frequency === 'weekly').length, icon: '🔄', color: '#0369a1', bg: '#e0f2fe' },
            { label: 'Bi-weekly', value: schedules.filter(s => s.frequency === 'bi_weekly').length, icon: '📆', color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Waste Types', value: Object.keys(byType).length, icon: '🗂️', color: '#d97706', bg: '#fef3c7' },
          ].map((c, i) => (
            <div key={i} className="card animate-fade-in" style={{ padding: '18px 20px', animationDelay: `${i * 0.07}s` }}>
              <div style={{ width: 38, height: 38, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{loading ? '…' : c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* By Waste Type */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>By Waste Type</h3>
            {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div> :
              Object.keys(WASTE_ICONS).filter(t => byType[t]).map(t => {
                const wt = WASTE_ICONS[t]
                const count = byType[t] || 0
                const pct = schedules.length ? Math.round(count / schedules.length * 100) : 0
                return (
                  <div key={t} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{wt.icon} {wt.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: wt.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })
            }
            {!loading && Object.keys(byType).length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No data</p>}
          </div>

          {/* By Day */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>By Collection Day</h3>
            {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div> :
              DAYS_ORDER.filter(d => byDay[d]).map(d => {
                const count = byDay[d] || 0
                const pct = schedules.length ? Math.round(count / schedules.length * 100) : 0
                return (
                  <div key={d} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green-primary)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })
            }
            {!loading && Object.keys(byDay).length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No data</p>}
          </div>
        </div>

      </main>
    </div>
  )
}
