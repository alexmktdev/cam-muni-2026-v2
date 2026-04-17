// Miembro de un club (adulto mayor) — DTO para UI.

export type MiembroClubCliente = {
  id: string
  clubId: string
  nombre: string
  apellidos: string
  /** RUT normalizado sin puntos ni guion (p. ej. 123456789K). */
  rut: string
  /** Para mostrar en tabla. */
  rutFormateado: string
}
