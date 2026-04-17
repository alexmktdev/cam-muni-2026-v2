import 'server-only'
/**
 * Medidor opcional de lecturas Firestore (solo desarrollo / diagnóstico).
 * Activar: FIRESTORE_READ_METER=1 en .env.local y reiniciar `npm run dev`.
 *
 * Es una estimación: documentos devueltos en queries; 1 por doc.get();
 * agregaciones (count/sum) se anotan con rango aproximado (la facturación real
 * sigue las reglas de Google).
 */

import type {
  CollectionReference,
  DocumentReference,
  Firestore,
  Query,
} from 'firebase-admin/firestore'

/** Agregados (count/sum/…); el SDK usa genéricos internos. */
type AggregateQueryLike = { get: () => Promise<{ data: () => Record<string, unknown> | undefined }> }

export function firestoreReadMeterEnabled(): boolean {
  const v = process.env.FIRESTORE_READ_METER?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

let sessionApproxReads = 0

export function getFirestoreReadMeterSessionApprox(): number {
  return sessionApproxReads
}

export function resetFirestoreReadMeterSession(): void {
  sessionApproxReads = 0
  if (firestoreReadMeterEnabled()) {
    console.log('[Firestore reads] Contador de sesión reiniciado → 0')
  }
}

function logApprox(n: number, hint: string): void {
  if (!firestoreReadMeterEnabled() || n < 0) {
    return
  }
  sessionApproxReads += n
  console.log(`[Firestore reads] +${n} ${hint}`)
  console.log(
    `[Firestore reads] TOTAL acumulado (todas las lecturas aprox., esta sesión del servidor): ${sessionApproxReads}`,
  )
}

/**
 * Ejecuta `fn` y al terminar escribe en consola cuántas lecturas aprox. hubo en ese tramo
 * y el total acumulado de la sesión. Útil alrededor de un handler de API o una función larga.
 */
export async function withFirestoreReadMeterSpan<T>(
  etiqueta: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!firestoreReadMeterEnabled()) {
    return fn()
  }
  const inicio = getFirestoreReadMeterSessionApprox()
  try {
    return await fn()
  } finally {
    const total = getFirestoreReadMeterSessionApprox()
    const delta = total - inicio
    console.log(
      `[Firestore reads] ─── Fin «${etiqueta}»: +${delta} aprox. en este tramo │ TOTAL sesión: ${total} ───`,
    )
  }
}

function wrapDocRef(ref: DocumentReference): DocumentReference {
  return new Proxy(ref, {
    get(target, prop, receiver) {
      if (prop === 'get') {
        return async () => {
          const snap = await target.get()
          logApprox(1, `doc(${target.path})`)
          return snap
        }
      }
      if (prop === 'collection') {
        const orig = Reflect.get(target, prop, receiver) as DocumentReference['collection']
        return (sub: string) => wrapCollectionRef(orig.call(target, sub))
      }
      const val = Reflect.get(target, prop, receiver)
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(target) : val
    },
  }) as DocumentReference
}

function wrapAggregateQuery<T extends AggregateQueryLike>(agg: T): T {
  return new Proxy(agg as object, {
    get(target, prop, receiver) {
      const typed = target as AggregateQueryLike
      if (prop === 'get') {
        return async () => {
          const snap = await typed.get()
          const data = snap.data() as Record<string, unknown> | undefined
          const parts: string[] = []
          let est = 1
          if (data && typeof data === 'object') {
            for (const [k, v] of Object.entries(data)) {
              if (typeof v === 'number' && Number.isFinite(v)) {
                parts.push(`${k}=${v}`)
                if (k === 'count' && v > 0) {
                  est = Math.max(1, Math.ceil(v / 1000))
                }
              }
            }
          }
          logApprox(
            est,
            `aggregate(${parts.join(', ') || 'sin datos'}; facturación real puede variar)`,
          )
          return snap
        }
      }
      const val = Reflect.get(typed, prop, receiver)
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(typed) : val
    },
  }) as T
}

