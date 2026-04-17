// Quién puede mutar usuarios / clubes / miembros (solo servidor / API).

/**
 * Por defecto cualquier usuario autenticado con perfil en `users` puede gestionar.
 * Solo se niega explícitamente a roles de solo lectura / invitado.
 */
export function canManageUsers(role?: string | null): boolean {
  const r = (role ?? '').trim()
  if (!r) {
    return true
  }
  const n = r.toLowerCase().replace(/\s+/g, '')
  if (
    n === 'invitado' ||
    n === 'guest' ||
    n === 'viewer' ||
    n === 'lector' ||
    n.includes('sololectura') ||
    n.includes('readonly')
  ) {
    return false
  }
  return true
}
