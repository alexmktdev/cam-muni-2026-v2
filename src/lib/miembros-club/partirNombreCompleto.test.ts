import { describe, expect, it } from 'vitest'
import { partirNombreCompletoCsv } from '@/lib/miembros-club/partirNombreCompleto'

describe('partirNombreCompletoCsv', () => {
  it('vacío', () => {
    expect(partirNombreCompletoCsv('')).toEqual({ nombre: '', apellidos: '' })
    expect(partirNombreCompletoCsv('   ')).toEqual({ nombre: '', apellidos: '' })
  })

  it('una sola palabra → apellidos placeholder', () => {
    expect(partirNombreCompletoCsv('María')).toEqual({ nombre: 'María', apellidos: '—' })
  })

  it('primera palabra nombre, resto apellidos', () => {
    expect(partirNombreCompletoCsv('Juan Pérez Soto')).toEqual({
      nombre: 'Juan',
      apellidos: 'Pérez Soto',
    })
  })

  it('normaliza espacios múltiples', () => {
    expect(partirNombreCompletoCsv('Ana   López')).toEqual({ nombre: 'Ana', apellidos: 'López' })
  })
})