function wrapQuery(q: Query): Query {
  return new Proxy(q, {
    get(target, prop, receiver) {
      if (prop === 'get') {
        return async () => {
          const snap = await target.get()
          logApprox(snap.docs.length, `query(${snap.size} doc(s))`)
          return snap
        }
      }
      if (prop === 'count') {
        const orig = Reflect.get(target, prop, receiver) as Query['count']
        if (typeof orig === 'function') {
          return () => wrapAggregateQuery(orig.call(target))
        }
      }
      if (prop === 'aggregate') {
        const orig = Reflect.get(target, prop, receiver) as Query['aggregate']
        if (typeof orig === 'function') {
          return (...args: unknown[]) =>
            wrapAggregateQuery(
              (orig as (...x: unknown[]) => AggregateQueryLike).apply(target, args) as AggregateQueryLike,
            ) as ReturnType<Query['aggregate']>
        }
      }
      const chain = [
        'where',
        'orderBy',
        'limit',
        'offset',
        'startAfter',
        'startAt',
        'endAt',
        'endBefore',
        'withConverter',
        'select',
      ] as const
      if ((chain as readonly string[]).includes(prop as string)) {
        const orig = Reflect.get(target, prop, receiver)
        if (typeof orig === 'function') {
          return (...args: unknown[]) =>
            wrapQuery((orig as (...x: unknown[]) => Query).apply(target, args))
        }
      }
      const val = Reflect.get(target, prop, receiver)
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(target) : val
    },
  }) as Query
}

function wrapCollectionRef(ref: CollectionReference): CollectionReference {
  return new Proxy(ref, {
    get(target, prop, receiver) {
      if (prop === 'get') {
        return async () => {
          const snap = await target.get()
          logApprox(snap.docs.length, `collection(${target.path}).get() ${snap.size} doc(s)`)
          return snap
        }
      }
      if (prop === 'doc') {
        const orig = Reflect.get(target, prop, receiver) as CollectionReference['doc']
        return (...ids: [string] | []) =>
          wrapDocRef(
            ids.length > 0 ? orig.call(target, ids[0]!) : (orig as () => DocumentReference).call(target),
          )
      }
      if (prop === 'count') {
        const orig = Reflect.get(target, prop, receiver) as CollectionReference['count']
        if (typeof orig === 'function') {
          return () => wrapAggregateQuery(orig.call(target))
        }
      }
      if (prop === 'aggregate') {
        const orig = Reflect.get(target, prop, receiver) as CollectionReference['aggregate']
        if (typeof orig === 'function') {
          return (...args: unknown[]) =>
            wrapAggregateQuery(
              (orig as (...x: unknown[]) => AggregateQueryLike).apply(
                target,
                args,
              ) as AggregateQueryLike,
            ) as ReturnType<CollectionReference['aggregate']>
        }
      }
      const chain = [
        'where',
        'orderBy',
        'limit',
        'offset',
        'startAfter',
        'startAt',
        'endAt',
        'endBefore',
        'withConverter',
        'select',
      ] as const
      if ((chain as readonly string[]).includes(prop as string)) {
        const orig = Reflect.get(target, prop, receiver)
        if (typeof orig === 'function') {
          return (...args: unknown[]) =>
            wrapQuery((orig as (...x: unknown[]) => Query).apply(target, args))
        }
      }
      const val = Reflect.get(target, prop, receiver)
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(target) : val
    },
  }) as CollectionReference
}

export function wrapFirestoreForReadMeter(db: Firestore): Firestore {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'collection') {
        const orig = Reflect.get(target, prop, receiver) as Firestore['collection']
        return (path: string) => wrapCollectionRef(orig.call(target, path))
      }
      if (prop === 'collectionGroup') {
        const orig = Reflect.get(target, prop, receiver) as Firestore['collectionGroup']
        return (id: string) => wrapQuery(orig.call(target, id))
      }
      const val = Reflect.get(target, prop, receiver)
      return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(target) : val
    },
  }) as Firestore
}
