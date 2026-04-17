import { revalidateTag, unstable_cache } from 'next/cache'
import { listUsuariosFromFirestore } from '@/services/user.service'

export const TAG_CACHE_USERS_LIST = 'users-list-catalog'

export function invalidarCacheUsersList(): void {
  try {
    revalidateTag(TAG_CACHE_USERS_LIST)
  } catch {
    // revalidateTag solo en runtime Next.
  }
}

/** Lista de usuarios para la página de gestión (evita releer toda `users` en cada navegación). */
export const obtenerUsuariosListadoCacheados = unstable_cache(
  () => listUsuariosFromFirestore(),
  ['users-list-v1'],
  { revalidate: 1200, tags: [TAG_CACHE_USERS_LIST] },
)
