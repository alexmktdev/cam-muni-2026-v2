// Normalización y validación básica de RUT chileno (solo servidor y cliente).

export function normalizarRutChile(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/\s/g, '')
}

function digitoVerificadorRut(cuerpo: string): string {
  let suma = 0
  let mult = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    const d = cuerpo[i]
    if (!d || !/\d/.test(d)) {
      return ''
    }
    suma += parseInt(d, 10) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) {
    return '0'
  }
  if (resto === 10) {
    return 'K'
  }
  return String(resto)
}

/**
 * Valida RUT con el algoritmo módulo 11 (SII / estándar chileno).
 * La app usa `esRutChilenoFormatoValido` en miembros (manual, CSV y API); esta función
 * queda disponible si en el futuro se exige DV matemático en algún flujo.
 */
export function esRutChilenoValido(raw: string): boolean {
  const n = normalizarRutChile(raw)
  if (!/^\d{7,8}[\dK]$/.test(n)) {
    return false
  }
  const cuerpo = n.slice(0, -1)
  const dv = n.slice(-1)
  return digitoVerificadorRut(cuerpo) === dv
}

/**
 * Cuerpo de 7 u 8 dígitos y dígito verificador 0-9 o K, sin comprobar módulo 11.
 * Usado en importación CSV cuando la planilla proviene de registros oficiales.
 */
export function esRutChilenoFormatoValido(raw: string): boolean {
  const n = normalizarRutChile(raw)
  return /^\d{7,8}[\dK]$/.test(n)
}

/** Presentación: 12.345.678-9 */
export function formatearRutMostrar(rutNormalizado: string): string {
  const n = normalizarRutChile(rutNormalizado)
  if (!/^\d{7,8}[\dK]$/.test(n)) {
    return rutNormalizado
  }
  const dv = n.slice(-1)
  const num = n.slice(0, -1)
  const conPuntos = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${conPuntos}-${dv}`
}
