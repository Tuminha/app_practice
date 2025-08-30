export type Plan = 'starter' | 'pro'

function apiBase() {
  const envBase = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_ASSISTANT_BASE_URL) as string | undefined
  if (envBase) return envBase
  if (typeof window !== 'undefined' && window.location) return window.location.origin
  // Node/test fallback: assume local assistant server if no env available
  return 'http://localhost:8787'
}

export async function getCheckoutUrl(plan: Plan, opts?: { userId?: string }): Promise<string> {
  const url = `${apiBase()}/api/billing/checkout`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, user_id: opts?.userId }),
  })
  if (!res.ok) throw new Error(`Checkout failed: ${res.status}`)
  const json = await res.json().catch(() => ({})) as any
  if (!json?.url) throw new Error('Missing checkout URL in response')
  return json.url as string
}

export async function getPortalUrl(customerId?: string): Promise<string> {
  const url = `${apiBase()}/api/billing/portal`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: customerId }) })
  if (!res.ok) throw new Error(`Portal failed: ${res.status}`)
  const json = await res.json().catch(() => ({})) as any
  if (!json?.url) throw new Error('Missing portal URL in response')
  return json.url as string
}

export async function getPlanStatus(arg?: { customerId?: string; userId?: string }): Promise<{ plan: 'free' | 'pro' }>{
  const qs = new URLSearchParams()
  if (arg?.customerId) qs.set('customer_id', arg.customerId)
  if (arg?.userId) qs.set('user_id', arg.userId)
  const url = `${apiBase()}/api/billing/status${qs}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Status failed: ${res.status}`)
  const json = await res.json().catch(() => ({})) as any
  return { plan: (json?.plan === 'pro' ? 'pro' : 'free') }
}
