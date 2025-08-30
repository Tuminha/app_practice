import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || (!anon && !service)) {
  console.error('Missing VITE_SUPABASE_URL and a key (VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY).')
  process.exit(1)
}

// Prefer service role if provided (read-only inspection on your local machine)
const usingService = Boolean(service)
const supabase = createClient(url, service || anon, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function countRows(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function sampleRows(table, limit = 5) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

async function describeFromSample(rows) {
  if (!rows || rows.length === 0) return []
  const keys = Object.keys(rows[0])
  return keys
}

async function inspectTable(name) {
  try {
    const total = await countRows(name)
    const rows = await sampleRows(name)
    const cols = await describeFromSample(rows)
    return { name, count: total, columns: cols, sample: rows }
  } catch (e) {
    return { name, error: e?.message || String(e) }
  }
}

;(async () => {
  console.log('Supabase URL:', url)
  console.log('Using service role key:', usingService)
  const projectRef = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1]
  if (projectRef) console.log('Project ref:', projectRef)

  // Known app tables. Add more here if needed.
  const targets = ['chat_sessions', 'messages']
  const results = []
  for (const t of targets) {
    // eslint-disable-next-line no-await-in-loop
    const r = await inspectTable(t)
    results.push(r)
  }

  for (const r of results) {
    console.log('\n===', r.name, '===')
    if (r.error) {
      console.log('Error:', r.error)
      if (!service) {
        console.log('Note: If this is a row-level security (RLS) permission error, add SUPABASE_SERVICE_ROLE_KEY to your .env temporarily for inspection only (never ship it to the client).')
      }
      continue
    }
    console.log('Count:', r.count)
    console.log('Columns (from sample):', r.columns?.length ? r.columns : '(empty table or unknown)')
    if (r.sample?.length) {
      console.log('Sample rows:')
      r.sample.forEach((row, i) => console.log(`#${i + 1}`, row))
    } else {
      console.log('No rows to display.')
    }
  }

  if (results.every((r) => r.error && /relation/i.test(r.error))) {
    console.log('\nIt looks like the tables are not created yet.')
    console.log('Run the SQL in docs/SUPABASE_SETUP.md to create them, then rerun this script.')
  }
})()
