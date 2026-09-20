import { describe, it, expect } from 'vitest'
import { toATSViewModel, toCreativeViewModel } from './normalize'
import { validateResumeDocument } from './schema'
import fullDocRaw from '../../fixtures/full-document.json'
import emptyDocRaw from '../../fixtures/empty-document.json'

// Helper to get validated doc from raw JSON
function getValidated(raw: unknown) {
  const result = validateResumeDocument(raw)
  if (!result.success) throw new Error('Fixture invalid: ' + JSON.stringify(result.error))
  return result.data
}

describe('Normalization: ATS ViewModel', () => {
  const doc = getValidated(fullDocRaw)
  const vm = toATSViewModel(doc)

  it('should have mode "ats"', () => {
    expect(vm.mode).toBe('ats')
  })

  it('should NOT contain a photo field (structural enforcement)', () => {
    // @ts-expect-error – verifying absence at runtime too
    expect(vm.photo).toBeUndefined()
    expect('photo' in vm).toBe(false)
  })

  it('should preserve name and headline', () => {
    expect(vm.name).toBe('Contoh Nama Fiktif')
    expect(vm.headline).toBe('Fresh Graduate Teknik Informatika')
  })

  it('should include contacts', () => {
    expect(vm.contacts.email).toBe('contoh.fiktif@example.com')
    expect(vm.contacts.phone).toBe('+62 812-0000-0000')
  })

  it('should include links with labels', () => {
    expect(vm.links).toHaveLength(1)
    const [firstLink] = vm.links
    expect(firstLink?.label).toBe('LinkedIn')
  })

  it('should order sections according to sectionOrder', () => {
    const keys = vm.sections.map((s) => s.key)
    expect(keys).toEqual([
      'education',
      'experience',
      'organizations',
      'projects',
      'skills',
      'certifications',
    ])
  })

  it('should use standard Indonesian headings', () => {
    const eduSection = vm.sections.find((s) => s.key === 'education')
    expect(eduSection?.heading).toBe('PENDIDIKAN')
    const expSection = vm.sections.find((s) => s.key === 'experience')
    expect(expSection?.heading).toBe('PENGALAMAN KERJA')
  })

  it('should format GPA as "value / scale"', () => {
    const eduSection = vm.sections.find((s) => s.key === 'education')
    const eduItem = eduSection?.items[0] as { gpa?: { formatted: string } }
    expect(eduItem.gpa?.formatted).toBe('3.52 / 4.00')
  })

  it('should translate education status to Indonesian', () => {
    const eduSection = vm.sections.find((s) => s.key === 'education')
    const eduItem = eduSection?.items[0] as { status?: string }
    expect(eduItem.status).toBe('Lulus')
  })

  it('should translate employment type to Indonesian (display string, not enum)', () => {
    const expSection = vm.sections.find((s) => s.key === 'experience')
    const expItem = expSection?.items[0] as { employmentType?: string }
    expect(expItem.employmentType).toBe('Magang')
  })

  it('should format dates in Indonesian months', () => {
    const eduSection = vm.sections.find((s) => s.key === 'education')
    const eduItem = eduSection?.items[0] as { dates: { start?: string; end?: string } }
    expect(eduItem.dates.start).toBe('Agustus 2021')
    expect(eduItem.dates.end).toBe('Juli 2025')
  })

  it('should handle current=true experience as "Sekarang"', () => {
    const [firstExperience] = doc.sections.experience ?? []
    if (firstExperience === undefined) {
      throw new Error('Fixture must contain at least one experience item')
    }
    const docWithCurrent = {
      ...doc,
      sections: { ...doc.sections, experience: [{ ...firstExperience, current: true }] },
    }
    const vmCurrent = toATSViewModel(docWithCurrent)
    const expSection = vmCurrent.sections.find((s) => s.key === 'experience')
    const item = expSection?.items[0] as { dates: { end?: string } }
    expect(item.dates.end).toBe('Sekarang')
  })
})

describe('Normalization: Creative ViewModel', () => {
  const doc = getValidated(fullDocRaw)
  const vm = toCreativeViewModel(doc)

  it('should have mode "creative"', () => {
    expect(vm.mode).toBe('creative')
  })

  it('should include photo when enabled and has assetRef', () => {
    expect(vm.photo).toBeDefined()
    expect(vm.photo?.assetRef).toBe('asset_test_001')
    expect(vm.photo?.enabled).toBe(true)
  })

  it('should omit photo when not enabled', () => {
    const noPhotoDoc = { ...doc, basics: { ...doc.basics, photo: undefined } }
    const vmNoPhoto = toCreativeViewModel(noPhotoDoc)
    expect(vmNoPhoto.photo).toBeUndefined()
  })

  it('should omit photo when enabled but no assetRef', () => {
    const reflessDoc = { ...doc, basics: { ...doc.basics, photo: { enabled: true } } }
    const vmRefless = toCreativeViewModel(reflessDoc)
    expect(vmRefless.photo).toBeUndefined()
  })
})

describe('Normalization: Empty Document Edge Cases', () => {
  const emptyDoc = getValidated(emptyDocRaw)

  it('ATS view model for empty doc should have zero sections', () => {
    const vm = toATSViewModel(emptyDoc)
    expect(vm.sections).toHaveLength(0)
    expect(vm.name).toBe('')
  })

  it('Creative view model for empty doc should have zero sections and no photo', () => {
    const vm = toCreativeViewModel(emptyDoc)
    expect(vm.sections).toHaveLength(0)
    expect(vm.photo).toBeUndefined()
  })
})

describe('Normalization: Purity & Determinism', () => {
  const doc = getValidated(fullDocRaw)

  it('calling twice produces identical output (pure function)', () => {
    const vm1 = toATSViewModel(doc)
    const vm2 = toATSViewModel(doc)
    expect(JSON.stringify(vm1)).toBe(JSON.stringify(vm2))
  })

  it('does not mutate the source document', () => {
    const snapshot = JSON.stringify(doc)
    toATSViewModel(doc)
    toCreativeViewModel(doc)
    expect(JSON.stringify(doc)).toBe(snapshot)
  })
})
