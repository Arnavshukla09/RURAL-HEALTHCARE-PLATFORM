import { afterEach, describe, expect, it, vi } from "vitest"
import { isRequestOriginAllowed } from "@/lib/security/request-origin"
afterEach(() => vi.unstubAllEnvs())
describe("exact application origins", () => {
  it("allows the request's own preview without trusting every provider subdomain", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_APP_URL", ""); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(isRequestOriginAllowed("https://own-preview.vercel.app", "https://own-preview.vercel.app/api/assistant/voice")).toBe(true)
    expect(isRequestOriginAllowed("https://attacker.vercel.app", "https://own-preview.vercel.app/api/assistant/voice")).toBe(false)
    expect(isRequestOriginAllowed("http://localhost:3000", "https://own-preview.vercel.app/api/assistant/voice")).toBe(false)
  })
  it("allows only the exact configured origin, including its scheme and port", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://clinic.example"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(isRequestOriginAllowed("https://clinic.example", "https://preview.example/api" )).toBe(true)
    for (const origin of ["https://clinic.example.evil.test", "https://clinic.example:444", "http://clinic.example", "null", "https://user:pass@clinic.example"]) expect(isRequestOriginAllowed(origin, "https://preview.example/api")).toBe(false)
  })
})
