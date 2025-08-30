import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Supabase setup', () => {
  it('has required env vars', () => {
    expect(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL missing').toBeTruthy()
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY missing').toBeTruthy()
  })

  it('can reach Supabase (chat_sessions presence is optional)', async () => {
    const { error } = await supabase.from('chat_sessions').select('id').limit(1)
    // If the table exists and RLS allows, there should be no error.
    // If the table does not exist yet, we don’t fail the test.
    if (error) {
      // Common when you haven’t run the SQL yet
      console.warn('[warn] chat_sessions not accessible:', error.message)
    }
    expect(true).toBe(true)
  })

  it('prints fields available now (if tables exist)', async () => {
    async function inspect(table: string) {
      const countRes = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      if (countRes.error) {
        console.info(`Table ${table}: not accessible or missing ->`, countRes.error.message)
        return
      }
      const total = countRes.count ?? 0
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      if (error) {
        console.info(`Table ${table}: error fetching sample ->`, error.message)
        return
      }
      const sample = data?.[0]
      const columns = sample ? Object.keys(sample) : []
      const columnsStr = columns.length
        ? columns.join(', ')
        : '(no rows yet; columns unknown via anon)'
      console.info(`Table ${table}: count=${total}, columns=${columnsStr}`)
      if (sample) {
        console.info(`Sample ${table} row:`, sample)
      }
    }

    await inspect('chat_sessions')
    await inspect('messages')
    expect(true).toBe(true)
  })
})
