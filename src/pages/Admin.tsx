import React from 'react'
import { useAuth } from '@/context/AuthProvider'

type BillingRow = {
  id: string
  user_id: string | null
  stripe_customer_id: string | null
  plan: 'free' | 'pro'
  current_period_end: string | null
  updated_at: string
}

const Admin = () => {
  const { user } = useAuth()
  const [rows, setRows] = React.useState<BillingRow[]>([])
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    const token = (import.meta as any).env?.VITE_ADMIN_TOKEN as string | undefined
    const base = (import.meta as any).env?.VITE_ASSISTANT_BASE_URL || 'http://localhost:8787'
    if (!token) {
      setError('Missing VITE_ADMIN_TOKEN (dev-only).')
      return
    }
    fetch(`${base}/api/billing/admin/list?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = await r.json()
        setRows(json?.rows || [])
      })
      .catch((e) => setError(String(e.message || e)))
  }, [])

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Admin — Billing</h1>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-2">User</th>
              <th className="text-left p-2">Stripe Customer</th>
              <th className="text-left p-2">Plan</th>
              <th className="text-left p-2">Period End</th>
              <th className="text-left p-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.user_id || '-'}</td>
                <td className="p-2">{r.stripe_customer_id || '-'}</td>
                <td className="p-2 uppercase">{r.plan}</td>
                <td className="p-2">{r.current_period_end || '-'}</td>
                <td className="p-2">{r.updated_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Dev-only panel. Do not expose VITE_ADMIN_TOKEN in production.</p>
    </div>
  )
}

export default Admin

