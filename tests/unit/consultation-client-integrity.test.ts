import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { bookVerifiedConsultation, consultationJoinPath } from "@/components/consultation-portal/booking-client"
import { EMPTY_RX, loadAuthorizedRoom, renderConsultationPrint, saveConsultationRecord, type AuthorizedRoom } from "@/app/teleconsult/room/room-client"

const appointmentId = "11111111-1111-4111-8111-111111111111"
const providerId = "22222222-2222-4222-8222-222222222222"
const patientId = "33333333-3333-4333-8333-333333333333"
const recordId = "44444444-4444-4444-8444-444444444444"
const booking = { provider_id: providerId, appointment_date: "2030-11-23T03:30:00.000Z", consultation_type: "audio" as const }
const appointment = { id: appointmentId, ...booking, status: "scheduled", teleconsult_room_id: "actual_server_room" }
const room: AuthorizedRoom = { appointmentId, providerId, patientId, participantRole: "doctor", participantName: "Dr. Registered", doctorName: "Dr. Registered", patientName: "Patient One", facilityName: "Clinic", roomId: "actual_server_room", domain: "meet.jit.si", token: "signed-token", requiresToken: true }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } })

describe("Acknowledged booking and authorized consultation clients", () => {
  let fetcher: ReturnType<typeof vi.fn>
  beforeEach(() => { fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher) })
  afterEach(() => vi.unstubAllGlobals())

  it("cannot confirm booking failures or missing/wrong server identities", async () => {
    for (const status of [401, 409, 500]) {
      fetcher.mockResolvedValueOnce(json({ error: "Not confirmed" }, status))
      await expect(bookVerifiedConsultation(booking)).rejects.toThrow("Not confirmed")
    }
    fetcher.mockResolvedValueOnce(json({ appointment }, 500))
    await expect(bookVerifiedConsultation(booking)).rejects.toThrow("not confirmed")
    for (const data of [{}, { appointment: { ...appointment, provider_id: recordId } }, { appointment: { ...appointment, teleconsult_room_id: "" } }]) {
      fetcher.mockResolvedValueOnce(json(data, 201))
      await expect(bookVerifiedConsultation(booking)).rejects.toThrow("did not acknowledge")
    }
  })

  it("requires an actual provider ID and consumes the server room/appointment for success", async () => {
    await expect(bookVerifiedConsultation({ ...booking, provider_id: "doc-directory-only" })).rejects.toThrow("registered provider")
    expect(fetcher).not.toHaveBeenCalled()
    fetcher.mockResolvedValueOnce(json({ appointment }, 201))
    expect(await bookVerifiedConsultation(booking)).toMatchObject({ id: appointmentId, teleconsult_room_id: "actual_server_room", consultation_type: "audio" })
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).not.toHaveProperty("teleconsult_room_id")
    const path = consultationJoinPath(appointmentId, "ur")
    expect(path).toContain(`appointmentId=${appointmentId}`)
    expect(path).not.toContain("role="); expect(path).not.toContain("token="); expect(path).not.toContain("room=")
  })

  it("blocks denied room access and invalid tokens before returning any Jitsi settings", async () => {
    fetcher.mockResolvedValueOnce(json({ ...room, error: "Access denied" }, 403))
    await expect(loadAuthorizedRoom(appointmentId)).rejects.toThrow("Access denied")
    fetcher.mockResolvedValueOnce(json({ ...room, token: null }))
    await expect(loadAuthorizedRoom(appointmentId)).rejects.toThrow("could not be verified")
    fetcher.mockResolvedValueOnce(json(room))
    expect(await loadAuthorizedRoom(appointmentId)).toMatchObject({ participantRole: "doctor", token: "signed-token", domain: "meet.jit.si" })
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ appointmentId })
  })

  it("does not fabricate clinical defaults or show record success after a failure", async () => {
    expect(Object.values(EMPTY_RX).every((value) => value === "")).toBe(true)
    await expect(saveConsultationRecord(room, EMPTY_RX)).rejects.toThrow("Enter the consultation findings")
    expect(fetcher).not.toHaveBeenCalled()
    const rx = { ...EMPTY_RX, diagnosis: "Clinician-entered findings" }
    fetcher.mockResolvedValueOnce(json({ error: "Cannot save" }, 500))
    await expect(saveConsultationRecord(room, rx)).rejects.toThrow("Cannot save")
    fetcher.mockResolvedValueOnce(json({ id: recordId, patient_id: patientId, provider_id: providerId, appointment_id: appointmentId, record_type: "prescription" }, 201))
    expect((await saveConsultationRecord(room, rx)).id).toBe(recordId)
    const sent = JSON.parse(fetcher.mock.calls[1][1].body)
    expect(sent).toMatchObject({ patient_id: patientId, appointment_id: appointmentId, provider_id: providerId, record_type: "prescription" })
    expect(sent.metadata).not.toHaveProperty("doctor_name")
  })

  it("saves patient notes as other and prints untrusted content as text", async () => {
    fetcher.mockResolvedValueOnce(json({ id: recordId, patient_id: patientId, provider_id: providerId, appointment_id: appointmentId, record_type: "other" }, 201))
    await saveConsultationRecord({ ...room, participantRole: "patient" }, { ...EMPTY_RX, instructions: "Patient notes" })
    expect(JSON.parse(fetcher.mock.calls[0][1].body).record_type).toBe("other")
    const nodes: any[] = []
    const document = { title: "", createElement: (tag: string) => {
      const node = { tag, textContent: "" }
      Object.defineProperty(node, "innerHTML", { set: () => { throw new Error("Unsafe HTML injection") } })
      return node
    }, body: { replaceChildren: vi.fn(), style: { cssText: "" }, append: (...items: any[]) => nodes.push(...items) } }
    renderConsultationPrint(document as any, room, { ...EMPTY_RX, diagnosis: "<img src=x onerror=alert(1)>" })
    expect(nodes.map((node) => node.tag)).toEqual(["h1", "div", "p"])
    expect(nodes[1].textContent).toContain("<img src=x onerror=alert(1)>")
    expect(nodes[2].textContent).toContain("not digitally signed")
  })
})
