import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('Rate Limiter (lib/rate-limit.ts)', () => {
  it('allows requests within the limit', () => {
    const key = `test-ip-${Date.now()}`
    const res1 = rateLimit(key, 3, 10_000)
    expect(res1.ok).toBe(true)
    expect(res1.retryAfter).toBe(0)

    const res2 = rateLimit(key, 3, 10_000)
    expect(res2.ok).toBe(true)

    const res3 = rateLimit(key, 3, 10_000)
    expect(res3.ok).toBe(true)
  })

  it('blocks requests exceeding the limit and returns accurate retryAfter', () => {
    const key = `test-block-${Date.now()}`
    rateLimit(key, 2, 5_000)
    rateLimit(key, 2, 5_000)

    const blocked = rateLimit(key, 2, 5_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
    expect(blocked.retryAfter).toBeLessThanOrEqual(5)
  })

  it('resets rate limit counter after the window expires', async () => {
    const key = `test-expiry-${Date.now()}`
    rateLimit(key, 1, 50) // 50ms window
    const blocked = rateLimit(key, 1, 50)
    expect(blocked.ok).toBe(false)

    // Wait 60ms for window to pass
    await new Promise((r) => setTimeout(r, 60))

    const allowedAgain = rateLimit(key, 1, 50)
    expect(allowedAgain.ok).toBe(true)
  })

  it('isolates buckets for different IP keys', () => {
    const ip1 = `user-a-${Date.now()}`
    const ip2 = `user-b-${Date.now()}`

    rateLimit(ip1, 1, 10_000)
    const ip1Blocked = rateLimit(ip1, 1, 10_000)
    expect(ip1Blocked.ok).toBe(false)

    const ip2Allowed = rateLimit(ip2, 1, 10_000)
    expect(ip2Allowed.ok).toBe(true)
  })

  it('extracts client IP from x-forwarded-for header properly', () => {
    const reqWithForwarded = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }
    })
    expect(getClientIp(reqWithForwarded)).toBe('203.0.113.195')

    const reqWithRealIp = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.1' }
    })
    expect(getClientIp(reqWithRealIp)).toBe('198.51.100.1')

    const reqNoHeader = new Request('http://localhost')
    expect(getClientIp(reqNoHeader)).toBe('unknown')
  })
})
