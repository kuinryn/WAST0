const SEVERITY = {
  low: { bg: '#fefce8', border: '#fde68a', text: '#92400e', label: 'Low Weather Alert' },
  moderate: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', label: 'Moderate Weather Alert' },
  high: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: 'High Severity Alert' },
}

export default function WeatherAlertBanner({ alert }) {
  if (!alert) return null
  const style = SEVERITY[alert.severity] || SEVERITY.low

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 8,
      padding: '16px 18px',
      marginBottom: 20,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 14,
      alignItems: 'start',
    }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: style.text, margin: '0 0 5px' }}>{style.label}</p>
        <p style={{ fontSize: 13, color: style.text, margin: '0 0 6px', lineHeight: 1.55 }}>{alert.message}</p>
        <p style={{ fontSize: 11, color: style.text, margin: 0, opacity: 0.68 }}>
          {new Date(alert.triggered_at).toLocaleString('en-PH')}
        </p>
      </div>
      <span className="badge" style={{ background: style.border, color: style.text }}>
        {alert.severity}
      </span>
    </div>
  )
}
