export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: 24, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32,
        maxWidth: 380, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 15, color: '#334155', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} className="btn-danger" style={{ flex: 1 }}>Delete</button>
        </div>
      </div>
    </div>
  )
}