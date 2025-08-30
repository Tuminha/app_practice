import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Google OAuth', () => {
  it('returns an authorization URL (provider enabled)', async () => {
    const redirectTo = (import.meta as any).env?.VITE_APP_URL || 'http://localhost:8080'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        flowType: 'pkce',
      },
    })

    if (error) {
      console.info('OAuth error:', error.message)
    }

    expect(error).toBeNull()
    expect(data?.url, 'Expected OAuth authorize URL').toBeTruthy()
    // Basic shape check of the authorize URL
    expect(data!.url).toMatch(/\/auth\/v1\/authorize/)
    expect(data!.url).toMatch(/provider=google/)
  })
})

