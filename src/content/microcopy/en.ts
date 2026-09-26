import type { MicrocopyPack } from './id'

/**
 * English micro-copy as typed data (ADR-0012, FR-702 — T3c).
 *
 * The pack mirrors `MicrocopyPack` exactly: `microcopyEnDraft` below is typed
 * as the full pack, so adding a key to the interface breaks the build until
 * the English string lands (decision D15, carried over from the ID pack).
 * The `import type` above is erased at compile time — content/ still has zero
 * runtime imports, and the boundary checker sees only a same-module edge.
 * A full local copy of the interface was rejected: two copies of a ~60-group
 * interface would drift, which is exactly the failure D15 guards against.
 *
 * Authored manually in English (AGENTS.md §12 forbids machine translation);
 * term equivalents follow glossary §7 in reverse, tone follows
 * localization-guide §1–§2 (guide, never condescend). Fake examples stay
 * obviously fake (Jane Doe, 555- numbers, Springfield) — never real personal
 * data. Forbidden phrases (glossary §6, both languages) are enforced by test.
 *
 * Indonesia-specific guidance stays an empty string in this pack (FR-204):
 * GPA scale, +62 phone format, pasfoto norms, campus-organization examples,
 * and education-status writing examples. Components render guidance only
 * when the string is non-empty, so a blank means "hidden" — the same
 * convention `microcopyStructural` uses.
 */

/** A possibly-incomplete English authoring object; missing leaves fall back to Indonesian. */
export type PartialMicrocopyPack = { [K in keyof MicrocopyPack]?: unknown }

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Per-key fallback resolver (ADR-0012, FR-703): walks the base pack and takes
 * the override wherever it is defined — including the intentional empty
 * string, which means "hidden", never "missing". Only `undefined` (a key the
 * English pack does not carry yet) falls back to the Indonesian string, so
 * the UI can never crash or render a blank surface from a partial pack.
 */
function mergeWithFallback(base: unknown, override: unknown): unknown {
  if (override === undefined) return base
  if (isPlainRecord(base) && isPlainRecord(override)) {
    const merged: Record<string, unknown> = {}
    for (const key of Object.keys(base)) {
      merged[key] = mergeWithFallback(base[key], override[key])
    }
    for (const key of Object.keys(override)) {
      if (!(key in merged)) merged[key] = override[key]
    }
    return merged
  }
  return override
}

/** Resolves a (possibly partial) English pack against the Indonesian pack. */
export function withIdFallback(base: MicrocopyPack, partial: PartialMicrocopyPack): MicrocopyPack {
  return mergeWithFallback(base, partial) as MicrocopyPack
}

