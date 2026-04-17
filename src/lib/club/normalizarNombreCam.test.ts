import { describe, expect, it } from 'vitest'
import { normalizarNombreClubCam } from '@/lib/club/normalizarNombreCam'

describe('normalizarNombreClubCam', () => {
  it('añade CAM si falta', () => {
    expect(normalizarNombreClubCam('  El trigal  ')).toBe('CAM El trigal')
  })

  it('no duplica CAM', () => {
    expect(normalizarNombreClubCam('cam El trigal')).toBe('CAM El trigal')
    expect(normalizarNombreClubCam('CAM El trigal')).toBe('CAM El trigal')
  })

  it('si solo queda la palabra cam/CAM (sin espacio tras el prefijo), se antepone CAM', () => {
    expect(normalizarNombreClubCam('cam')).toBe('CAM cam')
    expect(normalizarNombreClubCam('cam ')).toBe('CAM cam')
    expect(normalizarNombreClubCam('CAM')).toBe('CAM CAM')
  })

  it('vacío', () => {
    expect(normalizarNombreClubCam('')).toBe('')
    expect(normalizarNombreClubCam('   ')).toBe('')
  })
})
