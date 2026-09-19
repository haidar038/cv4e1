import { describe, expect, it } from 'vitest'
import {
  actionVerbs,
  getAllVerbs,
  getVerbCategories,
  getVerbsForSection,
  type CatalogSectionKey,
  type VerbCategory,
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
