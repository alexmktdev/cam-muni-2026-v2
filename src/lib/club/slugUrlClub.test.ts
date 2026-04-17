import { describe, expect, it } from 'vitest'
import {
  adjuntarSlugUrlACadaClub,
  resolverClubIdDesdeParamClub,
  slugBaseDesdeNombreClub,
  slugsUrlUnicosPorClub,
} from '@/lib/club/slugUrlClub'

describe('slugBaseDesdeNombreClub', () => {
  it('quita prefijo CAM y normaliza', () => {
    expect(slugBaseDesdeNombreClub('CAM El Trigal')).toBe('el-trigal')
  })

  it('elimina acentos', () => {
    expect(slugBaseDesdeNombreClub('Niño Jesús')).toBe('nino-jesus')
  })

  it('devuelve club si queda vacío', () => {
    expect(slugBaseDesdeNombreClub('CAM !!!')).toBe('club')
  })
})

describe('slugsUrlUnicosPorClub / adjuntarSlugUrlACadaClub', () => {
  it('añade sufijo del id a todos cuando hay colisión de nombre', () => {
    const clubes = [
      { id: 'abc123xyz', nombre: 'CAM Mismo' },
      { id: 'def456uvw', nombre: 'CAM Mismo' },
    ]
    const conSlug = adjuntarSlugUrlACadaClub(clubes)
    expect(conSlug[0]!.slugUrl).toBe('mismo-abc123')
    expect(conSlug[1]!.slugUrl).toBe('mismo-def456')
  })

  it('mapa id → slug', () => {
    const m = slugsUrlUnicosPorClub([{ id: 'x1', nombre: 'CAM Uno' }])
    expect(m.get('x1')).toBe('uno')
  })
})

describe('resolverClubIdDesdeParamClub', () => {
  const clubes = [
    { id: 'id-fire-1', slugUrl: 'el-trigal' },
    { id: 'id-fire-2', slugUrl: 'otro-club' },
  ]

  it('resuelve por id de documento', () => {
    expect(resolverClubIdDesdeParamClub('id-fire-1', clubes)).toBe('id-fire-1')
  })

  it('resuelve por slug exacto', () => {
    expect(resolverClubIdDesdeParamClub('el-trigal', clubes)).toBe('id-fire-1')
  })

  it('resuelve slug case-insensitive', () => {
    expect(resolverClubIdDesdeParamClub('EL-TRIGAL', clubes)).toBe('id-fire-1')
  })

  it('decodifica URI', () => {
    expect(resolverClubIdDesdeParamClub(encodeURIComponent('el-trigal'), clubes)).toBe('id-fire-1')
  })

  it('vacío o desconocido', () => {
    expect(resolverClubIdDesdeParamClub('', clubes)).toBe('')
    expect(resolverClubIdDesdeParamClub('no-existe', clubes)).toBe('')
  })
})
