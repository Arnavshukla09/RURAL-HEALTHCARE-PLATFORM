import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock @supabase/ssr createServerClient to verify whether getUser is invoked
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } })
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { role: "patient" } }),
        })),
      })),
    })),
  })),
}))

import { middleware } from "@/middleware"

describe("Edge Middleware Security & Gating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key"
  })

  describe("HTTP Method Restriction Guard", () => {
    it("rejects TRACE method with 405 Method Not Allowed", async () => {
      const req = {
        method: "TRACE",
        nextUrl: new URL("http://localhost:3000/api/health"),
        headers: new Headers(),
      } as unknown as NextRequest
      const res = await middleware(req)
      expect(res.status).toBe(405)
      expect(res.headers.get("Allow")).toContain("GET")
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it("rejects TRACK method with 405 Method Not Allowed", async () => {
      const req = {
        method: "TRACK",
        nextUrl: new URL("http://localhost:3000/api/facilities/nearby"),
        headers: new Headers(),
      } as unknown as NextRequest
      const res = await middleware(req)
      expect(res.status).toBe(405)
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it("rejects CONNECT method with 405 Method Not Allowed", async () => {
      const req = {
        method: "CONNECT",
        nextUrl: new URL("http://localhost:3000/"),
        headers: new Headers(),
      } as unknown as NextRequest
      const res = await middleware(req)
      expect(res.status).toBe(405)
      expect(mockGetUser).not.toHaveBeenCalled()
    })
  })

  describe("CORS Handling for API Routes", () => {
    it("allows OPTIONS preflight for same-origin requests", async () => {
      const req = new NextRequest("http://localhost:3000/api/facilities/nearby", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
        },
      })
      const res = await middleware(req)
      expect(res.status).toBe(204)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000")
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET")
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it("blocks OPTIONS preflight from malicious untrusted origins", async () => {
      const req = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "OPTIONS",
        headers: {
          origin: "https://evil-phishing-site.com",
        },
      })
      const res = await middleware(req)
      expect(res.status).toBe(403)
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it("blocks cross-origin API requests from untrusted origins", async () => {
      const req = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "POST",
        headers: {
          origin: "https://unauthorized-domain.com",
        },
      })
      const res = await middleware(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toBe("Cross-origin request blocked")
    })

    it("attaches Access-Control-Allow-Origin for legitimate origin on API route", async () => {
      const req = new NextRequest("http://localhost:3000/api/health", {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
        },
      })
      const res = await middleware(req)
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000")
      expect(res.headers.get("x-request-id")).toBeDefined()
    })
  })

  describe("Fast-Path Exemption for Public Routes", () => {
    it("bypasses Supabase getUser network call on public homepage", async () => {
      const req = new NextRequest("http://localhost:3000/", {
        method: "GET",
      })
      const res = await middleware(req)
      expect(res.status).toBe(200)
      expect(res.headers.get("x-request-id")).toBeDefined()
      expect(mockGetUser).not.toHaveBeenCalled()
    })

    it("bypasses Supabase getUser on /camps and /directory", async () => {
      const reqCamps = new NextRequest("http://localhost:3000/camps")
      await middleware(reqCamps)
      expect(mockGetUser).not.toHaveBeenCalled()

      const reqDir = new NextRequest("http://localhost:3000/directory")
      await middleware(reqDir)
      expect(mockGetUser).not.toHaveBeenCalled()
    })
  })

  describe("Authentication and Role Gating", () => {
    it("redirects unauthenticated user accessing /dashboard to /login", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const req = new NextRequest("http://localhost:3000/dashboard")
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toContain("/login?redirect=%2Fdashboard")
    })

    it("redirects unauthenticated user accessing /admin to /login", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const req = new NextRequest("http://localhost:3000/admin/users")
      const res = await middleware(req)
      expect(res.status).toBe(307)
      expect(res.headers.get("location")).toContain("/login?redirect=%2Fadmin%2Fusers")
    })
  })
})
