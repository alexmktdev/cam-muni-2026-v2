import { describe, expect, it } from 'vitest'
import {
  esRutChilenoFormatoValido,
  esRutChilenoValido,
  formatearRutMostrar,
  normalizarRutChile,
} from '@/lib/validation/chileRut'

describe('normalizarRutChile', () => {
  it('quita puntos, guion y espacios', () => {
    expect(normalizarRutChile('12.345.678-5')).toBe('123456785')
  })
})

describe('esRutChilenoFormatoValido', () => {
  it('acepta 7–8 dígitos + DV sin módulo 11', () => {
    expect(esRutChilenoFormatoValido('123456785')).toBe(true)
    expect(esRutChilenoFormatoValido('12.345.678-5')).toBe(true)
    expect(esRutChilenoFormatoValido('1-9')).toBe(false)
  })

  it('acepta K como DV', () => {
    expect(esRutChilenoFormatoValido('12345678K')).toBe(true)
  })
})

describe('esRutChilenoValido (módulo 11)', () => {
  it('valida RUT conocido correcto', () => {
    // 11.111.111-1 es un RUT de prueba válido en algoritmo módulo 11
    expect(esRutChilenoValido('111111111')).toBe(true)
    expect(esRutChilenoValido('11.111.111-1')).toBe(true)
  })

  it('rechaza DV incorrecto', () => {
    expect(esRutChilenoValido('111111112')).toBe(false)
  })
})

describe('formatearRutMostrar', () => {
  it('formatea RUT normalizado', () => {
    expect(formatearRutMostrar('123456785')).toBe('12.345.678-5')
  })

  it('devuelve original si formato inválido', () => {
    expect(formatearRutMostrar('abc')).toBe('abc')
  })
})
