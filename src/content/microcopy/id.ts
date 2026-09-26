/**
 * Indonesian micro-copy as typed data (decision D15 — a conscious deviation
 * from localization-guide.md §5, which proposed raw JSON; a typed TS module
 * gives autocomplete and fails the build when a key is missing).
 *
 * content/ may import NOTHING (architecture-overview.md §5), so the key
 * unions below mirror canonical types locally: education-status values come
 * from src/core/schema.ts and the locale union from its LOCALES constant.
 * They are structurally identical, so core values can be passed here directly;
 * consistency is asserted at the features level in Task 9.
 *
 * Tone rules (target-users.md §6): guide, never condescend — warnings are
 * help, not failure. Forbidden phrases (glossary.md §6) are enforced by test.
 */
import { microcopyEnDraft, withIdFallback } from './en'

export type LocaleKey = 'id' | 'en'

export type EducationStatusKey = 'graduated' | 'awaiting-ceremony' | 'in-progress' | 'discontinued'

/** Mirrors `SectionKey` (src/core/view-models.ts) plus `basics` for the identity card. */
export type SectionLabelKey =
  'basics' | 'education' | 'experience' | 'organizations' | 'projects' | 'skills' | 'certifications'

/** Mirrors `EMPLOYMENT_TYPES` (src/core/schema-parts.ts). */
export type EmploymentTypeKey =
  'full-time' | 'part-time' | 'internship' | 'freelance' | 'volunteer' | 'organization'

/** Mirrors `ImportErrorReason` (src/storage/export-import-types.ts). */
export type ImportErrorReasonKey =
  | 'NOT_JSON'
  | 'INVALID_ENVELOPE_STRUCTURE'
  | 'WRONG_FORMAT_ID'
  | 'UNSUPPORTED_KIND'
  | 'SCHEMA_TOO_NEW'
  | 'MIGRATION_FAILED'
  | 'VALIDATION_FAILED'

/** Mirrors `ImportPdfErrorReason` (src/features/import/import-pipeline.ts). */
export type ImportPdfErrorReasonKey =
  | 'NOT_PDF'
  | 'TOO_LARGE'
  | 'UNREADABLE'
  | 'NO_TEXT_NO_OCR'
  | 'OCR_UNAVAILABLE'
  | 'MAPPING_EMPTY'
  | 'VALIDATION_FAILED'

/** Label plus optional example placeholder and guidance for one form field. */
export interface FieldCopy {
  label: string
  placeholder?: string
  hint?: string
}

export type FieldCopyKey =
  | 'name'
  | 'headline'
  | 'email'
  | 'phone'
  | 'location'
  | 'summary'
  | 'linkLabel'
  | 'linkUrl'
  | 'institution'
  | 'degree'
  | 'fieldOfStudy'
  | 'itemLocation'
  | 'startDate'
  | 'endDate'
  | 'status'
  | 'gpaValue'
  | 'gpaScale'
  | 'highlights'
  | 'orgName'
  | 'role'
  | 'employmentType'
  | 'current'
  | 'projectName'
  | 'projectRole'
  | 'context'
  | 'url'
  | 'skillCategory'
  | 'skillItem'
  | 'certName'
  | 'issuer'
  | 'issueDate'

export interface EducationStatusCopy {
  label: string
  example: string
}

