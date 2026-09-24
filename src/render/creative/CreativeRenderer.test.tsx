/// <reference types="node" />
// This node-project test reads fixtures and the stylesheet from disk; the
// app tsconfig ships without node types, so they are referenced per-file here.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { toATSViewModel, toCreativeViewModel } from '../../core/normalize'
import { validateResumeDocument, type ValidatedResumeDocument } from '../../core/schema'
import type { CreativeViewModel } from '../../core/view-models'
import { ATSRenderer } from '../ats/ATSRenderer'
import { containsNormalized, expectedTexts as expectedAtsTexts } from '../ats/expectations'
import { CreativeRenderer } from './CreativeRenderer'
import { expectedTexts, firstOutOfOrderText } from './expectations'
import { findStructuralViolations } from './structural'

/**
 * Task 11 structural gates (FR-001/FR-008 creative side/FR-303) — no DOM:
 * the node project renders via react-dom/server, proving the renderer output
 * is a static, deterministic markup string. The Creative rules differ from
 * the ATS gates (render/ats/ATSRenderer.test.tsx): an <img> with alt is
 * legal; rasterization and text outside the text layer are not.
 */

const PHOTO_RESOLVER_OK = (assetRef: string): string | undefined =>
  assetRef === '' ? undefined : `blob:photo-${assetRef}`

function loadFixture(relativeUrl: string): ValidatedResumeDocument {
  const raw: unknown = JSON.parse(
    readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8'),
  )
  const result = validateResumeDocument(raw)
  if (!result.success) throw result.error
  return result.data
}

function renderVM(vm: CreativeViewModel, resolvePhotoUrl = PHOTO_RESOLVER_OK): string {
  return renderToStaticMarkup(<CreativeRenderer vm={vm} resolvePhotoUrl={resolvePhotoUrl} />)
}

const emptyDoc = loadFixture('../../../fixtures/empty-document.json')
const fullDoc = loadFixture('../../../fixtures/full-document.json')
const freshGraduateDoc = loadFixture('../../../docs/04-data/sample-resumes/fresh-graduate-id.json')

const emptyHtml = renderVM(toCreativeViewModel(emptyDoc))
const fullVm = toCreativeViewModel(fullDoc)
const fullHtml = renderVM(fullVm)
const freshVm = toCreativeViewModel(freshGraduateDoc)
const freshHtml = renderVM(freshVm)

