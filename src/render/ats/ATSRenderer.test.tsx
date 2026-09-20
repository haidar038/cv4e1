/// <reference types="node" />
// This node-project test reads fixtures and print.css from disk; the app
// tsconfig ships without node types, so they are referenced per-file here.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { toATSViewModel } from '../../core/normalize'
import { validateResumeDocument, type ValidatedResumeDocument } from '../../core/schema'
import type { ATSViewModel } from '../../core/view-models'
import { ATSRenderer } from './ATSRenderer'
import { expectedTexts, firstOutOfOrderText } from './expectations'
import { findStructuralViolations } from './structural'

/**
 * Task 10 structural gates (FR-002/004/005/006/007/008) — no DOM: the node
 * project renders via react-dom/server, proving the renderer output is a
 * static, deterministic markup string (plan AC: renderToStaticMarkup snapshot
 * test without DOM).
 */

function loadFixture(relativeUrl: string): ValidatedResumeDocument {
  const raw: unknown = JSON.parse(
    readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8'),
  )
  const result = validateResumeDocument(raw)
  if (!result.success) throw result.error
  return result.data
}

function renderVM(vm: ATSViewModel): string {
  return renderToStaticMarkup(<ATSRenderer vm={vm} />)
}

const emptyDoc = loadFixture('../../../fixtures/empty-document.json')
const fullDoc = loadFixture('../../../fixtures/full-document.json')
const freshGraduateDoc = loadFixture('../../../docs/04-data/sample-resumes/fresh-graduate-id.json')

const emptyHtml = renderVM(toATSViewModel(emptyDoc))
const fullVm = toATSViewModel(fullDoc)
const fullHtml = renderVM(fullVm)
const freshVm = toATSViewModel(freshGraduateDoc)
const freshHtml = renderVM(freshVm)

describe('ATSRenderer structural gates', () => {
  it('renders no img/table/svg/div even when the source has an enabled photo (FR-002, FR-005)', () => {
    // fresh-graduate-id.json has photo.enabled: true — the view model cannot
    // carry it, so the markup cannot show it.
    expect(findStructuralViolations(freshHtml)).toEqual([])
    expect(findStructuralViolations(fullHtml)).toEqual([])
    expect(freshHtml).not.toContain('asset_sample_photo_01')
  })

  it('renders flat semantic HTML only (plan AC: no decorative nesting)', () => {
    // Block-flow elements only: article/header/section/h1/h2/p/ul/li/strong/a/span.
    expect(fullHtml).not.toContain('<div')
    expect(freshHtml).not.toContain('<div')
  })

  it('renders headings in exact view-model order with the controlled vocabulary (FR-007)', () => {
    const headings = [...fullHtml.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((match) => match[1])
    expect(headings).toEqual(fullVm.sections.map((section) => section.heading))
    expect(headings).toEqual([
      'PENDIDIKAN',
      'PENGALAMAN KERJA',
      'ORGANISASI',
      'PROYEK',
      'KEAHLIAN',
      'SERTIFIKASI',
    ])
  })

  it('renders zero headings for the empty document (FR-006 + rendering contract)', () => {
    expect(emptyHtml).not.toContain('<h2')
    // The empty draft's name is '' — an empty <h1> would violate the
    // "ignore empty fields, never emit empty headings" rendering contract.
    expect(emptyHtml).not.toContain('<h1')
  })

  it('keeps the name verbatim mixed-case (D12)', () => {
    expect(fullHtml).toContain('Contoh Nama Fiktif')
    expect(freshHtml).toContain('Rania Putri Maharani')
    expect(fullHtml).not.toMatch(/CONTOH NAMA FIKTIF/)
  })

  it('emits every expected display string in reading order', () => {
    const expected = expectedTexts(fullVm)
    expect(expected.length).toBeGreaterThan(20)
    expect(firstOutOfOrderText(fullHtml, expected)).toBeNull()
  })

  it('recovers Indonesian-specific characters (en dash, +62, translated labels)', () => {
    expect(fullHtml).toContain('Agustus 2021 – Juli 2025')
    expect(fullHtml).toContain('+62 812-0000-0000')
    expect(fullHtml).toContain('IPK: 3.52 / 4.00')
    expect(fullHtml).toContain('Magang')
    expect(fullHtml).toContain('Lulus')
  })

  it('renders "Sekarang" for a current experience item', () => {
    const [firstExperience] = fullDoc.sections.experience ?? []
    if (firstExperience === undefined) throw new Error('fixture must have an experience item')
    const docWithCurrent = {
      ...fullDoc,
      sections: { ...fullDoc.sections, experience: [{ ...firstExperience, current: true }] },
    }
    const html = renderVM(toATSViewModel(docWithCurrent))
    expect(html).toContain('Juli 2024 – Sekarang')
  })

  it('meta: the structural checker fails when an <img> is injected (plan AC)', () => {
    expect(findStructuralViolations('<p><img src="photo.png" alt="foto"></p>')).toEqual(['<img'])
    expect(findStructuralViolations('<table><tr><td>x</td></tr></table>')).toEqual(['<table'])
  })
})

describe('ATSRenderer stylesheet gates (a template cannot override mode rules, FR-008)', () => {
  const cssFile = readFileSync(fileURLToPath(new URL('./print.css', import.meta.url)), 'utf8')
  // Assert against the rule body only — the header comment documents the
  // forbidden patterns by name and is not a rule.
  const css = cssFile.replace(/\/\*[\s\S]*?\*\//g, '')

  it('keeps the stylesheet single-column block flow (FR-004)', () => {
    expect(css).not.toMatch(/display\s*:\s*(grid|flex)/i)
    expect(css).not.toMatch(/column-count/i)
    expect(css).not.toMatch(/float\s*:/i)
  })

  it('never transforms the name casing (D12)', () => {
    expect(css).not.toMatch(/text-transform/i)
  })

  it('configures A4 pages and keeps experience items unsplit when printing', () => {
    expect(css).toMatch(/@page/i)
    expect(css).toMatch(/size\s*:\s*A4/i)
    expect(css).toMatch(/break-inside\s*:\s*avoid/i)
    expect(css).toMatch(/@media\s+print/i)
  })
})

describe('ATSRenderer markup baselines (regresi visual — committed snapshots)', () => {
  it('empty document', () => {
    expect(emptyHtml).toMatchSnapshot('empty document markup')
  })

  it('full document', () => {
    expect(fullHtml).toMatchSnapshot('full document markup')
  })

  it('fresh graduate document (photo enabled in source)', () => {
    expect(freshHtml).toMatchSnapshot('fresh graduate markup')
  })
})