export interface MicrocopyPack {
  gpa: {
    /** Canonical format is `3.52 / 4.00` — two decimals, scale always written (§3.1). */
    hint: string
    missingScaleWarning: string
    displayAdvice: string
  }
  educationStatus: Record<EducationStatusKey, EducationStatusCopy>
  photo: {
    /** Verbatim from plan Task 13a / target-users.md §6 — do not paraphrase. */
    atsHiddenNotice: string
    tips: string
  }
  contact: {
    phoneHint: string
    unprofessionalEmailWarning: string
    locationHint: string
    linkedinNote: string
  }
  organizations: {
    guidance: string
    examples: string
  }
  cvLength: {
    guidance: string
    softWarning: string
  }
  sections: Record<SectionLabelKey, string>
  employmentType: Record<EmploymentTypeKey, string>
  fields: Record<FieldCopyKey, FieldCopy>
  actions: {
    addItem: string
    addLink: string
    addGroup: string
    moveUp: string
    moveDown: string
    remove: string
  }
  actionVerbs: {
    /** Icon-only trigger prefix; components compose it with section + row labels. */
    toggleLabel: string
    /** Panel guidance — generic writing help, kept in the structural pack. */
    hint: string
    emptyState: string
  }
  aiStatic: {
    /** Rationale shown under each static bullet; `{verb}` is replaced. Guidance — blanked for non-id locales. */
    rationaleTemplate: string
    /** Rationale for sections without action verbs. Guidance — blanked for non-id locales. */
    genericRationale: string
    /** Shown when there is no raw task to build on. Guidance — blanked for non-id locales. */
    emptyInputNote: string
  }
  aiKeys: {
    /** Section heading — structural, kept for every locale. */
    sectionTitle: string
    /** What session-only means. Guidance — blanked for non-id locales. */
    intro: string
    /** Field labels — structural, kept for every locale. */
    apiKeyLabel: string
    keyPlaceholder: string
    modelLabel: string
    endpointLabel: string
    /** Endpoint validation feedback — kept (cf. `validation` group precedent). */
    endpointInvalid: string
    /** Actions — structural, kept for every locale. */
    saveAction: string
    clearAction: string
    reviewConsent: string
    revokeConsent: string
    /** Session key status — structural, kept for every locale. */
    configuredStatus: string
    /** FR-408 reason when unusable. Guidance — blanked for non-id locales. */
    unconfiguredReason: string
    /** Shown when the OAI form is incomplete. Guidance — blanked for non-id locales. */
    incompleteNote: string
    /** Session-grant note. Guidance — blanked for non-id locales. */
    grantedNote: string
  }
  aiConsent: {
    /** Dialog title and field labels — structural, kept for every locale. */
    title: string
    providerLabel: string
    dataLabel: string
    consequenceLabel: string
    grantAction: string
    declineAction: string
    policyLabel: string
    /** Explanation prose. Guidance — blanked for non-id locales. */
    intro: string
    consequenceText: string
    /** DF-6 field list for the bullet capability (Task 19 refines per capability). */
    dataFieldsList: string
    /** DF-6 field list for the polish capability (Task 20). */
    dataFieldsListPolish: string
  }
  aiBullets: {
    /** Trigger and panel names — structural, kept for every locale. */
    triggerLabel: string
    panelTitle: string
    targetRoleLabel: string
    targetRolePlaceholder: string
    /** Shown under the role field while no AI key is stored — static output ignores it. */
    targetRoleOfflineNote: string
    generateAction: string
    applyAction: string
    closeAction: string
    suggestionLabel: string
    /** Guidance prose — blanked for non-id locales. */
    hint: string
    loadingNote: string
    readyNote: string
    staticNote: string
    consentNote: string
    unconfiguredNote: string
    errorNote: string
    /** FR-408 reason when the provider quota is exhausted (Task 21). */
    rateLimitedNote: string
    /** FR-408 reason when the provider stops answering (Task 21). */
    timeoutNote: string
  }
  aiAchievement: {
    /** Trigger and panel names — structural, kept for every locale. */
    triggerLabel: string
    /** Hover/long-press explanation for the unified trigger. */
    triggerTooltip: string
    panelTitle: string
    descriptionLabel: string
    descriptionPlaceholder: string
    generateAction: string
    applyAction: string
    closeAction: string
    suggestionLabel: string
    /** Guidance prose — blanked for non-id locales. */
    hint: string
    emptyInputNote: string
    loadingNote: string
    readyNote: string
    staticNote: string
    consentNote: string
    unconfiguredNote: string
    errorNote: string
    rateLimitedNote: string
    timeoutNote: string
    /** Session banner above AI-generated candidates — review before applying. */
    aiGeneratedNote: string
  }
  aiTailoring: {
    /** Trigger and panel names — structural, kept for every locale. */
    triggerLabel: string
    /** Hover/long-press explanation for the trigger. */
    triggerTooltip: string
    panelTitle: string
    jdLabel: string
    jdPlaceholder: string
    generateAction: string
    closeAction: string
    /** Result list headings — structural, kept for every locale. */
    matchedLabel: string
    unsupportedLabel: string
    sectionsLabel: string
    questionsLabel: string
    /** Guidance prose — blanked for non-id locales. */
    hint: string
    emptyInputNote: string
    loadingNote: string
    readyNote: string
    staticNote: string
    consentNote: string
    unconfiguredNote: string
    errorNote: string
    rateLimitedNote: string
    timeoutNote: string
    /** Session banner above AI-generated candidates — review, never auto-apply. */
    aiGeneratedNote: string
    /** Shown when a pasted ad exceeds the input budget. */
    truncatedNote: string
  }
  aiPolish: {
    /** Trigger, panel, and mode names — structural, kept for every locale. */
    triggerLabel: string
    panelTitle: string
    modeLabel: string
    modeIdLabel: string
    modeEnLabel: string
    modeTranslateLabel: string
    generateAction: string
    applyAction: string
    closeAction: string
    /** Guidance prose — blanked for non-id locales. */
    hint: string
    loadingNote: string
    readyNote: string
    staticNote: string
    consentNote: string
    unconfiguredNote: string
    errorNote: string
    /** FR-408 reason when the provider quota is exhausted (Task 21). */
    rateLimitedNote: string
    /** FR-408 reason when the provider stops answering (Task 21). */
    timeoutNote: string
    emptyInputNote: string
    /** Static-fallback checklists per mode — blanked for non-id locales. */
    checklistId: readonly string[]
    avoidedId: readonly string[]
    checklistEn: readonly string[]
    avoidedEn: readonly string[]
    checklistTranslate: readonly string[]
    avoidedTranslate: readonly string[]
  }
  preview: {
    /** Accessible name of the preview region (Task 10 gate; Task 12 reuses it). */
    regionLabel: string
    /** Legend of the ATS ↔ Creative segmented control (Task 12). */
    modeLabel: string
    /** Mode option labels — structural, kept for every locale. */
    atsMode: string
    creativeMode: string
    /** Screen-reader announcement when the mode changes; `{mode}` is replaced. */
    modeStatus: string
    /** Mobile Form/Preview tab labels (Task 12) — structural. */
    formTab: string
    previewTab: string
    /** Accessible name of the form region (Task 12) — structural. */
    formLabel: string
    /** Dismiss label for the dismissable ATS photo notice (Task 12). */
    dismissNotice: string
    /** Paper-size selector legend + options — structural, kept for every locale. */
    paperSizeLabel: string
    paperA4: string
    paperLetter: string
  }
  print: {
    /** Print button + help opener — structural, kept for every locale. */
    button: string
    helpButton: string
    /** Dialog title — structural (accessible name), kept for every locale. */
    title: string
    /** Guidance below (ID-specific): blanked for non-id locales (FR-204). */
    intro: string
    chrome: string
    firefox: string
    safari: string
    /** Filename advice; `{filename}` is replaced with the suggestion. */
    filenameNote: string
    /** Dialog actions — structural. */
    printAction: string
    doNotShowAgain: string
  }
  offline: {
    /** Offline status text (F-G3) — status, kept for every locale. */
    offlineMessage: string
  }
  dataSafety: {
    /** Danger-zone heading + open-dialog button — structural, kept for every locale. */
    sectionTitle: string
    openDialog: string
    /** Dialog title + actions — structural, kept for every locale. */
    dialogTitle: string
    exportFirst: string
    confirm: string
    cancel: string
    wiping: string
    reload: string
    close: string
    /** Guidance — ID-specific, blanked for non-id locales (FR-204). */
    sectionDescription: string
    dialogDescription: string
    success: string
    exportFailedNote: string
    /** Partial-wipe report; `{remainder}` lists what is left. */
    partial: string
    remainderDrafts: string
    remainderPrefs: string
    remainderCache: string
  }
  storageNotice: {
    /**
     * Verbatim from local-storage-strategy.md §9 — do not paraphrase.
     * ID-specific guidance, blanked for non-id locales (FR-204).
     */
    notice: string
    /** Dismiss action — structural, kept for every locale. */
    dismiss: string
  }
  legal: {
    /** Copyright + license line in the app footer (F4e, AGPL Appropriate Legal Notices). */
    notice: string
    /** Link labels — structural, kept for every locale. */
    license: string
    source: string
    about: string
  }
  drafts: {
    title: string
    empty: string
    create: string
    rename: string
    renameTitle: string
    duplicate: string
    remove: string
    export: string
    import: string
    confirmDelete: string
  }
  /** D21 verbatim. The two error texts stay owned by the store — do not duplicate here. */
  autosave: {
    saving: string
    saved: string
  }
  importErrors: Record<ImportErrorReasonKey, string>
  importPdf: {
    /** Trigger, dialog, and file input — structural, kept for every locale. */
    button: string
    dialogTitle: string
    fileLabel: string
    approveAction: string
    cancelAction: string
    retryAction: string
    /** Guidance prose — blanked for non-id locales (FR-204). */
    hint: string
    extractingNote: string
    ocrNote: string
    ocrDownloadNote: string
    mappingNote: string
    readyNote: string
    reviewTitle: string
    /** `{count}` is replaced with the unmapped-line count. */
    unmappedNote: string
    sourceTextNote: string
    sourceOcrNote: string
    confidenceHigh: string
    confidenceMedium: string
    confidenceLow: string
    fieldCountNote: string
    errors: Record<ImportPdfErrorReasonKey, string>
  }
  emptyState: {
    title: string
    description: string
    cta: string
  }
  photoUpload: {
    label: string
    select: string
    replace: string
    remove: string
    processing: string
  }
  photoErrors: {
    wrongType: string
    tooLarge: string
    compressFailed: string
    quotaFull: string
  }
  validation: {
    invalidEmail: string
    invalidUrl: string
    invalidDate: string
    invalidGpaValue: string
    invalidGpaScale: string
  }
  progress: {
    sectionProgress: string
    /** Completeness count with `{filled}`/`{total}` — never a quality score (glossary §6). */
    sectionCompleted: string
  }
  common: {
    selectEmpty: string
  }
  skip: {
    toPreview: string
  }
  locale: {
    /** Switcher legend and option labels — structural, kept for every locale. */
    label: string
    indonesian: string
    english: string
    /** Screen-reader announcement when the locale changes; `{locale}` is replaced. */
    status: string
  }
}

