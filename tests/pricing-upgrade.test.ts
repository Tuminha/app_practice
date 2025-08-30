// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/context/BillingProvider', () => {
  return {
    useBilling: () => ({ plan: 'free', upgrade: vi.fn(), manage: vi.fn(), refresh: vi.fn() })
  }
})

import Pricing from '@/components/Pricing'

describe('Pricing component', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls upgrade on Upgrade to Pro button click', async () => {
    // Capture the upgrade mock returned from the module
    let captured: any
    vi.doMock('@/context/BillingProvider', () => {
      const upgrade = vi.fn()
      captured = upgrade
      return { useBilling: () => ({ plan: 'free', upgrade, manage: vi.fn(), refresh: vi.fn() }) }
    })
    const { default: PricingCmp } = await import('@/components/Pricing')
    render(React.createElement(PricingCmp))
    const btn = await screen.findByText(/Upgrade to Pro/i)
    fireEvent.click(btn)
    expect(captured).toHaveBeenCalledTimes(1)
  })
})

