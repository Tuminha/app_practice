import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCheckoutUrl, getPortalUrl, getPlanStatus } from '@/lib/billing'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch as any
})

describe('billing client', () => {
  it('requests checkout URL for a plan', async () => {
    (import.meta as any).env = { ...(import.meta as any).env, VITE_ASSISTANT_BASE_URL: 'http://localhost:8787' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://stripe.test/checkout' }) })
    const url = await getCheckoutUrl('pro')
    expect(url).toContain('stripe.test/checkout')
    expect(global.fetch).toHaveBeenCalled()
    const calledUrl = (global.fetch as any).mock.calls[0][0] as string
    expect(calledUrl).toMatch(/^http:\/\/localhost:8787\/api\/billing\/checkout/)
  })

  it('requests portal URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://stripe.test/portal' }) })
    const url = await getPortalUrl()
    expect(url).toContain('stripe.test/portal')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('gets plan status with optional customer id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ plan: 'pro' }) })
    const s = await getPlanStatus({ customerId: 'cus_123' })
    expect(s.plan).toBe('pro')
    const call = (global.fetch as any).mock.calls[0][0] as string
    expect(call).toMatch(/customer_id=cus_123/)
  })

  it('gets plan status with user id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ plan: 'free' }) })
    await getPlanStatus({ userId: 'user-1' })
    const call = (global.fetch as any).mock.calls[0][0] as string
    expect(call).toMatch(/user_id=user-1/)
  })
})
