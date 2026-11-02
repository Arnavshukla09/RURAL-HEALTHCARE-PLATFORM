import { describe, it, expect } from "vitest"
import {
  calculateScaledDimensions,
  dataUrlToBlob,
  estimateTransferTimeSecs,
} from "@/lib/media/compressor"

describe("Clinical Media Compressor Subsystem (Phase 1)", () => {
  describe("calculateScaledDimensions", () => {
    it("preserves aspect ratio when downscaling a large camera photograph", () => {
      // 4000x3000 (4:3 aspect ratio, 12MP smartphone photo)
      const scaled = calculateScaledDimensions(4000, 3000, 1280)
      expect(scaled.width).toBe(1280)
      expect(scaled.height).toBe(960)
    })

    it("scales portrait orientation correctly", () => {
      // 3000x4000 (portrait rash photo)
      const scaled = calculateScaledDimensions(3000, 4000, 1280)
      expect(scaled.height).toBe(1280)
      expect(scaled.width).toBe(960)
    })

    it("does not enlarge images already smaller than maxDimension", () => {
      const scaled = calculateScaledDimensions(800, 600, 1280)
      expect(scaled.width).toBe(800)
      expect(scaled.height).toBe(600)
    })

    it("handles square dimensions accurately", () => {
      const scaled = calculateScaledDimensions(2048, 2048, 1280)
      expect(scaled.width).toBe(1280)
      expect(scaled.height).toBe(1280)
    })
  })

  describe("dataUrlToBlob conversion", () => {
    it("converts a valid Base64 data URL to a binary Blob with matching MIME type", () => {
      // 1x1 transparent PNG data URL
      const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      const blob = dataUrlToBlob(dataUrl)
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe("image/png")
      expect(blob.size).toBeGreaterThan(0)
    })

    it("throws a descriptive error on malformed data URLs", () => {
      expect(() => dataUrlToBlob("invalid-url-string")).toThrow("Invalid Data URL format")
    })
  })

  describe("estimateTransferTimeSecs", () => {
    it("calculates realistic upload durations across Indian rural cellular tiers", () => {
      // 150 KB compressed clinical photo = 153,600 bytes
      const photoBytes = 153600

      const time2gGprs = estimateTransferTimeSecs(photoBytes, "2G_GPRS")
      const time2gEdge = estimateTransferTimeSecs(photoBytes, "2G_EDGE")
      const time3g = estimateTransferTimeSecs(photoBytes, "3G")
      const time4g = estimateTransferTimeSecs(photoBytes, "4G")

      // 150KB on 2G GPRS (~5KB/s) ~ 30.7s
      expect(time2gGprs).toBeCloseTo(30.7, 1)
      // 150KB on 2G EDGE (~15KB/s) ~ 10.2s
      expect(time2gEdge).toBeCloseTo(10.2, 1)
      // 150KB on 3G (~187.5KB/s) ~ 0.8s
      expect(time3g).toBeLessThan(1.5)
      // 150KB on 4G (< 0.5s)
      expect(time4g).toBeLessThan(0.5)
    })
  })
})
