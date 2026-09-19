import { describe, expect, it } from 'vitest'
import { createEmptyResumeDocument } from '../../core/schema'
import { ESTIMATED_CHARS_PER_PAGE, estimateCvPages } from './estimatePageCount'

describe('estimateCvPages (heuristic behind the soft two-page warning)', () => {
  it('estimates one page for an empty document', () => {
    expect(estimateCvPages(createEmptyResumeDocument())).toBe(1)
  })

  it('never returns less than one page', () => {
    expect(estimateCvPages({ basics: {}, sections: {} })).toBe(1)
  })

  it('grows with content volume: one page of chars stays one page', () => {
    const doc = {
      basics: { summary: 'a'.repeat(ESTIMATED_CHARS_PER_PAGE) },
      sections: {},
    }
    expect(estimateCvPages(doc)).toBe(1)
  })

  it('crosses the two-page boundary only with substantial content', () => {
    const twoPages = {
      basics: { summary: 'a'.repeat(ESTIMATED_CHARS_PER_PAGE * 2) },
      sections: {},
    }
    expect(estimateCvPages(twoPages)).toBe(2)

    const threePages = {
      basics: { summary: 'a'.repeat(ESTIMATED_CHARS_PER_PAGE * 2 + 1) },
      sections: {},
    }
    expect(estimateCvPages(threePages)).toBe(3)
  })

  it('counts section items as heading lines and highlights as content', () => {
    const doc = {
      basics: {},
      sections: {
        experience: Array.from({ length: 4 }, () => ({
          organization: 'org',
          current: false,
          highlights: ['b'.repeat(500), 'b'.repeat(500)],
        })),
      },
    }
    // 4 headings x 80 chars + 8 x 500 highlight chars = 4320 -> 2 pages.
    expect(estimateCvPages(doc)).toBe(2)
  })

  it('treats an empty section array as contributing nothing', () => {
    const doc = { basics: {}, sections: { education: [], skills: [] } }
    expect(estimateCvPages(doc)).toBe(1)
  })
})
