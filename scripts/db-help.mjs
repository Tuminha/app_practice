#!/usr/bin/env node
console.log(`DB scripts available:\n\n  npm run db:inspect            # show counts + sample columns for default tables\n  npm run db:inspect chat_sessions messages billing_status\n\n  npm run db:dump               # dump up to 20 rows from default tables\n  npm run db:dump chat_sessions --limit=50\n\n  npm run db:schema             # print schema (uses pg_meta or RPC fallback)\n  npm run db:seed               # seed demo chat/messages (requires service role)\n`)

