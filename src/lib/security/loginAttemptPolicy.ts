import 'server-only'

import { createHash } from 'node:crypto'
import { getAdminFirestore } from '@/lib/firebase/adminFirebase'

const COLLECTION = 'auth_login_attempts'
const MAX_FAILED_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000

type AttemptState = {
  count: number
  windowStartedAt: number
  lockedUntil: number
  updatedAt: number
}

function buildAttemptId(email: string, ip: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedIp = ip.trim().toLowerCase() || 'unknown'
  return createHash('sha256').update(`${normalizedEmail}|${normalizedIp}`).digest('hex')
}

function getNow(): number {
  return Date.now()
}

async function readState(docId: string): Promise<AttemptState | null> {
  const snap = await getAdminFirestore().collection(COLLECTION).doc(docId).get()
  if (!snap.exists) {
    return null
  }
  return snap.data() as AttemptState
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function getLoginLockState(email: string, ip: string): Promise<{ blocked: boolean }> {
  const docId = buildAttemptId(email, ip)
  const current = await readState(docId)
  if (!current) {
    return { blocked: false }
  }
  const now = getNow()
  if (current.lockedUntil > now) {
    return { blocked: true }
  }
  return { blocked: false }
}

export async function registerLoginFailure(email: string, ip: string): Promise<void> {
  const docId = buildAttemptId(email, ip)
  const ref = getAdminFirestore().collection(COLLECTION).doc(docId)
  const now = getNow()
  const current = await readState(docId)

  const shouldResetWindow = !current || now - current.windowStartedAt > WINDOW_MS
  const count = shouldResetWindow ? 1 : current.count + 1
  const windowStartedAt = shouldResetWindow ? now : current.windowStartedAt
  const lockedUntil = count >= MAX_FAILED_ATTEMPTS ? now + LOCK_MS : 0

  await ref.set(
    {
      count,
      windowStartedAt,
      lockedUntil,
      updatedAt: now,
    } satisfies AttemptState,
    { merge: true },
  )
}

export async function clearLoginFailures(email: string, ip: string): Promise<void> {
  const docId = buildAttemptId(email, ip)
  await getAdminFirestore().collection(COLLECTION).doc(docId).delete()
}
