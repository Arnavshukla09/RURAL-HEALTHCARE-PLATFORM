import { describe, it, expect } from "vitest"
import {
  NATIONAL_HELPLINES,
  STATE_HELPLINES_CATALOG,
  getStateHelplines,
  getCombinedHelplines,
  getAllHelplines,
} from "@/lib/emergency/helplines"

describe("Emergency Helpline Directory", () => {
  it("provides all essential national emergency and medical helplines", () => {
    const numbers = NATIONAL_HELPLINES.map((h) => h.number)
    expect(numbers).toContain("112") // National ERSS
    expect(numbers).toContain("108") // Ambulance
    expect(numbers).toContain("102") // Maternity
    expect(numbers).toContain("104") // Health Advice
    expect(numbers).toContain("14416") // Tele-MANAS
    expect(numbers).toContain("1098") // Childline
    expect(numbers).toContain("181") // Women in Distress
    expect(numbers).toContain("14567") // Elder Line
    expect(numbers).toContain("1070") // NDMA Disaster
    expect(numbers).toContain("1930") // Cyber fraud
    expect(numbers).toContain("14555") // Ayushman Bharat PM-JAY
    expect(numbers).toContain("1800116555") // AIIMS Poison Control
  })

  it("provides state-specific helplines for Madhya Pradesh (Code 23)", () => {
    const mpHelplines = getStateHelplines("23", "Madhya Pradesh", "मध्य प्रदेश")
    expect(mpHelplines.length).toBeGreaterThanOrEqual(5)

    const services = mpHelplines.map((h) => h.serviceEn)
    expect(services.some((s) => s.includes("CM Helpline 181"))).toBe(true)
    expect(services.some((s) => s.includes("104 Health Advice"))).toBe(true)
    expect(services.some((s) => s.includes("Shakti"))).toBe(true)
    expect(services.some((s) => s.includes("Disaster"))).toBe(true)
    expect(mpHelplines.every((h) => h.stateCode === "23")).toBe(true)
  })

  it("provides state-specific helplines for other key states (Maharashtra, UP, TN, Karnataka)", () => {
    // Maharashtra
    const mh = getStateHelplines("27")
    expect(mh.some((h) => h.serviceEn.includes("Aaple Sarkar"))).toBe(true)
    expect(mh.some((h) => h.serviceEn.includes("Arogya Sahayavani"))).toBe(true)

    // Uttar Pradesh
    const up = getStateHelplines("09")
    expect(up.some((h) => h.serviceEn.includes("1076"))).toBe(true)
    expect(up.some((h) => h.serviceEn.includes("Women Power Line"))).toBe(true)

    // Tamil Nadu
    const tn = getStateHelplines("33")
    expect(tn.some((h) => h.number === "1100")).toBe(true)

    // Karnataka
    const ka = getStateHelplines("29")
    expect(ka.some((h) => h.number === "1902")).toBe(true)
  })

  it("combines state-specific helplines with national helplines for localized view", () => {
    const combinedMP = getCombinedHelplines("23", "Madhya Pradesh", "मध्य प्रदेश")
    const stateItems = combinedMP.filter((h) => !h.isNational)
    const nationalItems = combinedMP.filter((h) => h.isNational)

    expect(stateItems.length).toBeGreaterThanOrEqual(5)
    expect(nationalItems.length).toBe(NATIONAL_HELPLINES.length)
    // State items must appear at the beginning of the list
    expect(combinedMP[0].isNational).toBe(false)
    expect(combinedMP[0].stateCode).toBe("23")
  })

  it("returns whole national directory when requested", () => {
    const all = getAllHelplines()
    expect(all.length).toBeGreaterThan(NATIONAL_HELPLINES.length + 30)
    // Every entry must contain complete bilingual metadata
    for (const h of all) {
      expect(h.id).toBeDefined()
      expect(h.serviceEn.length).toBeGreaterThan(0)
      expect(h.serviceHi.length).toBeGreaterThan(0)
      expect(h.number.length).toBeGreaterThan(0)
      expect(h.category).toBeDefined()
      expect(h.descriptionEn.length).toBeGreaterThan(0)
      expect(h.descriptionHi.length).toBeGreaterThan(0)
    }
  })
})
