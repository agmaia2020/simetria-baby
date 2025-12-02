import { describe, it, expect } from 'vitest'
import { validateEspecialidade, normalizeEspecialidade, isValidEspecialidade, formatEspecialidade } from './especialidade'

describe('Especialidade validation', () => {
  it('normalizes spaces', () => {
    expect(normalizeEspecialidade('  Fisio   Neuro  ')).toBe('Fisio Neuro')
  })
  it('accepts valid text', () => {
    expect(isValidEspecialidade('Fisioterapeuta Neurofuncional')).toBe(true)
  })
  it('accepts hyphens and apostrophes', () => {
    expect(isValidEspecialidade("Fisioterapia Cardio-respiratória")).toBe(true)
    expect(isValidEspecialidade("O'Connor Fisioterapia")).toBe(true)
  })
  it('rejects numbers or symbols', () => {
    expect(isValidEspecialidade('Fisio 123')).toBe(false)
    expect(isValidEspecialidade('Fisio*Neuro')).toBe(false)
    expect(isValidEspecialidade('   ')).toBe(false)
  })
  it('errors are descriptive', () => {
    const r = validateEspecialidade('F')
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toContain('Mínimo de 4 caracteres')
  })
  it('formats title case correctly', () => {
    expect(formatEspecialidade("fisioterapeuta neurofuncional")).toBe("Fisioterapeuta Neurofuncional")
    expect(formatEspecialidade("fisioterapia cardio-respiratória")).toBe("Fisioterapia Cardio-respiratória")
    expect(formatEspecialidade("o'connor fisioterapia")).toBe("O'connor Fisioterapia")
  })
})