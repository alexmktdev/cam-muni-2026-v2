// Authentication-related types and generic API response shapes.

/** Auth error with a technical code and a safe user-facing message. */
export type AuthError = {
  codigo: string
  mensaje: string
}

/** Typical API response with either data or an error string. */
export type ApiResponse<T> =
  | { exito: true; datos: T }
  | { exito: false; error: string }
