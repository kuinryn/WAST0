import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getBarangays, getUsers } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Reports() {
  const { user } = useAuth()
  const [barangays, setBarangays] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [residentSearch, setResidentSearch] = useState('')

  useEffect(() => {
    Promise.all([
      getBarangays().catch(() => ({ data: [] })),
      getUsers().catch(() => ({ data: [] })),
    ]).then(([barangayRes, userRes]) => {
      setBarangays(Array.isArray(barangayRes.data) ? barangayRes.data : [])
      setUsers(Array.isArray(userRes.data) ? userRes.data : [])
    }).finally(() => setLoading(false))
  }, [user])

  const scopedBarangays = user?.role === 'official'
    ? barangays.filter(barangay => String(barangay.id) === String(user.barangay))
    : barangays
  const scopedUsers = user?.role === 'official'
    ? users.filter(item => String(item.barangay || '') === String(user.barangay || ''))
    : users
  const residents = scopedUsers.filter(item => item.role === 'resident')
  const activeBarangays = scopedBarangays.filter(barangay => barangay.official_status === 'Active')
  const residentsByBarangay = scopedBarangays.map(barangay => ({
    ...barangay,
    count: residents.filter(resident => String(resident.barangay || '') === String(barangay.id)).length,
  }))
  const filteredResidentsByBarangay = residentsByBarangay.filter(barangay => {
    if (!residentSearch) return true
    const q = residentSearch.toLowerCase()
    return barangay.name?.toLowerCase().includes(q)
      || barangay.district?.toLowerCase().includes(q)
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const maxResidents = Math.max(...filteredResidentsByBarangay.map(item => item.count), 1)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="Reports" subtitle="Barangay and resident summaries" />
      <main style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Active Barangays', value: activeBarangays.length, helper: `out of ${scopedBarangays.length} barangay${scopedBarangays.length !== 1 ? 's' : ''} listed`, color: '#4caf74', bg: '#e8f5ee' },
            { label: 'Registered Residents', value: residents.length, color: '#0369a1', bg: '#e0f2fe' },
          ].map((card, index) => (
            <div key={card.label} className="card animate-fade-in" style={{ padding: '18px 20px', animationDelay: `${index * 0.07}s` }}>
              <div style={{ width: 38, height: 38, background: card.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>#</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{loading ? '...' : card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{card.label}</div>
              {card.helper && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{loading ? '' : card.helper}</div>}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>Number of Residents per Barangay</h3>
            <input
              className="input-field"
              placeholder="Search barangay..."
              value={residentSearch}
              onChange={e => setResidentSearch(e.target.value)}
              style={{ maxWidth: 260 }}
            />
          </div>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
          ) : filteredResidentsByBarangay.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{residentSearch ? 'No barangays match your search' : 'No barangay data'}</p>
          ) : (
            filteredResidentsByBarangay.map(barangay => {
              const pct = Math.round((barangay.count / maxResidents) * 100)
              return (
                <div key={barangay.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{barangay.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{barangay.count} resident{barangay.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green-primary)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
