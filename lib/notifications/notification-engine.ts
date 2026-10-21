/**
 * lib/notifications/notification-engine.ts
 *
 * Furnished Notification & Alert Engine for Rural Healthcare Platform
 * Supports:
 * - Patient, Doctor & Admin user roles
 * - Event triggers (Appointment Booked, Confirmed, Cancelled, Completed, Teleconsult Ready, Emergency SOS)
 * - Real-time custom event broadcasting for instant UI update
 * - Web Audio API non-intrusive notification chime
 * - Local storage fallback for offline / guest sessions
 */

import { createClient } from "@/lib/supabase/client"

export type NotificationType = "info" | "warning" | "success" | "emergency"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  recipient_type: "all" | "role" | "individual"
  recipient_role?: "patient" | "doctor" | "admin" | null
  recipient_id?: string | null
  is_read: boolean
  created_at: string
  action_url?: string
}

const LOCAL_NOTIFS_KEY = "rural_health_local_notifications"

/**
 * Synthesize a non-intrusive, gentle two-tone notification chime via Web Audio API
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Oscillator 1: D5 (587 Hz) -> A5 (880 Hz)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(587.33, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)

    // Soft, pleasant volume envelope
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  } catch {
    // Audio autoplay restricted or audio context blocked; safely ignore
  }
}

/**
 * Read notifications stored in LocalStorage for offline/guest resilience
 */
export function getLocalNotifications(userId?: string, userRole?: string): AppNotification[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFS_KEY)
    if (!raw) return []
    const all: AppNotification[] = JSON.parse(raw)
    if (!userId && !userRole) return all

    return all.filter((n) => {
      // Role-specific notifications (e.g. doctor alerts)
      if (n.recipient_type === "role" && n.recipient_role) {
        return n.recipient_role === userRole
      }
      // Individual notifications (e.g. specific patient confirmations)
      if (n.recipient_type === "individual" && n.recipient_id) {
        return n.recipient_id === userId
      }
      // System-wide broadcasts
      if (n.recipient_type === "all") {
        if (userRole === "doctor" && n.title?.includes("Appointment Confirmed")) {
          return false
        }
        return true
      }
      if (n.recipient_id) return n.recipient_id === userId
      return true
    })
  } catch {
    return []
  }
}

/**
 * Save notification locally and broadcast event
 */
function saveLocalNotification(notif: AppNotification) {
  if (typeof window === "undefined") return
  try {
    const existing = getLocalNotifications()
    const updated = [notif, ...existing.filter(n => n.id !== notif.id)].slice(0, 50)
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated))

    // Broadcast window event for instant NotificationBell update without polling delay
    window.dispatchEvent(new CustomEvent("ruralhealth:notification", { detail: notif }))
    playNotificationChime()
  } catch (err) {
    console.warn("Could not save local notification:", err)
  }
}

/**
 * Mark notification as read locally
 */
export function markLocalNotificationRead(id: string) {
  if (typeof window === "undefined") return
  try {
    const existing = getLocalNotifications()
    const updated = existing.map(n => n.id === id ? { ...n, is_read: true } : n)
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent("ruralhealth:notification_read", { detail: { id } }))
  } catch {
    // ignore
  }
}

/**
 * Mark all local notifications as read
 */
export function markAllLocalNotificationsRead() {
  if (typeof window === "undefined") return
  try {
    const existing = getLocalNotifications()
    const updated = existing.map(n => ({ ...n, is_read: true }))
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent("ruralhealth:notification_read_all"))
  } catch {
    // ignore
  }
}

/**
 * Create a new notification across both Backend DB (if authenticated) and Local Storage
 */
export async function dispatchNotification(params: {
  title: string
  message: string
  type: NotificationType
  recipient_type?: "all" | "role" | "individual"
  recipient_role?: "patient" | "doctor" | "admin" | null
  recipient_id?: string | null
  action_url?: string
}): Promise<AppNotification> {
  const notif: AppNotification = {
    id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: params.title,
    message: params.message,
    type: params.type,
    recipient_type: params.recipient_type || "all",
    recipient_role: params.recipient_role || null,
    recipient_id: params.recipient_id || null,
    is_read: false,
    created_at: new Date().toISOString(),
    action_url: params.action_url,
  }

  // 1. Always store locally for instant responsiveness
  saveLocalNotification(notif)

  // 2. Try inserting to Supabase if client session exists
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("notifications").insert([{
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        recipient_type: notif.recipient_type,
        recipient_role: notif.recipient_role,
        recipient_id: notif.recipient_id || user.id,
        is_read: false,
      }])
    }
  } catch (err) {
    // Ignore server error; local copy remains active
  }

  return notif
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFIC TRIGGER ENGINES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger: Patient books an appointment
 */
