---
name: cv4every1-fase-1-mvp
overview: Implementasi Fase 1 MVP cv4every1 — menutup utang teknis Fase 0 (strict TS, rig test, CI), lalu membangun lapisan state, form terpandu berbahasa Indonesia, dua renderer (ATS + Creative) dari view model yang sudah ada, toggle dual-engine, Action Verbs Catalog offline, ekspor PDF via print CSS (ADR-0007), PWA service worker, dan penghapusan seluruh data. Setiap task memakai template AGENTS.md §11 dan berhenti di gerbang Fase 1.
todos:
  - id: confirm-and-reconcile
    content: Baca AGENTS.md §3 + dokumen wajib, konfirmasi keputusan D13–D24, laporkan gap Task 7 yang belum selesai, tunggu persetujuan
    status: completed
  - id: harden-strict-and-tooling
    content: Aktifkan TypeScript strict + flag turunannya, tambah Prettier, dan perbaiki seluruh error yang muncul di core/ dan storage/
    status: completed
    dependencies:
      - confirm-and-reconcile
  - id: ci-and-test-rig
    content: Playwright config + smoke e2e + boundary checker + GitHub Actions + skrip agregat, isi angka anggaran performa dari build pertama
    status: completed
    dependencies:
      - harden-strict-and-tooling
  - id: store-layer
    content: Task 8 — DocumentStore/DraftStore/UIStore dengan Zustand, integrasi AutoSaveManager dan BroadcastChannel, selector view model ter-memoize
    status: completed
    dependencies:
      - ci-and-test-rig
  - id: content-pillar
    content: Task 13 — Action Verbs Catalog (JSON statis) + micro-copy ID sebagai data bertipe di src/content/ (13a data selesai; UI saran = 13b)
    status: completed
    dependencies:
      - store-layer
  - id: form-sections
    content: Task 9 — Form terpandu seluruh section dengan micro-copy, foto (kompres), validasi inline, indikator autosave, navigasi keyboard
    status: completed
    dependencies:
      - content-pillar
  - id: renderer-ats
    content: Task 10 — ATSRenderer dari ATSViewModel, single column, heading standar, print CSS, tanpa foto secara struktural
    status: completed
    dependencies:
      - form-sections
  - id: renderer-creative
    content: Task 11 — CreativeRenderer satu template, dua kolom, foto, aksen warna, teks tetap dapat diseleksi
    status: completed
    dependencies:
      - renderer-ats
  - id: dual-engine-ux
    content: Task 12 — ModeToggle + PreviewPane + PhotoNotice; buktikan switch mode tidak mengubah ResumeDocument
    status: completed
    dependencies:
      - renderer-creative
  - id: pdf-and-pwa
    content: Task 14 — Tombol cetak + modal instruksi header/footer, vite-plugin-pwa, manifest, uji offline e2e
    status: completed
    dependencies:
      - dual-engine-ux
  - id: data-safety
    content: Task 15 — Hapus semua data (IndexedDB + localStorage + Cache Storage) dengan tawaran ekspor, peringatan penyimpanan lokal
    status: completed
    dependencies:
      - pdf-and-pwa
  - id: phase-1-gate
    content: Verifikasi gerbang keluar Fase 1 (kriteria prd.md §10, alur inti offline, a11y, anggaran performa), perbarui changelog, laporkan dan berhenti sebelum Fase 2
    status: completed
    dependencies:
      - data-safety
---

## User Requirements

Melanjutkan implementasi cv4every1 ke **Fase 1 (MVP)** sesuai `docs/01-product/roadmap.md`, di atas fondasi Fase 0 yang sudah selesai.

Instruksi yang mengikat:

- Ikuti urutan fase. **Jangan lompat ke Fase 2 (AI).**
- Gunakan template task `AGENTS.md` §11.
- Konfirmasi keputusan desain **D13–D24** (di bawah) sebelum menulis kode.
- **Laporkan dan tutup utang teknis Task 7** terlebih dahulu — jangan membangun UI di atas rig test yang belum ada.
- Setiap task berhenti di checkpoint laporan sebelum lanjut ke task berikutnya.

---

## Status Awal (diverifikasi terhadap repository)

| Aspek | Status |
| :-- | :-- |
| Fase −1 (Spike S1) | ✅ Selesai — ADR-0007: **HTML + Print CSS** |
| Fase 0 jalur data | ✅ Selesai — schema, normalize, storage, import/export, migrasi |
| Fase 0 rig test + CI (**Task 7**) | **BELUM** — strict TS, Playwright config, CI, boundary checker, Prettier |
| Baseline test | ✅ 6 file · 51 test lulus · typecheck bersih |
| `src/render/`, `src/features/`, `src/content/` | ⬜ kosong (README saja) |
| `src/App.tsx` | ⬜ masih `Hello World` |

## Yang sudah tersedia dan **wajib dipakai**, bukan dibangun ulang

| Kapabilitas | API | Jangan lakukan |
| :-- | :-- | :-- |
| Validasi dokumen | `validateResumeDocument()` (`src/core/schema.ts`) | Jangan buat validator kedua |
| Dokumen kosong | `createEmptyResumeDocument()` | Jangan susun default manual |
| View model ATS | `toATSViewModel()` (`src/core/normalize.ts`) | **Jangan** terapkan aturan mode di JSX |
| View model Creative | `toCreativeViewModel()` | idem |
| Autosave | `AutoSaveManager` (`src/storage/autosave.ts`) | Jangan tulis debounce kedua |
| CRUD draft | `saveDraft`/`loadDraft`/`listDrafts`/`deleteDraft` | Jangan akses Dexie dari komponen |
| Wipe | `wipeAllData()` | — |
| Multi-tab | `notifyTabs`/`onExternalUpdate` (`src/storage/sync.ts`) | — |
| Ekspor/impor | `exportResume()`/`importResume()` | Jangan bungkus ulang envelope |
| Migrasi | `migrateDocument()` (`src/core/migration.ts`) | — |
| Aset foto | `saveAsset`/`loadAsset`/`deleteAsset` | Jangan simpan base64 di `ResumeDocument` |

## Batas modul yang mengikat (`architecture-overview.md` §5)

| Modul | Boleh bergantung pada | Tidak boleh |
| :-- | :-- | :-- |
| `core/` | — | React, DOM, storage, jaringan |
| `render/` | `core/` | storage, jaringan, `ai/` |
| `content/` | — | apa pun |
| `features/` | semua modul | — |

> **Konsekuensi keras:** `src/render/` **tidak boleh** mengimpor `src/storage/`. Foto pada mode Creative diberikan lewat view model + resolver yang disuntikkan dari `features/`, **bukan** dengan membuat `render/` membaca IndexedDB.

## Goal

**Pengguna dapat mengisi CV berbahasa Indonesia di ponsel, melihatnya dalam dua mode dari satu data, mencetaknya menjadi PDF yang dapat dibaca mesin, dan memakainya sepenuhnya offline — tanpa akun.**

Gerbang keluar Fase 1 (`roadmap.md`): **kriteria `prd.md` §10 terpenuhi; seluruh alur inti lulus test offline.**

---

## Keputusan Desain D13–D24 — **KONFIRMASI SEBELUM CODING**

Melanjutkan penomoran D1–D12 Fase 0. Setiap baris punya usulan default dengan alasan dan dokumen sumber. **Setujui atau ubah sebelum Task 8 dimulai.**

