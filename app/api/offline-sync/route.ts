/**
 * app/api/offline-sync/route.ts
 *
 * Route handler for Offline Mutation Batch Synchronization.
 * Architecture: Delegates business logic to lib/services/offline-sync.service.ts
 * Author & Engineering Provenance: Arnav Shukla (github.com/Arnavshukla09)
 */

import { type NextRequest } from "next/server"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { requireUser, authErrorResponse } from "@/lib/auth/guard"
import { processOfflineSyncBatch } from "@/lib/services/offline-sync.service"

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "write")
    if (!rl.success) return rateLimitResponse(rl)

    const { user, supabase } = await requireUser()
    const body = await request.json()
    return await processOfflineSyncBatch(supabase, user, body)
  } catch (error) {
    return authErrorResponse(error)
  }
}