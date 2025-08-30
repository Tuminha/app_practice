import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { buildSeedData } from '../src/lib/seed.js'

const url = process.env.VITE_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const userId = process.env.SEED_USER_ID // optional fixed user id

if (!url || !service) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false } })

async function main() {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id || (await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })).data.users?.[0]?.id
  if (!uid) {
    console.error('No user found. Log in at least once or set SEED_USER_ID in .env')
    process.exit(1)
  }

  const { session, messages } = buildSeedData(uid)

  const { data: s, error: se } = await supabase.from('chat_sessions').insert(session).select().single()
  if (se) throw se
  const sid = s.id

  const rows = messages.map(m => ({ ...m, session_id: sid }))
  const { error: me } = await supabase.from('messages').insert(rows)
  if (me) throw me
  console.log('Seeded session', sid, 'with', rows.length, 'messages')
}

main().catch((e) => {
  console.error('Seed failed:', e.message || e)
  process.exit(1)
})

