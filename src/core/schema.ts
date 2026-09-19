import { z } from 'zod'
import {
  SCHEMA_VERSION,
  metaSchema,
  basicsSchema,
  sectionsSchema,
  educationItemSchema,
  experienceItemSchema,
  projectItemSchema,
  skillGroupSchema,
  certificationItemSchema,
  gpaSchema,
  linkSchema,
  photoSchema,
} from './schema-parts'

// Re-export constants and sub-schemas for testing and composition
export { SCHEMA_VERSION }
export {
  metaSchema,
  basicsSchema,
  sectionsSchema,
  educationItemSchema,
  experienceItemSchema,
  projectItemSchema,
  skillGroupSchema,
  certificationItemSchema,
  gpaSchema,
  linkSchema,
  photoSchema,
}

// --- Inferred Types from Schemas ---

export type ResumeMeta = z.infer<typeof metaSchema>
export type ResumeBasics = z.infer<typeof basicsSchema>
export type ResumeSections = z.infer<typeof sectionsSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type CertificationItem = z.infer<typeof certificationItemSchema>
export type Gpa = z.infer<typeof gpaSchema>
export type Link = z.infer<typeof linkSchema>
export type Photo = z.infer<typeof photoSchema>

/**
 * The canonical ResumeDocument Schema.
 *
 * Design Decision D2: Unknown Fields Preservation.
 * We define the known structure strictly here. The separation of unknown fields
 * is handled in the `validateResumeDocument` wrapper function below, rather than
 * relying on Zod's catchall which flattens everything into one object.
 */
export const resumeDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  meta: metaSchema.optional(),
  basics: basicsSchema,
  sections: sectionsSchema,
  sectionOrder: z.array(z.string()).optional(),
})

// --- Types ---

export type ResumeDocumentInput = z.input<typeof resumeDocumentSchema>
export type ResumeDocumentOutput = z.output<typeof resumeDocumentSchema>

/**
 * Internal representation of the validated document.
 * Includes `_unknownFields` to satisfy D2 (Forward Compatibility).
 */
export interface ValidatedResumeDocument extends ResumeDocumentOutput {
  /**
   * Captures any top-level fields present in input JSON that are not defined
   * in the schema. Ensures no data loss during import/export cycles.
   */
  _unknownFields?: Record<string, unknown>
}

// --- Validation Logic with Unknown Field Extraction ---

const KNOWN_ROOT_KEYS = new Set(['schemaVersion', 'meta', 'basics', 'sections', 'sectionOrder'])

/**
 * Validates raw input against the ResumeDocument schema.
 * Implements D2: Extracts unknown top-level fields into `_unknownFields`.
 *
 * @param input - Raw JSON object (potentially from file import)
 * @returns Result object with success flag and either data or error
 */
export function validateResumeDocument(
  input: unknown,
): { success: true; data: ValidatedResumeDocument } | { success: false; error: z.ZodError } {
  // 1. Basic type guard
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      success: false,
      error: new z.ZodError([{ code: 'custom', message: 'Input must be a JSON object', path: [] }]),
    }
  }

  const rawObj = input as Record<string, unknown>
  const unknownKeys: Record<string, unknown> = {}
  const knownData: Record<string, unknown> = {}

  // 2. Separate known vs unknown keys at root level
  for (const key of Object.keys(rawObj)) {
    if (KNOWN_ROOT_KEYS.has(key)) {
      knownData[key] = rawObj[key]
    } else {
      unknownKeys[key] = rawObj[key]
    }
  }

  // 3. Validate the known parts against the strict schema
  const result = resumeDocumentSchema.safeParse(knownData)

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    }
  }

  // 4. Construct final output with _unknownFields if any exist
  const validatedDoc: ValidatedResumeDocument = {
    ...result.data,
    ...(Object.keys(unknownKeys).length > 0 ? { _unknownFields: unknownKeys } : {}),
  }

  return {
    success: true,
    data: validatedDoc,
  }
}

/**
 * Creates a new empty ResumeDocument with defaults applied.
 * Used when user starts a fresh CV.
 */
export function createEmptyResumeDocument(): ValidatedResumeDocument {
  // Parse an empty-ish object through the schema to get all defaults applied
  const result = resumeDocumentSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    basics: { name: '' },
    sections: {},
  })

  return result as ValidatedResumeDocument
}
