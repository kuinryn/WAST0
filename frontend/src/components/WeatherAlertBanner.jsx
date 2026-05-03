const SEVERITY = {
  low:      { bg: '#fefce8', border: '#fde68a', text: '#92400e', icon: '🌦️', label: 'Low Weather Alert' },
  moderate: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', icon: '🌧️', label: 'Moderate Weather Alert' },
  high:     { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '⛈️', label: 'High Severity Alert' },
}

export default function WeatherAlertBanner({ alert }) {
  if (!alert) return null
  const s = SEVERITY[alert.severity] || SEVERITY.low

  return (
    <div style={{
      background: s.bg, border: `1.5px solid ${s.border}`,
      borderRadius: 14, padding: '16px 20px', marginBottom: 20,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: s.text, margin: '0 0 4px' }}>{s.label}</p>
        <p style={{ fontSize: 13, color: s.text, margin: '0 0 4px', opacity: 0.9 }}>{alert.message}</p>
        <p style={{ fontSize: 11, color: s.text, margin: 0, opacity: 0.6 }}>
          {new Date(alert.triggered_at).toLocaleString('en-PH')}
        </p>
      </div>
      <div style={{
        padding: '3px 10px', borderRadius: 999, background: s.border,
        fontSize: 11, fontWeight: 700, color: s.text, textTransform: 'uppercase',
        letterSpacing: '0.05em', whiteSpace: 'nowrap',
      }}>
        {alert.severity}
      </div>
    </div>
  )
}