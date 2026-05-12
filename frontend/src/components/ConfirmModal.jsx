export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-panel" style={{ maxWidth: 390, textAlign: 'left' }}>
        <p className="badge badge-red" style={{ margin: '0 0 14px' }}>Confirm delete</p>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Are you sure?</h2>
        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button type="button" onClick={onConfirm} className="btn-danger" style={{ flex: 1 }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
