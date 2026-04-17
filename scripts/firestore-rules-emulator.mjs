#!/usr/bin/env node
/**
 * Prueba `firestore.rules` contra el **emulador** con @firebase/rules-unit-testing.
 * No usa tu proyecto real ni .env: valida el archivo local de reglas.
 *
 * Ejecutar vía:
 *   npm run test:firestore-rules:unit
 *
 * Requiere que `firebase emulators:exec` arranque el emulador (lo hace el script npm).
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rulesPath = join(__dirname, '..', 'firestore.rules')
const rules = readFileSync(rulesPath, 'utf8')

/** ID recomendado por Firebase para pruebas con emulador. */
const projectId =
  process.env.GCLOUD_PROJECT || process.env.GCLOUD_PROJECT_ID || 'demo-proyecto-base'

async function main() {
  console.log('═'.repeat(56))
  console.log('  Reglas Firestore — emulador + rules-unit-testing')
  console.log('═'.repeat(56))
  console.log(`projectId: ${projectId}`)
  console.log(`rules:     ${rulesPath}\n`)

  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  })

  const db = testEnv.unauthenticatedContext().firestore()
  const id = `probe-${Date.now()}`

  const cases = [
    ['getDoc users/{id}', () => getDoc(doc(db, 'users', id))],
    ['setDoc users/{id}', () => setDoc(doc(db, 'users', id), { x: 1, at: new Date().toISOString() })],
    ['getDocs query users', () => getDocs(query(collection(db, 'users'), limit(1)))],
    ['getDoc _security_probe/doc', () => getDoc(doc(db, '_security_probe', 'doc'))],
    [
      'writeBatch users',
      async () => {
        const batch = writeBatch(db)
        batch.set(doc(db, 'users', `${id}-batch`), { batch: true })
        await batch.commit()
      },
    ],
  ]

  let ok = 0
  for (const [label, fn] of cases) {
    try {
      await assertFails(fn())
      console.log(`✓ ${label} → permission-denied`)
      ok++
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? e.message : String(e)
      console.error(`✗ ${label} → ${msg}`)
      process.exitCode = 1
    }
  }

  await testEnv.cleanup()

  console.log('\n' + '─'.repeat(56))
  if (process.exitCode === 1) {
    console.error(`Fallos: ${cases.length - ok}/${cases.length}`)
    process.exit(1)
  }
  console.log(`OK: ${ok}/${cases.length} — reglas locales coherentes con “todo denegado” al cliente.`)
  console.log('─'.repeat(56))
}

main().catch((e) => {
  console.error('Error fatal:', e?.message || e)
  process.exit(1)
})
