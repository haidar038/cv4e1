import { describe, expect, it } from 'vitest'
import { fieldIsValid } from './field-validation'

describe('fieldIsValid (reuses the canonical core sub-schemas)', () => {
  it('treats the empty string as valid for every kind — clearing is legitimate', () => {
    for (const kind of ['email', 'url', 'partialDate', 'gpaValue', 'gpaScale'] as const) {
      expect(fieldIsValid(kind, '')).toBe(true)
    }
  })

  it('accepts schema-valid emails and rejects intermediates', () => {
    expect(fieldIsValid('email', 'budi.santoso@email.com')).toBe(true)
    expect(fieldIsValid('email', 'budi')).toBe(false)
    expect(fieldIsValid('email', 'budi@')).toBe(false)
  })

  it('accepts schema-valid URLs and rejects intermediates', () => {
    expect(fieldIsValid('url', 'https://www.linkedin.com/in/budisantoso')).toBe(true)
    expect(fieldIsValid('url', 'https://')).toBe(false)
    expect(fieldIsValid('url', 'bukan url')).toBe(false)
  })

  it('accepts every partialDate granularity and rejects partial input', () => {
    expect(fieldIsValid('partialDate', '2021')).toBe(true)
    expect(fieldIsValid('partialDate', '2021-08')).toBe(true)
    expect(fieldIsValid('partialDate', '2021-08-17')).toBe(true)
    expect(fieldIsValid('partialDate', '2021-')).toBe(false)
    expect(fieldIsValid('partialDate', '2021-0')).toBe(false)
  })

  it('accepts canonical GPA value/scale shapes and rejects intermediates', () => {
    expect(fieldIsValid('gpaValue', '3.52')).toBe(true)
    expect(fieldIsValid('gpaValue', '3,52')).toBe(true)
    expect(fieldIsValid('gpaValue', '3.')).toBe(false)
    expect(fieldIsValid('gpaScale', '4.00')).toBe(true)
    expect(fieldIsValid('gpaScale', '5')).toBe(true)
    expect(fieldIsValid('gpaScale', '4.')).toBe(false)
  })
})
