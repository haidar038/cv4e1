import { describe, expect, it } from 'vitest'
import {
  actionVerbs,
  actionVerbsEn,
  getAllVerbs,
  getVerbCategories,
  getVerbsForSection,
  type CatalogSectionKey,
  type VerbCategory,
  type VerbCategoryEn,
} from './index'

const ALL_CATEGORIES: readonly VerbCategory[] = [
  'Manajerial',
  'Teknis',
  'Analitis',
  'Kreatif',
  'Komunikasi',
  'Operasional',
]

const ALL_SECTION_KEYS: readonly CatalogSectionKey[] = [
  'education',
  'experience',
  'organizations',
  'projects',
  'skills',
  'certifications',
]

describe('catalog shape', () => {
  it('holds 60–100 entries (plan Task 13a target)', () => {
    expect(actionVerbs.length).toBeGreaterThanOrEqual(60)
    expect(actionVerbs.length).toBeLessThanOrEqual(100)
  })

  it('gives every entry a verb, a valid category, sections, and a phrase pattern', () => {
    for (const entry of actionVerbs) {
      expect(entry.verb.trim().length).toBeGreaterThan(0)
      expect(ALL_CATEGORIES).toContain(entry.category)
      for (const section of entry.applicableSections) {
        expect(ALL_SECTION_KEYS).toContain(section)
      }
      // J4: the phrase is a pattern with placeholders, not a finished sentence.
      expect(entry.examplePhrase).toContain('[')
      expect(entry.examplePhrase).toContain(entry.verb)
    }
  })

  it('has no duplicate verbs, case-insensitively', () => {
    const verbs = actionVerbs.map((entry) => entry.verb.toLowerCase())
    expect(new Set(verbs).size).toBe(verbs.length)
  })

  it('covers all six categories', () => {
    expect(getVerbCategories()).toEqual(ALL_CATEGORIES)
  })

  it('uses only experience-style sections (Task 13b shows no suggestions elsewhere)', () => {
    const usedSections = new Set(actionVerbs.flatMap((entry) => entry.applicableSections))
    for (const section of usedSections) {
      expect(['experience', 'organizations', 'projects']).toContain(section)
    }
  })
})

describe('getVerbsForSection', () => {
  it('returns relevant entries for projects, without any network request', () => {
    const verbs = getVerbsForSection('projects')
    expect(verbs.length).toBeGreaterThan(0)
    for (const entry of verbs) {
      expect(entry.applicableSections).toContain('projects')
    }
  })

  it('filters differently per section (experience vs skills vs education)', () => {
    const experience = getVerbsForSection('experience')
    const skills = getVerbsForSection('skills')
    const education = getVerbsForSection('education')

    expect(experience.length).toBeGreaterThan(0)
    expect(skills).toHaveLength(0)
    expect(education).toHaveLength(0)
    expect(experience).not.toEqual(skills)
  })

  it('returns different lists for experience and organizations', () => {
    const experience = getVerbsForSection('experience')
    const organizations = getVerbsForSection('organizations')
    expect(organizations.length).toBeGreaterThan(0)
    expect(experience).not.toEqual(organizations)
  })

  it('getAllVerbs returns the whole catalog unchanged', () => {
    expect(getAllVerbs()).toEqual(actionVerbs)
  })
})

describe('english catalog (ADR-0012, FR-702)', () => {
  const ALL_CATEGORIES_EN: readonly VerbCategoryEn[] = [
    'Managerial',
    'Technical',
    'Analytical',
    'Creative',
    'Communication',
    'Operational',
  ]

  it('mirrors the Indonesian catalog entry for entry (same size, same sections)', () => {
    expect(actionVerbsEn.length).toBe(actionVerbs.length)
    for (let index = 0; index < actionVerbs.length; index += 1) {
      expect(actionVerbsEn[index]?.applicableSections).toEqual(
        actionVerbs[index]?.applicableSections,
      )
    }
  })

  it('gives every entry an English verb, a valid category, sections, and a phrase pattern', () => {
    for (const entry of actionVerbsEn) {
      expect(entry.verb.trim().length).toBeGreaterThan(0)
      expect(ALL_CATEGORIES_EN).toContain(entry.category)
      for (const section of entry.applicableSections) {
        expect(ALL_SECTION_KEYS).toContain(section)
      }
      // Same J4 contract as the ID catalog: pattern, not a finished sentence.
      expect(entry.examplePhrase).toContain('[')
      expect(entry.examplePhrase).toContain(entry.verb)
    }
  })

  it('has no duplicate verbs, case-insensitively', () => {
    const verbs = actionVerbsEn.map((entry) => entry.verb.toLowerCase())
    expect(new Set(verbs).size).toBe(verbs.length)
  })

  it('covers all six English categories in catalog order', () => {
    expect(getVerbCategories('en')).toEqual(ALL_CATEGORIES_EN)
  })

  it('routes the section getters by locale without changing the ID default', () => {
    const idVerbs = getVerbsForSection('experience')
    const enVerbs = getVerbsForSection('experience', 'en')
    expect(enVerbs.length).toBeGreaterThan(0)
    for (const entry of enVerbs) {
      expect(entry.applicableSections).toContain('experience')
    }
    // Same sections, different verbs — a mapping would share one side.
    expect(enVerbs.map((entry) => entry.verb)).not.toEqual(idVerbs.map((entry) => entry.verb))
    expect(getAllVerbs('en')).toEqual(actionVerbsEn)
  })
})
