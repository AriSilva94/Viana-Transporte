// src/renderer/test/e2e/global-setup.ts
//
// Starts the full e2e infrastructure before the Playwright test suite runs:
//   1. Docker Compose (e2e project, port 5433) — brings up a DEDICATED Postgres
//      that is completely separate from dev (5432). NEVER touches dev data.
//   2. Prisma migrate deploy + generate — against the e2e DB (5433).
//   3. Creates the dedicated e2e admin user (idempotent upsert) in the e2e DB.
//   4. Clears port 3000 (kills any leftover process) then starts the NestJS API
//      pointed at the e2e DB.
//   5. Detects EADDRINUSE / premature exit and aborts with a clear error.
//   6. Polls GET /api/health until the API responds 200.
//   7. Writes the API process PID to disk for global-teardown to consume.

import { execSync, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from './fixtures/credentials'

const API_DIR = path.resolve(__dirname, '../../../../../viana-transportes-api')
const PID_DIR = path.resolve(__dirname, '../../../../../test-results/e2e')
const PID_FILE = path.join(PID_DIR, 'api.pid')
const API_PORT = 3000

// ─── E2E database (dedicated, isolated from dev) ──────────────────────────────
// Dev uses localhost:5432/viana_transportes.
// E2E uses localhost:5433/viana_transportes_e2e — different port, different DB,
// different Docker volume (viana_e2e_pgdata). teardown runs `down -v` only on
// the viana-e2e compose project, so dev data is NEVER touched.

const E2E_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/viana_transportes_e2e'
const E2E_COMPOSE_FILE = path.join(API_DIR, 'docker-compose.e2e.yml')
const E2E_COMPOSE_PROJECT = 'viana-e2e'
const E2E_COMPOSE_CMD = `docker compose -p ${E2E_COMPOSE_PROJECT} -f ${E2E_COMPOSE_FILE}`

const API_BASE_URL = `http://localhost:${API_PORT}/api`
const HEALTH_URL = `${API_BASE_URL}/health`

// ─── Guards ───────────────────────────────────────────────────────────────────

function assertLocalhostOnly(): void {
  const baked = process.env.VIANA_API_BASE_URL ?? ''
  if (
    baked !== '' &&
    !baked.startsWith('http://localhost') &&
    !baked.startsWith('http://127.0.0.1')
  ) {
    throw new Error(
      `global-setup refused: VIANA_API_BASE_URL="${baked}" is not localhost. ` +
      'E2E tests may only run against local infrastructure.'
    )
  }
}

/**
 * Abort if the effective DATABASE_URL for e2e does not end in `_e2e` and does
 * not use port 5433. Prevents accidentally running against the dev database.
 */
function assertE2EDatabase(): void {
  const url = E2E_DATABASE_URL
  const hasE2ESuffix = url.includes('_e2e')
  const hasE2EPort = url.includes(':5433/')
  if (!hasE2ESuffix || !hasE2EPort) {
    throw new Error(
      `global-setup refused: E2E_DATABASE_URL="${url}" does not look like a safe e2e ` +
      'database (must contain "_e2e" in the DB name and use port 5433). ' +
      'Refusing to run migrations/seed against what might be a dev or production database.'
    )
  }
}

// ─── Port management ──────────────────────────────────────────────────────────

/**
 * Kill any process currently listening on `port` using fuser.
 * Silently succeeds if nothing is listening.
 */
function freePort(port: number): void {
  console.log(`[global-setup] Freeing port ${port} (fuser -k ${port}/tcp)...`)
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: ['ignore', 'ignore', 'pipe'] })
    // Give the OS a moment to release the socket
    execSync('sleep 0.5', { stdio: 'ignore' })
  } catch {
    // fuser exits non-zero when no process held the port — that's fine
  }
}

/**
 * Return the PID of the process listening on `port`, or null if none.
 */
