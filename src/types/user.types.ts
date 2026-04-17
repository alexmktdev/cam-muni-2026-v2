// User profile shape as stored or read from Firestore.

/** Perfil en la colección `users` (documento id = uid de Auth cuando aplica). */
export type UserProfile = {
  /** Correo normalizado desde `correo` o `email` en Firestore. */
  correo: string
  /** A veces se guarda igual que en Firebase Auth. */
  displayName?: string
  nombreMostrar?: string
  nombreCompleto?: string
  nombre?: string
  /** Apellido(s); admite `apellido` singular por compatibilidad. */
  apellidos?: string
  apellido?: string
  creadoEn?: string
  /** Rol en app (p. ej. admin, SuperAdmin); campo `role` en Firestore. */
  role?: string
  /** `active` en Firestore; si falta se asume activo en UI. */
  active?: boolean
  /** Fecha de registro resuelta en servidor (ISO 8601). */
  fechaRegistroISO?: string
}

/** Fila de gestión de usuarios enviada al cliente (sin mostrar uid en la tabla). */
export type UsuarioListaCliente = {
  /** Id documento Firestore; solo acciones y key interna. */
  id: string
  nombre: string
  iniciales: string
  email: string
  role: string
  active: boolean
  fechaCreacion: string
  /** Campos `name` / `lastName` en Firestore (formulario editar). */
  name: string
  lastName: string
}
