import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || (!anon && !service)) {
  console.error('Missing VITE_SUPABASE_URL and a key (VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY).')
  process.exit(1)
}

const supabase = createClient(url, service || anon, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const args = process.argv.slice(2)
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20
const tables = args.filter((a) => !a.startsWith('--'))
const targets = tables.length ? tables : ['chat_sessions', 'messages', 'billing_status']

;(async () => {
  console.log('Supabase URL:', url)
  console.log('Tables:', targets.join(', '))
  for (const t of targets) {
    try {
      const { data, error, count } = await supabase
        .from(t)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .limit(limit)
      if (error) throw error
      console.log(`\n=== ${t} (showing up to ${limit}, total: ${count ?? 'unknown'}) ===`)
      if (!data || !data.length) {
        console.log('(no rows)')
      } else {
        data.forEach((row, i) => console.log(`#${i + 1}`, row))
      }
    } catch (e) {
      console.log(`\n=== ${t} ===`)
      console.log('Error:', e?.message || String(e))
    }
  }
})()