function getPortOwner(port: number): number | null {
  try {
    const out = execSync(
      `lsof -ti tcp:${port}`,
      { stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString().trim()
    const pid = parseInt(out, 10)
    return isNaN(pid) ? null : pid
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd: string, cwd: string, env?: NodeJS.ProcessEnv): void {
  console.log(`[global-setup] $ ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
}

async function waitForPostgresHealthy(timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const result = execSync(
        `${E2E_COMPOSE_CMD} ps --format json db`,
        { cwd: API_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
      ).toString()
      // docker compose ps --format json outputs one JSON object per line
      const lines = result.trim().split('\n').filter(Boolean)
      for (const line of lines) {
        const svc = JSON.parse(line)
        if (svc.Health === 'healthy') {
          console.log('[global-setup] E2E Postgres healthy (port 5433)')
          return
        }
      }
    } catch {
      // docker not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(
    `[global-setup] Timed out waiting for E2E Postgres (port 5433) to become healthy (${timeoutMs}ms)`
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function globalSetup(): Promise<void> {
  assertLocalhostOnly()
  assertE2EDatabase()

  // 1. Start dedicated E2E Postgres (port 5433, DB viana_transportes_e2e)
  //    Dev Postgres (port 5432) is NEVER touched.
  console.log('[global-setup] Starting E2E Postgres via docker compose (viana-e2e project)...')
  run(`${E2E_COMPOSE_CMD} up -d`, API_DIR)
  await waitForPostgresHealthy()

  // 2. Apply migrations and generate Prisma client — E2E DB only
  console.log('[global-setup] Running prisma migrate deploy (e2e DB)...')
  run('npx prisma migrate deploy', API_DIR, { DATABASE_URL: E2E_DATABASE_URL })
  console.log('[global-setup] Running prisma generate...')
  run('npx prisma generate', API_DIR, { DATABASE_URL: E2E_DATABASE_URL })

  // 3. Seed dedicated e2e admin user (idempotent upsert) — E2E DB only
  console.log(`[global-setup] Seeding e2e admin user: ${E2E_ADMIN_EMAIL}`)
  run('npx ts-node --project tsconfig.json -e "require(\'./prisma/seed.ts\')"', API_DIR, {
    DATABASE_URL: E2E_DATABASE_URL,
    SEED_ADMIN_EMAIL: E2E_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
  })

  // 4. Build the API
  console.log('[global-setup] Building NestJS API...')
  run('npm run build', API_DIR)

  // 5. Ensure port 3000 is free before starting our API process
  freePort(API_PORT)

  const residual = getPortOwner(API_PORT)
  if (residual !== null) {
    throw new Error(
      `[global-setup] Port ${API_PORT} is still in use by PID ${residual} after fuser -k. ` +
      'Kill it manually and retry.'
    )
  }

  // 6. Start the API — pointed at the e2e DB (5433), not dev (5432)
  console.log('[global-setup] Starting NestJS API on port 3000 (e2e DB: port 5433)...')

  let setupFailed = false
  let setupFailReason = ''

  const apiProcess = spawn('node', ['dist/src/main.js'], {
    cwd: API_DIR,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(API_PORT),
      NODE_ENV: 'production',
      DATABASE_URL: E2E_DATABASE_URL,
    },
  })

  apiProcess.stdout?.on('data', (data: Buffer) => {
    process.stdout.write(`[api] ${data}`)
  })
  apiProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString()
    process.stderr.write(`[api] ${text}`)
    // Detect EADDRINUSE early — port was grabbed between our fuser and the spawn
    if (text.includes('EADDRINUSE')) {
      setupFailed = true
      setupFailReason = `API process reported EADDRINUSE on port ${API_PORT}. Another process grabbed the port after fuser -k.`
    }
  })

  apiProcess.on('error', (err: NodeJS.ErrnoException) => {
    setupFailed = true
    setupFailReason = `API process emitted error: ${err.message}`
  })

  // Detect premature exit before health check passes
  let apiExitCode: number | null = null
  apiProcess.on('exit', (code) => {
    apiExitCode = code ?? 1
  })

  // Persist PID so teardown can kill it
  fs.mkdirSync(PID_DIR, { recursive: true })
  fs.writeFileSync(PID_FILE, String(apiProcess.pid), 'utf-8')
  console.log(`[global-setup] API process PID ${apiProcess.pid} written to ${PID_FILE}`)

  // 7. Wait for the API to be ready — abort immediately on process failure
  const HEALTH_TIMEOUT_MS = 90_000
  const deadline = Date.now() + HEALTH_TIMEOUT_MS

  while (Date.now() < deadline) {
    // Check for setup failures detected by event handlers
    if (setupFailed) {
      throw new Error(`[global-setup] API startup failed: ${setupFailReason}`)
    }

    // Detect premature exit — process died before health check passed.
    // If a different process now owns :3000 we must abort (stale/foreign API).
    if (apiExitCode !== null) {
      const portOwner = getPortOwner(API_PORT)
      const ourPid = apiProcess.pid
      if (portOwner !== null && portOwner !== ourPid) {
        throw new Error(
          `[global-setup] Our API process (PID ${ourPid}) exited with code ${apiExitCode} ` +
          `but port ${API_PORT} is held by a DIFFERENT process (PID ${portOwner}). ` +
          'Refusing to continue — specs would run against stale/foreign API state.'
        )
      }
      throw new Error(
        `[global-setup] API process (PID ${ourPid}) exited prematurely with code ${apiExitCode} ` +
        'before the health check passed.'
      )
    }

    // A 200 from /api/health means our freshly-spawned API is ready. We already
    // freed port 3000 before spawning and abort on EADDRINUSE / premature exit,
    // so the response can only come from our process. (An lsof-based ownership
    // check here was unreliable on WSL — lsof reports a pid != apiProcess.pid —
    // and, thrown inside this try, was swallowed by the catch, looping until the
    // 90s timeout despite healthy 200s.)
    try {
      const res = await fetch(HEALTH_URL)
      if (res.ok) {
        console.log(`[global-setup] API healthy at ${HEALTH_URL} (PID ${apiProcess.pid}, DB: e2e port 5433)`)
        break
      }
    } catch {
      // not yet ready
    }

    await new Promise((r) => setTimeout(r, 1000))
  }

  if (Date.now() >= deadline && apiExitCode === null && !setupFailed) {
    throw new Error(
      `[global-setup] Timed out waiting for ${HEALTH_URL} to respond 200 (${HEALTH_TIMEOUT_MS}ms)`
    )
  }

  console.log('[global-setup] Infrastructure ready. E2E DB: viana_transportes_e2e @ localhost:5433')
}
