import { describe, it, expect } from 'vitest'
import { validateCrefito, normalizeCrefito, isValidCrefito } from './crefito'

describe('Crefito validation', () => {
  it('normalizes non-alphanumerics', () => {
    expect(normalizeCrefito('12.34-5F')).toBe('12345F')
  })
  it('accepts valid lengths', () => {
    expect(isValidCrefito('12345')).toBe(true)
    expect(isValidCrefito('123456789012')).toBe(true)
  })
  it('rejects too short/long', () => {
    expect(isValidCrefito('1234')).toBe(false)
    expect(isValidCrefito('1234567890123')).toBe(false)
  })
  it('rejects invalid chars', () => {
    expect(isValidCrefito('1234$F')).toBe(false)
  })
  it('provides clear errors', () => {
    const r = validateCrefito('12$')
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toContain('Apenas letras e números')
  })
})