| # | Pertanyaan | Usulan Default | Alasan / Sumber |
| :-- | :-- | :-- | :-- |
| **D13** | Library state management | **Zustand** | `architecture-overview.md` §3 sudah mengusulkan Zustand. ~1,5 KB gzip, MIT, aktif. `useReducer`+Context menyebabkan re-render boros pada form 40+ field. Butuh pembenaran `dependency-policy.md`. |
| **D14** | Router? | **Tidak ada router.** Gunakan view state di `UIStore` + `lastDraftId` di `localStorage` | Aplikasi satu-workspace, tanpa deep-linking. Menghindari dependensi (`react-router` ~10 KB) yang tidak memberi nilai pada local-first tanpa URL publik. |
| **D15** | Format micro-copy ID | **Modul TypeScript bertipe** di `src/content/microcopy/id.ts`, bukan JSON mentah | Memberi autocomplete + gagal saat build jika kunci hilang. `localization-guide.md` §5 mengusulkan JSON; TS memberi jaminan tipe lebih kuat. **Ini deviasi sadar dari dokumen — laporkan.** |
| **D16** | Action Verbs Catalog | **JSON statis** `src/content/action-verbs/id.json` + loader bertipe. ~60–100 entri, 6 kategori, `applicableSections[]` | `localization-guide.md` §4, glossary `action-verbs.json`. Wajib offline (FR-206). |
| **D17** | Template Creative MVP | **1 template** (`default`), dua kolom dengan sidebar | D6 (disetujui Fase 0). `vision.md` Q4 menyarankan dua; mulai satu, tambah tanpa breaking change. |
| **D18** | Kompresi foto | **Canvas API native**, maks 2 MB masuk → maks 500 KB keluar, sisi terpanjang maks 800 px, output WebP dengan fallback JPEG | D8 (disetujui Fase 0). Tanpa dependensi baru. `local-storage-strategy.md` §6. |
| **D19** | Mekanisme ekspor PDF | `window.print()` + `print.css` ter-scope + modal instruksi menonaktifkan header/footer | ADR-0007 Opsi 4. **Tidak ada** generator PDF runtime. |
| **D20** | Identitas PWA | `name: "cv4every1"`, `short_name: "cv4every1"`, `display: standalone`, `lang: "id"`, `start_url: "/"`, ikon 192/512 dibundel lokal | `deployment-architecture.md`. Tanpa aset remote (C-T10). |
| **D21** | Indikator autosave | Teks: `Menyimpan…` · `Tersimpan` · `Gagal menyimpan — ekspor manual disarankan` · `Mode privat: perubahan tidak tersimpan` | `local-storage-strategy.md` §3, §9. Nada memandu, bukan menghakimi. |
| **D22** | Susun ulang section (F-B9, P1) | **Tombol naik/turun**, bukan drag-and-drop | Menghindari dependensi DnD; aksesibel keyboard secara alami (NFR-005); drag-and-drop sulit diakses. |
| **D23** | Navigasi draft | Panel daftar draft (side sheet di mobile, sidebar di desktop) + aksi: baru, ganti nama, duplikat, hapus, ekspor, impor | J6, F-A1. Menghormati mobile-first (`target-users.md` §6). |
| **D24** | Penegakan anggaran performa | Skrip `scripts/check-bundle-size.mjs` membandingkan `dist/` dengan baseline tersimpan; CI gagal jika naik >10% | `performance-budget.md` §2, NFR-008. Angka konkret diisi setelah build produksi pertama. |

### Keputusan yang **tidak** boleh diambil sepihak

- Menambah dependensi runtime apa pun di luar `zustand` dan `vite-plugin-pwa` → butuh pembenaran tertulis.
- Menyimpan konten CV di `localStorage` → dilarang C-T7.
- Membuat `src/render/` membaca IndexedDB → melanggar batas modul.
- Menambahkan `html2canvas` atau sejenisnya → dilarang permanen C-T5.
- Mengubah bentuk `ResumeDocument` → butuh ADR + migrasi + bump versi.

---

# Milestone 1.0 — Menutup Fase 0 (Task 7) + Hardening

Ini **bukan task baru**; ini menutup item Fase 0 yang belum selesai sebelum UI dibangun di atasnya.

## Task 7a — Aktifkan TypeScript strict + Prettier

**Requirement:** NFR-008 (tidak langsung), prasyarat Definition of Done (`AGENTS.md` §8)

**Context:** `tsconfig.app.json` saat ini **tidak** memuat `"strict"`. Kode Fase 0 lulus typecheck karena hanya `noUnusedLocals`/`noUnusedParameters` yang aktif. Risiko: kelas bug TypeScript tidak tertangkap justru saat kode React bertambah.

**Goal:** TypeScript menolak kesalahan tipe secara ketat di seluruh `src/`, `scripts/`, dan berkas test.

**Requirements**

- Tambahkan ke `tsconfig.app.json` dan `tsconfig.node.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitOverride": true`.
- Perbaiki **seluruh** error yang muncul di `src/core/*` dan `src/storage/*` — tanpa menurunkan tipe menjadi `any` tanpa komentar.
- Tambahkan `.prettierrc.json` + `.prettierignore` + skrip `format`/`format:check`.
- `oxlint` tetap linter tunggal (jangan migrasi ke ESLint).

**Non-goals**

- Tidak mereformat `docs/**` (AGENTS.md §5 — jangan mereformat berkas yang tidak diubah).
- Tidak mengubah perilaku runtime apa pun.

**Acceptance criteria**

- [x] `bun run typecheck` lulus dengan strict aktif
- [x] `bun run test` tetap 51 test lulus (atau lebih, jika ada test tambahan)
- [x] `bun run lint` lulus
- [x] `bun run format:check` lulus
- [x] Tidak ada `any` tanpa komentar penjelasan
- [x] `exactOptionalPropertyTypes` **tidak** dilonggarkan sebagai jalan pintas

**Edge cases**

- `exactOptionalPropertyTypes` akan menolak `{ photo: undefined }` — perbaiki dengan menghilangkan kunci, bukan `as any`.
- `noUncheckedIndexedAccess` akan menandai `order[i]` dan akses array di `normalize-helpers.ts` — gunakan guard eksplisit.

**Files**

- `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.json`
- `.prettierrc.json`, `.prettierignore`
- `package.json` (skrip)
- `src/core/*.ts`, `src/storage/*.ts` (perbaikan tipe)

---

## Task 7b — Rig Pengujian (Playwright) + Boundary Checker

**Requirement:** NFR-005, NFR-007, prasyarat test Fase 1

**Context:** `playwright` terpasang di `devDependencies` tetapi `playwright.config.ts` tidak ada dan `e2e/` kosong. Aturan batas modul masih hanya konvensi di README — belum ditegakkan mesin.

**Goal:** Setiap pelanggaran batas modul dan setiap alur kritis dapat ditangkap otomatis.

**Requirements**

- `playwright.config.ts`: projects `chromium` + `firefox`; `webServer` menjalankan `vite preview` dari build produksi; `testDir: e2e`.
- `e2e/smoke.spec.ts`: memuat app shell, memastikan tanpa console error, judul halaman benar.
- `scripts/module-boundaries.mjs`: fungsi murni `findBoundaryViolations()` dengan tabel izin sebagai data (lihat `architecture-overview.md` §5).
- `scripts/check-boundaries.mjs`: wrapper IO, ekstrak specifier `import`/`export from`/`import()` termasuk import **relatif** lintas modul, keluar dengan kode 1 dan pesan `file:line`.
- Test unit untuk boundary checker (kasus lolos dan kasus gagal).
- Skrip `check:boundaries`, `test:unit`, `test:e2e`, `verify`.
- `vitest.config.ts`: pertahankan `environment: 'node'` sebagai default (menegakkan `core/` tanpa DOM), tambahkan override `jsdom` hanya untuk `*.dom.test.tsx`.

**Non-goals**

- Tidak menambah jsdom/RTL sebelum Task 9 benar-benar membutuhkannya.
- Tidak menulis test komponen di milestone ini.

**Acceptance criteria**

- [x] `bun run test:e2e` lulus di Chromium dan Firefox
- [x] `bun run check:boundaries` mendeteksi pelanggaran buatan (mis. `core/` mengimpor `react`) dan lulus pada kode saat ini
- [x] Boundary checker menangkap import relatif (`../storage/x`) yang lolos dari pola path-based
- [x] `bun run verify` menjalankan lint → typecheck → boundaries → test → build secara berurutan
- [x] Boundary checker juga diperluas ke Fase 1: `render/` → `storage/` dilarang

**Edge cases**

- Import tipe-saja (`import type`) tetap dihitung sebagai dependensi.
- Berkas test di dalam modul tidak dikecualikan dari aturan.
- `.gitkeep` dan `README.md` diabaikan.

