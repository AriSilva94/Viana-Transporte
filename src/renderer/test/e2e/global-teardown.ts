// src/renderer/test/e2e/global-teardown.ts
//
// Stops the e2e infrastructure after the Playwright test suite finishes:
//   1. Kills the NestJS API — by saved PID first, then by port (fuser -k 3000/tcp)
//      as a belt-and-suspenders fallback. ESRCH (already dead) is treated as success.
//   2. Runs `docker compose -p viana-e2e -f docker-compose.e2e.yml down -v` to stop
//      and remove ONLY the e2e Postgres container and its dedicated volume.
//      The dev Postgres (docker-compose.yml, port 5432) is NEVER touched.

import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const API_DIR = path.resolve(__dirname, '../../../../../viana-transportes-api')
const PID_FILE = path.resolve(__dirname, '../../../../../test-results/e2e/api.pid')
const API_PORT = 3000

const E2E_COMPOSE_FILE = path.join(API_DIR, 'docker-compose.e2e.yml')
const E2E_COMPOSE_PROJECT = 'viana-e2e'
const E2E_COMPOSE_CMD = `docker compose -p ${E2E_COMPOSE_PROJECT} -f ${E2E_COMPOSE_FILE}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function runAlways(cmd: string, cwd: string): void {
  console.log(`[global-teardown] $ ${cmd}`)
  try {
    execSync(cmd, { cwd, stdio: 'inherit' })
  } catch (err) {
    console.warn(`[global-teardown] Command failed (continuing): ${cmd}`, err)
  }
}

/**
 * Kill any process listening on `port` via fuser.
 * Silently ignores "nothing listening" (fuser exits non-zero in that case).
 */
function killByPort(port: number): void {
  console.log(`[global-teardown] fuser -k ${port}/tcp (belt-and-suspenders port kill)...`)
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch {
    // nothing was listening — fine
  }
}

/**
 * Send SIGTERM to `pid`, wait briefly, then SIGKILL if still alive.
 * ESRCH (no such process) is treated as success — process already dead.
 */
function killPid(pid: number): void {
  console.log(`[global-teardown] Killing API process PID ${pid}...`)
  try {
    process.kill(pid, 'SIGTERM')
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ESRCH') {
      console.log(`[global-teardown] PID ${pid} already dead (ESRCH) — ok.`)
      return
    }
    console.warn(`[global-teardown] SIGTERM PID ${pid} failed:`, err)
    return
  }

  // Brief grace period for NestJS to shut down cleanly
  execSync('sleep 2', { stdio: 'ignore' })

  try {
    process.kill(pid, 'SIGKILL')
    console.log(`[global-teardown] SIGKILL sent to PID ${pid}.`)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ESRCH') {
      console.warn(`[global-teardown] SIGKILL PID ${pid} failed:`, err)
    }
    // ESRCH = already dead after SIGTERM — that's the happy path
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function globalTeardown(): Promise<void> {
  // 1a. Kill by saved PID
  if (fs.existsSync(PID_FILE)) {
    const raw = fs.readFileSync(PID_FILE, 'utf-8').trim()
    const pid = parseInt(raw, 10)
    if (!isNaN(pid) && pid > 0) {
      killPid(pid)
    } else {
      console.warn(`[global-teardown] PID file contained invalid value: "${raw}"`)
    }
    fs.rmSync(PID_FILE, { force: true })
  } else {
    console.warn(`[global-teardown] PID file not found at ${PID_FILE} — skipping PID kill.`)
  }

  // 1b. Belt-and-suspenders: kill anything still on port 3000
  //     Handles the ESRCH case where the PID was stale but the process kept
  //     the port (e.g. re-spawned child), or teardown was skipped in a prior run.
  killByPort(API_PORT)

  // 2. Bring down ONLY the e2e Postgres project and remove its dedicated volume.
  //    Dev Postgres (docker-compose.yml, port 5432, volume postgres_data) is
  //    NEVER touched by this command.
  console.log('[global-teardown] Bringing down E2E Postgres (viana-e2e project, port 5433)...')
  runAlways(`${E2E_COMPOSE_CMD} down -v`, API_DIR)

  console.log('[global-teardown] Infrastructure torn down. Dev DB untouched.')
}
