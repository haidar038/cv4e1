import { z } from 'zod'

// --- Constants & Enums ---

export const SCHEMA_VERSION = '1.0.0' as const

const LOCALES = ['id', 'en'] as const
const MODES = ['ats', 'creative'] as const

const EDUCATION_STATUS = ['graduated', 'awaiting-ceremony', 'in-progress', 'discontinued'] as const

const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'internship',
  'freelance',
  'volunteer',
  'organization',
] as const

// --- Helper Schemas ---

/**
 * Partial Date: YYYY, YYYY-MM, or YYYY-MM-DD
 */
export const partialDateSchema = z
  .string()
  .regex(
    /^[0-9]{4}(-[0-9]{2})?(-[0-9]{2})?$/,
    'Invalid date format. Expected YYYY, YYYY-MM, or YYYY-MM-DD',
  )

/**
 * GPA Object: value, scale, label
 * Stored as strings to preserve precision and formatting intent (e.g., "3.50" vs "3.5")
 */
export const gpaSchema = z.object({
  value: z.string().regex(/^[0-9]+([.,][0-9]{1,2})?$/, 'Invalid GPA value'),
  // Regex must come before .default() in Zod v4 chaining
  scale: z
    .string()
    .regex(/^[0-9]+([.,][0-9]{1,2})?$/, 'Invalid GPA scale')
    .default('4.00'),
  label: z.string().default('IPK'),
})

/**
 * Link Item
 */
export const linkSchema = z.object({
  label: z.string().max(60).optional(),
  url: z.string().url().max(500),
})

/**
 * Photo Reference
 * Note: Actual image data is stored in IndexedDB assets store, not here.
 */
export const photoSchema = z.object({
  enabled: z.boolean().default(true),
  assetRef: z.string().optional(), // Optional because user might enable but not upload yet
})

// --- Section Schemas ---

export const educationItemSchema = z.object({
  institution: z.string().max(200),
  degree: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  location: z.string().max(120).optional(),
  startDate: partialDateSchema.optional(),
  endDate: partialDateSchema.optional(),
  status: z.enum(EDUCATION_STATUS).optional(),
  gpa: gpaSchema.optional(),
  highlights: z.array(z.string().max(400)).max(10).optional(),
})

export const experienceItemSchema = z.object({
  organization: z.string().max(200),
  role: z.string().max(200).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  location: z.string().max(120).optional(),
  startDate: partialDateSchema.optional(),
  endDate: partialDateSchema.optional(),
  current: z.boolean().default(false),
  highlights: z.array(z.string().max(400)).max(12).optional(),
})

export const projectItemSchema = z.object({
  name: z.string().max(200),
  role: z.string().max(200).optional(),
  context: z.string().max(200).optional(),
  startDate: partialDateSchema.optional(),
  endDate: partialDateSchema.optional(),
  url: z.string().url().max(500).optional(),
  highlights: z.array(z.string().max(400)).max(10).optional(),
})

export const skillGroupSchema = z.object({
  category: z.string().max(80).optional(),
  items: z.array(z.string().max(60)).max(40),
})

export const certificationItemSchema = z.object({
  name: z.string().max(200),
  issuer: z.string().max(200).optional(),
  issueDate: partialDateSchema.optional(),
  url: z.string().url().max(500).optional(),
})

// --- Top-Level Sub-Schemas ---

export const metaSchema = z.object({
  locale: z.enum(LOCALES).default('id'),
  mode: z.enum(MODES).default('ats'),
  template: z.string().optional(),
  title: z.string().optional(), // User-facing draft label
})

export const basicsSchema = z.object({
  // Name is required to exist but can be empty for initial drafts.
  // Strict validation (non-empty) is enforced at export/print time, not persistence.
  name: z.string().max(120),
  headline: z.string().max(160).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  summary: z.string().max(1200).optional(),
  links: z.array(linkSchema).max(10).optional(),
  photo: photoSchema.optional(),
})

export const sectionsSchema = z.object({
  education: z.array(educationItemSchema).optional(),
  experience: z.array(experienceItemSchema).optional(),
  organizations: z.array(experienceItemSchema).optional(), // Reuses experience structure per json-schema.json
  projects: z.array(projectItemSchema).optional(),
  skills: z.array(skillGroupSchema).optional(),
  certifications: z.array(certificationItemSchema).optional(),
})
