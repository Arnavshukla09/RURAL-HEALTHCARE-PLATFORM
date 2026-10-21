/**
 * lib/pagination.ts
 *
 * Cursor-based pagination utilities for scalable list endpoints.
 * Prevents unbounded queries (H8) while maintaining deterministic ordering.
 */

export interface CursorPayload {
  createdAt: string
  id: string
}

export interface PaginationParams {
  limit: number
  cursor: CursorPayload | null
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  totalLoaded?: number
}

/**
 * Parses limit and cursor from URL search parameters.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const rawLimit = parseInt(searchParams.get("limit") || `${defaultLimit}`, 10)
  const limit = Math.min(Math.max(isNaN(rawLimit) ? defaultLimit : rawLimit, 1), maxLimit)

  const cursorStr = searchParams.get("cursor")
  let cursor: CursorPayload | null = null

  if (cursorStr) {
    try {
      const decoded = Buffer.from(cursorStr, "base64url").toString("utf-8")
      const parsed = JSON.parse(decoded)
      if (parsed.createdAt && parsed.id) {
        cursor = { createdAt: parsed.createdAt, id: parsed.id }
      }
    } catch {
      // Invalid cursor string is safely ignored
      cursor = null
    }
  }

  return { limit, cursor }
}

/**
 * Encodes a row's created_at and id into a base64url cursor.
 */
export function encodeCursor(item: { created_at: string; id: string }): string {
  const payload = JSON.stringify({ createdAt: item.created_at, id: item.id })
  return Buffer.from(payload, "utf-8").toString("base64url")
}

/**
 * Processes Supabase query results (fetched with limit + 1)
 * into a PaginatedResponse.
 */
export function paginateResults<T extends { created_at: string; id: string }>(
  items: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  const lastItem = data[data.length - 1]
  const nextCursor = hasMore && lastItem ? encodeCursor(lastItem) : null

  return {
    data,
    nextCursor,
    totalLoaded: data.length,
  }
}
