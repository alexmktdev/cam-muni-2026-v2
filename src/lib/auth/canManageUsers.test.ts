import { describe, expect, it } from 'vitest'
import { canManageUsers } from '@/lib/auth/canManageUsers'

describe('canManageUsers', () => {
  it('permite sin rol o vacío', () => {
    expect(canManageUsers(undefined)).toBe(true)
    expect(canManageUsers(null)).toBe(true)
    expect(canManageUsers('')).toBe(true)
    expect(canManageUsers('   ')).toBe(true)
  })

  it('permite admin u otros roles no restringidos', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('Editor')).toBe(true)
  })

  it('niega roles de solo lectura', () => {
    expect(canManageUsers('invitado')).toBe(false)
    expect(canManageUsers('guest')).toBe(false)
    expect(canManageUsers('viewer')).toBe(false)
    expect(canManageUsers('lector')).toBe(false)
    expect(canManageUsers('solo lectura')).toBe(false)
    expect(canManageUsers('readOnly')).toBe(false)
  })
})
