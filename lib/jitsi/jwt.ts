/**
 * lib/jitsi/jwt.ts
 *
 * Cryptographic Teleconsultation Security (Phase 3).
 *
 * $0 Free-Tier Design:
 * - Operates without paid third-party token services by default (pure Node.js crypto HS256).
 * - Generates standard Jitsi Meet / JaaS compatible JWT payloads embedding user role, room name, and 1-hour expiration.
 * - If JITSI_APP_SECRET or JAAS_API_KEY is configured in the environment, signs and returns the cryptographic JWT.
 * - If no secret is configured (default $0 free tier), gracefully falls back to room-id access with strict time-window gating.
 */

import { createHmac } from "crypto"

export interface JitsiTokenPayload {
  context: {
    user: {
      id: string
      name: string
      email?: string
      avatar?: string
    }
    features?: {
      recording?: boolean
      livestreaming?: boolean
      "screen-sharing"?: boolean
    }
  }
  aud: string
  iss: string
  sub: string
  room: string
  iat: number
  exp: number
  moderator?: boolean
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

/**
 * Generate an HS256 JWT for Jitsi / JaaS room access.
 * Returns null if no server signing secret is configured ($0 Free Tier fallback).
 */
export function generateJitsiToken(params: {
  roomName: string
  userId: string
  userName: string
  role: "patient" | "doctor" | "admin"
  durationSeconds?: number
}): { token: string | null; requiresToken: boolean } {
  const secret = process.env.JITSI_APP_SECRET || process.env.JAAS_API_KEY
  const appId = process.env.JITSI_APP_ID || "RuralHealthcare"

  if (!secret) {
    // Zero-cost posture: No paid JaaS or self-hosted secret needed
    return { token: null, requiresToken: false }
  }

  const now = Math.floor(Date.now() / 1000)
  const duration = params.durationSeconds || 3600 // 1 hour validity

  const header = {
    alg: "HS256",
    typ: "JWT",
  }

  const payload: JitsiTokenPayload = {
    context: {
      user: {
        id: params.userId,
        name: params.userName,
      },
      features: {
        recording: false,      // Prevent recording PHI
        livestreaming: false,  // Prevent public streaming
        "screen-sharing": true,
      },
    },
    aud: "jitsi",
    iss: appId,
    sub: params.role === "doctor" || params.role === "admin" ? appId : "patient",
    room: params.roomName,
    iat: now,
    exp: now + duration,
    moderator: params.role === "doctor" || params.role === "admin",
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${headerEncoded}.${payloadEncoded}`

  const signature = createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  return {
    token: `${dataToSign}.${signature}`,
    requiresToken: true,
  }
}
