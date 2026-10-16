import { describe, it, expect } from "vitest"
import {
  validateCoordinates,
  normalizePhoneNumber,
  generateCanonicalFacilityId,
  resolveFacilityDuplicates,
  detectSharedPhoneNumbers,
  calculateDataQualityMetrics,
  INDIA_BOUNDS,
  CanonicalFacilityRecord,
} from "@/lib/geo/facility-provenance"

describe("Phase 5: Data Engineering, Geospatial Search & Provenance Pipeline", () => {
  describe("Geospatial Bounding Box & Inversion Detection", () => {
    it("accepts valid coordinates within India's sovereign bounding box", () => {
      // Bhopal, MP
      const bhopal = validateCoordinates(23.2599, 77.4126)
      expect(bhopal.isValid).toBe(true)

      // New Delhi
      const delhi = validateCoordinates(28.6139, 77.209)
      expect(delhi.isValid).toBe(true)

      // Kanyakumari, Tamil Nadu (Southern point)
      const south = validateCoordinates(8.0883, 77.5385)
      expect(south.isValid).toBe(true)

      // Leh, Ladakh (Northern point)
      const north = validateCoordinates(34.1526, 77.5771)
      expect(north.isValid).toBe(true)
    })

    it("detects and flags swapped latitude/longitude (GIS coordinate inversion)", () => {
      // Lat = 77.41 (in longitude range), Lon = 23.26 (in latitude range)
      const swapped = validateCoordinates(77.4126, 23.2599)
      expect(swapped.isValid).toBe(false)
      expect(swapped.isSwapped).toBe(true)
      expect(swapped.error).toContain("inverted")
    })

    it("rejects coordinates outside the Indian territorial bounding box", () => {
      // London, UK
      const london = validateCoordinates(51.5074, -0.1278)
      expect(london.isValid).toBe(false)
      expect(london.isSwapped).toBe(false)
      expect(london.error).toContain("outside the Indian territorial bounding box")

      // Equator / Null Island
      const nullIsland = validateCoordinates(0, 0)
      expect(nullIsland.isValid).toBe(false)
    })

    it("handles NaN and non-numeric coordinate inputs gracefully", () => {
      expect(validateCoordinates(NaN, 77.41).isValid).toBe(false)
      expect(validateCoordinates(23.25, NaN).isValid).toBe(false)
      expect(validateCoordinates(undefined as any, 77.41).isValid).toBe(false)
    })
  })

  describe("Telephone Sanitization & Shared Helpline Detection", () => {
    it("normalizes 10-digit Indian mobile numbers into standard E.164 +91 format", () => {
      const raw = "9826012345"
      const res = normalizePhoneNumber(raw)
      expect(res.isValid).toBe(true)
      expect(res.normalized).toBe("+91 98260 12345")
    })

    it("normalizes numbers prefixed with 0 or 91", () => {
      const withZero = normalizePhoneNumber("09826012345")
      expect(withZero.isValid).toBe(true)
      expect(withZero.normalized).toBe("+91 98260 12345")

      const with91 = normalizePhoneNumber("919826012345")
      expect(with91.isValid).toBe(true)
      expect(with91.normalized).toBe("+91 98260 12345")
    })

    it("validates official landline numbers with STD codes", () => {
      const aiimsBhopalLandline = normalizePhoneNumber("+91 755-2672355")
      expect(aiimsBhopalLandline.isValid).toBe(true)
      expect(aiimsBhopalLandline.normalized).toBe("+91 755-2672355")
    })

    it("rejects obvious placeholder or synthetic repetitive digit patterns", () => {
      expect(normalizePhoneNumber("0000000000").isValid).toBe(false)
      expect(normalizePhoneNumber("999999999999").isValid).toBe(false)
      expect(normalizePhoneNumber("").isValid).toBe(false)
      expect(normalizePhoneNumber(null).isValid).toBe(false)
    })

    it("detects shared phone numbers across multiple distinct facilities", () => {
      const facilityA: CanonicalFacilityRecord = {
        facility_id: "fac_1",
        name: "District Hospital Sehore",
        facility_type: "district_hospital",
        address: "Civil Lines, Sehore",
        district: "Sehore",
        state: "Madhya Pradesh",
        latitude: 23.2,
        longitude: 77.08,
        phone: "+91 7562-224430",
        phone_verification_status: "source_confirmed",
        source_name: "PM-JAY",
        source_record_id: "NIN101",
        source_url: "https://data.gov.in",
        last_checked_at: "2026-06-02T00:00:00Z",
        operational_status: "active",
      }

      const facilityB: CanonicalFacilityRecord = {
        facility_id: "fac_2",
        name: "CHC Ashta",
        facility_type: "chc",
        address: "Main Road, Ashta",
        district: "Sehore",
        state: "Madhya Pradesh",
        latitude: 23.02,
        longitude: 76.72,
        phone: "+91 7562-224430", // Identical district central desk number
        phone_verification_status: "facility_nodal_contact",
        source_name: "PM-JAY",
        source_record_id: "NIN102",
        source_url: "https://data.gov.in",
        last_checked_at: "2026-06-02T00:00:00Z",
        operational_status: "active",
      }

      const facilityC: CanonicalFacilityRecord = {
        facility_id: "fac_3",
        name: "AIIMS Bhopal",
        facility_type: "medical_college",
        address: "Saket Nagar, Bhopal",
        district: "Bhopal",
        state: "Madhya Pradesh",
        latitude: 23.21,
        longitude: 77.45,
        phone: "+91 755-2672355",
        phone_verification_status: "independently_verified",
        source_name: "NHP",
        source_record_id: "NIN201",
        source_url: "https://data.gov.in",
        last_checked_at: "2026-06-02T00:00:00Z",
        operational_status: "active",
      }

      const shared = detectSharedPhoneNumbers([facilityA, facilityB, facilityC])
      expect(shared.size).toBe(1)
      const list = shared.get("917562224430")
      expect(list).toBeDefined()
      expect(list?.length).toBe(2)
      expect(list?.map((f) => f.name)).toContain("District Hospital Sehore")
      expect(list?.map((f) => f.name)).toContain("CHC Ashta")
    })
  })

  describe("Deterministic Canonical Identifiers & Idempotent Upsert", () => {
    it("generates deterministic facility IDs ensuring identical keys across repeat runs", () => {
      const idRun1 = generateCanonicalFacilityId("pmjay_nha", "NIN987654")
      const idRun2 = generateCanonicalFacilityId("pmjay_nha", "NIN987654")
      expect(idRun1).toBe(idRun2)
      expect(idRun1).toBe("fac_pmjay_nha_nin987654")
    })

    it("falls back to sanitized name and district when sourceRecordId is missing", () => {
      const fallbackId = generateCanonicalFacilityId("osm", "", "Bansal Hospital", "Bhopal")
      expect(fallbackId).toBe("fac_osm_bansal_hospital_bhopal")
    })
  })

  describe("Entity Resolution, Deduplication & Quality Metrics", () => {
    it("resolves duplicate records while preserving the higher verification tier", () => {
      const unverifiedDoc: CanonicalFacilityRecord = {
        facility_id: "fac_dup_1",
        name: "Hamidia Hospital",
        facility_type: "hospital",
        address: "Royal Market, Bhopal",
        district: "Bhopal",
        state: "Madhya Pradesh",
        latitude: 23.25,
        longitude: 77.4,
        phone: "+91 755-2540222",
        phone_verification_status: "unverified",
        source_name: "NHP",
        source_record_id: "HAMIDIA_01",
        source_url: "https://data.gov.in",
        last_checked_at: "2026-01-01T00:00:00Z",
        operational_status: "active",
      }

      const verifiedDoc: CanonicalFacilityRecord = {
        facility_id: "fac_dup_1",
        name: "Hamidia Hospital (GMC)",
        facility_type: "hospital",
        address: "Royal Market, Bhopal",
        district: "Bhopal",
        state: "Madhya Pradesh",
        latitude: 23.25,
        longitude: 77.4,
        phone: "+91 755-2540222",
        phone_verification_status: "independently_verified", // Higher verification tier
        source_name: "NHP",
        source_record_id: "HAMIDIA_01",
        source_url: "https://data.gov.in",
        last_checked_at: "2026-06-02T00:00:00Z",
        operational_status: "active",
      }

      const { unique, duplicateCount } = resolveFacilityDuplicates([unverifiedDoc, verifiedDoc])
      expect(duplicateCount).toBe(1)
      expect(unique.length).toBe(1)
      expect(unique[0].phone_verification_status).toBe("independently_verified")
    })

    it("calculates comprehensive Data Quality & Provenance Scorecard", () => {
      const sampleRecords: CanonicalFacilityRecord[] = [
        {
          facility_id: "fac_1",
          name: "AIIMS Bhopal",
          facility_type: "medical_college",
          address: "Saket Nagar",
          district: "Bhopal",
          state: "Madhya Pradesh",
          latitude: 23.21,
          longitude: 77.45,
          phone: "+91 755-2672355",
          phone_verification_status: "independently_verified",
          source_name: "PM-JAY",
          source_record_id: "NIN_AIIMS",
          source_url: "https://data.gov.in",
          last_checked_at: "2026-06-02T00:00:00Z",
          operational_status: "active",
        },
        {
          facility_id: "fac_2",
          name: "Overseas Bogus Clinic",
          facility_type: "clinic",
          address: "Outside India",
          district: "Nowhere",
          state: "Unknown",
          latitude: 55.0, // Invalid: outside India
          longitude: 10.0,
          phone: null,
          phone_verification_status: "unverified",
          source_name: "Scraped",
          source_record_id: "",
          source_url: "",
          last_checked_at: "2026-01-01T00:00:00Z",
          operational_status: "active",
        },
      ]

      const report = calculateDataQualityMetrics(sampleRecords)
      expect(report.totalRecords).toBe(2)
      expect(report.validCoordinatesCount).toBe(1)
      expect(report.validCoordinatesPercentage).toBe(50.0)
      expect(report.traceableSourceCount).toBe(1)
      expect(report.traceableSourcePercentage).toBe(50.0)
      expect(report.phoneProvidedCount).toBe(1)
      expect(report.phoneVerificationBreakdown.independently_verified).toBe(1)
      expect(report.phoneVerificationBreakdown.unverified).toBe(1)
    })
  })
})
