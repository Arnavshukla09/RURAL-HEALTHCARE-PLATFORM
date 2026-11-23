import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ success: true })), rateLimitResponse: vi.fn() }))
const { db } = vi.hoisted(() => ({ db: { from: vi.fn() } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => db) }))
import { GET } from '@/app/api/providers/route'
import { AbdmGatewayClient } from '@/lib/abdm/client'
afterEach(() => vi.unstubAllEnvs())
describe('Public service boundaries', () => {
  it('selects explicit public directory fields without reading patient contacts', async () => {
    const select = vi.fn(), eq = vi.fn(), limit = vi.fn(async () => ({ data: [{ id: 'provider', name: 'Public clinic' }], error: null }))
    select.mockReturnValue({ eq }); eq.mockReturnValue({ limit }); db.from.mockReturnValue({ select })
    const response = await GET(new NextRequest('http://localhost/api/providers'))
    expect(response.status).toBe(200)
    expect(select).toHaveBeenCalledWith('id, name, phone, location, specialization, bio, avatar_url, is_verified')
    expect(db.from).toHaveBeenCalledTimes(1)
    expect(db.from).toHaveBeenCalledWith('healthcare_providers')
  })
  it('never presents format validation as live national identity verification', async () => {
    vi.stubEnv('ABDM_CLIENT_ID', 'placeholder-client'); vi.stubEnv('ABDM_CLIENT_SECRET', 'placeholder-secret')
    const client = new AbdmGatewayClient()
    expect(client.isLive).toBe(false)
    const result = await client.verifyAbha('example@abdm')
    expect(result.mode).toBe('simulated')
    expect(result.message).toContain('identity not verified')
  })
})
