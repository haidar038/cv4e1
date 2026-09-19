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
}

export const microcopyId: MicrocopyPack = {
  gpa: {
    hint: 'Tulis IPK Anda beserta skala, misalnya 3.52 / 4.00',
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
    phoneHint:
      'Gunakan format nomor Indonesia yang konsisten, misalnya +62 812-3456-7890 atau 0812-3456-7890.',
    unprofessionalEmailWarning:
      'Alamat email seperti nama panggilan mengurangi kesan profesional. Pertimbangkan email berbasis nama Anda, misalnya budi.santoso@email.com.',
    locationHint: 'Tulis nama kota saja tanpa alamat lengkap, misalnya Bandung atau Depok.',
    linkedinNote:
      'LinkedIn bersifat opsional. Cantumkan bila profilnya aktif dan relevan dengan posisi yang dituju.',
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
}

/**
 * FR-204: Indonesian-specific microcopy is inactive for other locales. The
 * English pack arrives in Fase 3 (F-G5); callers must handle the null case.
 */
export function getMicrocopy(locale: LocaleKey): MicrocopyPack | null {
  return locale === 'id' ? microcopyId : null
}