// Shared strings are pulled out so both their canonical group and the field
// hints can reference them without a self-referencing object literal.
const gpaHint = 'Tulis IPK Anda beserta skala, misalnya 3.52 / 4.00'
const contactPhoneHint =
  'Gunakan format nomor Indonesia yang konsisten, misalnya +62 812-3456-7890 atau 0812-3456-7890.'
const contactUnprofessionalEmailWarning =
  'Alamat email seperti nama panggilan mengurangi kesan profesional. Pertimbangkan email berbasis nama Anda, misalnya budi.santoso@email.com.'
const contactLocationHint =
  'Tulis nama kota saja tanpa alamat lengkap, misalnya Bandung atau Depok.'
const contactLinkedinNote =
  'LinkedIn bersifat opsional. Cantumkan bila profilnya aktif dan relevan dengan posisi yang dituju.'

export const microcopyId: MicrocopyPack = {
  gpa: {
    hint: gpaHint,
    missingScaleWarning:
      'Skala IPK belum ditulis. Cantumkan agar perekrut memahami nilainya, misalnya 3.52 / 4.00.',
    displayAdvice:
      'IPK bersifat opsional. Jika nilainya belum meyakinkan, Anda bisa menonjolkan proyek atau pengalaman organisasi sebagai kekuatan utama.',
  },
  educationStatus: {
    graduated: {
      label: 'Lulus',
      example: 'S1 Teknik Informatika, Universitas Contoh — Lulus 2025 (IPK 3.52 / 4.00)',
    },
    'awaiting-ceremony': {
      label: 'Lulus (menunggu wisuda)',
      example: 'S1 Akuntansi, Politeknik Contoh — Lulus (menunggu wisuda), yudisium Juli 2026',
    },
    'in-progress': {
      label: 'Sedang menempuh',
      example:
        'S1 Ilmu Komunikasi, Universitas Contoh — Sedang menempuh semester 7, perkiraan lulus 2027',
    },
    discontinued: {
      label: 'Berhenti',
      example:
        'D3 Manajemen Informatika, Universitas Contoh — Berhenti 2024 (48 dari 110 sks selesai)',
    },
  },
  photo: {
    atsHiddenNotice:
      'Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.',
    tips: 'Gunakan pasfoto berlatar polos dengan pakaian formal dan wajah terlihat jelas. Foto adalah pilihan, bukan kewajiban.',
  },
  contact: {
    phoneHint: contactPhoneHint,
    unprofessionalEmailWarning: contactUnprofessionalEmailWarning,
    locationHint: contactLocationHint,
    linkedinNote: contactLinkedinNote,
  },
  organizations: {
    guidance:
      'Kepanitiaan, BEM/HMJ, UKM, KKN, dan asisten praktikum adalah pengalaman yang sah. Tuliskan peran dan hasil nyatanya, bukan sekadar tugas harian.',
    examples:
      'Contoh: "Mengoordinasikan 12 panitia seminar nasional dengan 350 peserta" atau "Menyusun laporan pertanggungjawaban KKN yang disetujui pembimbing lapangan".',
  },
  cvLength: {
    guidance: 'Untuk fresh graduate, CV idealnya 1–2 halaman.',
    softWarning:
      'CV melewati 2 halaman. Ringkas bullet yang kurang relevan agar lebih mudah dibaca perekrut.',
  },
  sections: {
    basics: 'Data Diri',
    education: 'Pendidikan',
    experience: 'Pengalaman',
    organizations: 'Organisasi',
    projects: 'Proyek',
    skills: 'Keahlian',
    certifications: 'Sertifikasi',
  },
  employmentType: {
    'full-time': 'Penuh waktu',
    'part-time': 'Paruh waktu',
    internship: 'Magang',
    freelance: 'Freelance',
    volunteer: 'Sukarelawan',
    organization: 'Organisasi',
  },
  fields: {
    name: {
      label: 'Nama lengkap',
      placeholder: 'Budi Santoso',
      hint: 'Tulis nama lengkap Anda seperti pada ijazah.',
    },
    headline: {
      label: 'Headline',
      placeholder: 'Fresh Graduate Teknik Informatika',
      hint: 'Satu kalimat yang merangkum bidang studi dan minat karier Anda.',
    },
    email: {
      label: 'Email',
      placeholder: 'budi.santoso@email.com',
      hint: contactUnprofessionalEmailWarning,
    },
    phone: {
      label: 'Nomor telepon',
      placeholder: '+62 812-3456-7890',
      hint: contactPhoneHint,
    },
    location: {
      label: 'Domisili',
      placeholder: 'Bandung',
      hint: contactLocationHint,
    },
    summary: {
      label: 'Ringkasan',
      placeholder: 'Lulusan S1 Teknik Informatika dengan pengalaman magang pengembangan web…',
      hint: 'Ringkas siapa Anda, keahlian utama, dan apa yang Anda tuju dalam 3–4 kalimat.',
    },
    linkLabel: {
      label: 'Label tautan',
      placeholder: 'LinkedIn',
    },
    linkUrl: {
      label: 'URL',
      placeholder: 'https://www.linkedin.com/in/budisantoso',
      hint: contactLinkedinNote,
    },
    institution: {
      label: 'Nama institusi',
      placeholder: 'Universitas Contoh Nusantara',
    },
    degree: {
      label: 'Gelar',
      placeholder: 'S1 Teknik Informatika',
    },
    fieldOfStudy: {
      label: 'Bidang studi',
      placeholder: 'Rekayasa Perangkat Lunak',
    },
    itemLocation: {
      label: 'Lokasi',
      placeholder: 'Kota Contoh',
    },
    startDate: {
      label: 'Mulai',
      placeholder: '2021-08',
      hint: 'Format YYYY atau YYYY-MM, misalnya 2021 atau 2021-08.',
    },
    endDate: {
      label: 'Selesai',
      placeholder: '2025-07',
      hint: 'Format YYYY atau YYYY-MM, misalnya 2025 atau 2025-07.',
    },
    status: {
      label: 'Status pendidikan',
    },
    gpaValue: {
      label: 'IPK',
      placeholder: '3.52',
      hint: gpaHint,
    },
    gpaScale: {
      label: 'Skala',
      placeholder: '4.00',
    },
    highlights: {
      label: 'Poin pencapaian',
      hint: 'Tulis satu pencapaian per poin, mulai dengan kata kerja dan hasil nyata.',
    },
    orgName: {
      label: 'Nama perusahaan/organisasi',
      placeholder: 'CV Contoh Digital',
    },
    role: {
      label: 'Peran',
      placeholder: 'Magang Pengembang Web',
    },
    employmentType: {
      label: 'Jenis',
    },
    current: {
      label: 'Saya masih menempati posisi ini',
    },
    projectName: {
      label: 'Nama proyek',
      placeholder: 'Sistem Pendataan UMKM',
    },
    projectRole: {
      label: 'Peran Anda',
      placeholder: 'Pengembang',
    },
    context: {
      label: 'Konteks proyek',
      placeholder: 'Tugas akhir',
      hint: 'Misalnya tugas akhir, proyek mata kuliah, atau proyek personal.',
    },
    url: {
      label: 'URL',
      placeholder: 'https://github.com/budisantoso/proyek',
    },
    skillCategory: {
      label: 'Kategori',
      placeholder: 'Teknis',
    },
    skillItem: {
      label: 'Keahlian',
      placeholder: 'JavaScript',
    },
    certName: {
      label: 'Nama sertifikasi',
      placeholder: 'Belajar Dasar Pemrograman Web',
    },
    issuer: {
      label: 'Penerbit',
      placeholder: 'Dicoding Academy',
    },
    issueDate: {
      label: 'Tanggal terbit',
      placeholder: '2024-03',
      hint: 'Format YYYY atau YYYY-MM, misalnya 2024 atau 2024-03.',
    },
  },
  actions: {
    addItem: 'Tambah',
    addLink: 'Tambah tautan',
    addGroup: 'Tambah grup',
    moveUp: 'Naikkan',
    moveDown: 'Turunkan',
    remove: 'Hapus',
  },
  actionVerbs: {
    toggleLabel: 'Saran kata kerja',
    hint: 'Pilih kata kerja untuk menyisipkannya di posisi kursor, lalu sesuaikan dengan pengalaman Anda.',
    emptyState: 'Belum ada saran kata kerja untuk bagian ini.',
  },
  aiStatic: {
    rationaleTemplate:
      'Saran: Awali dengan "{verb}" agar terbaca sebagai pencapaian. Sesuaikan dengan pengalaman Anda dan ganti [dampak yang dapat diukur] dengan hasil nyata — hapus bagian itu bila tidak ada datanya.',
    genericRationale:
      'Bagian ini belum memakai kata kerja aksi. Tambahkan [dampak yang dapat diukur] bila ada datanya, atau hapus bagian itu.',
    emptyInputNote: 'Tulis dulu deskripsi tugas mentah Anda, lalu saran akan muncul di sini.',
  },
  aiKeys: {
    sectionTitle: 'Bantuan AI (opsional)',
    intro:
      'AI bersifat opsional dan selalu punya alternatif manual. Kunci hanya tersimpan di tab ini — menutup atau memuat ulang tab akan menghapusnya.',
    apiKeyLabel: 'Kunci API',
    keyPlaceholder: 'Tempel kunci API di sini',
    modelLabel: 'Model',
    endpointLabel: 'Alamat endpoint',
    endpointInvalid: 'Alamat tidak valid. Gunakan https, atau http hanya untuk localhost.',
    saveAction: 'Simpan di sesi ini',
    clearAction: 'Hapus kunci',
    reviewConsent: 'Tinjau persetujuan',
    revokeConsent: 'Cabut persetujuan',
    configuredStatus: 'Kunci tersimpan di sesi ini.',
    unconfiguredReason: 'Belum ada kunci — fitur AI nonaktif. Saran manual tetap tersedia.',
    incompleteNote: 'Lengkapi alamat, kunci, dan model untuk menyimpan.',
    grantedNote: 'Persetujuan sesi ini aktif. Anda bisa mencabutnya kapan saja.',
  },
  aiConsent: {
    title: 'Izinkan pengiriman data ke AI?',
    providerLabel: 'Penyedia',
    dataLabel: 'Data yang dikirim',
    consequenceLabel: 'Akibatnya',
    grantAction: 'Setuju dan kirim',
    declineAction: 'Tolak',
    policyLabel: 'Baca kebijakan privasi penyedia',
    intro:
      'Operasi ini mengirim sebagian kecil data CV Anda ke penyedia AI. Tanpa persetujuan, tidak ada yang dikirim.',
    consequenceText:
      'Data di atas diproses oleh penyedia sesuai kebijakannya — kebijakan itu bisa berubah dan di luar kendali kami.',
    dataFieldsList: 'Deskripsi tugas mentah, konteks bagian, bahasa, fakta yang boleh dipakai',
    dataFieldsListPolish: 'Teks yang dipilih dan mode poles (ID/EN/terjemahan)',
  },
  aiBullets: {
    triggerLabel: 'Saran bullet AI',
    panelTitle: 'Saran bullet AI',
    targetRoleLabel: 'Peran yang dilamar (opsional)',
    targetRolePlaceholder: 'mis. Staff administrasi',
    targetRoleOfflineNote:
      'Kolom ini baru dipakai setelah Anda menyimpan kunci AI — saran manual di bawah mengabaikannya.',
    generateAction: 'Minta saran',
    applyAction: 'Terapkan',
    closeAction: 'Tutup',
    suggestionLabel: 'Saran',
    hint: 'Tulis dulu deskripsi tugas mentah pada baris ini, lalu minta saran. Saran hanya kandidat — tidak ada yang berubah sebelum Anda menekan Terapkan.',
    loadingNote: 'Meminta saran…',
    readyNote: 'Saran siap. Tidak ada yang berubah sebelum Anda menekan Terapkan.',
    staticNote: 'Menampilkan saran manual yang tetap bisa dipakai.',
    consentNote: 'Persetujuan ditolak — menampilkan saran manual. Tidak ada data yang dikirim.',
    unconfiguredNote: 'Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.',
    errorNote: 'AI tidak menjawab — menampilkan saran manual. Draft Anda tidak berubah.',
    rateLimitedNote:
      'Batas pemakaian AI tercapai — menampilkan saran manual. Draft Anda tidak berubah; coba lagi nanti.',
    timeoutNote:
      'AI tidak menjawab tepat waktu — menampilkan saran manual. Draft Anda tidak berubah.',
  },
  aiAchievement: {
    triggerLabel: 'Susun bullet dengan AI',
    triggerTooltip: 'Tulis deskripsi pencapaian — AI menyusun 1–3 bullet poles yang bisa ditinjau.',
    panelTitle: 'Susun bullet dengan AI',
    descriptionLabel: 'Deskripsi pencapaian',
    descriptionPlaceholder:
      'mis. Membuat PRD dan SRS untuk aplikasi kasir bersama 2 teman selama magang',
    generateAction: 'Susun bullet',
    applyAction: 'Terapkan',
    closeAction: 'Tutup',
    suggestionLabel: 'Saran',
    hint: 'Tulis pencapaian dalam 1–2 paragraf, lalu minta AI menyusunnya jadi bullet. Saran hanya kandidat — tidak ada yang berubah sebelum Anda menekan Terapkan.',
    emptyInputNote: 'Tulis dulu deskripsi pencapaian Anda, lalu bullet akan muncul di sini.',
    loadingNote: 'Menyusun bullet…',
    readyNote: 'Bullet siap. Tidak ada yang berubah sebelum Anda menekan Terapkan.',
    staticNote: 'Menampilkan saran manual yang tetap bisa dipakai.',
    consentNote: 'Persetujuan ditolak — menampilkan saran manual. Tidak ada data yang dikirim.',
    unconfiguredNote: 'Belum ada kunci — menampilkan saran manual yang tetap bisa dipakai.',
    errorNote: 'AI tidak menjawab — menampilkan saran manual. Draft Anda tidak berubah.',
    rateLimitedNote:
      'Batas pemakaian AI tercapai — menampilkan saran manual. Draft Anda tidak berubah; coba lagi nanti.',
    timeoutNote:
      'AI tidak menjawab tepat waktu — menampilkan saran manual. Draft Anda tidak berubah.',
    aiGeneratedNote:
      'Daftar ini dibuat AI — tinjau kembali sebelum menerapkan. AI dapat membuat kesalahan.',
  },
  aiTailoring: {
    triggerLabel: 'Sesuaikan dengan lowongan',
    triggerTooltip: 'Tempel deskripsi lowongan — lihat kata kunci mana yang didukung data Anda.',
    panelTitle: 'Sesuaikan dengan lowongan',
    jdLabel: 'Deskripsi lowongan',
    jdPlaceholder: 'mis. Dicari staf administrasi yang menguasai Microsoft Excel…',
    generateAction: 'Analisis kecocokan',
    closeAction: 'Tutup',
    matchedLabel: 'Kata kunci yang didukung data',
    unsupportedLabel: 'Kata kunci yang belum didukung',
    sectionsLabel: 'Bagian yang perlu diperkuat',
    questionsLabel: 'Pertanyaan klarifikasi',
    hint: 'Tempel deskripsi lowongan, lalu lihat kata kunci mana yang sudah didukung data Anda. Hasilnya hanya bahan tinjauan — CV Anda tidak berubah.',
    emptyInputNote: 'Tempel dulu deskripsi lowongannya, lalu hasilnya muncul di sini.',
    loadingNote: 'Menganalisis kecocokan…',
    readyNote: 'Hasil siap. CV Anda tidak berubah.',
    staticNote: 'Menampilkan hasil pencocokan manual yang tetap bisa dipakai.',
    consentNote: 'Persetujuan ditolak — menampilkan hasil manual. Tidak ada data yang dikirim.',
    unconfiguredNote: 'Belum ada kunci — menampilkan hasil manual yang tetap bisa dipakai.',
    errorNote: 'AI tidak menjawab — menampilkan hasil manual. Draft Anda tidak berubah.',
    rateLimitedNote:
      'Batas pemakaian AI tercapai — menampilkan hasil manual. Draft Anda tidak berubah; coba lagi nanti.',
    timeoutNote:
      'AI tidak menjawab tepat waktu — menampilkan hasil manual. Draft Anda tidak berubah.',
    aiGeneratedNote: 'Daftar ini dibuat AI — tinjau kembali. AI dapat membuat kesalahan.',
    truncatedNote: 'Deskripsi lowongan dipotong hingga 10.000 karakter.',
  },
  aiPolish: {
    triggerLabel: 'Poles teks dengan AI',
    panelTitle: 'Poles teks',
    modeLabel: 'Mode',
    modeIdLabel: 'Polish (ID)',
    modeEnLabel: 'Polish (EN)',
    modeTranslateLabel: 'Terjemahkan ke Inggris',
    generateAction: 'Minta polesan',
    applyAction: 'Terapkan',
    closeAction: 'Tutup',
    hint: 'Polesan hanya kandidat — tidak ada yang berubah sebelum Anda menekan Terapkan.',
    loadingNote: 'Memoles teks…',
    readyNote: 'Polesan siap. Tidak ada yang berubah sebelum Anda menekan Terapkan.',
    staticNote: 'Menampilkan panduan manual yang tetap bisa dipakai.',
    consentNote: 'Persetujuan ditolak — menampilkan panduan manual. Tidak ada data yang dikirim.',
    unconfiguredNote: 'Belum ada kunci — menampilkan panduan manual yang tetap bisa dipakai.',
    errorNote: 'AI tidak menjawab — menampilkan panduan manual. Draft Anda tidak berubah.',
    rateLimitedNote:
      'Batas pemakaian AI tercapai — menampilkan panduan manual. Draft Anda tidak berubah; coba lagi nanti.',
    timeoutNote:
      'AI tidak menjawab tepat waktu — menampilkan panduan manual. Draft Anda tidak berubah.',
    emptyInputNote: 'Tulis dulu teks pada field ini, lalu panduan akan muncul di sini.',
    checklistId: [
      'Awali dengan kata kerja aksi, misalnya "Mengelola" atau "Menyusun".',
      'Satu kalimat, satu gagasan — pangkas kata pengisi seperti "melakukan".',
      'Pertahankan semua angka, nama, dan tanggal persis seperti semula.',
      'Akhiri dengan tanda baca dan pastikan ejaan konsisten.',
    ],
    avoidedId: [
      'Hindari "Bertanggung jawab atas…" — tulis aksinya, misalnya "Mengelola jadwal piket 30 anggota."',
      'Hindari singkatan yang tidak umum tanpa kepanjangannya.',
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
      'Tulis kalimat pendek yang setara — satu kalimat sumber, satu kalimat Inggris.',
      'Pertahankan angka, nama, dan tanggal persis seperti teks sumber.',
      'Jangan menaikkan peran menjadi pengalaman profesional yang tidak diklaim.',
      'Awali dengan kata kerja aksi Bahasa Inggris bila cocok.',
    ],
    avoidedTranslate: [
      'Hindari menerjemahkan kata per kata — utamakan kalimat yang wajar.',
      'Hindari menambah gelar atau jabatan yang tidak ada di teks sumber.',
    ],
  },
  preview: {
    regionLabel: 'Pratinjau CV',
    modeLabel: 'Mode tampilan CV',
    atsMode: 'ATS',
    creativeMode: 'Creative',
    modeStatus: 'Mode {mode} aktif',
    formTab: 'Form',
    previewTab: 'Pratinjau',
    formLabel: 'Formulir CV',
    dismissNotice: 'Tutup pemberitahuan',
    paperSizeLabel: 'Ukuran kertas pratinjau',
    paperA4: 'A4',
    paperLetter: 'Letter',
  },
  print: {
    button: 'Cetak / Simpan PDF',
    helpButton: 'Panduan cetak',
    title: 'Mencetak CV sebagai PDF',
    intro:
      'CV dicetak langsung dari pratinjau yang sedang tampil — hasilnya sama dengan yang Anda lihat. Pada dialog cetak peramban, pilih tujuan "Simpan sebagai PDF".',
    chrome:
      'Chrome: buka "Opsi lainnya" pada dialog cetak, lalu hilangkan centang "Header dan footer".',
    firefox:
      'Firefox: buka "Opsi lainnya" pada dialog cetak, lalu pilih "Kosong" untuk header dan footer.',
    safari: 'Safari: pada dialog cetak, hilangkan centang "Cetak header dan footer".',
    filenameNote: 'Beri nama berkas {filename} saat menyimpan agar mudah ditemukan kembali.',
    printAction: 'Cetak sekarang',
    doNotShowAgain: 'Jangan tampilkan lagi',
  },
  offline: {
    offlineMessage: 'Anda sedang offline. Semua perubahan tetap tersimpan di perangkat ini.',
  },
  dataSafety: {
    sectionTitle: 'Hapus semua data',
    openDialog: 'Hapus semua data',
    dialogTitle: 'Hapus semua data?',
    exportFirst: 'Ekspor dulu (.json)',
    confirm: 'Ya, hapus semua',
    cancel: 'Batal',
    wiping: 'Menghapus…',
    reload: 'Muat ulang',
    close: 'Tutup',
    sectionDescription:
      'Menghapus seluruh draft, foto, dan pengaturan dari peramban ini. Berguna di perangkat bersama seperti lab kampus atau warnet.',
    dialogDescription:
      'Tindakan ini menghapus seluruh draft dan foto dari peramban ini dan tidak bisa dibatalkan. Ekspor dulu draft yang sedang terbuka bila masih dibutuhkan.',
    success: 'Semua data terhapus dari peramban ini. Muat ulang untuk kembali ke kondisi kosong.',
    exportFailedNote:
      'Ekspor gagal — periksa kembali unduhan peramban Anda. Anda tetap bisa melanjutkan penghapusan atau membatalkannya.',
    partial:
      'Sebagian data terhapus. Yang tersisa: {remainder}. Muat ulang, lalu ulangi penghapusan bila perlu.',
    remainderDrafts: 'sebagian draft',
    remainderPrefs: 'sebagian pengaturan',
    remainderCache: 'cache aplikasi',
  },
  storageNotice: {
    notice:
      'Data Anda tersimpan di peramban pada perangkat ini. Membersihkan data peramban, mode penyamaran, atau pembersihan otomatis dapat menghapus draft Anda. Gunakan Ekspor Draft untuk membuat salinan cadangan.',
    dismiss: 'Mengerti',
  },
  legal: {
    notice: 'cv4every1 © 2026 M. Khaidar — perangkat lunak bebas berlisensi AGPL-3.0.',
    license: 'Lisensi',
    source: 'Kode sumber',
    about: 'Tentang',
  },
  drafts: {
    title: 'CV saya',
    empty: 'Belum ada CV tersimpan.',
    create: 'CV baru',
    rename: 'Ganti nama',
    renameTitle: 'Ganti nama CV',
    duplicate: 'Duplikat',
    remove: 'Hapus',
    export: 'Ekspor',
    import: 'Impor',
    confirmDelete: 'Hapus CV ini? Tindakan ini tidak bisa dibatalkan.',
  },
  autosave: {
    saving: 'Menyimpan…',
    saved: 'Tersimpan',
  },
  importErrors: {
    NOT_JSON:
      'Berkas ini bukan berkas teks yang dapat dibaca. Pilih berkas hasil ekspor dari aplikasi ini.',
    INVALID_ENVELOPE_STRUCTURE:
      'Struktur berkas tidak dikenali. Pastikan Anda memilih berkas hasil ekspor aplikasi ini.',
    WRONG_FORMAT_ID: 'Berkas ini bukan berkas CV dari aplikasi ini.',
    UNSUPPORTED_KIND: 'Jenis berkas ini belum didukung. Gunakan berkas hasil ekspor CV.',
    SCHEMA_TOO_NEW:
      'Berkas ini dibuat dengan versi aplikasi yang lebih baru. Perbarui aplikasi Anda, lalu coba lagi.',
    MIGRATION_FAILED: 'Berkas dari versi lama tidak dapat dibaca. CV Anda saat ini tetap aman.',
    VALIDATION_FAILED:
      'Isi berkas tidak lengkap sehingga tidak bisa dibuka. CV Anda saat ini tetap aman.',
  },
  importPdf: {
    button: 'Impor PDF',
    dialogTitle: 'Impor CV dari PDF',
    fileLabel: 'Pilih berkas PDF',
    approveAction: 'Simpan sebagai CV baru',
    cancelAction: 'Batal',
    retryAction: 'Coba lagi',
    hint: 'Hasil ekstraksi hanya kandidat — tinjau dulu, lalu simpan sebagai CV baru bila sudah benar. CV yang sedang terbuka tidak berubah sebelum Anda menekan Simpan.',
    extractingNote: 'Membaca lapisan teks PDF…',
    ocrNote: 'Teks digital tidak ditemukan — membaca gambar halaman…',
    ocrDownloadNote:
      'Pemakaian pertama mengunduh model baca-gambar (beberapa MB) lalu menyimpannya di perangkat. Butuh internet sekali ini saja.',
    mappingNote: 'Memetakan teks ke kolom CV…',
    readyNote: 'Hasil siap ditinjau. Tidak ada yang tersimpan sebelum Anda menekan Simpan.',
    reviewTitle: 'Tinjau hasil impor',
    unmappedNote: '{count} baris tidak terpeta — periksa dan salin manual bila perlu.',
    sourceTextNote: 'Sumber: teks digital PDF.',
    sourceOcrNote:
      'Sumber: baca-gambar (OCR). Ketelitiannya di bawah teks digital — periksa tiap kolom.',
    confidenceHigh: 'Pola jelas',
    confidenceMedium: 'Perlu ditinjau',
    confidenceLow: 'Tebakan lemah — wajib cek',
    fieldCountNote: 'kolom terpeta',
    errors: {
      NOT_PDF: 'Berkas ini bukan PDF. Pilih CV lama Anda yang berformat PDF.',
      TOO_LARGE:
        'Berkas melebihi 10 MB sehingga tidak dibaca. Pilih berkas yang lebih kecil, atau isi manual.',
      UNREADABLE:
        'Berkas PDF tidak dapat dibaca (rusak atau halamannya terlalu banyak). CV Anda saat ini tetap aman.',
      NO_TEXT_NO_OCR:
        'Tidak ada teks yang bisa dibaca dari berkas ini. Coba PDF lain, atau isi manual.',
      OCR_UNAVAILABLE:
        'Model baca-gambar belum tersedia (perlu internet sekali untuk mengunduhnya). PDF digital tetap bisa dibaca; atau isi manual.',
      MAPPING_EMPTY:
        'Tidak ada kolom yang bisa dipetakan dari berkas ini. Coba PDF lain, atau isi manual.',
      VALIDATION_FAILED:
        'Hasil ekstraksi tidak lengkap sehingga tidak bisa disimpan. CV Anda saat ini tetap aman.',
    },
  },
  emptyState: {
    title: 'Mulai dari halaman kosong',
    description:
      'Isi bagian demi bagian sesuai kemampuan Anda. Semuanya tersimpan otomatis di perangkat ini dan tidak dikirim ke mana pun.',
    cta: 'Buat CV pertama',
  },
  photoUpload: {
    label: 'Foto profil',
    select: 'Pilih foto',
    replace: 'Ganti foto',
    remove: 'Hapus foto',
    processing: 'Memproses foto…',
  },
  photoErrors: {
    wrongType: 'Format foto belum didukung. Gunakan berkas JPG, PNG, atau WebP.',
    tooLarge: 'Ukuran foto melebihi 2 MB. Pilih foto yang lebih kecil, lalu coba lagi.',
    compressFailed: 'Foto tidak dapat diproses. Coba foto lain dari kamera atau galeri Anda.',
    quotaFull:
      'Kuota penyimpanan perangkat penuh, sehingga foto tidak tersimpan. Isi CV Anda tetap aman — pertimbangkan mengekspornya.',
  },
  validation: {
    invalidEmail: 'Format email belum benar, misalnya budi.santoso@email.com.',
    invalidUrl: 'Format tautan belum benar. Awali dengan https://, misalnya https://contoh.id.',
    invalidDate:
      'Format tanggal belum benar. Gunakan YYYY atau YYYY-MM, misalnya 2021 atau 2021-08.',
    invalidGpaValue: 'Format IPK belum benar, misalnya 3.52.',
    invalidGpaScale: 'Format skala belum benar, misalnya 4.00.',
  },
  progress: {
    sectionProgress: 'Bagian {current} dari {total}',
    sectionCompleted: '{filled} dari {total} bagian terisi',
  },
  common: {
    selectEmpty: 'Belum dipilih',
  },
  skip: {
    toPreview: 'Lewati ke pratinjau CV',
  },
  locale: {
    label: 'Bahasa antarmuka',
    indonesian: 'Indonesia',
    english: 'Inggris',
    status: 'Bahasa {locale} aktif',
  },
}

