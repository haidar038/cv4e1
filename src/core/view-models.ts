/**
 * View Models for cv4every1 Renderers.
 *
 * These are derived, normalized representations of ResumeDocument,
 * prepared specifically for one rendering engine. They are NEVER persisted.
 * Business rules (mode enforcement) live here, not in React components.
 */

// --- Shared Display Types ---

export interface ContactDisplay {
  email?: string
  phone?: string
  location?: string
}

export interface LinkDisplay {
  label: string
  url: string
}

export interface DateRangeDisplay {
  start?: string // Formatted display string
  end?: string // Formatted display string or "Present" / "Sekarang"
  rawStart?: string // Original partial date for sorting/logic
  rawEnd?: string
}

export interface GpaDisplay {
  formatted: string // e.g., "3.52 / 4.00"
  value: string
  scale: string
  label: string
}

// --- Section Item Displays ---

export interface EducationDisplay {
  institution: string
  degree?: string
  field?: string
  location?: string
  dates: DateRangeDisplay
  status?: string // Translated status label
  gpa?: GpaDisplay
  highlights: string[]
}

export interface ExperienceDisplay {
  organization: string
  role?: string
  employmentType?: string
  location?: string
  dates: DateRangeDisplay
  highlights: string[]
}

export interface ProjectDisplay {
  name: string
  role?: string
  context?: string
  dates: DateRangeDisplay
  url?: string
  highlights: string[]
}

export interface SkillGroupDisplay {
  category?: string
  items: string[]
}

export interface CertificationDisplay {
  name: string
  issuer?: string
  issueDate?: string // Formatted
  url?: string
}

// --- Ordered Section Structure ---

export type SectionKey =
  'education' | 'experience' | 'organizations' | 'projects' | 'skills' | 'certifications'

export interface SectionDataMap {
  education: EducationDisplay[]
  experience: ExperienceDisplay[]
  organizations: ExperienceDisplay[] // Same structure as experience
  projects: ProjectDisplay[]
  skills: SkillGroupDisplay[]
  certifications: CertificationDisplay[]
}

export interface OrderedSection<T> {
  key: SectionKey
  heading: string // Localized heading (e.g., "PENDIDIKAN")
  items: T[]
}

// --- ATS ViewModel ---

export interface ATSViewModel {
  mode: 'ats'
  name: string
  headline?: string
  contacts: ContactDisplay
  links: LinkDisplay[]
  summary?: string
  // NO photo field — structurally excluded
  sections: OrderedSection<
    EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay
  >[]
}

// --- Creative ViewModel ---

export interface CreativePhotoDisplay {
  assetRef: string
  enabled: boolean
}

export interface CreativeViewModel {
  mode: 'creative'
  name: string
  headline?: string
  contacts: ContactDisplay
  links: LinkDisplay[]
  summary?: string
  photo?: CreativePhotoDisplay // Present only if enabled and has assetRef
  sections: OrderedSection<
    EducationDisplay | ExperienceDisplay | ProjectDisplay | SkillGroupDisplay | CertificationDisplay
  >[]
}
