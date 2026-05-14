// src/pages/GuestBrowse.jsx
// Public guest view — browse barangay waste schedules without logging in
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSchedules, getBarangays } from '../services/api'

const WASTE_LABELS = {
  biodegradable: { label: 'Biodegradable', icon: '♻️', color: '#065f46', bg: '#d1fae5' },
  non_biodegradable: { label: 'Non-Biodegradable', icon: '🗑️', color: '#92400e', bg: '#fef3c7' },
  residual: { label: 'Residual', icon: '🪣', color: '#374151', bg: '#f3f4f6' },
  hazardous: { label: 'Hazardous', icon: '⚠️', color: '#991b1b', bg: '#fee2e2' },
}

export default function GuestBrowse() {
  const [barangays, setBarangays] = useState([])
  const [selectedBarangay, setSelectedBarangay] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getBarangays().then(r => setBarangays(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBarangay) return
    setLoading(true)
    getSchedules({ barangay: selectedBarangay })
      .then(r => setSchedules(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false))
  }, [selectedBarangay])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--charcoal), var(--green-dark))',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <span style={{
            display: 'inline-block', marginBottom: 16,
            background: 'rgba(76,175,116,0.2)', border: '1px solid rgba(76,175,116,0.4)',
            color: '#86efac', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          }}>
            📋 Public Schedule Browser
          </span>
          <h1 style={{
            fontSize: 36, fontWeight: 900, color: 'white', margin: '0 0 10px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            <span style={{ color: '#86efac' }}>Project </span>Wasto
          </h1>
          <p style={{ fontSize: 15, color: '#86efac', margin: '0 0 28px' }}>
            Select your barangay to view the waste collection schedule
          </p>

          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <select
              value={selectedBarangay}
              onChange={e => {
                setSelectedBarangay(e.target.value)
                const b = barangays.find(b => String(b.id) === e.target.value)
                setSelectedName(b?.name || '')
              }}
              style={{
                width: '100%', padding: '14px 18px',
                borderRadius: 12, border: 'none',
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', outline: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'white', color: 'var(--charcoal)',
              }}
            >
              <option value="">— Choose your barangay —</option>
              {barangays.map(b => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedules */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {!selectedBarangay && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <p style={{ fontSize: 15 }}>Select a barangay above to view schedules</p>
          </div>
        )}

        {selectedBarangay && loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
            <p>Loading schedules…</p>
          </div>
        )}

        {selectedBarangay && !loading && schedules.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p>No schedules found for {selectedName}</p>
          </div>
        )}

        {selectedBarangay && !loading && schedules.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--charcoal)', marginBottom: 16 }}>
              {selectedName} — Collection Schedule
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schedules.map(s => {
                const wt = WASTE_LABELS[s.waste_type] || { label: s.waste_type, icon: '🗑️', color: '#374151', bg: '#f3f4f6' }
                return (
                  <div key={s.id} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, flexShrink: 0,
                      background: wt.bg, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {wt.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4 }}>
                        {wt.label} Collection
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                        Every {s.frequency === 'bi_weekly' ? 'other ' : ''}{s.collection_day}
                        {' · '}
                        {s.collection_time ? s.collection_time.slice(0, 5) : ''}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: wt.bg, color: wt.color,
                    }}>
                      {s.frequency === 'bi_weekly' ? 'Bi-weekly' : 'Weekly'}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Login prompt */}
        <div style={{
          marginTop: 40, padding: '24px', textAlign: 'center',
          background: 'var(--green-light)', borderRadius: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>🔔</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 4 }}>
            Want notifications and reminders?
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Register as a resident to get push notifications and calendar reminders
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>
              Register
            </Link>
            <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
