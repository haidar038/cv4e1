import { describe, expect, it } from 'vitest'
import { insertAtCursor } from './insertAtCursor'

/**
 * Pure insertion logic for Task 13b suggestion picks (FR-205). Every case
 * pins both the resulting value and the caret: the caret contract is what
 * "insert at the cursor, never overwrite" means in practice.
 */
describe('insertAtCursor (pure, no DOM)', () => {
  const verb = 'Memimpin'

  it('inserts the bare verb into an empty field — no hanging space', () => {
    expect(insertAtCursor({ value: '', selectionStart: 0, insert: verb })).toEqual({
      value: 'Memimpin',
      caret: 8,
    })
  })

  it('separates from preceding text at the end of the value', () => {
    expect(insertAtCursor({ value: 'Membuat', selectionStart: 7, insert: verb })).toEqual({
      value: 'Membuat Memimpin',
      caret: 16,
    })
  })

  it('does not double the space when the value already ends with one', () => {
    expect(insertAtCursor({ value: 'Membuat ', selectionStart: 8, insert: verb })).toEqual({
      value: 'Membuat Memimpin',
      caret: 16,
    })
  })

  it('separates from following text at the start of the value', () => {
    expect(insertAtCursor({ value: 'tim', selectionStart: 0, insert: verb })).toEqual({
      value: 'Memimpin tim',
      caret: 9,
    })
  })

  it('fits between two words using the existing surrounding spaces', () => {
    expect(insertAtCursor({ value: 'Halo dunia', selectionStart: 4, insert: verb })).toEqual({
      value: 'Halo Memimpin dunia',
      caret: 13,
    })
  })

  it('keeps both word fragments intact when the caret sits mid-word', () => {
    expect(insertAtCursor({ value: 'Memimpin', selectionStart: 6, insert: verb })).toEqual({
      value: 'Memimp Memimpin in',
      caret: 16,
    })
  })

  it('adds separators on both sides between two glued words', () => {
    expect(insertAtCursor({ value: 'AbcDef', selectionStart: 3, insert: verb })).toEqual({
      value: 'Abc Memimpin Def',
      caret: 13,
    })
  })

  it('never deletes a non-collapsed selection — it inserts before it', () => {
    const result = insertAtCursor({ value: 'tim lama', selectionStart: 0, insert: verb })
    expect(result).toEqual({ value: 'Memimpin tim lama', caret: 9 })
    expect(result.value).toContain('tim lama')
  })

  it('clamps an out-of-range position to the end of the value', () => {
    expect(insertAtCursor({ value: 'abc', selectionStart: 99, insert: verb })).toEqual({
      value: 'abc Memimpin',
      caret: 12,
    })
  })

  it('clamps a negative position to the start of the value', () => {
    expect(insertAtCursor({ value: 'abc', selectionStart: -3, insert: verb })).toEqual({
      value: 'Memimpin abc',
      caret: 9,
    })
  })

  it('treats an empty insert as a no-op that only clamps the caret', () => {
    expect(insertAtCursor({ value: 'Halo', selectionStart: 2, insert: '' })).toEqual({
      value: 'Halo',
      caret: 2,
    })
  })
})
