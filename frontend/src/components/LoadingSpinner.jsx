export default function LoadingSpinner({ label = 'Loading data...' }) {
  return (
    <div style={{
      minHeight: '56vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 42,
        height: 42,
        border: '3px solid #dcfce7',
        borderTop: '3px solid #14532d',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 700 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
