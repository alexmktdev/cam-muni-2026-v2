// Slugs legibles para ?club= en URLs (derivados del nombre; sin persistir en Firestore).

export function slugBaseDesdeNombreClub(nombre: string): string {
  const sinCam = nombre.replace(/^cam\s+/i, '').trim()
  const s = sinCam
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return s.length > 0 ? s : 'club'
}

/** Un slug por club; si dos nombres colisionan, se añade un sufijo del id de Firestore. */
export function slugsUrlUnicosPorClub<T extends { id: string; nombre: string }>(
  clubes: T[],
): Map<string, string> {
  const bases = clubes.map((c) => ({
    id: c.id,
    base: slugBaseDesdeNombreClub(c.nombre),
  }))
  const countByBase = new Map<string, number>()
  for (const { base } of bases) {
    countByBase.set(base, (countByBase.get(base) ?? 0) + 1)
  }
  const idToSlug = new Map<string, string>()
  for (const { id, base } of bases) {
    const n = countByBase.get(base) ?? 1
    const slug = n > 1 ? `${base}-${id.slice(0, 6)}` : base
    idToSlug.set(id, slug)
  }
  return idToSlug
}

export function adjuntarSlugUrlACadaClub<T extends { id: string; nombre: string }>(
  clubes: T[],
): Array<T & { slugUrl: string }> {
  const map = slugsUrlUnicosPorClub(clubes)
  return clubes.map((c) => ({ ...c, slugUrl: map.get(c.id)! }))
}

/** Acepta slug canónico o id de Firestore (compatibilidad con enlaces antiguos). */
export function resolverClubIdDesdeParamClub(
  param: string,
  clubes: { id: string; slugUrl: string }[],
): string {
  const raw = decodeURIComponent(param).trim()
  if (!raw) {
    return ''
  }
  const byId = clubes.find((c) => c.id === raw)
  if (byId) {
    return byId.id
  }
  const lower = raw.toLowerCase()
  const bySlug = clubes.find(
    (c) => c.slugUrl === raw || c.slugUrl.toLowerCase() === lower,
  )
  return bySlug?.id ?? ''
}
