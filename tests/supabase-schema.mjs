import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !service) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const headers = {
  apikey: service,
  Authorization: `Bearer ${service}`,
}

async function pg(endpoint, params = '') {
  const u = `${url}/pg/${endpoint}${params}`
  const res = await fetch(u, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`PG meta request failed: ${res.status} ${res.statusText} for ${u}\n${text}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

function printSchema({ schemas, tables, columns }) {
  const publicTables = tables.filter(t => t.schema === 'public')
  console.log('Schemas:', schemas.map(s => s.name).join(', '))
  console.log('\nPublic tables:', publicTables.length ? publicTables.map(t => t.name).join(', ') : '(none)')

  for (const tbl of publicTables) {
    const cols = columns
      .filter(c => c.schema === 'public' && c.table === tbl.name)
      .sort((a, b) => a.position - b.position)
    console.log(`\n- ${tbl.name}`)
    if (!cols.length) {
      console.log('  (no columns reported)')
      continue
    }
    for (const c of cols) {
      const nullable = c.is_nullable ? 'nullable' : 'not null'
      const def = c.default_value ? ` default ${c.default_value}` : ''
      console.log(`  • ${c.name}: ${c.data_type} ${nullable}${def}`)
    }
  }
}

;(async () => {
  console.log('Supabase URL:', url)
  console.log('Using service role key: true')

  try {
    try {
      const schemas = await pg('schemas')
      // Prefer included_schemas, fallback to schema param if needed
      let tables
      try {
        tables = await pg('tables', '?included_schemas=public')
      } catch (_) {
        tables = await pg('tables', '?schema=public')
      }
      let columns
      try {
        columns = await pg('columns', '?schema=public')
      } catch (_) {
        // Some deployments accept filter syntax
        columns = await pg('columns', '?schema=eq.public')
      }
      printSchema({ schemas, tables, columns })
      return
    } catch (err) {
      if (err?.status && err.status !== 404) throw err
      // Fallback: use an RPC that returns information_schema for public
      const supabase = createClient(url, service)
      const { data, error } = await supabase.rpc('introspect_public_schema')
      if (error) {
        console.error('\nRPC introspection failed:', error.message)
        console.error('\nCreate the function in Supabase SQL editor, then rerun:')
        console.error(`\ncreate or replace function public.introspect_public_schema()\nreturns table (\n  table_schema text,\n  table_name text,\n  column_name text,\n  data_type text,\n  is_nullable text,\n  column_default text,\n  ordinal_position int\n) language sql stable as $$\n  select c.table_schema, c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default, c.ordinal_position\n  from information_schema.columns c\n  where c.table_schema = 'public'\n  order by c.table_name, c.ordinal_position;\n$$;`)
        process.exit(1)
      }
      const byTable = new Map()
      for (const r of data) {
        if (!byTable.has(r.table_name)) byTable.set(r.table_name, [])
        byTable.get(r.table_name).push(r)
      }
      const tableNames = Array.from(byTable.keys()).sort()
      console.log('Public tables:', tableNames.length ? tableNames.join(', ') : '(none)')
      for (const name of tableNames) {
        console.log(`\n- ${name}`)
        const cols = byTable.get(name)
        for (const c of cols) {
          const nullable = c.is_nullable === 'YES' ? 'nullable' : 'not null'
          const def = c.column_default ? ` default ${c.column_default}` : ''
          console.log(`  • ${c.column_name}: ${c.data_type} ${nullable}${def}`)
        }
      }
    }
  } catch (e) {
    console.error('\nSchema introspection failed.')
    console.error(String(e.message || e))
    console.error('\nTip: If pg_meta is disabled and the RPC has not been created, run the SQL below in Supabase SQL editor:')
    console.error(`\nSELECT table_schema, table_name, column_name, data_type, is_nullable, column_default\nFROM information_schema.columns\nWHERE table_schema = 'public'\nORDER BY table_name, ordinal_position;`)
    process.exit(1)
  }
})()
