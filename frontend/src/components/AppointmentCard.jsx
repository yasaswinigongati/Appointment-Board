function formatDate(value) {
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatTime(value) {
  if (!value) return ''
  const [h, m] = value.split(':')
  const date = new Date()
  date.setHours(Number(h), Number(m), 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function AppointmentCard({ appointment, index, onEdit, onComplete, onCancel }) {
  const isCancelled = appointment.status === 'cancelled'
  const isCompleted = appointment.status === 'completed'

  return (
    <article
      className={[
        'appointment-card',
        isCancelled ? 'is-cancelled' : '',
        isCompleted ? 'is-completed' : '',
        !isCancelled && !isCompleted ? 'is-scheduled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      <div className="card-top">
        <div>
          <h3>{appointment.title}</h3>
          {appointment.description ? <p>{appointment.description}</p> : null}
        </div>
        <span className={`status-badge status-${appointment.status}`}>{appointment.status}</span>
      </div>

      <div className="meta-row">
        <span>
          <strong>Date</strong> {formatDate(appointment.appointment_date)}
        </span>
        <span>
          <strong>Time</strong> {formatTime(appointment.start_time)} –{' '}
          {formatTime(appointment.end_time)}
        </span>
      </div>

      <div className="card-actions">
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => onEdit(appointment)}
          disabled={isCancelled}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-success"
          onClick={() => onComplete(appointment)}
          disabled={isCancelled || isCompleted}
        >
          Complete
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onCancel(appointment)}
          disabled={isCancelled}
        >
          Cancel
        </button>
      </div>
    </article>
  )
}
