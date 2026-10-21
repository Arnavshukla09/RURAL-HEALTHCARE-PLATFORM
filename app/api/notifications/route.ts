/**
 * app/api/notifications/route.ts
 *
 * Route handler for User and Broadcast Notifications API.
 * Architecture: Delegates database queries to lib/services/notifications.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import {
  handleGetNotifications,
  handleCreateNotification,
  handleUpdateNotification,
} from "@/lib/services/notifications.service"

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "read")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const { searchParams } = new URL(request.url)
    return await handleGetNotifications(supabase, user, searchParams)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()
    return await handleCreateNotification(supabase, user, body)
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()
    return await handleUpdateNotification(supabase, user, body)
  } catch (error) {
    return authErrorResponse(error)
  }
}