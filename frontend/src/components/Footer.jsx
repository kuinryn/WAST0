import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#0a1f0f', color: '#bbf7d0', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="brand-mark" style={{ width: 34, height: 34, background: '#15803d' }}>W</span>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 21, color: 'white' }}>WAST0</span>
            </div>
            <p style={{ fontSize: 13, color: '#86efac', lineHeight: 1.7, margin: 0 }}>
              Barangay waste collection schedules with weather-aware alerts for Davao City communities.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 12px' }}>Navigate</p>
              {[
                { to: '/browse', label: 'View schedules' },
                { to: '/register', label: 'Register' },
                { to: '/', label: 'Sign in' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: 'block', fontSize: 13, color: '#bbf7d0', textDecoration: 'none', marginBottom: 8 }}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 12px' }}>Coverage</p>
              <p style={{ fontSize: 13, color: '#bbf7d0', lineHeight: 1.7, margin: 0 }}>
                Davao City, Philippines<br />
                Region XI barangays
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(134,239,172,0.16)', marginTop: 26, paddingTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>© {new Date().getFullYear()} WAST0</p>
          <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>Built for barangay waste management</p>
        </div>
      </div>
    </footer>
  )
}
