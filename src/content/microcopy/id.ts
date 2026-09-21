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
  }
  common: {
    selectEmpty: string
  }
  skip: {
    toPreview: string
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
  },
  common: {
    selectEmpty: 'Belum dipilih',
  },
  skip: {
    toPreview: 'Lewati ke pratinjau CV',
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
 * FR-204: Indonesian-specific microcopy is inactive for other locales. The
 * English pack arrives in Fase 3 (F-G5); callers must handle the null case.
 */
export function getMicrocopy(locale: LocaleKey): MicrocopyPack | null {
  return locale === 'id' ? microcopyId : null
}
