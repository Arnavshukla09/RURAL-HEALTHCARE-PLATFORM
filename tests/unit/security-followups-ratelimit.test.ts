import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { GET as getReady } from '@/app/api/ready/route'

describe('Security Follow-ups: Rate Limiting & Fast Liveness Probes', () => {
  it('enforces 10 req/min limit on /api/auth/login and responds with 429 on the 11th request', async () => {
    const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`

    // 10 valid requests within the limit
    for (let i = 0; i < 10; i++) {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify({ email: '', password: '' }), // Bad request 400, but consumed by rate limiter
      })
      const res = await POST(req)
      expect(res.status).not.toBe(429)
    }

    // 11th request must receive 429 Too Many Requests
    const req11 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIp,
      },
      body: JSON.stringify({ email: 'test@ruralhealth.com', password: 'password123' }),
    })
    const res11 = await POST(req11)
    expect(res11.status).toBe(429)

    const json = await res11.json()
    expect(json.code).toBe('RATE_LIMITED')
    expect(res11.headers.get('Retry-After')).toBeTruthy()
  })

  it('keeps /api/ready instant without database overhead', async () => {
    const req = new NextRequest('http://localhost:3000/api/ready')
    const start = performance.now()
    const res = await getReady(req)
    const duration = performance.now() - start

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ready).toBe(true)
    expect(duration).toBeLessThan(100) // Fast in-memory response (<100ms)
  })
})
