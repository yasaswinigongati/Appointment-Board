import { useCallback, useEffect, useState } from 'react'
import {
  cancelAppointment,
  completeAppointment,
  createAppointment,
  fetchAppointments,
  updateAppointment,
} from './api'
import AppointmentCard from './components/AppointmentCard'
import AppointmentFormModal from './components/AppointmentFormModal'

const THEME_KEY = 'appointment-board-theme'

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState(getPreferredTheme)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState({ date: '', status: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-animating')
    root.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
    const timer = window.setTimeout(() => root.classList.remove('theme-animating'), 420)
    return () => window.clearTimeout(timer)
  }, [theme])

  const pushToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAppointments({
        date: filters.date || undefined,
        status: filters.status || undefined,
      })
      setAppointments(data)
    } catch (error) {
      pushToast(error.message || 'Failed to load appointments', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters.date, filters.status, pushToast])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(appointment) {
    setEditing(appointment)
    setModalOpen(true)
  }

  async function handleSave(payload) {
    setBusy(true)
    try {
      const result = editing
        ? await updateAppointment(editing.id, payload)
        : await createAppointment(payload)
      pushToast(result.message, 'success')
      setModalOpen(false)
      setEditing(null)
      await loadAppointments()
    } finally {
      setBusy(false)
    }
  }

  async function handleComplete(appointment) {
    try {
      const result = await completeAppointment(appointment.id)
      pushToast(result.message, 'success')
      await loadAppointments()
    } catch (error) {
      pushToast(error.message || 'Could not complete appointment', 'error')
    }
  }

  async function handleCancel(appointment) {
    const confirmed = window.confirm(`Cancel "${appointment.title}"? It will stay visible as cancelled.`)
    if (!confirmed) return
    try {
      const result = await cancelAppointment(appointment.id)
      pushToast(result.message, 'success')
      await loadAppointments()
    } catch (error) {
      pushToast(error.message || 'Could not cancel appointment', 'error')
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <h1>Appointment Board</h1>
          <p>
            View, schedule, update, complete, and cancel team appointments. Overlapping time slots
            are blocked automatically.
          </p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span className="toggle-track" aria-hidden="true">
            <span className="toggle-thumb">
              <span key={theme} className="icon">
                {theme === 'light' ? '☀' : '☾'}
              </span>
            </span>
          </span>
          <span className="toggle-label">{theme === 'light' ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      <section className="toolbar" aria-label="Filters">
        <div className="field">
          <label htmlFor="filter-date">Filter by date</label>
          <input
            id="filter-date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="filter-status">Filter by status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFilters({ date: '', status: '' })}
          >
            Clear filters
          </button>
          <button type="button" className="btn btn-accent" onClick={openCreate}>
            Add Appointment
          </button>
        </div>
      </section>

      <div className="board-meta">
        <h2>Appointments</h2>
        <span>
          {loading ? 'Loading…' : `${appointments.length} shown`}
        </span>
      </div>

      {loading ? (
        <div className="loading-line" aria-hidden="true">
          <span />
        </div>
      ) : null}

      <section className="board" aria-live="polite">
        {!loading && appointments.length === 0 ? (
          <div className="empty-state">
            No appointments match these filters. Add one or clear the filters to see the board.
          </div>
        ) : (
          appointments.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              index={index}
              onEdit={openEdit}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))
        )}
      </section>

      <AppointmentFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          if (!busy) {
            setModalOpen(false)
            setEditing(null)
          }
        }}
        onSubmit={handleSave}
        busy={busy}
      />

      <div className="toast-stack" aria-live="assertive">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