**Files**

- `playwright.config.ts`, `e2e/smoke.spec.ts`
- `scripts/module-boundaries.mjs`, `scripts/check-boundaries.mjs`
- `src/core/module-boundaries.test.ts` *(fungsi murni diuji dari `src/` agar tercakup Vitest)*
- `vitest.config.ts`, `package.json`, `.gitignore`

---

## Task 7c — CI + Anggaran Performa

**Requirement:** NFR-008, NFR-012

**Context:** `.github/` tidak ada. `performance-budget.md` §1 masih angka usulan.

**Goal:** Setiap PR gagal jika melanggar lint, tipe, batas modul, test, atau anggaran bundle.

**Requirements**

- `.github/workflows/ci.yml`: job `verify` (setup-bun, `bun install --frozen-lockfile`, lint, format:check, typecheck, check:boundaries, test:unit, build) lalu job `e2e` (Chromium saja di PR).
- Tanpa secret apa pun (C-T2).
- `scripts/check-bundle-size.mjs`: ukur `dist/`, bandingkan dengan baseline tersimpan, gagal jika naik >10%.
- Isi angka konkret di `docs/07-quality/performance-budget.md` §1 berdasarkan build produksi pertama, dan tandai bahwa angka sudah divalidasi.

**Acceptance criteria**

- [x] CI hijau pada commit terakhir Milestone 1.0
- [x] Bundle size baseline tercatat; kenaikan >10% menggagalkan CI
- [x] `bun run build` menghasilkan `dist/` statis
- [x] Anggaran performa di dokumen tidak lagi berlabel "usulan"

**Edge cases**

- Cache `~/.bun/install/cache` dan `~/.cache/ms-playwright` untuk menghemat waktu CI.
- Build di CI Linux (bukan Windows) untuk konsistensi dengan temuan spike ADR-0007.

**Files**

- `.github/workflows/ci.yml`
- `scripts/check-bundle-size.mjs`
- `docs/07-quality/performance-budget.md`
- `package.json`

---

# Milestone 1.1 — Store Layer (Task 8)

## Task 8 — State Management Store (Zustand)

**Requirement:** FR-003, FR-102, FR-103, FR-108, NFR-005, NFR-013
**Context:** `state-management.md` §1–§6, `data-flow.md` DF-1, ADR-0004

**Dokumen wajib dibaca:** `docs/03-architecture/state-management.md`, `docs/adr/0004-two-rendering-engines.md`, `docs/03-architecture/data-flow.md`, `docs/06-security/dependency-policy.md`

**Pembenaran dependensi `zustand` (per `dependency-policy.md`):**

- **Fungsi:** state global ringan dengan selector granular dan middleware.
- **Kenapa bukan `useReducer` + Context:** form dengan 40+ field akan memicu re-render seluruh subtree pada setiap ketikan. Zustand memberikan subscription per-selector.
- **Bundle:** ~1,5 KB gzip.
- **Lisensi:** MIT. **Maintenance:** aktif, dipelihara oleh pmndrs.
- **Alternatif ditolak:** Redux Toolkit (~11 KB + boilerplate); Jotai (atom granular, tetapi model store terpusat lebih cocok untuk satu dokumen kanonik).
- **Rencana jika ditinggalkan:** store ditulis sebagai modul biasa dengan API `getState`/`setState`/`subscribe`; migrasi ke implementasi sendiri bersifat mekanis.

**Requirements**

- Tiga store terpisah sesuai `state-management.md` §2:
  - `DocumentStore` — `ResumeDocument` aktif, `draftId`, status dirty, `lastSavedAt`.
  - `DraftStore` — daftar `DraftSummary`, draft terpilih, aksi baru/ganti nama/duplikat/hapus.
  - `UIStore` — mode (`ats`/`creative`), locale, panel yang terbuka, status autosave, pesan storage.
- **Mutasi hanya lewat action bernama.** Tidak ada assignment langsung ke state dari komponen.
- `AIStore` disiapkan sebagai keranjang kosong yang inert (dilarang berisi logika di Fase 1).
- Integrasi `AutoSaveManager`: setiap action yang mengubah dokumen memanggil `autosave.registerChange(doc, draftId)`.
- Integrasi `notifyTabs`/`onExternalUpdate` untuk konflik multi-tab.
- Selector view model ter-memoize: `selectATSViewModel` / `selectCreativeViewModel` hanya menghitung ulang saat dokumen benar-benar berubah.
- `mode` disimpan **per draft** di `meta.mode` dokumen, bukan global — sesuai `meta.mode` yang sudah ada di schema.
- Semua logika store **dapat diuji tanpa React** (`state-management.md` §8).

**Non-goals**

- Tidak ada undo/redo (D5).
- Tidak ada sinkronisasi server.
- Tidak ada AI action.
- Tidak ada router (D14).

**Acceptance criteria**

- [x] Action terdefinisi untuk: muat draft, buat draft baru, update `basics`, tambah/ubah/hapus/hitung-ulang item per section, ubah `sectionOrder`, ganti nama draft, duplikat draft, hapus draft, ganti mode.
- [x] `mode` switch **tidak mengubah** `ResumeDocument` selain `meta.mode` — dibuktikan test.
- [x] Selector view model memoized: test membuktikan tidak ada perhitungan ulang saat state tak terkait berubah.
- [x] Store berfungsi tanpa React (`store.test.ts` dijalankan di env `node`).
- [x] Setelah `registerChange`, autosave terpicu; setelah save, `DraftStore` diperbarui.
- [x] `onExternalUpdate` menandai draft sebagai "diperbarui di tab lain" tanpa menimpa diam-diam.
- [x] `AIStore` ada tetapi tidak diekspor ke UI.

**Edge cases**

- Storage diblokir: store tetap berfungsi di memori; `UIStore` menampilkan status `blocked`; tidak ada crash.
- Kuota penuh saat save: status `error`, dokumen memori **utuh**, tawaran ekspor muncul.
- Draft yang dihapus sedang terbuka di tab lain → pindah ke kondisi kosong, bukan error.
- Memuat draft yang rusak → `InvalidDataError` ditangkap, pengguna diberi tahu, tidak menghapus data lama.
- Dua tab mengedit draft sama → peringatan non-blocking, bukan overwrite diam-diam.

**Files**

- `src/features/store/document-store.ts`
- `src/features/store/draft-store.ts`
- `src/features/store/ui-store.ts`
- `src/features/store/ai-store.ts` *(keranjang inert)*
- `src/features/store/selectors.ts`
- `src/features/store/actions.ts`
- `src/features/store/store.test.ts`

**Tests:** unit store tanpa React; invariant mode-switch; memoization; jalur gagal storage.

---

# Milestone 1.2 — Content Foundation (Task 13a)

Bagian **data** dari Task 13 dipisahkan ke depan karena form membutuhkannya. UI saran menyusul di Milestone 1.3.

## Task 13a — Micro-copy ID + Action Verbs Catalog (data saja)

**Requirement:** FR-201, FR-202, FR-204, FR-205, FR-206
**Context:** `localization-guide.md` §3–§5, `glossary.md` §7

**Goal:** Semua teks panduan Bahasa Indonesia dan katalog kata kerja tersedia sebagai data bertipe, tanpa permintaan jaringan.

**Requirements**

- `src/content/microcopy/id.ts` — micro-copy bertipe (keputusan **D15**):
  - IPK: `"Tulis IPK Anda beserta skala, misalnya 3.52 / 4.00"` (localization-guide §3.1).
  - Status pendidikan: `Lulus` · `Lulus (menunggu wisuda)` · `Sedang menempuh` · `Berhenti` (glossary §7, localization-guide §3.2).
  - Peringatan foto ATS — **wajib menjelaskan alasan**, teks mengikuti `target-users.md` §6:
    > "Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative."
  - Kontak: format `+62` vs `08`.
  - Organisasi: BEM/HMJ/UKM/kepanitiaan/KKN/asisten praktikum diperlakukan sebagai pengalaman sah.
  - Panjang CV: panduan 1–2 halaman.
