#!/usr/bin/env node
/**
 * Prueba las reglas de Firestore **desde el SDK cliente** (igual que el navegador).
 * El Admin SDK ignora las reglas; por eso no sirve para este test.
 *
 * Con reglas `allow read, write: if false` deben fallar todas las operaciones con
 * código `permission-denied`.
 *
 * Requisitos:
 *   - Firestore activado en el proyecto Firebase
 *   - Reglas **desplegadas** en Firebase (el archivo local firestore.rules debe coincidir)
 *   - Variables NEXT_PUBLIC_FIREBASE_* (carga automática desde .env.local si existe)
 *
 * Uso:
 *   npm run test:firestore-rules
 *   node scripts/firestore-rules-test.mjs
 *
 * Solo contra proyectos tuyos o con permiso explícito.
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  limit,
  writeBatch,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = join(__dirname, '..', '.env.local')
  if (!existsSync(envPath)) {
    return
  }
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\n/g, '\n')
    }
    if (process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}

function isPermissionDenied(err) {
  return (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    err.code === 'permission-denied'
  )
}

const stats = { ok: 0, fail: 0, skip: 0 }

function pass(msg) {
  console.log(`✓ ${msg}`)
  stats.ok++
}

function fail(msg, detail) {
  console.error(`✗ ${msg}${detail != null ? ` → ${detail}` : ''}`)
  stats.fail++
}

function skip(msg) {
  console.warn(`⊘ ${msg}`)
  stats.skip++
}

async function expectDenied(label, fn) {
  try {
    await fn()
    fail(label, 'se esperaba permission-denied pero la operación tuvo éxito (¿reglas demasiado abiertas?)')
  } catch (err) {
    if (isPermissionDenied(err)) {
      pass(`${label} → permission-denied`)
    } else {
      const code = err && typeof err === 'object' && 'code' in err ? err.code : String(err)
      const msg = err && typeof err === 'object' && 'message' in err ? err.message : ''
      fail(label, `error inesperado: ${code} ${msg}`.trim())
    }
  }
}

async function main() {
  loadEnvLocal()

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!apiKey || !authDomain || !projectId) {
    console.error(
      'Faltan NEXT_PUBLIC_FIREBASE_* en el entorno o en .env.local en la raíz del proyecto.',
    )
    process.exit(1)
  }

  console.log('═'.repeat(56))
  console.log('  Test de reglas Firestore (SDK cliente)')
  console.log('═'.repeat(56))
  console.log(`Proyecto: ${projectId}\n`)

  const app = initializeApp({ apiKey, authDomain, projectId })
  const db = getFirestore(app)

  // Colección que usa tu app (debe estar bloqueada para cliente)
  const usuariosCol = 'users'
  const testDocId = `rules-test-${Date.now()}`

  await expectDenied(`getDoc /${usuariosCol}/{id}`, () =>
    getDoc(doc(db, usuariosCol, testDocId)),
  )

  await expectDenied(`setDoc /${usuariosCol}/{id}`, () =>
    setDoc(doc(db, usuariosCol, testDocId), { probe: true, at: new Date().toISOString() }),
  )

  await expectDenied(`getDocs query /${usuariosCol}`, () =>
    getDocs(query(collection(db, usuariosCol), limit(1))),
  )

  // Ruta arbitraria: reglas catch-all `match /{document=**}` deben bloquear
  await expectDenied('getDoc /_security_probe/doc', () =>
    getDoc(doc(db, '_security_probe', 'doc')),
  )

  await expectDenied('setDoc /_security_probe/doc', () =>
    setDoc(doc(db, '_security_probe', 'doc'), { x: 1 }),
  )

  // Batch write (sigue evaluando reglas por operación)
  await expectDenied('batch.set en usuarios', async () => {
    const batch = writeBatch(db)
    batch.set(doc(db, usuariosCol, `${testDocId}-batch`), { batch: true })
    await batch.commit()
  })

  console.log('\n' + '─'.repeat(56))
  console.log(`Resumen: OK=${stats.ok}  Fallos=${stats.fail}  Omitidos=${stats.skip}`)
  console.log('─'.repeat(56))

  if (stats.fail > 0) {
    console.error(
      '\nSi alguna operación tuvo éxito, las reglas en la nube permiten acceso cliente.',
      '\nDespliega firestore.rules: firebase deploy --only firestore:rules',
    )
    process.exit(1)
  }

  console.log(
    '\nLas reglas desplegadas parecen **denegar** el acceso cliente en las rutas probadas.',
  )
  console.log(
    'Para probar el archivo local `firestore.rules` con emulador (sin proyecto real): npm run test:firestore-rules:unit',
  )
}

main().catch((e) => {
  console.error('Error fatal:', e.message || e)
  process.exit(1)
})
