import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { performConfirmedVoiceBooking, performConfirmedVoiceCancellation } from "@/components/voice-assistant/action-receipts"
import type { PreparedAction } from "@/lib/assistant/client-actions"

const userId = "11111111-1111-4111-8111-111111111111"
const providerId = "22222222-2222-4222-8222-222222222222"
const appointmentId = "33333333-3333-4333-8333-333333333333"
const otherId = "44444444-4444-4444-8444-444444444444"
const appointmentDate = "2030-11-23T03:30:00.000Z"
const bookingDraft = { providerId, providerName: "Registered clinician", appointmentDate, consultationType: "audio", notes: "" }
const cancelDraft = { appointmentId, providerId, providerName: "Registered clinician", appointmentDate }
function prepared(action: string, draft: Record<string, string>): PreparedAction {
  const contents = { action, userId, operationId: appointmentId, draft }
  return { draft, confirmationToken: `${Buffer.from(JSON.stringify(contents)).toString("base64url")}.test-signature`, expiresAt: "2030-11-23T03:00:00.000Z" }
}
const booking = prepared("appointments.book", bookingDraft)
const cancellation = prepared("appointments.cancel", cancelDraft)
const expected = { userId, providerId, appointmentDate, consultationType: "audio" as const }
const appointment = { id: appointmentId, provider_id: providerId, appointment_date: appointmentDate, consultation_type: "audio", status: "scheduled", teleconsult_room_id: "actual-server-room" }
const receipt = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } })

describe("Voice workflow action receipts before success speech", () => {
  let fetcher: ReturnType<typeof vi.fn>
  beforeEach(() => { fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher) })
  afterEach(() => vi.unstubAllGlobals())

  it("rejects empty, malformed and mismatched booking acknowledgments", async () => {
    const wrong = [
      {}, { appointment: {} }, { appointment: { ...appointment, id: "invalid-id" } },
      { appointment: { ...appointment, id: otherId } }, { appointment: { ...appointment, provider_id: otherId } },
      { appointment: { ...appointment, appointment_date: "2030-11-24T03:30:00.000Z" } },
      { appointment: { ...appointment, status: "cancelled" } }, { appointment: { ...appointment, consultation_type: "video" } },
      { appointment: { ...appointment, teleconsult_room_id: "" } }, { appointment, error: "Not acknowledged" },
    ]
    for (const body of wrong) {
      fetcher.mockResolvedValueOnce(receipt(body))
      await expect(performConfirmedVoiceBooking(booking, expected)).rejects.toThrow("did not acknowledge")
    }
  })

  it("requires the selected provider/time/mode and current user to match the prepared confirmation", async () => {
    await expect(performConfirmedVoiceBooking(booking, { ...expected, providerId: otherId })).rejects.toThrow("does not match")
    await expect(performConfirmedVoiceBooking(booking, { ...expected, userId: otherId })).rejects.toThrow("does not match")
    await expect(performConfirmedVoiceBooking({ ...booking, draft: { ...bookingDraft, appointmentDate: "2030-11-24T03:30:00.000Z" } }, expected)).rejects.toThrow("does not match")
    expect(fetcher).not.toHaveBeenCalled()
  })

  it("accepts the exact booking receipt and sends explicit confirmation", async () => {
    fetcher.mockResolvedValueOnce(receipt({ appointment }, 201))
    expect(await performConfirmedVoiceBooking(booking, expected)).toEqual(appointment)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ action: "appointments.book", confirmationToken: booking.confirmationToken, confirmed: true })
  })

  it("rejects cancellation receipts without the exact appointment/provider/date and cancelled status", async () => {
    const cancelled = { ...appointment, status: "cancelled" }
    for (const body of [{}, { appointment }, { appointment: { ...cancelled, id: otherId } }, { appointment: { ...cancelled, provider_id: otherId } }, { appointment: { ...cancelled, appointment_date: "2030-11-24T03:30:00.000Z" } }, { appointment: { id: appointmentId, status: "cancelled" } }]) {
      fetcher.mockResolvedValueOnce(receipt(body))
      await expect(performConfirmedVoiceCancellation(cancellation, userId)).rejects.toThrow("did not acknowledge")
    }
  })

  it("accepts an acknowledged cancellation including a duplicate result, while rejecting another user's confirmation", async () => {
    await expect(performConfirmedVoiceCancellation(cancellation, otherId)).rejects.toThrow("does not match")
    expect(fetcher).not.toHaveBeenCalled()
    fetcher.mockResolvedValueOnce(receipt({ appointment: { ...appointment, status: "cancelled" }, duplicate: true }))
    expect(await performConfirmedVoiceCancellation(cancellation, userId)).toMatchObject({ id: appointmentId, provider_id: providerId, status: "cancelled" })
  })
})
