import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ScheduleTable, { BarangayICalButton } from '../components/ScheduleTable'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function GuestScheduleView() {
    const { user } = useAuth()
    const [barangays, setBarangays] = useState([])
    const [selectedBarangay, setSelectedBarangay] = useState('')
    const [selectedName, setSelectedName] = useState('')
    const [schedules, setSchedules] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        api.get('/barangays/').then(res => setBarangays(res.data)).catch(() => {})
    }, [])

    useEffect(() => {
        if (!selectedBarangay) return
        setLoading(true)
        api.get(`/schedules/?barangay=${selectedBarangay}`)
            .then(res => setSchedules(res.data))
            .catch(() => setSchedules([]))
            .finally(() => setLoading(false))
    }, [selectedBarangay])

    return (
        <div style={{ minHeight: '80vh' }}>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0a1f0f, #14532d)', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <span className="badge badge-green animate-fade-up" style={{ marginBottom: 16, display: 'inline-block' }}>
                        📋 Public Schedule
                    </span>
                    <h1 className="animate-fade-up delay-100" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 40, color: 'white', margin: '0 0 12px' }}>
                        Waste Collection Schedules
                    </h1>
                    <p className="animate-fade-up delay-200" style={{ fontSize: 15, color: '#86efac', margin: '0 0 28px' }}>
                        Select your barangay below to view the schedule and add it directly to your calendar.
                    </p>
                    <div className="animate-fade-up delay-300" style={{ position: 'relative', maxWidth: 420, margin: '0 auto' }}>
                        <select
                            value={selectedBarangay}
                            onChange={e => {
                                setSelectedBarangay(e.target.value)
                                const b = barangays.find(b => b.id === e.target.value)
                                setSelectedName(b?.name || '')
                            }}
                            style={{
                                width: '100%', padding: '14px 18px', borderRadius: 12,
                                border: '2px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.95)',
                                fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                                color: '#0f172a', cursor: 'pointer', outline: 'none',
                            }}
                        >
                            <option value="">— Select a barangay —</option>
                            {barangays.map(b => (
                                <option key={b.id} value={b.id}>{b.name} — {b.district}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Guest-only: register banner */}
            {!user && (
                <div style={{ background: '#fefce8', borderBottom: '1px solid #fde68a', padding: '12px 24px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                            🔔 <strong>Register as a resident</strong> to receive real-time weather alerts that may affect waste collection.
                        </p>
                        <Link to="/register" style={{
                            fontSize: 13, fontWeight: 600, color: '#14532d',
                            background: '#dcfce7', padding: '6px 14px', borderRadius: 8,
                            textDecoration: 'none', border: '1px solid #bbf7d0', whiteSpace: 'nowrap',
                        }}>Register Free →</Link>
                    </div>
                </div>
            )}

            {/* Logged-in user banner */}
            {user && (
                <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '12px 24px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
                            👋 You're logged in as <strong>{user.name}</strong>. Your dashboard shows your barangay's schedule automatically.
                        </p>
                        <Link to={
                            user.role === 'super_admin' ? '/admin' :
                            user.role === 'official' ? '/official' : '/dashboard'
                        } style={{
                            fontSize: 13, fontWeight: 600, color: 'white',
                            background: '#1d4ed8', padding: '6px 14px', borderRadius: 8,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                        }}>Go to My Dashboard →</Link>
                    </div>
                </div>
            )}

            {/* Schedule Content */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
                {!selectedBarangay ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
                        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#334155', marginBottom: 8 }}>Select a Barangay</h3>
                        <p style={{ fontSize: 14, color: '#94a3b8' }}>Choose your barangay from the dropdown above to see the waste collection schedule.</p>
                    </div>
                ) : loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: '#0f172a', margin: '0 0 4px' }}>
                                    Barangay {selectedName}
                                </h2>
                                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                                    {schedules.length} collection schedule{schedules.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {schedules.length > 0 && (
                                    <BarangayICalButton barangayId={selectedBarangay} barangayName={selectedName} />
                                )}
                                {!user && (
                                    <Link to="/register" style={{
                                        fontSize: 13, fontWeight: 600, color: 'white',
                                        background: '#14532d', padding: '9px 18px', borderRadius: 10,
                                        textDecoration: 'none',
                                    }}>Get Weather Alerts →</Link>
                                )}
                            </div>
                        </div>

                        {/* Calendar tip */}
                        {schedules.length > 0 && (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                                padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#15803d',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span>💡</span>
                                <span>
                                    Each schedule has a <strong>Google Cal</strong> button to add a recurring reminder to your Google Calendar,
                                    or <strong>.ics</strong> to import into Apple Calendar, Outlook, or any calendar app.
                                </span>
                            </div>
                        )}

                        <ScheduleTable schedules={schedules} canEdit={false} />
                    </>
                )}
            </div>
        </div>
    )
}
