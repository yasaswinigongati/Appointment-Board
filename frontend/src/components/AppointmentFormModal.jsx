import { useEffect, useId, useState } from 'react'

const emptyForm = {
  title: '',
  description: '',
  appointment_date: '',
  start_time: '',
  end_time: '',
}

function toInputTime(value) {
  if (!value) return ''
  return value.slice(0, 5)
}

export default function AppointmentFormModal({ open, initial, onClose, onSubmit, busy }) {
  const titleId = useId()
  const [form, setForm] = useState(emptyForm)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        appointment_date: initial.appointment_date || '',
        start_time: toInputTime(initial.start_time),
        end_time: toInputTime(initial.end_time),
      })
    } else {
      setForm(emptyForm)
    }
    setLocalError('')
  }, [open, initial])

  if (!open) return null

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')

    if (!form.title.trim()) {
      setLocalError('Title is required.')
      return
    }
    if (!form.appointment_date || !form.start_time || !form.end_time) {
      setLocalError('Date, start time, and end time are required.')
      return
    }
    if (form.end_time <= form.start_time) {
      setLocalError('End time must be after start time.')
      return
    }

    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        appointment_date: form.appointment_date,
        start_time: `${form.start_time}:00`,
        end_time: `${form.end_time}:00`,
      })
    } catch (error) {
      setLocalError(error.message || 'Could not save appointment.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{initial ? 'Edit appointment' : 'Add appointment'}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Team standup"
              maxLength={120}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.appointment_date}
              onChange={(e) => updateField('appointment_date', e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="start">Start time</label>
              <input
                id="start"
                type="time"
                value={form.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="end">End time</label>
              <input
                id="end"
                type="time"
                value={form.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                required
              />
            </div>
          </div>
          {localError ? <p className="form-error">{localError}</p> : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Close
            </button>
            <button type="submit" className="btn btn-accent" disabled={busy}>
              {busy ? 'Saving…' : initial ? 'Save changes' : 'Add appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
