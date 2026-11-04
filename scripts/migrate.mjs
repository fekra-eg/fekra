#!/usr/bin/env node
/**
 * Runs pending Payload migrations before the build, but only when there is a
 * database to run them against.
 *
 * Why in the build: `push` is disabled in production, so nothing else ever
 * creates the schema. Deploying to a fresh database without this produces a
 * site where every page 500s with `relation "header" does not exist` — the
 * failure is invisible at build time and total at runtime.
 *
 * Skipping when unconfigured is what lets the holding page deploy on a project
 * that has no database yet.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

// Next reads .env.local itself, but this runs before Next does, so it has to
// load them or it would report "not configured" on a machine that plainly is.
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const url = process.env.DATABASE_URL?.trim() ?? ''

if (url && !/^postgres(ql)?:\/\//.test(url)) {
  console.error(
    '\n  DATABASE_URL is not a Postgres connection string.\n' +
      '  It must start with postgres:// or postgresql://\n' +
      '  Supabase: Settings > Database > Connection string > Transaction pooler (port 6543).\n' +
      '  The https://<ref>.supabase.co project URL is the REST API, not the database.\n',
  )
  process.exit(1)
}

const configured = Boolean(url) && Boolean(process.env.PAYLOAD_SECRET?.trim())

if (!configured) {
  console.log('  migrate: skipped — no DATABASE_URL / PAYLOAD_SECRET (holding-page build)')
  process.exit(0)
}

console.log('  migrate: applying pending migrations…')

/*
 * `payload migrate` prompts for confirmation if the database carries a `dev`
 * marker from a schema push. A prompt in CI is a build that hangs until the
 * platform kills it, so stdin is closed: the prompt resolves to "no" and the
 * build fails fast with something a human can act on.
 *
 * MIGRATE_ACCEPT_DATA_LOSS=true opts into answering yes. Deliberately not the
 * default — that prompt exists because the migration may drop columns.
 */
const args = ['migrate']
if (process.env.MIGRATE_ACCEPT_DATA_LOSS === 'true') args.push('--force-accept-warning')

/*
 * Supavisor hands out a backend per transaction, and when it is saturated the
 * checkout fails outright — `(ECHECKOUTTIMEOUT) unable to check out connection
 * from the pool after 15000ms in Transaction mode`, a FATAL that kills the
 * migrate step and so the whole deploy. Nothing is wrong with the migration or
 * the schema; the pooler was busy for fifteen seconds. Applied migrations are
 * recorded in payload_migrations, so re-running is a no-op for anything that
 * already landed and a genuine failure still fails, three times, with its own
 * error on the log.
 *
 * Retries alone stopped being enough (27 Sep 2026: three straight 60s
 * checkout timeouts on 6543 while production traffic held the pool). So the
 * migration goes through the session pooler (5432) — what Supabase recommends
 * for migrations — on two connections, with two minutes of patience per
 * checkout. Migrations are serial (the second covers a query outside the transaction), and
 * it keeps us far under the session-mode client cap.
 *
 * ponytail: fixed 30s backoff; raise the Supabase pool size if this still stalls.
 */
const migrateUrl = new URL(url)
if (migrateUrl.hostname.endsWith('.pooler.supabase.com') && migrateUrl.port === '6543') {
  migrateUrl.port = '5432'
}

let result
for (let attempt = 1; attempt <= 3; attempt++) {
  result = spawnSync('payload', args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-deprecation',
      DATABASE_URL: migrateUrl.toString(),
      DATABASE_POOL_MAX: '2',
      DATABASE_CONNECT_TIMEOUT_MS: '120000',
    },
    shell: true,
  })

  if (result.status === 0 || attempt === 3) break
  console.error(`  migrate: attempt ${attempt} failed — retrying in 30s…`)
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 30_000)
}

if (result.status !== 0) {
  console.error(
    '\n  Migration failed. If the log mentions a database that was pushed in dev\n' +
      '  mode, delete the marker row and retry:\n\n' +
      "    delete from payload_migrations where name = 'dev';\n",
  )
}

// A failed migration must stop the deploy: shipping code against a schema it
// does not match is worse than not shipping at all.
process.exit(result.status ?? 1)
