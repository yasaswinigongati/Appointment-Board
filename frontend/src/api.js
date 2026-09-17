const API_BASE = '/api/appointments'

async function parseError(response) {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      return data.detail.map((item) => item.msg || JSON.stringify(item)).join('. ')
    }
    return data.message || 'Something went wrong'
  } catch {
    return 'Something went wrong'
  }
}

export async function fetchAppointments({ date, status } = {}) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (status) params.set('status', status)
  const query = params.toString()
  const response = await fetch(`${API_BASE}${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function createAppointment(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function updateAppointment(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function completeAppointment(id) {
  const response = await fetch(`${API_BASE}/${id}/complete`, { method: 'POST' })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function cancelAppointment(id) {
  const response = await fetch(`${API_BASE}/${id}/cancel`, { method: 'POST' })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}
