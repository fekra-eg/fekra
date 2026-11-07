import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
const environment = parseEnv(readFileSync(process.argv[2], 'utf8'))
if (!/^postgres(?:ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):/.test(environment.DATABASE_URL || '') || environment.NEXT_PUBLIC_ENV === 'production') throw new Error('Review builds require an isolated local database')
const child = spawn('pnpm', ['build'], { stdio: 'inherit', env: { ...process.env, ...environment, NEXT_DIST_DIR: '.next-review-build' } })
child.on('exit', (code) => process.exit(code ?? 1))
