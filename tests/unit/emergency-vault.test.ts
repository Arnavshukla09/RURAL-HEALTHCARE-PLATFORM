import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  DEFAULT_PROFILE,
  getEmergencyProfile,
  saveEmergencyProfile,
  buildSosMessage,
  dispatchSmsSos,
  EmergencyProfile,
} from "@/lib/emergency/vault"

describe("Emergency Health Vault & SOS Dispatch Engine", () => {
  beforeEach(() => {
    // Clear localStorage mock
    const store: Record<string, string> = {}
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val
      }),
      clear: vi.fn(() => {
        for (const k in store) delete store[k]
      }),
    })
  })

  it("returns default profile when empty", () => {
    const profile = getEmergencyProfile()
    expect(profile.fullName).toBe("")
    expect(profile.bloodGroup).toBe("Unknown")
  })

  it("saves and retrieves patient chronic health profile from local storage", () => {
    const custom: Partial<EmergencyProfile> = {
      fullName: "Ramesh Sharma",
      age: "54",
      bloodGroup: "O+",
      chronicConditions: "Type 2 Diabetes, Hypertension",
      currentMedications: "Metformin 500mg, Amlodipine",
      severeAllergies: "Penicillin",
      primaryEmergencyContact: "+919876543210",
    }

    const saved = saveEmergencyProfile(custom)
    expect(saved.fullName).toBe("Ramesh Sharma")
    expect(saved.bloodGroup).toBe("O+")

    const fetched = getEmergencyProfile()
    expect(fetched.chronicConditions).toBe("Type 2 Diabetes, Hypertension")
    expect(fetched.primaryEmergencyContact).toBe("+919876543210")
  })

  it("builds structured SOS message containing GPS link and clinical history", () => {
    const profile: EmergencyProfile = {
      fullName: "Anita Patel",
      age: "42",
      bloodGroup: "B+",
      chronicConditions: "Asthma",
      currentMedications: "Salbutamol Inhaler",
      severeAllergies: "Sulfa drugs",
      primaryEmergencyContact: "9876543210",
      secondaryEmergencyContact: "9123456789",
      emergencyNotes: "Carry inhaler",
    }

    const msg = buildSosMessage(profile, { lat: 23.2599, lng: 77.4126 })
    expect(msg).toContain("MEDICAL EMERGENCY SOS!")
    expect(msg).toContain("https://maps.google.com/?q=23.25990,77.41260")
    expect(msg).toContain("Anita Patel, Age: 42, Blood: B+")
    expect(msg).toContain("Asthma")
    expect(msg).toContain("Salbutamol Inhaler")
    expect(msg).toContain("Sulfa drugs")
  })

  it("dispatches SMS URI targeted to saved emergency contacts", () => {
    const profile: EmergencyProfile = {
      ...DEFAULT_PROFILE,
      fullName: "Suresh",
      primaryEmergencyContact: "+91 98765 43210",
      secondaryEmergencyContact: "07552672355",
    }

    const smsUrl = dispatchSmsSos(profile, { lat: 23.2, lng: 77.4 })
    expect(smsUrl).toMatch(/^sms:\+919876543210,07552672355\?body=/)
  })

  it("falls back to 112 when no emergency contacts are saved", () => {
    const emptyProfile: EmergencyProfile = { ...DEFAULT_PROFILE }
    const smsUrl = dispatchSmsSos(emptyProfile)
    expect(smsUrl).toMatch(/^sms:112\?body=/)
  })
})