- `src/content/action-verbs/id.json` — ~60–100 entri, 6 kategori (Manajerial, Teknis, Analitis, Kreatif, Komunikasi, Operasional), tiap entri `{ verb, category, applicableSections[], examplePhrase }`.
- `src/content/action-verbs/index.ts` — loader bertipe + `getVerbsForSection(section)`.
- `src/content/action-verbs/action-verbs.test.ts` — validasi bentuk katalog.
- **Aturan:** micro-copy khas Indonesia otomatis nonaktif saat locale `en` (FR-204) — siapkan struktur, meski UI EN ditunda ke Fase 3.

**Non-goals**

- Tidak ada UI di task ini.
- Tidak ada terjemahan Bahasa Inggris penuh.
- Tidak ada panggilan AI.

**Acceptance criteria**

- [x] Tidak ada string micro-copy yang di-hardcode di komponen (semua lewat `src/content/`).
- [x] Katalog tervalidasi: setiap `applicableSections` merujuk section yang ada di `SectionKey`.
- [x] `getVerbsForSection('projects')` mengembalikan entri yang relevan, tanpa network.
- [x] Peringatan foto menjelaskan **alasan**, bukan sekadar melarang.
- [x] Tidak ada frasa terlarang `glossary.md` §6 (`ATS-compliant`, skor CV, "dijamin lolos ATS").
- [x] `src/content/` tidak mengimpor apa pun dari modul lain (batas modul).

**Edge cases**

- Entri katalog duplikat → test gagal.
- `applicableSections` kosong → entri diabaikan, tidak crash.
- Micro-copy sangat panjang di layar kecil → diuji di Task 9.

**Files**

- `src/content/microcopy/id.ts`
- `src/content/action-verbs/id.json`
- `src/content/action-verbs/index.ts`
- `src/content/action-verbs/action-verbs.test.ts`

---

# Milestone 1.3 — Form Terpandu + Saran Kata Kerja

## Task 9 — Form UI: Guided Sections

**Requirement:** FR-101, FR-102, FR-201 s.d. FR-206, NFR-005, NFR-007, NFR-014
**Context:** J1, J2 (`user-journeys.md`); `target-users.md` §6 (mobile-first, perangkat bersama, kecemasan); `accessibility-plan.md` §2

**Goal:** Fresh graduate dapat mengisi seluruh bagian CV dari ponsel, dengan panduan Bahasa Indonesia di titik pengisian, tanpa kehilangan pekerjaan saat tab tertutup.

**Requirements**

**Struktur & navigasi**
- `FormLayout` dengan navigasi section (accordion/tab) + indikator progres.
- Setiap field punya label, placeholder (contoh nyata), dan deskripsi bantuan bila relevan.
- Fokus berpindah secara logis; tidak ada focus trap; tersedia skip link ke pratinjau.

**Section (F-B1 s.d. F-B7)**
- `BasicsForm` — nama, headline, email, telepon, lokasi, ringkasan, links.
- `EducationForm` — institusi, gelar, bidang, lokasi, tanggal mulai/selesai, status (dropdown dengan contoh), IPK (nilai + skala + label), highlights.
- `ExperienceForm` — organisasi, peran, jenis (magang/kontrak/penuh waktu/organisasi), lokasi, tanggal, `current`, highlights.
- `OrganizationsForm` — memakai struktur sama dengan pengalaman; **diperlakukan setara**, tidak dikategorikan "pengalaman kurang".
- `ProjectsForm` — nama, peran, konteks (tugas akhir/proyek mata kuliah/personal), tanggal, URL, highlights.
- `SkillsForm` — grup berkategori + item.
- `CertificationsForm` — nama, penerbit, tanggal, URL.

**Micro-copy & panduan (F-C1 s.d. F-C6)**
- IPK: hint format + **peringatan jika skala kosong** (localization-guide §3.1).
- Status pendidikan: pemilih dengan contoh penulisan.
- Foto: peringatan kontekstual saat mode ATS aktif (F-C3) — teks dari `src/content/microcopy/id.ts`.
- Kontak: panduan format nomor Indonesia.
- Organisasi: panduan penulisan berorientasi hasil.
- Panjang CV: peringatan lunak saat melewati 2 halaman.

**Foto (F-B8, D18)**
- `PhotoUpload`: terima file, validasi tipe & ukuran (maks 2 MB), kompres via Canvas ke maks 500 KB / sisi terpanjang 800 px, simpan sebagai Blob lewat `saveAsset`, lalu set `basics.photo.assetRef`.
- Pratinjau foto + tombol hapus.

**Perilaku & umpan balik**
- Validasi inline muncul **saat blur**, bukan saat setiap ketikan.
- Pesan error terhubung ke field via `aria-describedby` dan diumumkan (`role="alert"`).
- Indikator autosave terlihat dengan teks D21.
- Susun ulang section dengan tombol naik/turun (F-B9, D22).
- Aksi draft: baru, ganti nama, duplikat, hapus, ekspor, impor (F-A3, F-A4) — UI memakai `exportResume`/`importResume`.
- Empty state yang memandu, bukan menghakimi.

**Non-goals**

- Tidak ada section kustom (F-B10, P3).
- Tidak ada AI di form (Fase 2).
- Tidak ada drag-and-drop.
- Tidak menampilkan skor ATS atau kelengkapan CV dalam bentuk angka.

**Acceptance criteria**

- [x] Seluruh field dapat dijangkau dan dioperasikan hanya dengan keyboard (NFR-005).
- [x] Audit axe tidak menemukan pelanggaran WCAG 2.2 AA pada form (NFR-007).
- [x] Berfungsi pada pembesaran 200% tanpa kehilangan fungsi atau overflow horizontal (NFR-014).
- [x] Setiap field punya label programatik + deskripsi bantuan.
- [x] Teks panjang wrap tanpa overflow di lebar 360 px.
- [x] Validasi muncul saat blur; tidak ada error yang muncul sebelum pengguna berinteraksi.
- [x] Indikator autosave bertransisi `Menyimpan…` → `Tersimpan` dan bertahan setelah reload.
- [x] Foto 3 MB ditolak dengan pesan ramah yang menyebut batasnya.
- [x] Foto 1,5 MB berhasil dikompres dan tersimpan sebagai Blob di store `assets`.
- [x] Section kosong tidak menampilkan heading di pratinjau (diverifikasi lewat view model).
- [x] Impor berkas rusak menampilkan pesan spesifik dari `ImportError.reason`, tidak pernah menimpa draft aktif.

**Edge cases**

- Foto dengan rasio ekstrem (panorama/vertikal) → tidak merusak layout.
- EXIF orientation dari kamera ponsel → dinormalkan sebelum kompresi.
- Storage diblokir → form tetap dapat diisi; status D21 menunjukkan mode privat.
- Kuota penuh saat menyimpan foto → pesan jelas, draft teks tidak hilang.
- Nama lembaga/gelar sangat panjang → wrap, tidak memotong data.
- Tanggal `current` aktif → field tanggal selesai dinonaktifkan.
- Pengguna mengetik cepat lalu menutup tab → `visibilitychange` memicu flush (sudah ada di `AutoSaveManager`).

**Files**

- `src/features/form/FormLayout.tsx`
- `src/features/form/sections/{Basics,Education,Experience,Organizations,Projects,Skills,Certifications}Form.tsx`
- `src/features/form/fields/*` (input, tanggal parsial, highlights editor, GPA group)
- `src/features/form/photo/PhotoUpload.tsx`, `src/features/form/photo/compress.ts`
- `src/features/form/SectionOrderControls.tsx`
- `src/features/form/AutoSaveIndicator.tsx`
- `src/features/form/*.dom.test.tsx` (env jsdom)

**Tests:**
- Komponen per section (jsdom + Testing Library).
- Walkthrough keyboard-only untuk alur pengisian.
- Audit axe otomatis.
- Unit test `compress.ts` (fungsi murni sebisa mungkin) untuk batas ukuran dan dimensi.

