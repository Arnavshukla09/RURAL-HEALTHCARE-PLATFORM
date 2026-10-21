import crypto from "crypto"
import { type NextRequest } from "next/server"

/**
 * lib/logger.ts
 *
 * Structured JSON Logging for Observability (Phase 8, Audit M6)
 * - Emits single-line JSON logs to stdout/stderr.
 * - Extracts or generates x-request-id.
 * - Hashes user IDs (SHA-256 12-char prefix); NEVER logs raw PII, emails, or medical data.
 */

export interface LogContext {
  requestId?: string
  route?: string
  method?: string
  status?: number
  durationMs?: number
  userId?: string
  [key: string]: any
}

export function hashUserId(userId?: string | null): string | undefined {
  if (!userId) return undefined
  return crypto.createHash("sha256").update(userId).digest("hex").slice(0, 12)
}

export function getRequestId(request: Request | NextRequest): string {
  const existing = request.headers.get("x-request-id")
  if (existing) return existing
  return crypto.randomUUID()
}

export function logInfo(message: string, context?: LogContext) {
  writeLog("info", message, context)
}

export function logWarn(message: string, context?: LogContext) {
  writeLog("warn", message, context)
}

export function logError(message: string, context?: LogContext, error?: any) {
  const errDetails = error
    ? {
        errorMessage: error?.message || String(error),
        errorStack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      }
    : {}
  writeLog("error", message, { ...context, ...errDetails })
}

function writeLog(level: "info" | "warn" | "error", message: string, context: LogContext = {}) {
  const { requestId, route, method, status, durationMs, userId, ...extra } = context

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: requestId || undefined,
    route: route || undefined,
    method: method || undefined,
    status: status !== undefined ? status : undefined,
    durationMs: durationMs !== undefined ? Math.round(durationMs) : undefined,
    userIdHash: hashUserId(userId),
    ...extra,
  }

  const jsonStr = JSON.stringify(entry)
  if (level === "error") {
    console.error(jsonStr)
  } else if (level === "warn") {
    console.warn(jsonStr)
  } else {
    console.log(jsonStr)
  }
}