export async function triggerAppointmentBooked(payload: {
  appointmentId?: string
  doctorName: string
  doctorSpecialty: string
  hospitalName: string
  date: string
  time: string
  consultType: "video" | "audio" | "chat"
  patientName: string
  patientUserId?: string
  roomId?: string
}) {
  const dateFormatted = new Date(payload.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  })

  // 1. Notification for Patient
  await dispatchNotification({
    title: `Appointment Confirmed: ${payload.doctorName}`,
    message: `Your ${payload.consultType.toUpperCase()} consultation with ${payload.doctorName} (${payload.doctorSpecialty}, ${payload.hospitalName}) on ${dateFormatted} at ${payload.time} is confirmed.`,
    type: "success",
    recipient_type: payload.patientUserId ? "individual" : "all",
    recipient_id: payload.patientUserId,
    action_url: "/appointments",
  })

  // 2. Notification for Doctor
  await dispatchNotification({
    title: `New Consultation: ${payload.patientName}`,
    message: `Patient ${payload.patientName} booked a ${payload.consultType} consultation on ${dateFormatted} at ${payload.time}.`,
    type: "info",
    recipient_type: "role",
    recipient_role: "doctor",
    action_url: "/doctor/appointments",
  })
}

/**
 * Trigger: Appointment status updated (Confirmed, Cancelled, Completed)
 */
export async function triggerAppointmentStatusUpdated(payload: {
  appointmentId: string
  newStatus: "scheduled" | "completed" | "cancelled"
  doctorName: string
  patientName?: string
  date: string
  patientUserId?: string
}) {
  const dateFormatted = new Date(payload.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  })

  if (payload.newStatus === "completed") {
    await dispatchNotification({
      title: "Consultation Completed",
      message: `Your consultation with ${payload.doctorName} is complete. Your medical summary has been recorded.`,
      type: "success",
      recipient_type: payload.patientUserId ? "individual" : "all",
      recipient_id: payload.patientUserId,
      action_url: "/records",
    })
  } else if (payload.newStatus === "cancelled") {
    await dispatchNotification({
      title: "Appointment Cancelled",
      message: `The consultation on ${dateFormatted} with ${payload.doctorName} has been cancelled.`,
      type: "warning",
      recipient_type: payload.patientUserId ? "individual" : "all",
      recipient_id: payload.patientUserId,
      action_url: "/appointments",
    })
  }
}

/**
 * Trigger: Teleconsultation video room ready
 */
export async function triggerTeleconsultRoomReady(payload: {
  doctorName: string
  roomId: string
  patientUserId?: string
}) {
  await dispatchNotification({
    title: "Teleconsultation Room Ready",
    message: `${payload.doctorName} is ready in the virtual clinic. Click to enter the consultation room.`,
    type: "info",
    recipient_type: payload.patientUserId ? "individual" : "all",
    recipient_id: payload.patientUserId,
    action_url: `/appointments?room=${payload.roomId}`,
  })
}

/**
 * Trigger: Emergency SOS dispatch
 */
export async function triggerEmergencyAlert(payload: {
  locationText?: string
  coords?: { lat: number; lng: number }
  patientUserId?: string
}) {
  const locStr = payload.coords
    ? `GPS: ${payload.coords.lat.toFixed(3)}, ${payload.coords.lng.toFixed(3)}`
    : payload.locationText || "Current Location"

  await dispatchNotification({
    title: "🚨 Emergency SOS Dispatched",
    message: `Emergency signal logged for ${locStr}. Paramedic ICE pass generated and local helpline records activated.`,
    type: "emergency",
    recipient_type: "all",
    action_url: "/emergency",
  })
}