**Prasyarat baru:** `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `axe-core` (atau `vitest-axe`). Masing-masing pendek, MIT, dev-only.

---

## Task 13b — Action Verbs Suggestions UI

**Requirement:** FR-205, FR-206, J4
**Context:** `localization-guide.md` §4, `feature-catalog.md` F-E1 s.d. F-E3

**Goal:** Saat pengguna berhenti di kolom deskripsi, ia mendapat saran kata kerja yang bisa disesuaikan — tanpa AI, tanpa jaringan.

**Requirements**

- `ActionVerbSuggestions` muncul di samping/tepi setiap editor bullet pada Experience, Organizations, Projects.
- Saran **difilter berdasarkan section** (`getVerbsForSection`), bukan daftar umum.
- Klik menyisipkan kata kerja **pada posisi kursor**, tidak menimpa teks pengguna.
- Menampilkan `examplePhrase` sebagai pola, bukan kalimat jadi — pengguna tetap penulisnya (J4).
- Panel dapat dibuka/ditutup dan **dapat dinavigasi keyboard** (`accessibility-plan.md` §2).
- Tidak ada permintaan jaringan; bekerja offline penuh (FR-206).

**Non-goals**

- Tidak ada generasi bullet otomatis (itu Fase 2).
- Tidak ada penyimpanan preferensi kata kerja.
- Tidak mengubah data tanpa aksi eksplisit pengguna.

**Acceptance criteria**

- [x] Saran tampil tanpa permintaan jaringan (diverifikasi dengan network dimatikan di e2e).
- [x] Klik menyisipkan pada posisi kursor, menyisipkan **hanya** kata kerja/pola, tidak menghapus teks.
- [x] Daftar berbeda antara section Experience dan Skills (filter bekerja).
- [x] Dapat dioperasikan keyboard penuh; fokus kembali ke textarea setelah menyisipkan.
- [x] Tidak ada saran di section yang tidak relevan (mis. Education).

**Edge cases**

- Kursor berada di tengah kata → penyisipan tetap benar.
- Textarea kosong → menyisipkan di awal, tanpa spasi menggantung.
- Katalog tidak punya entri untuk section → panel tidak muncul, bukan error.

**Files**

- `src/features/form/ActionVerbSuggestions.tsx`
- `src/features/form/ActionVerbSuggestions.dom.test.tsx`

---

# Milestone 1.4 — Renderers

## Task 10 — Renderer ATS (HTML + Print CSS)

**Requirement:** FR-002, FR-004, FR-005, FR-006, FR-007, FR-008, FR-301, FR-302, FR-304, NFR-015
**Context:** ADR-0004, ADR-0007, `rendering-architecture.md` §2 & §4, `07-quality/ats-test-plan.md`

**Goal:** Satu halaman yang menjadi **pratinjau sekaligus sumber PDF** untuk mode ATS, dengan teks yang dapat diekstraksi penuh.

**Requirements**

- `ATSRenderer` mengonsumsi **hanya** `ATSViewModel` — tidak pernah `ResumeDocument`.
- **Penegakan struktural, bukan konvensi:**
  - Satu kolom — tanpa flex/grid multi-kolom pada struktur inti.
  - Tidak ada elemen `<img>` untuk foto (field foto memang tidak ada di view model).
  - Tanpa `<table>` untuk struktur inti.
  - Tanpa ikon yang menggantikan teks.
  - Heading dari kosakata terkontrol (`PENDIDIKAN`, `PENGALAMAN KERJA`, `ORGANISASI`, `PROYEK`, `KEAHLIAN`, `SERTIFIKASI`).
  - Nama dalam **mixed-case** (keputusan **D12** dari Fase 0) — hindari `text-transform: uppercase` pada nama.
- `print.css` dengan `@page` A4 (+ Letter), margin, `break-inside: avoid` per item pengalaman, dan `@media print` yang menyembunyikan seluruh kontrol UI.
- Font dari `@fontsource-variable/*` yang sudah dibundel (NFR-015) — **tanpa CDN**.
- **Subset font Latin** pada langkah bundling font (penutup utang `performance-budget.md` §1: target font raw ≤ 100 KB; transfer ikut turun). Angka sebelum/sesudah dicatat di changelog dan baseline `check:budget` di-update. — **✅ SELESAI LEBIH AWAL (2026-09-20): fontsRaw 393,5 → 88,8 KB, transfer 608,6 → 302,7 KB; Task 10 tidak perlu mengerjakan ini lagi.**
- Ukuran halaman dan paginasi mengikuti `rendering-architecture.md` §4.
- Urutan section persis mengikuti `viewModel.sections` (FR-007).

**Non-goals**

- Tidak ada ekspor PDF terprogram (ADR-0007 → dialog cetak).
- Tidak ada `@react-pdf/renderer` di bundle runtime.
- Tidak ada kontrol paginasi tingkat lanjut (F-F2, P1 — boleh ditunda).
- Tidak ada tema/warna kustom di ATS.

**Acceptance criteria**

- [x] Output render **tidak mengandung** `<img>` meski `photo.enabled: true` di dokumen sumber.
- [x] Urutan section persis sama dengan `sectionOrder`.
- [x] Section kosong menghasilkan **nol heading** (FR-006).
- [x] Tidak ada `<table>` di struktur inti (FR-005).
- [x] Nama tampil mixed-case, bukan uppercase.
- [x] Struktur HTML rata/sederhana — tidak ada nesting dekoratif berlebihan.
- [x] `renderToStaticMarkup` dapat dipakai untuk snapshot test **tanpa DOM** (JSON-LD/string test).
- [x] Regresi visual baseline tersimpan untuk semua fixture valid. *(baseline = snapshot markup deterministik per fixture; baseline screenshot piksel menyusul di Task 11/12 — keputusan tercatat di visual-regression-plan.md §3)*
- [x] **Uji ekstraksi teks**: cetak ke PDF di CI (Chromium Linux) lalu ekstrak — nama, kontak, heading, tanggal, `3.52 / 4.00`, dan seluruh highlights pulih lengkap dan berurutan (`ats-test-plan.md`). *(ternyata `page.pdf()` juga bekerja di Chromium Windows lokal — gerbang berlaku di keduanya; Firefox skip karena kapabilitas browser)*
- [x] Mode ATS *tidak* bisa menampilkan foto meski template dimodifikasi — dibuktikan test yang gagal jika `<img>` muncul.

**Edge cases**

- Teks sangat panjang → wrap tanpa scroll horizontal; `break-inside` mencegah item terpotong di tengah.
- Bullet sangat banyak → paginasi wajar, tidak ada konten hilang.
- Heading dengan satu item saja → tetap tampil, tanpa spasi ganjil.
- Karakter Indonesia (é, akronim, en dash, `+62`) pulih benar saat ekstraksi.
- `highlights` kosong → tidak ada bullet kosong.

**Files**

- `src/render/ats/ATSRenderer.tsx`
- `src/render/ats/sections/*.tsx`
- `src/render/ats/print.css`
- `src/render/ats/ATSRenderer.test.tsx` (assertion struktural + snapshot)
- `e2e/ats-print.spec.ts` (cetak → ekstraksi teks, Chromium di CI)

> **Batas modul:** `src/render/` **tidak boleh** mengimpor `src/storage/`. Foto tidak relevan di ATS; untuk Creative, resolver foto disuntikkan sebagai prop dari `features/`.

---

## Task 11 — Renderer Creative (1 template)

**Requirement:** FR-001, FR-303, NFR-007
**Context:** ADR-0004, `rendering-architecture.md` §2, D17

**Goal:** Versi visual dari data yang sama — boleh berfoto dan dua kolom, tetapi teksnya tetap dapat diseleksi dan dibaca.

**Requirements**

- `CreativeRenderer` mengonsumsi **hanya** `CreativeViewModel`.
- Satu template: `default` (dua kolom: sidebar kiri untuk foto/kontak/keahlian, kolom utama untuk ringkasan/pengalaman/pendidikan).
- Foto dirender melalui **resolver yang disuntikkan** (`resolvePhotoUrl(assetRef) => string | undefined`), bukan dengan membaca IndexedDB di dalam `render/`.
- Aksen warna dari token OKLCH yang sudah ada di `src/index.css` — tanpa warna hardcoded baru di luar token.
- Ikon sebagai **pelengkap** teks, bukan pengganti (selalu ada label teks).
- Teks tetap dapat diekstraksi saat dicetak (FR-303) — hindari `background-image` untuk teks, hindari rasterisasi.
- Urutan section mengikuti view model.

**Non-goals**

- Tidak ada template kedua di Fase 1 (D17).
- Tidak ada pemilihan tema (F-D6, P2).
- Tidak ada pembanding berdampingan (F-D5, P2).

**Acceptance criteria**

- [x] Foto dirender bila `photo` ada di view model; tidak dirender bila tidak ada. *(test node: resolver → img+alt; resolver undefined → placeholder; tanpa photo → tanpa slot; jalur blob nyata di e2e via seed IndexedDB)*
- [x] Tanpa foto, layout tetap seimbang (tidak ada kolom kosong ganjil). *(sidebar tidak dirender bila kosong; foto gagal muat → placeholder menjaga keseimbangan)*
- [x] Setiap ikon memiliki label teks yang setara. *(keputusan: template default TANPA ikon — AC terpenuhi vacuously; `<svg` masuk daftar terlarang checker sehingga ikon masa depan butuh keputusan sadar)*
- [x] Teks terekstraksi lengkap saat dicetak (uji yang sama seperti ATS). *(e2e `creative-print.spec.ts`: semua baris pratinjau pulih berurutan dari PDF, Chromium)*
- [x] Baseline regresi visual tersimpan. *(3 snapshot markup per fixture — keputusan yang sama dengan Task 10; screenshot piksel menyusul satu siklus baseline Linux di CI)*
- [x] Tidak ada warna di luar token tema. *(gate stylesheet: tolak hex/rgb/hsl/oklch literal, wajib var(--token))*
- [x] `render/` lulus pemeriksaan batas modul (tidak mengimpor `storage/`). *(resolver foto disuntikkan di PreviewGate; `check:boundaries` hijau)*

**Edge cases**

- Nama/headline sangat panjang → tidak mendorong foto keluar halaman.
- Foto rasio ekstrem → `object-fit: cover` dengan bingkai tetap.
- Section sangat banyak → paginasi wajar.
- Kegagalan memuat blob foto → placeholder netral, teks tidak terpengaruh.
- `highlights` panjang di kolom sempit → wrap, tidak memotong.

**Files**

- `src/render/creative/CreativeRenderer.tsx`
- `src/render/creative/templates/default/TemplateDefault.tsx`
- `src/render/creative/templates/default/styles.module.css`
- `src/render/creative/CreativeRenderer.test.tsx`
- `e2e/creative-print.spec.ts`

---

# Milestone 1.5 — Dual-Engine UX

## Task 12 — Toggle Mode + Preview Pane

**Requirement:** FR-003, FR-008, FR-002, J3
**Context:** ADR-0004, `state-management.md` §5, `accessibility-plan.md` §2

**Goal:** Fitur pembeda produk. Satu klik mengubah keluaran dari ATS ke Creative tanpa menyentuh data, dan pengguna **memahami mengapa** sesuatu berubah.

**Requirements**

- `ModeToggle`: segmented control ATS ↔ Creative, dapat dioperasikan keyboard, perubahan **diumumkan** ke pembaca layar (`aria-live` atau `role="status"`).
- `PreviewPane`: menampilkan renderer sesuai mode aktif; di desktop berdampingan dengan form, di mobile melalui tab Form/Pratinjau.
- Pratinjau memakai `selectATSViewModel` / `selectCreativeViewModel` — **tidak** memanggil `normalize()` langsung di komponen.
- `PhotoNotice`: saat berpindah ke ATS dan dokumen punya foto, tampilkan penjelasan sekali per sesi (dismissable) dengan teks dari `src/content/microcopy/id.ts`.
- Perubahan mode **tidak menandai draft kotor sebagai perubahan data** — hanya `meta.mode` yang berubah.
- Pratinjau bekerja offline.
- Untuk Creative, `features/` menyuntikkan `resolvePhotoUrl` (objek URL dari Blob melalui `loadAsset`) ke `CreativeRenderer`.

**Non-goals**

- Tidak ada pembanding berdampingan dua mode sekaligus (F-D5, P2).
- Tidak ada pemilihan tema per mode (F-D6, P2).
- Tidak ada animasi yang mengabaikan `prefers-reduced-motion`.

**Acceptance criteria**

- [x] Toggle mengubah pratinjau tanpa flicker dan tanpa reload.
- [x] **Invariant diuji:** snapshot `JSON.stringify(document)` identik sebelum dan sesudah toggle (kecuali `meta.mode`).
- [x] `PhotoNotice` muncul saat beralih ke ATS dengan foto ada; tidak muncul dua kali dalam sesi yang sama setelah ditutup.
- [x] Perubahan mode diumumkan ke pembaca layar.
- [x] Berfungsi dengan jaringan dimatikan (e2e offline).
- [x] `prefers-reduced-motion` dihormati.
- [x] Fokus tidak hilang saat toggle digunakan dengan keyboard.

**Edge cases**

- Dokumen tanpa foto → `PhotoNotice` tidak muncul.
- Toggle cepat berulang → tidak ada state race; tidak ada render ganda yang terlihat.
- Mode tersimpan per draft: membuka draft lain memuat mode draft tersebut.
- Pratinjau di layar sempit → dapat digulir, tidak memotong konten.
- Foto gagal dimuat di Creative → placeholder netral + teks tetap utuh.

**Files**

- `src/features/preview/PreviewPane.tsx`
- `src/features/preview/ModeToggle.tsx`
- `src/features/preview/PhotoNotice.tsx`
- `src/features/preview/*.dom.test.tsx`
- `e2e/mode-switch.spec.ts`

---

# Milestone 1.6 — Output & Platform

## Task 14 — PDF Export Flow + PWA Service Worker

**Requirement:** FR-301, FR-304, NFR-001, NFR-003, NFR-012, NFR-009
**Context:** ADR-0007, `deployment-architecture.md`, `rendering-architecture.md` §5

**Pembenaran dependensi `vite-plugin-pwa` (per `dependency-policy.md`):**

- **Fungsi:** menghasilkan Workbox service worker + manifest dari konfigurasi Vite.
- **Kenapa bukan service worker manual:** strategi precaching/runtime caching punya banyak jebakan halus; bug di sini menyebabkan kegagalan offline yang sulit didiagnosis. Hand-written SW untuk precaching aset ber-hash adalah pekerjaan yang sudah terpecahkan.
- **Bundle:** hanya build-time; nol overhead runtime di luar SW itu sendiri.
- **Lisensi:** MIT. **Maintenance:** aktif.
- **Rencana jika ditinggalkan:** SW hasil generate adalah berkas biasa di `dist/`; dapat diganti SW manual tanpa mengubah kode aplikasi.

**Requirements**

**Ekspor PDF (D19)**
- `PrintButton` memanggil `window.print()` dengan stylesheet cetak mode aktif.
- `PrintInstructionsModal` berisi panduan Bahasa Indonesia singkat untuk menonaktifkan header/footer pada Chrome, Firefox, dan Safari.
- Instruksi hanya ditampilkan pada cetakan pertama (atau dapat dibuka kembali dari menu bantuan).
- Penamaan berkas disarankan: `CV-<SlugNama>-<mode>` (J5 — pola konkret ditetapkan saat implementasi, dicatat).

**PWA (D20)**
- `vite-plugin-pwa` dikonfigurasi di `vite.config.ts`.
- `public/manifest.webmanifest`: `name`/`short_name` `cv4every1`, `lang: "id"`, `display: standalone`, ikon 192 & 512 dibundel **lokal**.
- Precache app shell; offline penuh setelah kunjungan pertama.
- **Tanpa** runtime caching ke jaringan untuk data CV.
- Indikator status offline (F-G3).
- Permintaan `navigator.storage.persist()` pada pembuatan draft pertama (F-G4) — sudah ada di lapisan storage, tinggal memastikan permukaannya.

**Non-goals**

- Tidak ada generator PDF terprogram (ADR-0007).
- Tidak ada runtime caching pihak ketiga.
- Tidak ada analytics atau telemetry (C-T10).
- Tidak ada push notification.

**Acceptance criteria**

- [x] Kunjungan pertama memuat app shell; kunjungan berikutnya bekerja **offline sepenuhnya**. *(reload offline penuh dari precache SW — `e2e/offline.spec.ts`, Chromium + Firefox)*
- [x] E2E offline lulus untuk: isi form → simpan → reload offline → muat draft → toggle mode → cetak. *(idem; debounce autosave 2 s ditunggu eksplisit seperti preseden mode-switch)*
- [x] Tombol cetak membuka dialog cetak dengan ukuran kertas benar. *(dialog tak dapat diotomatisasi — stub `window.print()` membuktikan tombol mencapai API cetak pada mode aktif; ukuran kertas milik stylesheet `@page` A4 Task 10/11)*
- [x] Modal instruksi menjelaskan cara menonaktifkan header/footer untuk Chrome/Firefox/Safari. *(`PrintInstructionsModal`, diuji dom + e2e)*
- [x] **Verifikasi eksplisit:** tidak ada permintaan jaringan saat memakai fitur inti offline (network log kosong). *(kolektor off-origin di `offline.spec.ts`, kosong di Chromium + Firefox)*
- [x] Manifest valid dan aplikasi dapat dipasang. *(fetch + asersi field + ikon 200 di `offline.spec.ts`)*
- [x] Tidak ada skrip pihak ketiga dimuat saat runtime (NFR-009). *(idem; SW same-origin only by construction)*
- [x] Ikon dan manifest dilayani dari origin sendiri. *(asersi `src: /…` + fetch 200; ikon karya original, tanpa aset remote)*

**Edge cases**

- Service worker versi lama → strategi update yang tidak mengunci pengguna pada cache basi.
- Storage cache dibersihkan → pesan jelas, data draft di IndexedDB tetap utuh (cache ≠ data).
- Pengguna mengakses dari `file://` → SW tidak aktif; aplikasi tetap berfungsi (hanya tanpa offline).
- Cetak di Firefox: header/footer dikendalikan pengguna, bukan program — didokumentasikan.

**Files**

- `src/features/export/PrintButton.tsx`
- `src/features/export/PrintInstructionsModal.tsx`
- `src/features/offline/OfflineIndicator.tsx`
- `vite.config.ts`, `public/manifest.webmanifest`, `public/icons/*`
- `e2e/offline.spec.ts`

---

# Milestone 1.7 — Data Safety

## Task 15 — Delete All Data + Local Storage Notice

**Requirement:** FR-108, FR-109, FR-111, J9
**Context:** `local-storage-strategy.md` §1, §7, §9; `data-flow.md` DF-8

**Goal:** Pengguna — termasuk di perangkat bersama (lab kampus, warnet) — dapat menghapus seluruh jejaknya, dan tahu di mana datanya berada sejak awal.

**Requirements**

**Hapus semua data (J9, F-A6)**
- `wipeAllData()` (sudah ada) diperluas menjadi `src/storage/wipe.ts` yang menghapus **tiga** tempat:
  1. IndexedDB (`drafts`, `assets`, `meta`),
  2. `localStorage` (preferensi UI + `lastDraftId`),
  3. **Cache Storage** milik service worker.
- Alur: konfirmasi eksplisit → **tawarkan ekspor terlebih dahulu** → hapus → muat ulang.
- Mudah ditemukan, **tidak** tersembunyi di menu lanjutan.

**Peringatan penyimpanan lokal (F-A8, FR-109)**
- Teks **verbatim** dari `local-storage-strategy.md` §9 (tidak diparafrase):
  > "Data Anda tersimpan di peramban pada perangkat ini. Membersihkan data peramban, mode penyamaran, atau pembersihan otomatis dapat menghapus draft Anda. Gunakan Ekspor Draft untuk membuat salinan cadangan."
- Pemicu ditetapkan sadar: muncul setelah draft pertama berhasil disimpan; tetap dapat diakses dari footer/panel info.
- Untuk konteks perangkat bersama, dorongan ekspor dibuat lebih terlihat.

**Non-goals**

- Tidak ada akun, login, atau penghapusan sisi server (tidak ada server).
- Tidak ada undo untuk penghapusan — dikonfirmasi ganda dan ekspor ditawarkan lebih dulu.

**Acceptance criteria**

- [x] Setelah wipe, reload menampilkan kondisi kosong sepenuhnya.
- [x] Test memverifikasi **ketiga** penyimpanan benar-benar kosong.
- [x] Ekspor ditawarkan **sebelum** penghapusan dan berfungsi.
- [x] Membatalkan dialog tidak menghapus apa pun.
- [x] Peringatan memakai teks **verbatim** dari dokumen.
- [x] Peringatan muncul pada saat yang tepat (setelah save pertama, bukan pada kunjungan kosong pertama).
- [x] Tidak ada klaim "data Anda sepenuhnya aman" (`glossary.md` §6).

**Edge cases**

- Wipe gagal sebagian (mis. Cache Storage tidak tersedia) → hapus yang bisa, laporkan jujur apa yang tersisa.
- Service worker masih mengontrol tab → penghapusan cache tidak boleh membuat shell putus.
- Beberapa tab terbuka → broadcast agar tab lain ikut ke kondisi kosong.
- Storage diblokir sejak awal → wipe tetap berjalan tanpa error.

**Files**

- `src/storage/wipe.ts`
- `src/features/settings/DataManagement.tsx`
- `src/features/settings/StorageNotice.tsx`
- `src/storage/wipe.test.ts`
- `e2e/wipe-data.spec.ts`

---

# Gerbang Keluar Fase 1

Fase 1 selesai ketika **semua** berikut benar (`roadmap.md` + `prd.md` §10):

- [x] Kriteria MVP di `prd.md` §10 terpenuhi
- [x] Seluruh alur inti lulus test **offline** (J1, J5, J6, J8, J9)
- [x] Ekstraksi teks PDF lulus untuk ATS **dan** Creative (`ats-test-plan.md`)
- [x] Round-trip impor/ekspor masih lulus untuk semua fixture
- [x] Migrasi tetap teruji dari semua versi yang didukung
- [x] Audit aksesibilitas otomatis lulus di seluruh permukaan baru
- [x] Walkthrough keyboard-only dilakukan dan dicatat
- [x] Anggaran performa terpenuhi dengan angka nyata (`performance-budget.md`)
- [x] `bun run verify` hijau; tidak ada test di-skip
- [x] Tidak ada secret, PII, atau data nyata di diff
- [x] Tidak ada frasa terlarang `glossary.md` §6 di copy baru
- [x] Changelog diperbarui dengan entri untuk Task 7–15

**Setelah gerbang ini: BERHENTI. Jangan masuk Fase 2 (AI) tanpa konfirmasi pengguna.**

---

# Risiko Fase 1 & Mitigasi

| Risiko | Dampak | Mitigasi |
| :-- | :-- | :-- |
| Paginasi CSS bervariasi lintas peramban | CV berbeda antar peramban | Uji visual regresi di CI (Chromium Linux); dokumentasikan variasi; terima sebagai trade-off MVP (ADR-0007) |
| UX dialog cetak kurang mulus | Pengguna bingung mencari "Simpan sebagai PDF" | Modal instruksi Bahasa Indonesia; tombol jelas; penamaan berkas disarankan |
| Divergensi dua renderer | Konten tidak konsisten antar mode | Rendering contract eksplisit + uji "konten sama di kedua mode, beda hanya foto/kolom/warna/ikon" (mitigasi ADR-0004) |
| React + Tailwind + Dexie + Zod melewati anggaran | Pengguna koneksi lambat terdampak | Ukur di Milestone 1.0 **sebelum** form dibangun; code splitting; jika gagal → pertimbangkan Preact (A-T4), **bukan** menaikkan anggaran |
| jsdom + RTL menambah waktu CI | CI lambat | Pisahkan env: `node` default, `jsdom` hanya `*.dom.test.tsx` |
| Form besar memicu re-render berlebihan | Ketikan lambat di ponsel kelas menengah | Selector granular Zustand; ukur dengan React Profiler sebelum menutup Task 9 |
| Foto besar menghabiskan kuota | Save gagal, pengguna panik | Kompresi agresif (D18) + pesan jujur + tawaran ekspor |
| `exactOptionalPropertyTypes` memaksa perbaikan luas | Milestone 1.0 melebar | Sudah dijadwalkan sebagai task tersendiri; **jangan** ditunda ke tengah Task 9 |
| CI belum ada saat bug masuk | Regresi tak terdeteksi | Task 7c **sebelum** Task 8 |
| Beban pemeliharaan satu orang | Proyek melambat | Dependensi minimal (D13, D14, D19 menolak yang bisa dihindari) |

---

# Struktur Direktori Fase 1

```text
src/
├── core/                     ✅ Fase 0 (diubah hanya untuk perbaikan strict)
├── storage/                  ✅ Fase 0 + [MODIFY] wipe.ts (Task 15)
├── render/                   ← Task 10, 11
│   ├── ats/                  ATSRenderer, sections/, print.css
│   └── creative/             CreativeRenderer, templates/default/
├── content/                  ← Task 13a
│   ├── microcopy/id.ts
│   └── action-verbs/{id.json, index.ts, action-verbs.test.ts}
├── features/                 ← Task 8, 9, 12, 13b, 14, 15
│   ├── store/                document-store, draft-store, ui-store, ai-store(inert), selectors, actions
│   ├── form/                 FormLayout, sections/, fields/, photo/, ActionVerbSuggestions
│   ├── preview/              PreviewPane, ModeToggle, PhotoNotice
│   ├── export/               PrintButton, PrintInstructionsModal
│   ├── offline/              OfflineIndicator
│   ├── settings/             DataManagement, StorageNotice
│   └── drafts/               DraftList / panel navigasi (D23)
├── components/ui/            ✅ shadcn primitives (tidak diubah)
├── lib/, hooks/              ✅
└── App.tsx                   [MODIFY] shell workspace: form + pratinjau + panel draft

scripts/
├── generate-json-schema.mjs  ✅ Fase 0
├── module-boundaries.mjs     ← Task 7b
├── check-boundaries.mjs      ← Task 7b
└── check-bundle-size.mjs     ← Task 7c

e2e/                          ← Task 7b, 10, 11, 12, 14, 15
├── smoke.spec.ts
├── ats-print.spec.ts
├── creative-print.spec.ts
├── mode-switch.spec.ts
├── offline.spec.ts
└── wipe-data.spec.ts

.github/workflows/ci.yml      ← Task 7c
playwright.config.ts          ← Task 7b
.prettierrc.json              ← Task 7a
```

---

# Definition of Done — per Task Fase 1

Mengikuti `AGENTS.md` §8. Untuk setiap task:

- [ ] Kriteria penerimaan terpenuhi
- [ ] Test ditambahkan dan lulus (sesuai jenis perubahan, `AGENTS.md` §6)
- [ ] `lint`, `format:check`, `typecheck`, `check:boundaries`, `test` lulus
- [ ] Build produksi lulus
- [ ] Anggaran performa masih terpenuhi
- [ ] Perilaku offline diverifikasi (jika relevan)
- [ ] Aksesibilitas diperiksa pada permukaan yang berubah
- [ ] Tinjauan privasi: tidak ada data keluar perangkat, tidak ada log berisi konten CV
- [ ] Tidak ada frasa terlarang (`glossary.md` §6) di copy baru
- [ ] Tidak ada secret/PII/data nyata di diff
- [ ] Dokumen/changelog diperbarui
- [ ] ADR ditambahkan jika ada keputusan arsitektural (tabel di bawah)

## ADR yang mungkin diperlukan di Fase 1

| Pemicu | Perlu ADR? |
| :-- | :-- |
| Memilih Zustand sebagai library state | Tidak — sudah diusulkan di `architecture-overview.md` §3; cukup pembenaran dependensi + catatan changelog |
| Menambah `vite-plugin-pwa` | Tidak — pembenaran dependensi cukup |
| Menambah `@react-pdf/renderer` sebagai **runtime** | **YA** — akan supersede ADR-0007 |
| Mengubah bentuk `ResumeDocument` | **YA** + bump versi + migrasi + fixture |
| Menambahkan runtime caching ke jaringan | **YA** |
| Dependensi runtime di luar Zustand/PWA | **YA** atau minimal pembenaran tertulis |

---

# Yang Sengaja Ditunda dari Fase 1

| Item | Alasan | Fase |
| :-- | :-- | :-- |
| Semua fitur AI | Fase 2 | 2 |
| Undo/redo | D5 | pasca-MVP |
| Section kustom (F-B10) | P3 | — |
| Pembanding berdampingan dua mode (F-D5) | P2 | — |
| Pemilihan tema per mode (F-D6) | P2 | — |
| Ekspor DOCX (F-F4) | P3, tidak dijadwalkan | — |
| Ekspor cadangan penuh dengan foto base64 (F-A5, D3) | P1 — ditunda ke Fase 2 (keputusan gerbang 2026-09-22: paragraf MVP §10.1 hanya menuntut `.cv4e.json` sebagai cadangan; portabilitas assetRef butuh desain) | 2 |
| Locale Inggris (F-G5) | Q6; struktur disiapkan, UI ditunda | 3 |
| Mode gelap (F-G6) | P2 | — |
| Kontrol paginasi tingkat lanjut (F-F2) | P1 | 1/2 |
| OCR / impor CV (F-H5) | P2 | 3 |
| Analytics apa pun | C-T10 — dilarang permanen | — |

---

# Catatan Bahasa & Konvensi

Sesuai `AGENTS.md` §12:

- **Kode, identifier, tipe, nama berkas:** Bahasa Inggris.
- **Copy antarmuka:** Bahasa Indonesia lebih dulu; nada memandu, tidak menggurui.
- **`docs/**`:** Bahasa Indonesia.
- **Commit:** Conventional Commits — `feat(form):`, `fix(storage):`, `test(renderer):`, `docs(adr):`.

Contoh nada yang benar (`target-users.md` §6):

- Buruk: `Error: Foto tidak diperbolehkan.`
- Baik: `Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.`

---

# Ringkasan Urutan Pengerjaan

```text
Milestone 1.0  Task 7a → 7b → 7c     ← WAJIB DULU (rig test + strict + CI)
Milestone 1.1  Task 8                ← store + integrasi autosave
Milestone 1.2  Task 13a              ← katalog konten (data saja)
Milestone 1.3  Task 9 → 13b          ← form → saran kata kerja
Milestone 1.4  Task 10 → 11          ← ATS → Creative
Milestone 1.5  Task 12               ← dual-engine UX
Milestone 1.6  Task 14               ← cetak PDF + PWA
Milestone 1.7  Task 15               ← hapus data + peringatan
Gerbang         verifikasi + laporkan ← BERHENTI sebelum Fase 2
```

> **Aturan berhenti:** setiap milestone berakhir dengan laporan singkat (apa yang selesai, apa yang diuji, apa yang gagal, keputusan apa yang diperlukan) dan menunggu konfirmasi sebelum milestone berikutnya.

---

# Cara Memakai Dokumen Ini

1. Buka sesi baru dengan `cv4every1-prompt-fase-1.md` sebagai prompt awal.
2. Lampirkan `cv4every1-fase-1-mvp.md` (rencana) dan `cv4every1-changelog.md` (baseline) sebagai konteks.
3. Agen **wajib** membaca `AGENTS.md` §3 dan dokumen per-task, lalu mengonfirmasi D13–D24 sebelum menulis kode.
4. Setiap milestone berakhir dengan checkpoint laporan; jangan lanjut tanpa konfirmasi.
5. Setelah setiap task selesai, minta agen memperbarui `cv4every1-changelog.md`.