// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/context/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-123' } }) }))

describe('Upgrade button triggers redirect', () => {
  const originalFetch = global.fetch
  const originalAssign = window.location.assign

  beforeEach(() => {
    (import.meta as any).env = { ...(import.meta as any).env, VITE_ASSISTANT_BASE_URL: 'http://localhost:8787' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://stripe.test/checkout' }) })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.location as any).assign = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch as any
    window.location.assign = originalAssign
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('clicking Upgrade to Pro calls location.assign with checkout URL', async () => {
    vi.doMock('@/context/BillingProvider', async () => {
      const mod = await import('@/context/BillingProvider')
      // Reuse real provider but stub out refresh to avoid network
      return {
        ...mod,
        useBilling: () => ({ plan: 'free', upgrade: mod['BillingProvider'].prototype?.upgrade ?? vi.fn(), manage: vi.fn(), refresh: vi.fn() })
      }
    })
    const { default: Pricing } = await import('@/components/Pricing')
    render(React.createElement(Pricing))
    const btn = await screen.findByText(/Upgrade to Pro/i)
    fireEvent.click(btn)
    expect(window.location.assign).toHaveBeenCalled()
    const url = (window.location.assign as unknown as jest.Mock).mock.calls?.[0]?.[0] || (window.location.assign as any).mock.calls[0][0]
    expect(url).toContain('stripe.test/checkout')
  })
})

