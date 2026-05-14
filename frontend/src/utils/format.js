export function formatClock(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(`1970-01-01T${String(value).slice(0, 8)}`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase()
}
