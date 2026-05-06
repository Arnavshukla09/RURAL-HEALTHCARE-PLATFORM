export async function fetchAppointments(status?: string) {
  const url = new URL("/api/appointments", window.location.origin)
  if (status) url.searchParams.append("status", status)

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch appointments")
  return response.json()
}

export async function createAppointment(appointmentData: any) {
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appointmentData),
  })
  if (!response.ok) throw new Error("Failed to create appointment")
  return response.json()
}

export async function updateAppointment(id: string, updates: any) {
  const response = await fetch(`/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error("Failed to update appointment")
  return response.json()
}
