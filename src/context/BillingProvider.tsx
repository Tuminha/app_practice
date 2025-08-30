import React from 'react'
import { getCheckoutUrl, getPlanStatus, getPortalUrl } from '@/lib/billing'
import { useAuth } from '@/context/AuthProvider'

type BillingContextType = {
  plan: 'free' | 'pro'
  refresh: () => Promise<void>
  upgrade: () => Promise<void>
  manage: (customerId?: string) => Promise<void>
}

const BillingContext = React.createContext<BillingContextType | undefined>(undefined)

export const BillingProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [plan, setPlan] = React.useState<'free' | 'pro'>('free')
  const { user } = useAuth()

  const refresh = React.useCallback(async () => {
    try {
      const envCid = (import.meta as any).env?.VITE_STRIPE_CUSTOMER_ID as string | undefined
      const savedCid = typeof window !== 'undefined' ? window.localStorage.getItem('billing_customer_id') || undefined : undefined
      const s = await getPlanStatus({ customerId: savedCid || envCid, userId: user?.id })
      setPlan(s.plan)
    } catch {
      setPlan('free')
    }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  const upgrade = async () => {
    try {
      const url = await getCheckoutUrl('pro', { userId: user?.id })
      if (typeof window !== 'undefined' && window.location) {
        // easier to spy in tests and more robust than setting href directly
        window.location.assign(url)
      }
    } catch (e) {
      console.error('Upgrade failed:', (e as Error).message)
      if (typeof window !== 'undefined') {
        // Minimal UX feedback
        alert('Unable to start checkout. Please ensure the assistant server is running and Stripe env vars are set.')
      }
    }
  }

  const manage = async (customerId?: string) => {
    const envCid = (import.meta as any).env?.VITE_STRIPE_CUSTOMER_ID as string | undefined
    const url = await getPortalUrl(customerId || envCid)
    window.location.href = url
  }

  return (
    <BillingContext.Provider value={{ plan, refresh, upgrade, manage }}>
      {children}
    </BillingContext.Provider>
  )
}

export const useBilling = () => {
  const ctx = React.useContext(BillingContext)
  if (!ctx) throw new Error('useBilling must be used within BillingProvider')
  return ctx
}
