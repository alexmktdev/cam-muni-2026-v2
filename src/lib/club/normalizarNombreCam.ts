// Convención CAM + nombre del club (compartido por servicios; sin dependencias de servidor).

/**
 * Convención: "CAM " + nombre del club.
 * Si ya empieza por "CAM ", se normaliza el resto sin duplicar el prefijo.
 */
export function normalizarNombreClubCam(nombre: string): string {
  const n = nombre.trim()
  if (!n) {
    return ''
  }
  if (/^cam\s+/i.test(n)) {
    const resto = n.replace(/^cam\s+/i, '').trim()
    return resto ? `CAM ${resto}` : 'CAM'
  }
  return `CAM ${n}`
}
