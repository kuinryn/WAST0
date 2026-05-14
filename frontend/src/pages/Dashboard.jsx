// src/pages/Dashboard.jsx
// Role-aware dashboard summaries for admins, barangay officials, and residents.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import WeatherWidget from '../components/WeatherWidget'
import { getBarangays, getSchedules, getUsers } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatClock } from '../utils/format'

const WASTE_ICONS = {
  biodegradable: 'B',
  non_biodegradable: 'N',
  residual: 'R',
  hazardous: 'H',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function formatWasteType(type = '') {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function StatCard({ card, loading, onClick, index }) {
  const content = (
    <>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: card.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, marginBottom: 12,
        color: card.color, fontWeight: 900,
      }}>
        {card.icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>
        {loading ? '...' : card.value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{card.label}</div>
    </>
  )

  if (onClick) {
    return (
      <button
        className="card animate-fade-in"
        onClick={onClick}
        style={{
          padding: '18px 20px',
          animationDelay: `${index * 0.07}s`,
          border: '1px solid var(--border)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '18px 20px', animationDelay: `${index * 0.07}s` }}>
      {content}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState([])
  const [barangays, setBarangays] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [barangaySearch, setBarangaySearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')

  useEffect(() => {
    const requests = user?.role === 'super_admin'
      ? [
          getBarangays().catch(() => ({ data: [] })),
          getUsers().catch(() => ({ data: [] })),
        ]
      : user?.role === 'official'
        ? [
            getSchedules(user?.barangay ? { barangay: user.barangay } : {}).catch(() => ({ data: [] })),
            getUsers().catch(() => ({ data: [] })),
          ]
      : [
          getSchedules(user?.barangay ? { barangay: user.barangay } : {}).catch(() => ({ data: [] })),
          Promise.resolve({ data: [] }),
        ]

    Promise.all(requests).then(([firstRes, secondRes]) => {
      if (user?.role === 'super_admin') {
        setBarangays(Array.isArray(firstRes.data) ? firstRes.data : [])
        setUsers(Array.isArray(secondRes.data) ? secondRes.data : [])
        setSchedules([])
      } else {
        setSchedules(Array.isArray(firstRes.data) ? firstRes.data : [])
        setUsers(Array.isArray(secondRes.data) ? secondRes.data : [])
        setBarangays([])
      }
    }).finally(() => setLoading(false))
  }, [user])

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long' })
  const todaySchedules = schedules.filter(s => s.collection_day === today)
  const scopedResidents = users.filter(item => (
    item.role === 'resident'
    && (user?.role !== 'official' || String(item.barangay || '') === String(user?.barangay || ''))
  ))
  const allResidents = users.filter(item => item.role === 'resident')
  const activeBarangays = barangays.filter(barangay => barangay.official_status === 'Active')
  const districts = useMemo(() => (
    [...new Set(barangays.map(barangay => barangay.district).filter(Boolean))]
  ), [barangays])
  const filteredActiveBarangays = activeBarangays.filter(barangay => {
    if (districtFilter && barangay.district !== districtFilter) return false
    if (!barangaySearch) return true
    const q = barangaySearch.toLowerCase()
    return barangay.name?.toLowerCase().includes(q)
      || barangay.official_name?.toLowerCase().includes(q)
      || barangay.district?.toLowerCase().includes(q)
  })

  const statCards = user?.role === 'super_admin'
    ? [
        { label: 'Active Barangays', value: activeBarangays.length, icon: 'AB', color: '#4caf74', bg: '#e8f5ee' },
        { label: 'Total Residents', value: allResidents.length, icon: 'TR', color: '#0369a1', bg: '#e0f2fe' },
        { label: 'All Barangays', value: barangays.length, icon: 'BG', color: '#7c3aed', bg: '#ede9fe', onClick: () => navigate('/schedules') },
      ]
    : user?.role === 'official' ? [
        { label: 'Total Residents', value: scopedResidents.length, icon: 'TR', color: '#4caf74', bg: '#e8f5ee' },
        { label: "Today's Collections", value: todaySchedules.length, icon: 'TC', color: '#059669', bg: '#d1fae5' },
        { label: 'Barangay', value: user?.barangay_name || '-', icon: 'BG', color: '#0369a1', bg: '#e0f2fe' },
      ] : [
        { label: 'Total Schedules', value: schedules.length, icon: 'TS', color: '#4caf74', bg: '#e8f5ee' },
        { label: "Today's Collections", value: todaySchedules.length, icon: 'TC', color: '#059669', bg: '#d1fae5' },
        { label: 'Barangay', value: user?.barangay_name || '-', icon: 'BG', color: '#0369a1', bg: '#e0f2fe' },
      ]

  const todayScheduleCard = (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--charcoal)' }}>Today's Schedule</h3>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{today}</span>
      </div>
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
          <div className="spinner-dark" style={{ margin: '0 auto 10px' }} /> Loading...
        </div>
      ) : todaySchedules.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No schedule today</div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Waste Type</th><th>Day</th><th>Time</th><th>Frequency</th></tr></thead>
          <tbody>
            {todaySchedules.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{WASTE_ICONS[s.waste_type] || 'W'} {formatWasteType(s.waste_type)}</td>
                <td>{s.collection_day}</td>
                <td>{formatClock(s.collection_time)}</td>
                <td>{s.frequency === 'bi_weekly' ? 'Bi-weekly' : 'Weekly'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={user?.role === 'super_admin' ? 'System-wide barangay and resident overview' : 'Waste collection and resident overview'}
      />

      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="dashboard-summary-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {statCards.map((card, i) => (
                <StatCard key={card.label} card={card} loading={loading} onClick={card.onClick} index={i} />
              ))}
            </div>
            {user?.role !== 'super_admin' && todayScheduleCard}
          </div>
          {user?.role !== 'super_admin' && <WeatherWidget />}
        </div>

        {user?.role === 'super_admin' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-toolbar">
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--charcoal)' }}>List of Active Barangays</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{filteredActiveBarangays.length} active barangay{filteredActiveBarangays.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input className="input-field" placeholder="Search barangay or official..." value={barangaySearch} onChange={e => setBarangaySearch(e.target.value)} style={{ width: 260 }} />
                <select className="input-field" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} style={{ width: 180 }}>
                  <option value="">All districts</option>
                  {districts.map(district => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                <div className="spinner-dark" style={{ margin: '0 auto 10px' }} /> Loading...
              </div>
            ) : filteredActiveBarangays.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No active barangays match your filters.</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Barangay</th><th>District</th><th>Official</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredActiveBarangays.map(barangay => (
                    <tr key={barangay.id}>
                      <td style={{ fontWeight: 700 }}>{barangay.name}</td>
                      <td style={{ color: 'var(--muted)' }}>{barangay.district || '-'}</td>
                      <td>{barangay.official_name || '-'}</td>
                      <td><span className="badge badge-green">Active account</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
