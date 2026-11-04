import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

const file = process.argv[2]
if (!file) throw new Error('Pass a local QA environment file')
const environment = parseEnv(readFileSync(file, 'utf8'))
if (!/^postgres(?:ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):/.test(environment.DATABASE_URL || '') || environment.NEXT_PUBLIC_ENV === 'production') throw new Error('QA server requires an isolated local database')
const production = process.argv.includes('--production')
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', production ? 'start' : 'dev', '--port', production ? '3014' : '3012'], {
  stdio: 'inherit', env: { ...process.env, ...environment, NEXT_DIST_DIR: production ? '.next-review-build' : '.next-review' },
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('exit', (code) => process.exit(code ?? 1))
