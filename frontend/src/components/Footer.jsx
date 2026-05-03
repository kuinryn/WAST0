import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#0a1f0f', color: '#86efac', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, background: '#14532d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗑️</div>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'white' }}>WAST0</span>
            </div>
            <p style={{ fontSize: 13, color: '#4ade80', lineHeight: 1.7, margin: 0 }}>
              Barangay Waste Collection Scheduler with Weather Alerts. Keeping Davao City clean, one barangay at a time.
            </p>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 14 }}>Navigation</p>
            {[
              { to: '/browse', label: 'View Schedules' },
              { to: '/register', label: 'Register as Resident' },
              { to: '/', label: 'Sign In' },
            ].map(({ to, label }) => (
              <div key={to} style={{ marginBottom: 8 }}>
                <Link to={to} style={{ fontSize: 13, color: '#86efac', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = '#86efac'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Tech */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 14 }}>Powered By</p>
            {['Django REST Framework', 'React + Vite', 'PostgreSQL', 'OpenWeatherMap API', 'Firebase Cloud Messaging'].map(t => (
              <div key={t} style={{ fontSize: 13, color: '#86efac', marginBottom: 6 }}>— {t}</div>
            ))}
          </div>

          {/* Info */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 14 }}>Location</p>
            <p style={{ fontSize: 13, color: '#86efac', lineHeight: 1.7, margin: 0 }}>
              📍 Davao City, Philippines<br />
              Davao Region (Region XI)<br />
              182 Barangays Covered
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #14532d', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#4ade80', margin: 0 }}>
            © {new Date().getFullYear()} WAST0 — All rights reserved
          </p>
          <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>
            Built for Davao City Barangay Waste Management
          </p>
        </div>
      </div>
    </footer>
  )
}