export const microcopyEnDraft: MicrocopyPack = {
  gpa: {
    hint: '',
    missingScaleWarning: '',
    displayAdvice: '',
  },
  educationStatus: {
    graduated: {
      label: 'Graduated',
      example: '',
    },
    'awaiting-ceremony': {
      label: 'Graduated (pending ceremony)',
      example: '',
    },
    'in-progress': {
      label: 'In progress',
      example: '',
    },
    discontinued: {
      label: 'Discontinued',
      example: '',
    },
  },
  photo: {
    atsHiddenNotice:
      'The ATS version hides the photo so applicant tracking systems can read it safely. Your photo stays stored and appears in the Creative version.',
    tips: '',
  },
  contact: {
    phoneHint: '',
    unprofessionalEmailWarning:
      'Addresses like nicknames look less professional. Consider a name-based email, for example jane.doe@email.com.',
    locationHint: 'Write only the city name without a full address, for example Springfield.',
    linkedinNote:
      'LinkedIn is optional. Include it when the profile is active and relevant to the role.',
  },
  organizations: {
    guidance: '',
    examples: '',
  },
  cvLength: {
    guidance: '',
    softWarning: '',
  },
  sections: {
    basics: 'Personal details',
    education: 'Education',
    experience: 'Experience',
    organizations: 'Organizations',
    projects: 'Projects',
    skills: 'Skills',
    certifications: 'Certifications',
  },
  employmentType: {
    'full-time': 'Full-time',
    'part-time': 'Part-time',
    internship: 'Internship',
    freelance: 'Freelance',
    volunteer: 'Volunteer',
    organization: 'Organization',
  },
  fields: {
    name: {
      label: 'Full name',
      placeholder: 'Jane Doe',
      hint: 'Write your full name as shown on your diploma.',
    },
    headline: {
      label: 'Headline',
      placeholder: 'Computer Science Fresh Graduate',
      hint: 'One sentence summarizing your field of study and career interests.',
    },
    email: {
      label: 'Email',
      placeholder: 'jane.doe@email.com',
      hint: 'Addresses like nicknames look less professional. Consider a name-based email, for example jane.doe@email.com.',
    },
    phone: {
      label: 'Phone number',
      placeholder: '+1 555-010-2030',
      hint: '',
    },
    location: {
      label: 'City',
      placeholder: 'Springfield',
      hint: 'Write only the city name without a full address, for example Springfield.',
    },
    summary: {
      label: 'Summary',
      placeholder: 'Computer Science graduate with web development internship experience…',
      hint: 'Sum up who you are, your key skills, and your goals in 3–4 sentences.',
    },
    linkLabel: {
      label: 'Link label',
      placeholder: 'LinkedIn',
    },
    linkUrl: {
      label: 'URL',
      placeholder: 'https://www.linkedin.com/in/janedoe',
      hint: 'LinkedIn is optional. Include it when the profile is active and relevant to the role.',
    },
    institution: {
      label: 'Institution name',
      placeholder: 'Example State University',
    },
    degree: {
      label: 'Degree',
      placeholder: 'B.Sc. Computer Science',
    },
    fieldOfStudy: {
      label: 'Field of study',
      placeholder: 'Software Engineering',
    },
    itemLocation: {
      label: 'Location',
      placeholder: 'Example City',
    },
    startDate: {
      label: 'Start',
      placeholder: '2021-08',
      hint: 'Use YYYY or YYYY-MM format, for example 2021 or 2021-08.',
    },
    endDate: {
      label: 'End',
      placeholder: '2025-07',
      hint: 'Use YYYY or YYYY-MM format, for example 2025 or 2025-07.',
    },
    status: {
      label: 'Education status',
    },
    gpaValue: {
      label: 'GPA',
      placeholder: '3.52',
      hint: '',
    },
    gpaScale: {
      label: 'Scale',
      placeholder: '4.00',
    },
    highlights: {
      label: 'Achievement bullets',
      hint: 'Write one achievement per bullet, starting with a verb and a concrete outcome.',
    },
    orgName: {
      label: 'Company/organization name',
      placeholder: 'Example Digital Co.',
    },
    role: {
      label: 'Role',
      placeholder: 'Web Developer Intern',
    },
    employmentType: {
      label: 'Type',
    },
    current: {
      label: 'I still hold this position',
    },
    projectName: {
      label: 'Project name',
      placeholder: 'SME Records System',
    },
    projectRole: {
      label: 'Your role',
      placeholder: 'Developer',
    },
    context: {
      label: 'Project context',
      placeholder: 'Capstone project',
      hint: 'For example a capstone, coursework, or personal project.',
    },
    url: {
      label: 'URL',
      placeholder: 'https://github.com/janedoe/project',
    },
    skillCategory: {
      label: 'Category',
      placeholder: 'Technical',
    },
    skillItem: {
      label: 'Skill',
      placeholder: 'JavaScript',
    },
    certName: {
      label: 'Certification name',
      placeholder: 'Web Programming Basics',
    },
    issuer: {
      label: 'Issuer',
      placeholder: 'Example Academy',
    },
    issueDate: {
      label: 'Issue date',
      placeholder: '2024-03',
      hint: 'Use YYYY or YYYY-MM format, for example 2024 or 2024-03.',
    },
  },
  actions: {
    addItem: 'Add',
    addLink: 'Add link',
    addGroup: 'Add group',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
  },
  actionVerbs: {
    toggleLabel: 'Verb suggestions',
    hint: 'Pick a verb to insert it at the cursor, then adapt it to your experience.',
    emptyState: 'No verb suggestions for this section yet.',
  },
  aiStatic: {
    rationaleTemplate:
      'Tip: open with "{verb}" so it reads as an achievement. Adapt it to your experience and replace [measurable impact] with a real result — drop that part when you have no data for it.',
    genericRationale:
      'This section does not use action verbs yet. Add [measurable impact] when you have the data, or drop that part.',
    emptyInputNote: 'Write your raw task description first, then suggestions will appear here.',
  },
  aiKeys: {
    sectionTitle: 'AI assistance (optional)',
    intro:
      'AI is optional and always has a manual alternative. The key lives only in this tab — closing or reloading the tab erases it.',
    apiKeyLabel: 'API key',
    keyPlaceholder: 'Paste your API key here',
    modelLabel: 'Model',
    endpointLabel: 'Endpoint address',
    endpointInvalid: 'Invalid address. Use https, or http for localhost only.',
    saveAction: 'Save for this session',
    clearAction: 'Remove key',
    reviewConsent: 'Review consent',
    revokeConsent: 'Revoke consent',
    configuredStatus: 'Key stored for this session.',
    unconfiguredReason: 'No key yet — AI features are off. Manual suggestions remain available.',
    incompleteNote: 'Complete the address, key, and model to save.',
    grantedNote: "This session's consent is active. You can revoke it at any time.",
  },
  aiConsent: {
    title: 'Allow sending data to AI?',
    providerLabel: 'Provider',
    dataLabel: 'Data being sent',
    consequenceLabel: 'Consequence',
    grantAction: 'Agree and send',
    declineAction: 'Decline',
    policyLabel: 'Read the provider privacy policy',
    intro:
      'This operation sends a small part of your CV data to the AI provider. Without consent, nothing is sent.',
    consequenceText:
      'The data above is processed by the provider under its policy — that policy can change and is outside our control.',
    dataFieldsList: 'Raw task description, section context, language, facts allowed for use',
    dataFieldsListPolish: 'Selected text and polish mode (ID/EN/translation)',
  },
  aiBullets: {
    triggerLabel: 'AI bullet suggestions',
    panelTitle: 'AI bullet suggestions',
    targetRoleLabel: 'Target role (optional)',
    targetRolePlaceholder: 'e.g. Administrative staff',
    targetRoleOfflineNote:
      'This field is only used after you store an AI key — the manual suggestions below ignore it.',
    generateAction: 'Get suggestions',
    applyAction: 'Apply',
    closeAction: 'Close',
    suggestionLabel: 'Suggestion',
    hint: 'First write the raw task description on this row, then ask for suggestions. Suggestions are only candidates — nothing changes before you press Apply.',
    loadingNote: 'Requesting suggestions…',
    readyNote: 'Suggestions ready. Nothing changes before you press Apply.',
    staticNote: 'Showing manual suggestions that remain usable.',
    consentNote: 'Consent declined — showing manual suggestions. No data was sent.',
    unconfiguredNote: 'No key yet — showing manual suggestions that remain usable.',
    errorNote: 'The AI did not answer — showing manual suggestions. Your draft is unchanged.',
    rateLimitedNote:
      'The AI usage limit is reached — showing manual suggestions. Your draft is unchanged; try again later.',
    timeoutNote:
      'The AI did not answer in time — showing manual suggestions. Your draft is unchanged.',
  },
  aiAchievement: {
    triggerLabel: 'Draft bullets with AI',
    triggerTooltip: 'Describe the achievement — the AI drafts 1–3 polished bullets for review.',
    panelTitle: 'Draft bullets with AI',
    descriptionLabel: 'Achievement description',
    descriptionPlaceholder:
      'e.g. Wrote a PRD and SRS for a cashier app with 2 friends during an internship',
    generateAction: 'Draft bullets',
    applyAction: 'Apply',
    closeAction: 'Close',
    suggestionLabel: 'Suggestion',
    hint: 'Describe the achievement in 1–2 paragraphs, then ask the AI to shape it into bullets. Suggestions are only candidates — nothing changes before you press Apply.',
    emptyInputNote: 'First describe your achievement, then bullets will appear here.',
    loadingNote: 'Drafting bullets…',
    readyNote: 'Bullets ready. Nothing changes before you press Apply.',
    staticNote: 'Showing manual suggestions that remain usable.',
    consentNote: 'Consent declined — showing manual suggestions. No data was sent.',
    unconfiguredNote: 'No key yet — showing manual suggestions that remain usable.',
    errorNote: 'The AI did not answer — showing manual suggestions. Your draft is unchanged.',
    rateLimitedNote:
      'The AI usage limit is reached — showing manual suggestions. Your draft is unchanged; try again later.',
    timeoutNote:
      'The AI did not answer in time — showing manual suggestions. Your draft is unchanged.',
    aiGeneratedNote: 'This list was made by AI — review it before applying. AI can make mistakes.',
  },
  aiTailoring: {
    triggerLabel: 'Tailor to a job ad',
    triggerTooltip: 'Paste the job description — see which keywords your data supports.',
    panelTitle: 'Tailor to a job ad',
    jdLabel: 'Job description',
    jdPlaceholder: 'e.g. Seeking administrative staff fluent in Microsoft Excel…',
    generateAction: 'Analyze match',
    closeAction: 'Close',
    matchedLabel: 'Keywords supported by your data',
    unsupportedLabel: 'Keywords not yet supported',
    sectionsLabel: 'Sections to strengthen',
    questionsLabel: 'Clarifying questions',
    hint: 'Paste the job description, then see which keywords your data already supports. Results are only review material — your CV does not change.',
    emptyInputNote: 'First paste the job description, then results appear here.',
    loadingNote: 'Analyzing match…',
    readyNote: 'Results ready. Your CV is unchanged.',
    staticNote: 'Showing manual matching results that remain usable.',
    consentNote: 'Consent declined — showing manual results. No data was sent.',
    unconfiguredNote: 'No key yet — showing manual results that remain usable.',
    errorNote: 'The AI did not answer — showing manual results. Your draft is unchanged.',
    rateLimitedNote:
      'The AI usage limit is reached — showing manual results. Your draft is unchanged; try again later.',
    timeoutNote: 'The AI did not answer in time — showing manual results. Your draft is unchanged.',
    aiGeneratedNote: 'This list was made by AI — review it. AI can make mistakes.',
    truncatedNote: 'The job description was cut to 10,000 characters.',
  },
  aiPolish: {
    triggerLabel: 'Polish text with AI',
    panelTitle: 'Polish text',
    modeLabel: 'Mode',
    modeIdLabel: 'Polish (ID)',
    modeEnLabel: 'Polish (EN)',
    modeTranslateLabel: 'Translate to English',
    generateAction: 'Request polish',
    applyAction: 'Apply',
    closeAction: 'Close',
    hint: 'A polish is only a candidate — nothing changes before you press Apply.',
    loadingNote: 'Polishing text…',
    readyNote: 'Polish ready. Nothing changes before you press Apply.',
    staticNote: 'Showing the manual guide that remains usable.',
    consentNote: 'Consent declined — showing the manual guide. No data was sent.',
    unconfiguredNote: 'No key yet — showing the manual guide that remains usable.',
    errorNote: 'The AI did not answer — showing the manual guide. Your draft is unchanged.',
    rateLimitedNote:
      'The AI usage limit is reached — showing the manual guide. Your draft is unchanged; try again later.',
    timeoutNote:
      'The AI did not answer in time — showing the manual guide. Your draft is unchanged.',
    emptyInputNote: 'First write text in this field, then the guide will appear here.',
    checklistId: [
      'Open with an action verb, for example "Mengelola" or "Menyusun".',
      'One sentence, one idea — cut filler words like "melakukan".',
      'Keep every number, name, and date exactly as written.',
      'End with punctuation and keep spelling consistent.',
    ],
    avoidedId: [
      'Avoid "Bertanggung jawab atas…" — write the action instead, for example "Mengelola jadwal piket 30 anggota."',
      'Avoid uncommon abbreviations without their full form.',
    ],
    checklistEn: [
      'Open with an action verb, e.g. "Managed" or "Compiled".',
      'One sentence, one idea — cut filler words.',
      'Keep every number, name, and date exactly as written.',
      'Check verb tense consistency and final punctuation.',
    ],
    avoidedEn: [
      'Avoid "Responsible for…" — write the action instead, e.g. "Managed a duty roster of 30 members."',
      'Avoid uncommon abbreviations without their full form.',
    ],
    checklistTranslate: [
      'Write an equivalent short sentence — one source sentence, one English sentence.',
      'Keep numbers, names, and dates exactly as in the source text.',
      'Do not upgrade the role into professional experience that was not claimed.',
      'Open with an English action verb when it fits.',
    ],
    avoidedTranslate: [
      'Avoid word-for-word translation — prefer a natural sentence.',
      'Avoid adding titles or positions missing from the source text.',
    ],
  },
  preview: {
    regionLabel: 'CV preview',
    modeLabel: 'CV display mode',
    atsMode: 'ATS',
    creativeMode: 'Creative',
    modeStatus: '{mode} mode active',
    formTab: 'Form',
    previewTab: 'Preview',
    formLabel: 'CV form',
    dismissNotice: 'Dismiss notice',
    paperSizeLabel: 'Preview paper size',
    paperA4: 'A4',
    paperLetter: 'Letter',
  },
  print: {
    button: 'Print / Save PDF',
    helpButton: 'Print guide',
    title: 'Printing your CV as PDF',
    intro:
      'Your CV prints straight from the visible preview — the result matches what you see. In the browser print dialog, choose "Save as PDF" as the destination.',
    chrome: 'Chrome: open "More settings" in the print dialog, then uncheck "Headers and footers".',
    firefox:
      'Firefox: open "More settings" in the print dialog, then pick "Blank" for headers and footers.',
    safari: 'Safari: in the print dialog, uncheck "Print headers and footers".',
    filenameNote: 'Name the file {filename} when saving so it is easy to find again.',
    printAction: 'Print now',
    doNotShowAgain: 'Do not show again',
  },
  offline: {
    offlineMessage: 'You are offline. All changes remain stored on this device.',
  },
  dataSafety: {
    sectionTitle: 'Erase all data',
    openDialog: 'Erase all data',
    dialogTitle: 'Erase all data?',
    exportFirst: 'Export first (.json)',
    confirm: 'Yes, erase everything',
    cancel: 'Cancel',
    wiping: 'Erasing…',
    reload: 'Reload',
    close: 'Close',
    sectionDescription:
      'Erases every draft, photo, and setting from this browser. Useful on shared devices such as campus labs or internet cafés.',
    dialogDescription:
      'This erases every draft and photo from this browser and cannot be undone. Export the open draft first if you still need it.',
    success: 'All data erased from this browser. Reload to return to the empty state.',
    exportFailedNote:
      'Export failed — check your browser downloads again. You can still continue erasing or cancel.',
    partial: 'Partly erased. What remains: {remainder}. Reload, then repeat the erase if needed.',
    remainderDrafts: 'some drafts',
    remainderPrefs: 'some settings',
    remainderCache: 'app cache',
  },
  storageNotice: {
    notice:
      'Your data is stored in the browser on this device. Clearing browser data, private mode, or automatic cleanup can delete your drafts. Use Export to keep a backup copy.',
    dismiss: 'Got it',
  },
  legal: {
    notice: 'cv4every1 © 2026 M. Khaidar — free software licensed under AGPL-3.0.',
    license: 'License',
    source: 'Source code',
    about: 'About',
  },
  drafts: {
    title: 'My CVs',
    empty: 'No CV stored yet.',
    create: 'New CV',
    rename: 'Rename',
    renameTitle: 'Rename CV',
    duplicate: 'Duplicate',
    remove: 'Delete',
    export: 'Export',
    import: 'Import',
    confirmDelete: 'Delete this CV? This cannot be undone.',
  },
  autosave: {
    saving: 'Saving…',
    saved: 'Saved',
  },
  importErrors: {
    NOT_JSON: 'This file is not readable text. Pick a file exported from this app.',
    INVALID_ENVELOPE_STRUCTURE:
      'Unrecognized file structure. Make sure you picked a file exported from this app.',
    WRONG_FORMAT_ID: 'This is not a CV file from this app.',
    UNSUPPORTED_KIND: 'This file kind is not supported yet. Use an exported CV file.',
    SCHEMA_TOO_NEW: 'This file was made with a newer app version. Update your app, then try again.',
    MIGRATION_FAILED: 'The older-version file cannot be read. Your current CV remains safe.',
    VALIDATION_FAILED:
      'The file content is incomplete and cannot be opened. Your current CV remains safe.',
  },
  importPdf: {
    button: 'Import PDF',
    dialogTitle: 'Import a CV from PDF',
    fileLabel: 'Choose a PDF file',
    approveAction: 'Save as a new CV',
    cancelAction: 'Cancel',
    retryAction: 'Try again',
    hint: 'Extraction results are only candidates — review them first, then save as a new CV when correct. The open CV does not change before you press Save.',
    extractingNote: 'Reading the PDF text layer…',
    ocrNote: 'No digital text found — reading page images…',
    ocrDownloadNote:
      'First use downloads the image-reading model (a few MB) then stores it on-device. Internet is needed this once only.',
    mappingNote: 'Mapping text to CV fields…',
    readyNote: 'Results ready for review. Nothing is stored before you press Save.',
    reviewTitle: 'Review import results',
    unmappedNote: '{count} lines unmapped — check and copy manually if needed.',
    sourceTextNote: 'Source: PDF digital text.',
    sourceOcrNote:
      'Source: image reading (OCR). Less accurate than digital text — check every field.',
    confidenceHigh: 'Clear pattern',
    confidenceMedium: 'Needs review',
    confidenceLow: 'Weak guess — must check',
    fieldCountNote: 'fields mapped',
    errors: {
      NOT_PDF: 'This file is not a PDF. Choose your old CV in PDF format.',
      TOO_LARGE:
        'The file exceeds 10 MB and was not read. Pick a smaller file, or fill in manually.',
      UNREADABLE:
        'The PDF cannot be read (corrupt or too many pages). Your current CV remains safe.',
      NO_TEXT_NO_OCR: 'No readable text in this file. Try another PDF, or fill in manually.',
      OCR_UNAVAILABLE:
        'The image-reading model is unavailable (it needs internet once to download). Digital PDFs still work; or fill in manually.',
      MAPPING_EMPTY:
        'No fields could be mapped from this file. Try another PDF, or fill in manually.',
      VALIDATION_FAILED:
        'The extraction result is incomplete and cannot be saved. Your current CV remains safe.',
    },
  },
  emptyState: {
    title: 'Start from a blank page',
    description:
      'Fill in section by section at your own pace. Everything autosaves on this device and is never sent anywhere.',
    cta: 'Create my first CV',
  },
  photoUpload: {
    label: 'Profile photo',
    select: 'Choose photo',
    replace: 'Replace photo',
    remove: 'Remove photo',
    processing: 'Processing photo…',
  },
  photoErrors: {
    wrongType: 'Photo format not supported yet. Use a JPG, PNG, or WebP file.',
    tooLarge: 'The photo exceeds 2 MB. Pick a smaller photo, then try again.',
    compressFailed: 'The photo cannot be processed. Try another photo from your camera or gallery.',
    quotaFull:
      'Device storage is full, so the photo was not saved. Your CV content is safe — consider exporting it.',
  },
  validation: {
    invalidEmail: 'Email format is not right yet, for example jane.doe@email.com.',
    invalidUrl:
      'Link format is not right yet. Start with https://, for example https://example.com.',
    invalidDate: 'Date format is not right yet. Use YYYY or YYYY-MM, for example 2021 or 2021-08.',
    invalidGpaValue: 'GPA format is not right yet, for example 3.52.',
    invalidGpaScale: 'Scale format is not right yet, for example 4.00.',
  },
  progress: {
    sectionProgress: 'Section {current} of {total}',
    sectionCompleted: '{filled} of {total} sections filled',
  },
  common: {
    selectEmpty: 'Not selected yet',
  },
  skip: {
    toPreview: 'Skip to CV preview',
  },
  locale: {
    label: 'Interface language',
    indonesian: 'Indonesian',
    english: 'English',
    status: '{locale} language active',
  },
}