describe('CreativeRenderer structural gates', () => {
  it('renders no canvas/svg/table/iframe/object/embed on any fixture', () => {
    expect(findStructuralViolations(emptyHtml)).toEqual([])
    expect(findStructuralViolations(fullHtml)).toEqual([])
    expect(findStructuralViolations(freshHtml)).toEqual([])
    // Text is never carried by a background: every field is a real text node
    // (asserted by the order test below) and the stylesheet gate forbids
    // background-image entirely.
  })

  it('renders exactly one img with alt when the photo blob resolves (AC: foto dirender)', () => {
    expect((fullHtml.match(/<img\b/g) ?? []).length).toBe(1)
    expect(fullHtml).toContain('src="blob:photo-asset_test_001"')
    expect(fullHtml).toContain('alt="Contoh Nama Fiktif"')
    expect(findStructuralViolations(fullHtml)).toEqual([])
  })

  it('renders a neutral placeholder and no img when the photo blob fails to load', () => {
    const html = renderVM(fullVm, () => undefined)
    expect(html).not.toContain('<img')
    expect(html).not.toContain('asset_test_001')
    // The placeholder keeps the sidebar balanced without inventing content.
    expect(html).toContain('aria-hidden="true"')
    expect(findStructuralViolations(html)).toEqual([])
  })

  it('renders no photo slot at all when the photo is absent (AC: tidak dirender bila tidak ada)', () => {
    const basicsWithoutPhoto = { ...fullDoc.basics }
    delete basicsWithoutPhoto.photo
    const docWithoutPhoto: ValidatedResumeDocument = { ...fullDoc, basics: basicsWithoutPhoto }
    const html = renderVM(toCreativeViewModel(docWithoutPhoto))
    expect(html).not.toContain('<img')
    expect(html).not.toContain('aria-hidden="true"')
    expect(html).not.toContain('photo')
  })

  it('renders no sidebar when it would be empty (AC: tanpa foto, layout tetap seimbang)', () => {
    // The empty draft has no photo, contacts, links, or skills.
    expect(emptyHtml).not.toContain('<aside')
    expect(emptyHtml).not.toContain('<h1')
    expect(emptyHtml).not.toContain('<h2')
  })

  it('renders each section heading exactly once, skills inside the sidebar', () => {
    const headings = [...fullHtml.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1])
    expect(headings).toEqual([
      'KEAHLIAN',
      'PENDIDIKAN',
      'PENGALAMAN KERJA',
      'ORGANISASI',
      'PROYEK',
      'SERTIFIKASI',
    ])
    // Sidebar first; the main-column sections keep the view-model order after it.
    const asideEnd = fullHtml.indexOf('</aside>')
    expect(fullHtml.indexOf('KEAHLIAN</h2>')).toBeLessThan(asideEnd)
    expect(fullHtml.indexOf('PENDIDIKAN</h2>')).toBeGreaterThan(asideEnd)
  })

  it('keeps the name verbatim mixed-case (D12)', () => {
    expect(fullHtml).toContain('Contoh Nama Fiktif')
    expect(freshHtml).toContain('Rania Putri Maharani')
    expect(fullHtml).not.toMatch(/CONTOH NAMA FIKTIF/)
  })

  it('emits every expected display string in creative reading order', () => {
    const expected = expectedTexts(fullVm)
    expect(expected.length).toBeGreaterThan(20)
    expect(firstOutOfOrderText(fullHtml, expected)).toBeNull()
  })

  it('renders the same field values as the ATS renderer for the same document (AC-001-a)', () => {
    for (const [creativeHtml, atsVm] of [
      [fullHtml, toATSViewModel(fullDoc)],
      [freshHtml, toATSViewModel(freshGraduateDoc)],
    ] as const) {
      const missingInCreative = expectedAtsTexts(atsVm).filter(
        (text) => !containsNormalized(creativeHtml, text),
      )
      expect(missingInCreative, `missing in creative: ${missingInCreative.join(' | ')}`).toEqual([])
    }
    const atsHtml = renderToStaticMarkup(<ATSRenderer vm={toATSViewModel(fullDoc)} />)
    const missingInAts = expectedTexts(fullVm).filter((text) => !containsNormalized(atsHtml, text))
    expect(missingInAts, `missing in ATS: ${missingInAts.join(' | ')}`).toEqual([])
  })

  it('recovers Indonesian-specific characters (en dash, +62, translated labels)', () => {
    expect(fullHtml).toContain('Agustus 2021 – Juli 2025')
    expect(fullHtml).toContain('+62 812-0000-0000')
    expect(fullHtml).toContain('IPK: 3.52 / 4.00')
    expect(fullHtml).toContain('Magang')
    expect(fullHtml).toContain('Lulus')
    expect(fullHtml).toContain('LinkedIn: https://www.linkedin.com/in/contoh-fiktif')
  })

  it('renders "Sekarang" for a current experience item', () => {
    const [firstExperience] = fullDoc.sections.experience ?? []
    if (firstExperience === undefined) throw new Error('fixture must have an experience item')
    const docWithCurrent = {
      ...fullDoc,
      sections: { ...fullDoc.sections, experience: [{ ...firstExperience, current: true }] },
    }
    const html = renderVM(toCreativeViewModel(docWithCurrent))
    expect(html).toContain('Juli 2024 – Sekarang')
  })

  it('meta: the structural checker fails on raster/table/svg and img rule breaks (plan AC)', () => {
    expect(findStructuralViolations('<svg><text>x</text></svg>')).toEqual(['<svg'])
    expect(findStructuralViolations('<canvas></canvas>')).toEqual(['<canvas'])
    expect(findStructuralViolations('<table><tr><td>x</td></tr></table>')).toEqual(['<table'])
    expect(findStructuralViolations('<img src="a.png" alt="a"><img src="b.png" alt="b">')).toEqual([
      '<img ×2 (maksimum satu)',
    ])
    expect(findStructuralViolations('<img src="a.png">')).toEqual(['<img tanpa alt'])
    expect(findStructuralViolations('<img src="a.png" alt="foto">')).toEqual([])
  })
})

describe('CreativeRenderer stylesheet gates (a template cannot override mode rules)', () => {
  const cssFile = readFileSync(
    fileURLToPath(new URL('./templates/default/styles.module.css', import.meta.url)),
    'utf8',
  )
  // Assert against the rule body only — the header comment documents the
  // forbidden patterns by name and is not a rule.
  const css = cssFile.replace(/\/\*[\s\S]*?\*\//g, '')

  it('keeps every color on theme tokens (AC: tidak ada warna di luar token)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/rgba?\(/)
    expect(css).not.toMatch(/hsla?\(/)
    expect(css).not.toMatch(/oklch\(/)
    expect(css).toContain('var(--')
  })

  it('never carries text via background-image and never transforms casing (FR-303, D12)', () => {
    expect(css).not.toMatch(/background-image/i)
    expect(css).not.toMatch(/text-transform/i)
  })

  it('uses the two-column flex layout this mode is allowed to use', () => {
    expect(css).toMatch(/display\s*:\s*flex/i)
  })

  it('configures A4 pages, unsplit items, cover photo, and print isolation', () => {
    expect(css).toMatch(/@page/i)
    expect(css).toMatch(/size\s*:\s*A4/i)
    expect(css).toMatch(/break-inside\s*:\s*avoid/i)
    expect(css).toMatch(/break-after\s*:\s*avoid/i)
    expect(css).toMatch(/object-fit\s*:\s*cover/i)
    expect(css).toMatch(/@media\s+print/i)
    expect(css).toMatch(/:global\(body \*\)/i)
  })

  it('restores disc markers on item lists (preview bullets stay visible)', () => {
    expect(css).toMatch(/\.item\s+ul\s*\{[^}]*list-style-type\s*:\s*disc/i)
  })
})

describe('CreativeRenderer markup baselines (regresi visual — committed snapshots)', () => {
  it('empty document', () => {
    expect(emptyHtml).toMatchSnapshot('empty document markup')
  })

  it('full document (photo blob resolved)', () => {
    expect(fullHtml).toMatchSnapshot('full document markup')
  })

  it('fresh graduate document (photo enabled in source)', () => {
    expect(freshHtml).toMatchSnapshot('fresh graduate markup')
  })
})
