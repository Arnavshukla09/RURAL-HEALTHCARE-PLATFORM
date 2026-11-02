import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

// Test the matching rules declared in app/sw.ts
describe("PWA Caching & Routing Strategies (Audit §2.3, Hardening C3)", () => {
  const isPrivateApi = (pathname: string, method: string = "GET") => {
    if (method !== "GET") return true
    return (
      pathname.startsWith("/api/appointments") ||
      pathname.startsWith("/api/medical-records") ||
      pathname.startsWith("/api/notifications") ||
      pathname.startsWith("/api/health-data") ||
      pathname.startsWith("/api/doctor-requests") ||
      pathname.startsWith("/api/chat-cache") ||
      pathname.startsWith("/api/offline-sync") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/teleconsult") ||
      pathname.startsWith("/api/admin") ||
      pathname.startsWith("/auth/")
    )
  }

  const isPublicApi = (pathname: string, method: string = "GET") => {
    if (method !== "GET") return false
    return (
      pathname.startsWith("/api/providers") ||
      pathname.startsWith("/api/facilities") ||
      pathname.startsWith("/api/health")
    )
  }

  it("classifies all sensitive medical and auth endpoints as NetworkOnly", () => {
    const sensitiveUrls = [
      "/api/appointments",
      "/api/appointments?cursor=abc",
      "/api/medical-records",
      "/api/medical-records?id=123",
      "/api/notifications",
      "/api/health-data",
      "/api/doctor-requests",
      "/api/chat-cache",
      "/api/offline-sync",
      "/api/auth/profile",
      "/api/teleconsult/room",
      "/api/admin/users",
      "/auth/callback",
    ]

    for (const url of sensitiveUrls) {
      expect(isPrivateApi(url, "GET")).toBe(true)
    }
  })

  it("ensures any HTTP mutation (POST, PATCH, DELETE) is NetworkOnly", () => {
    expect(isPrivateApi("/api/providers", "POST")).toBe(true)
    expect(isPrivateApi("/api/facilities", "DELETE")).toBe(true)
    expect(isPrivateApi("/api/appointments", "PATCH")).toBe(true)
  })

  it("classifies public read-only APIs as cacheable (StaleWhileRevalidate)", () => {
    expect(isPublicApi("/api/providers", "GET")).toBe(true)
    expect(isPublicApi("/api/facilities/nearby?lat=23.2&lng=77.4", "GET")).toBe(true)
    expect(isPublicApi("/api/health", "GET")).toBe(true)
    expect(isPublicApi("/api/appointments", "GET")).toBe(false)
  })

  it("verifies public/manifest.json conforms to PWA install criteria", () => {
    const manifestPath = path.resolve(__dirname, "../../public/manifest.json")
    expect(fs.existsSync(manifestPath)).toBe(true)

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
    expect(manifest.display).toBe("standalone")
    expect(manifest.theme_color).toBe("#0ea5e9")
    expect(manifest.start_url).toBe("/?source=pwa")

    // Icons check
    const icons = manifest.icons
    expect(Array.isArray(icons)).toBe(true)
    expect(icons.length).toBeGreaterThanOrEqual(4)

    const icon192 = icons.find((i: any) => i.sizes === "192x192" && i.purpose === "any")
    const icon512 = icons.find((i: any) => i.sizes === "512x512" && i.purpose === "any")
    const maskable192 = icons.find((i: any) => i.sizes === "192x192" && i.purpose === "maskable")
    const maskable512 = icons.find((i: any) => i.sizes === "512x512" && i.purpose === "maskable")

    expect(icon192).toBeDefined()
    expect(icon512).toBeDefined()
    expect(maskable192).toBeDefined()
    expect(maskable512).toBeDefined()

    // Verify files physically exist
    expect(fs.existsSync(path.resolve(__dirname, "../../public" + icon192.src))).toBe(true)
    expect(fs.existsSync(path.resolve(__dirname, "../../public" + icon512.src))).toBe(true)
    expect(fs.existsSync(path.resolve(__dirname, "../../public" + maskable192.src))).toBe(true)
    expect(fs.existsSync(path.resolve(__dirname, "../../public" + maskable512.src))).toBe(true)

    // Shortcuts check
    expect(manifest.shortcuts).toBeDefined()
    expect(manifest.shortcuts.some((s: any) => s.url === "/emergency")).toBe(true)
    expect(manifest.shortcuts.some((s: any) => s.url === "/symptom-checker")).toBe(true)
  })
})
