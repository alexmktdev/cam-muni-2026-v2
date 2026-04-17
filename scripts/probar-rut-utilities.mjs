/**
 * Prueba @fdograph/rut-utilities (https://github.com/fdograph/rut-utilities)
 * antes de integrarla en la app. Ejecutar: npm run test:rut-lib
 */

import { validateRut, formatRut, deconstructRut, RutFormat } from '@fdograph/rut-utilities'

function linea(titulo) {
  console.log(`\n--- ${titulo} ---`)
}

const casos = [
  // Referencia documentación librería
  '18585543-0',
  '18.585.543-0',
  // Ejemplo Wikipedia / SII
  '12345678-5',
  '12.345.678-5',
  // personas.csv (filas que antes chocaban con módulo 11 “manual”)
  '5.454.899-3',
  '3.967.954-0',
  '4.952.745-4',
  // RUTs “sospechososos” que la librería filtra por defecto
  '9.999.999-9',
  '44.444.444-4',
  '22.222.222-2',
]

linea('validateRut(rut) — default noSuspicious=true (rechaza patrones sospechosos)')
for (const rut of casos) {
  const ok = validateRut(rut)
  console.log(`  ${String(ok).padStart(5)}  ${rut}`)
}

linea('validateRut(rut, false) — sin filtro de patrones sospechosos')
for (const rut of casos) {
  const ok = validateRut(rut, false)
  console.log(`  ${String(ok).padStart(5)}  ${rut}`)
}

linea('formatRut + deconstructRut (muestra)')
for (const rut of ['5.454.899-3', '7775735-k']) {
  try {
    const dec = deconstructRut(rut)
    const fmt = formatRut(rut, RutFormat.DOTS_DASH)
    console.log(`  ${rut} → dígitos=${dec.digits} verifier=${dec.verifier} | format DOTS_DASH=${fmt}`)
  } catch (e) {
    console.log(`  ${rut} → error: ${e.message}`)
  }
}

console.log('\nNotas:')
console.log(
  '  • noSuspicious=false desactiva el rechazo por patrón repetido (ej. 44.444.444-4 puede pasar si el DV cuadra).',
)
console.log(
  '  • Si un RUT es false con default y con false, el DV no cumple módulo 11 (alineado con nuestro chileRut.ts).',
)
console.log('  • Repo: https://github.com/fdograph/rut-utilities · npm: @fdograph/rut-utilities\n')
