export class AssistantActionError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message) }
}
export interface AssistantProvider { id: string; name: string; specialization?: string; location?: string }
export interface AssistantAppointment { id: string; appointment_date: string; status: string; teleconsult_room_id?: string; provider_name?: string }
export interface AssistantSlot { appointmentDate: string; available: boolean }
export interface PreparedAction { draft: Record<string, string>; confirmationToken: string; expiresAt: string }

export async function assistantAction<T>(action: string, fields: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/api/assistant/actions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...fields }), signal: AbortSignal.timeout(15000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new AssistantActionError(data.error || "Request failed", data.code || "REQUEST_FAILED", response.status)
  return data as T
}

export function formatAssistantDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso))
}
export function formatAssistantTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso))
}