/**
 * FR-204: for non-Indonesian locales the Indonesia-specific domain microcopy
 * (IPK, +62, photo norms, CV-length advice, status writing examples) is
 * blanked, while structural labels stay Indonesian until the English pack
 * arrives in Fase 3 (F-G5). Components render guidance only when the string
 * is non-empty, so a blank means "hidden".
 */
export const microcopyStructural: MicrocopyPack = {
  ...microcopyId,
  dataSafety: {
    ...microcopyId.dataSafety,
    sectionDescription: '',
    dialogDescription: '',
    success: '',
    exportFailedNote: '',
    partial: '',
    remainderDrafts: '',
    remainderPrefs: '',
    remainderCache: '',
  },
  storageNotice: { ...microcopyId.storageNotice, notice: '' },
  importPdf: {
    ...microcopyId.importPdf,
    hint: '',
    extractingNote: '',
    ocrNote: '',
    ocrDownloadNote: '',
    mappingNote: '',
    readyNote: '',
    reviewTitle: '',
    unmappedNote: '',
    sourceTextNote: '',
    sourceOcrNote: '',
    confidenceHigh: '',
    confidenceMedium: '',
    confidenceLow: '',
    fieldCountNote: '',
  },
  print: {
    ...microcopyId.print,
    intro: '',
    chrome: '',
    firefox: '',
    safari: '',
    filenameNote: '',
  },
  gpa: { hint: '', missingScaleWarning: '', displayAdvice: '' },
  educationStatus: {
    graduated: { label: microcopyId.educationStatus.graduated.label, example: '' },
    'awaiting-ceremony': {
      label: microcopyId.educationStatus['awaiting-ceremony'].label,
      example: '',
    },
    'in-progress': { label: microcopyId.educationStatus['in-progress'].label, example: '' },
    discontinued: { label: microcopyId.educationStatus.discontinued.label, example: '' },
  },
  photo: { atsHiddenNotice: '', tips: '' },
  contact: {
    phoneHint: '',
    unprofessionalEmailWarning: '',
    locationHint: '',
    linkedinNote: '',
  },
  organizations: { guidance: '', examples: '' },
  cvLength: { guidance: '', softWarning: '' },
  aiStatic: { rationaleTemplate: '', genericRationale: '', emptyInputNote: '' },
  aiKeys: {
    ...microcopyId.aiKeys,
    intro: '',
    keyPlaceholder: '',
    unconfiguredReason: '',
    grantedNote: '',
    incompleteNote: '',
  },
  aiConsent: {
    ...microcopyId.aiConsent,
    intro: '',
    consequenceText: '',
    dataFieldsList: '',
    dataFieldsListPolish: '',
  },
  aiBullets: {
    ...microcopyId.aiBullets,
    hint: '',
    loadingNote: '',
    readyNote: '',
    staticNote: '',
    consentNote: '',
    unconfiguredNote: '',
    errorNote: '',
    rateLimitedNote: '',
    timeoutNote: '',
    targetRoleOfflineNote: '',
  },
  aiAchievement: {
    ...microcopyId.aiAchievement,
    triggerTooltip: '',
    descriptionPlaceholder: '',
    hint: '',
    emptyInputNote: '',
    loadingNote: '',
    readyNote: '',
    staticNote: '',
    consentNote: '',
    unconfiguredNote: '',
    errorNote: '',
    rateLimitedNote: '',
    timeoutNote: '',
    aiGeneratedNote: '',
  },
  aiTailoring: {
    ...microcopyId.aiTailoring,
    triggerTooltip: '',
    jdPlaceholder: '',
    hint: '',
    emptyInputNote: '',
    loadingNote: '',
    readyNote: '',
    staticNote: '',
    consentNote: '',
    unconfiguredNote: '',
    errorNote: '',
    rateLimitedNote: '',
    timeoutNote: '',
    aiGeneratedNote: '',
    truncatedNote: '',
  },
  aiPolish: {
    ...microcopyId.aiPolish,
    hint: '',
    loadingNote: '',
    readyNote: '',
    staticNote: '',
    consentNote: '',
    unconfiguredNote: '',
    errorNote: '',
    rateLimitedNote: '',
    timeoutNote: '',
    emptyInputNote: '',
    checklistId: [],
    avoidedId: [],
    checklistEn: [],
    avoidedEn: [],
    checklistTranslate: [],
    avoidedTranslate: [],
  },
  fields: {
    ...microcopyId.fields,
    email: { ...microcopyId.fields.email, hint: '' },
    phone: { ...microcopyId.fields.phone, hint: '' },
    location: { ...microcopyId.fields.location, hint: '' },
    linkUrl: { ...microcopyId.fields.linkUrl, hint: '' },
    gpaValue: { ...microcopyId.fields.gpaValue, hint: '' },
  },
}

/**
 * FR-204: Indonesian-specific microcopy is inactive for other locales. Since
 * T3c (ADR-0012, FR-702) the English pack below carries the full interface
 * copy; callers keep the null fallback for unknown future locales.
 */
export function getMicrocopy(locale: LocaleKey): MicrocopyPack | null {
  if (locale === 'id') return microcopyId
  if (locale === 'en') return microcopyEn
  return null
}

/**
 * English pack resolved against the Indonesian pack at module load (ADR-0012,
 * FR-703): the authored draft is complete, so it resolves unchanged — and any
 * key a future edit drops falls back per-key through `withIdFallback` instead
 * of crashing. Exported for the sweep tests; components use `getMicrocopy`.
 */
export const microcopyEn: MicrocopyPack = withIdFallback(microcopyId, microcopyEnDraft)
