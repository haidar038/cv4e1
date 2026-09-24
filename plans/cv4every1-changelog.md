# Changelog â€” cv4every1

Catatan perubahan per fase. Ditulis agar sesi agen AI baru dapat memulai **tanpa menebak state repository**.

| Field | Value |
| :-- | :-- |
| Terakhir diperbarui | 2026-09-22 |
| Fase terakhir selesai | **Fase 1 -- Gerbang keluar: LULUS (2026-09-22)** |
| Fase berikutnya | **Fase 2 (AI opsional) -- menunggu kickoff maintainer** |
| Baseline test | 45 file test, 370 test lulus, e2e 54 lulus + 2 skip kapabilitas, tsc bersih (strict aktif) |
| Wall-clock unit test | ~60 s penuh (node Â±6 s Â· jsdom Â±50 s) |
| Package manager | Bun (`bun.lock` dikomit) |

> Konvensi penomoran task mengikuti `cv4every1-bootstrap-dan-spike-pdf.md` dan planning Fase 0. **Nomor task tidak pernah didaur ulang** (AGENTS.md Â§5).

---

## Fase âˆ’1 â€” Spike Risiko

**Status: SELESAI.**

| Item | Status | Bukti |
| :-- | :-- | :-- |
| S1 â€” Kesetiaan PDF | âœ… | `docs/adr/0007-pdf-export-pipeline.md` |
| Gerbang keluar: S1 lulus atau pipeline didesain ulang | âœ… | ADR-0007 â†’ **Opsi 4: HTML + Print CSS (Kandidat A)** |

### Keputusan ADR-0007 yang mengikat Fase 1

- PDF dihasilkan lewat **dialog cetak peramban** (`window.print()`), bukan generator PDF terprogram.
- **Satu codepath** untuk preview dan PDF â†’ apa yang dilihat pengguna adalah apa yang tercetak.
- **Nol dependensi PDF runtime.** `@react-pdf/renderer` tetap `devDependency` (artefak spike), tidak masuk bundle.
- Rasterisasi (html2canvas) **ditolak permanen** (C-T5).
- Kelemahan yang diterima: UX dialog cetak, header/footer peramban, variasi paginasi lintas peramban.
- Uji ekstraksi teks otomatis **harus di CI Linux container**, bukan mesin developer Windows (temuan spike).

---

## Fase 0 â€” Fondasi Data & Persistensi

**Status: SELESAI untuk jalur data. UTANG TEKNIS pada rig pengujian lanjutan (lihat di bawah).**

Gerbang keluar Fase 0: *data dapat disimpan, dimuat, diekspor, diimpor, dan dimigrasi, dengan test.*

| Item gerbang | Status | Bukti |
| :-- | :-- | :-- |
| Disimpan & dimuat | âœ… | `src/storage/repository.ts` Â· `repository.test.ts` |
| Autosave | âœ… | `src/storage/autosave.ts` (debounce 2s, flush on hide) |
| Beberapa draft | âœ… | `listDrafts()` terurut `updatedAt` desc |
| Diekspor & diimpor | âœ… | `src/storage/export-import.ts` Â· `export-import.test.ts` |
| Dimigrasi | âœ… | `src/core/migration.ts` Â· `migration.test.ts` |
| Dengan test | âœ… | 51 test lulus (6 file) |
| Rig pengujian final + CI + anggaran performa | âœ— | **Utang teknis â€” lihat di bawah** |

### Task 2 â€” Spike S1 (PDF)

Lihat Fase âˆ’1 di atas. Tidak ada artefak kode yang masuk `src/`.

### Task 3 â€” ResumeDocument Schema + Validasi (Zod)

**Requirement:** FR-001, NFR-006

| Berkas | Peran |
| :-- | :-- |
| `src/core/schema-parts.ts` | Sub-skema granular: `basics`, `sections`, `education`, `experience`, `projects`, `skills`, `certifications`, `gpa`, `link`, `photo`, `meta`, `partialDate` |
| `src/core/schema.ts` | Skema kanonik `resumeDocumentSchema`, tipe terinferensi, `validateResumeDocument()`, `createEmptyResumeDocument()` |
| `scripts/generate-json-schema.mjs` | Generator JSON Schema deterministik dari Zod |
| `schemas/resume.schema.json` | **Tergenerate** â€” jangan diedit manual |
| `fixtures/empty-document.json` | Dokumen minimal |
| `fixtures/full-document.json` | Dokumen lengkap (data fiktif) |
| `fixtures/unknown-fields.json` | Uji forward-compatibility |
| `src/core/schema.test.ts` | 9 test |

**Keputusan implementasi:**

- **D2 diterapkan:** field tak dikenal di root disimpan ke `_unknownFields` (bukan ditolak) â€” memenuhi kompatibilitas maju & "jangan pernah hilang data pengguna".
- `basics.name` **boleh string kosong** pada level persistence (draft parsial). Validasi "wajib diisi" digeser ke ekspor/cetak.
- Chaining Zod v4: `.regex()` **sebelum** `.default()`.
- Dependensi baru: `zod@4.6.5` (runtime), `zod-to-json-schema` (build-time).

Perintah: `bun run gen:schema` menghasilkan `schemas/resume.schema.json`.

### Task 4 â€” Normalisasi + View Model Derivation

**Requirement:** FR-001 s.d. FR-008

| Berkas | Peran |
| :-- | :-- |
| `src/core/view-models.ts` | Tipe display: `ATSViewModel`, `CreativeViewModel`, `*Display`, `OrderedSection`, `DateRangeDisplay`, `GpaDisplay` |
| `src/core/normalize-helpers.ts` | Formatter tanggal ID, status pendidikan, heading section, builder per-section |
| `src/core/normalize.ts` | **`toATSViewModel()`** dan **`toCreativeViewModel()`** â€” fungsi murni |
| `src/core/normalize.test.ts` | 19 test |

**Keputusan implementasi:**

- **Penegakan aturan mode bersifat struktural, bukan flag.** `ATSViewModel` **tidak memiliki field `photo`** sama sekali. Template tidak bisa meng-override karena datanya memang tidak ada (ADR-0004, AGENTS.md Â§2.15).
- `CreativeViewModel.photo` hanya terisi bila `enabled === true` **dan** `assetRef` ada.
- Section kosong **tidak pernah** masuk output (memenuhi FR-006 secara struktural).
- Urutan section mengikuti `sectionOrder` dokumen sumber; key tak dikenal diabaikan dengan aman.
- Format IPK kanonik `3.52 / 4.00` (localization-guide Â§3.1).
- Nama bulan Bahasa Indonesia; `current: true` â†’ "Sekarang".
- Dibuktikan murni oleh test: pemanggilan ganda identik, sumber tidak dimutasi.

### Task 5 â€” Adapter IndexedDB + Autosave + Draft Management

**Requirement:** FR-101 s.d. FR-111, NFR-013

| Berkas | Peran |
| :-- | :-- |
| `src/storage/db.ts` | Dexie, DB `cv4every1` v1 â€” stores `drafts` (`id, updatedAt`), `assets` (`ref`), `meta` (`key`) |
| `src/storage/repository.ts` | `saveDraft`, `loadDraft`, `listDrafts`, `deleteDraft`, `wipeAllData`, `saveAsset`, `loadAsset`, `deleteAsset` |
| `src/storage/autosave.ts` | `AutoSaveManager` â€” debounce 2s, flush on `visibilitychange`/`beforeunload` |
| `src/storage/sync.ts` | BroadcastChannel `cv4every1-sync` â€” `notifyTabs`, `onExternalUpdate` |
| `src/storage/errors.ts` | `StorageFullError`, `StorageBlockedError`, `InvalidDataError` |
| `src/storage/types.ts` | `DraftRecord`, `DraftSummary`, `AssetRecord`, `StorageStatus`, `AutoSaveCallbacks` |
| `src/storage/index.ts` | Barrel export API publik |
| `src/storage/repository.test.ts` | 9 test (dengan `fake-indexeddb`) |

**Keputusan implementasi:**

- **D1:** debounce 2000 ms; snapshot JSON mencegah write redundan.
- **D4:** BroadcastChannel, last-write-wins untuk MVP.
- **D10/D11:** nama DB dan desain object store sesuai keputusan.
- `loadDraft()` **memvalidasi ulang dengan Zod** saat dibaca â†’ mendeteksi korupsi lebih awal.
- `listDrafts()` mengembalikan ringkasan ringan, bukan dokumen penuh.
- `saveDraft()` menerjemahkan `QuotaExceededError` menjadi `StorageFullError`. State memori **tidak pernah** dibuang.
- Dependensi baru: `dexie@4.4.6` (runtime), `fake-indexeddb` (dev).

### Task 6 â€” Import/Export JSON + Migration Framework

**Requirement:** FR-104 s.d. FR-107, FR-110

| Berkas | Peran |
| :-- | :-- |
| `src/storage/export-import.ts` | `exportResume()`, `importResume()` |
| `src/storage/export-import-types.ts` | `ExportEnvelope`, `ImportError` + `ImportErrorReason` |
| `src/core/migration.ts` | `registerMigration()`, `migrateDocument()`, `clearMigrations()` |
| `src/storage/export-import.test.ts` | 8 test |
| `src/core/migration.test.ts` | 5 test |

**Keputusan implementasi:**

- Envelope final: `{ format, kind, formatVersion, exportedAt, data }` sesuai import-export-spec Â§3.
- `importResume()` **tidak pernah menyentuh state existing** sebelum validasi lolos (aturan import-export-spec Â§6).
- Error granular: `NOT_JSON`, `INVALID_ENVELOPE_STRUCTURE`, `WRONG_FORMAT_ID`, `UNSUPPORTED_KIND`, `SCHEMA_TOO_NEW`, `MIGRATION_FAILED`, `VALIDATION_FAILED`.
- Proteksi downgrade: versi lebih baru dari aplikasi ditolak dengan pesan membantu.
- Rantai migrasi berurutan + deteksi siklus + validasi setelah migrasi.
- **Belum diimplementasikan:** penyematan base64 foto untuk `kind: "backup"` (keputusan D3) â€” masih TODO di Task 6 lanjutan / Fase 1 (F-A5).

### Task 7a â€” Strict TypeScript + Prettier (closure verifikasi)

**Status: âœ… SELESAI (closure).** Verifikasi ulang 2026-09-19 membuktikan pekerjaan substansi
sudah ada di repo: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride` aktif di `tsconfig.app.json` **dan** `tsconfig.node.json`;
`.prettierrc.json` + `.prettierignore` + skrip `format`/`format:check` ada dan lulus.

Verifikasi: `typecheck` bersih Â· `format:check` lulus Â· `test` 7 file / 74 test lulus Â·
`check:boundaries` OK (87 files, 289 import specifiers) Â· `lint` 0 error / 26 warning
(warning hanya dari scaffold `src/components/ui`, bukan `core/`/`storage/`/`scripts/`).
Satu-satunya `as any` di `src/` ada di `src/storage/repository.test.ts:163` dengan komentar
penjelas (mock error path â€” diizinkan AGENTS.md Â§5). Tidak ada perubahan runtime.

---

## State Repository Terverifikasi (per 2026-09-19)

### Dependensi terpasang

| Paket | Versi | Jenis | Ditambahkan pada |
| :-- | :-- | :-- | :-- |
| `zod` | ^3.25.76 **dideklarasikan 2026-09-20** (sebelumnya dipakai tanpa deklarasi) | runtime | Task 3 |
| `dexie` | ^4.4.6 | runtime | Task 5 |
| `zod-to-json-schema` | ^3.25.2 | dev | Task 3 |
| `fake-indexeddb` | ^6.2.5 | dev | Task 5 |
| `vitest` | ^5.0.1 | dev | Task 1 |
| `playwright` | ^1.63.0 | dev | Task 1 |
| `@react-pdf/renderer` | ^4.9.0 | dev | Task 2 (spike, **bukan** runtime) |
| `oxlint` | ^1.81.0 | dev | Task 1 |
| `typescript` | ~6.0.2 | dev | Task 1 |
| `vite` | ^8.3.0 | dev | Task 1 |
| `@playwright/test` | 1.63.0 | dev | Task 7b |
| `jsdom` | ^30.1.0 | dev | Task 9 |
| `@testing-library/react` | ^16.3.3 | dev | Task 9 |
| `@testing-library/jest-dom` | ^7.0.1 | dev | Task 9 |
| `@testing-library/user-event` | ^14.6.7 | dev | Task 9 |
| `axe-core` | ^4.13.0 | dev | Task 9 |
| `zustand` | ^5.0.15 | runtime | Pra-Task 8 (D13, disetujui maintainer) |

**Dihapus 2026-09-20 (audit scaffold, lihat entri Pra-Task 8):** `recharts`, `embla-carousel-react`,
`cmdk`, `input-otp`, `react-day-picker`, `date-fns`, `react-resizable-panels`, `@shadcn/react`.

**Belum dipasang (dibutuhkan Fase 1):** `vite-plugin-pwa` (Task 14). `@axe-core/playwright` juga belum dipasang â€” audit aksesibilitas halaman penuh (kontras + `lang` + `title`, yang tidak dapat dinilai jsdom) dijadwalkan di Task 10/12. Seluruh dependensi test env jsdom sudah terpasang sejak Task 9.

### Skrip `package.json` saat ini

```text
dev               vite
build             tsc -b && vite build
lint              oxlint
format            prettier --write .
format:check      prettier --check .
typecheck         tsc -b --noEmit
check:boundaries  bun scripts/check-boundaries.ts
check:budget      bun scripts/check-bundle-size.ts   (ratchet +10%, D24)
test / test:unit  vitest run                       (kedua project)
test:unit:node    vitest run --project node        (jalur cepat lokal, Â±3 s)
test:unit:jsdom   vitest run --project jsdom
test:e2e          playwright test
verify            lint â†’ format:check â†’ typecheck â†’ check:boundaries â†’ test:unit â†’ build
gen:schema        bun scripts/generate-json-schema.mjs
preview           vite preview
```

**Semua skrip dan workflow CI sudah ada.** Eksekusi CI (bukti hijau di GitHub Actions) menunggu
`git init` dan push ke remote â€” keputusan maintainer.

### Struktur `src/` saat ini

```text
src/
â”œâ”€â”€ core/          âœ… TERISI â€” schema, view-models, normalize, migration + 4 test
â”œâ”€â”€ storage/       âœ… TERISI â€” db, repository, autosave, sync, export-import + 2 test
â”œâ”€â”€ render/        â¬œ kosong (README saja)          â† Task 10, 11
â”œâ”€â”€ ai/            â¬œ kosong (README saja)          â† Fase 2
â”œâ”€â”€ content/       âœ… TERISI â€” microcopy id + katalog 72 action verbs (Task 13a)
â”œâ”€â”€ features/      âœ… TERISI â€” store (Task 8), form + photo + drafts (Task 9)
â”œâ”€â”€ test/          âœ… setup jsdom + canvas double (Task 9)
â”œâ”€â”€ components/ui/ âœ… shadcn primitives (~62 berkas, dari scaffold â€” sudah diaudit)
â”œâ”€â”€ ui/            â¬œ README + button.tsx
â”œâ”€â”€ hooks/         use-mobile.ts
â”œâ”€â”€ lib/utils.ts   cn()
â”œâ”€â”€ App.tsx        âœ… shell minimal: DraftPanel + FormLayout (Task 9)
â””â”€â”€ index.css      âœ… token Tailwind v4 + fontsource
```

### Artefak lain

| Path | Isi |
| :-- | :-- |
| `fixtures/` | `empty-document.json`, `full-document.json`, `unknown-fields.json` |
| `schemas/` | `resume.schema.json` (tergenerate) |
| `docs/04-data/sample-resumes/` | `fresh-graduate-id.json` (sumber fixture `full-document`) |
| `plans/` | `cv4every1-bootstrap-dan-spike-pdf.md`, `cv4every1-changelog.md`, `cv4every1-fase-1-mvp.md`, `cv4every1-prompt-fase-1.md` |
| `experiments/pdf-spike/` | Artefak spike S1 (referensi ADR-0007) |

---

## Fase 1 â€” MVP

**Status: SEDANG BERJALAN.** Milestone 1.0 (Task 7a/7b/7c), 1.1 (Task 8), 1.2 (Task 13a), dan 1.3 (Task 9) selesai â€” lihat tabel progres di bawah. Rencana lengkap: `cv4every1-fase-1-mvp.md`.

Isi bagian ini **setelah setiap task Fase 1 selesai**, mengikuti format yang sama dengan Fase 0 di atas (Requirement, tabel berkas, keputusan implementasi, bukti test).

### Ringkasan progres Fase 1

| Task | Judul | Status |
| :-- | :-- | :-- |
| 7 | Testing Rig Final + CI Pipeline + Strict TS | âœ… selesai (7a+7b+7c; bukti CI menunggu remote) |
| 8 | State Management Store (Zustand) | âœ… selesai (2026-09-20) |
| 9 | Form UI â€” Guided Sections | âœ… selesai (2026-09-20) |
| 10 | Renderer ATS (HTML + Print CSS) | âœ… selesai (2026-09-21) |
| 11 | Renderer Creative (1 template) | âœ… selesai (2026-09-21) |
| 12 | Toggle Mode + Preview Pane | âœ… selesai (2026-09-21) |
| 13 | Action Verbs Catalog + Suggestions UI | â—‘ 13a âœ… (data, 2026-09-20) Â· 13b â¬œ (UI) |
| 14 | PDF Export Flow + PWA Service Worker | âœ… selesai (2026-09-21) |
| 15 | Delete All Data + Local Storage Notice | â¬œ belum |

**Gerbang keluar Fase 1:** kriteria `prd.md` Â§10 terpenuhi; seluruh alur inti lulus test offline.

### Log perubahan Fase 1

### Task 7b â€” Rig Pengujian (Playwright) + Boundary Checker

**Requirement:** NFR-005, NFR-007 (prasyarat rig test Fase 1)
**Status: âœ… SELESAI (2026-09-20).** Substansi rig â€” boundary checker, Playwright config, skrip agregat â€”
sudah ada di repo dari sesi sebelumnya tanpa catatan changelog. Sesi ini menutup bagian yang hilang
dan memverifikasi seluruh acceptance criteria Task 7b.

| Berkas | Peran |
| :-- | :-- |
| `e2e/smoke.spec.ts` | **Baru.** Smoke: shell termuat (`#root` berisi konten), nol console error/pageerror, judul `cv4e1` (assertion diganti saat Task 14) |
| `playwright.config.ts` | webServer kini `bun run build && bun run preview --host 127.0.0.1 â€¦` â€” build selalu segar, host dipaksa IPv4 agar cocok dengan `baseURL` |
| `tsconfig.node.json` | `e2e/` masuk cakupan `typecheck` â€” spec e2e tidak boleh lolos dari strict TS |
| `.gitignore` | Ditambah artefak test/coverage (`test-results`, `playwright-report`, `blob-report`, `coverage`, `playwright/.cache`) |
| `scripts/module-boundaries.ts`, `check-boundaries.ts`, `source-files.ts`, `module-boundaries.test.ts` | Sudah ada (substansi 7b sebelumnya): aturan `architecture-overview.md` Â§5 sebagai data, import relatif + `import type` tetap dihitung, test unit kasus lolos dan gagal |
| `vitest.config.ts` | Sudah ada: env `node` default (menegakkan `core/` tanpa DOM) |

**Keputusan implementasi:**

- Smoke spec sengaja shell-agnostik â€” tidak meng-assert teks "Hello World" â€” agar tetap hijau saat
  shell nyata menggantikannya di Task 8; perilaku fitur masuk spec tersendiri.
- Assertion judul memakai nilai scaffold `cv4e1` plus komentar penunjuk; **Task 14 wajib
  memperbaruinya bersama `index.html`**.
- Temuan Windows: `vite preview` tanpa `--host` mengikat `::1` (IPv6) saja, sehingga readiness check
  Playwright di `127.0.0.1` timeout 120 s. Diperbaiki dengan `--host 127.0.0.1`. Konsisten dengan
  temuan ADR-0007: kebenaran lintas-platform divalidasi di CI Linux (Task 7c).
- `e2e/` ditambahkan ke `tsconfig.node.json` (di luar daftar file rencana) agar spec tercakup
  `strict` â€” dilaporkan sebagai deviasi kecil yang menutup celah cakupan typecheck.
- Tanpa dependensi baru.

**Verifikasi:** `bun run verify` hijau (lint Â· format:check Â· typecheck Â· boundaries Â· 7 file / 74 test unit Â· build) Â·
`bun run test:e2e` **2 lulus (Chromium + Firefox)** Â· bundle produksi: JS 219,95 kB (gzip 68,74 kB),
CSS 198,13 kB (gzip 30,20 kB) â€” angka dasar untuk Task 7c.

### Task 7c â€” CI + Anggaran Performa

**Requirement:** NFR-008, NFR-012
**Status: âœ… SELESAI (2026-09-20).** Satu-satunya kriteria yang belum bisa dibuktikan adalah
"CI hijau pada commit terakhir" â€” repo belum git, sehingga workflow tervalidasi secara lokal
(YAML lolos prettier; setiap command di dalamnya adalah command yang lulus di mesin lokal).

| Berkas | Peran |
| :-- | :-- |
| `.github/workflows/ci.yml` | **Baru.** Job `verify` (setup-bun 1.3.14 â†’ cache `~/.bun/install/cache` â†’ `bun install --frozen-lockfile` â†’ lint â†’ format:check â†’ typecheck â†’ boundaries â†’ test:unit â†’ build â†’ check:budget) lalu job `e2e` (cache `~/.cache/ms-playwright`, `playwright install --with-deps chromium`, `bunx playwright test --project=chromium`). Tanpa secret (C-T2); runner Linux sesuai temuan ADR-0007. |
| `scripts/bundle-budget.ts` | **Baru.** Aturan anggaran sebagai data + fungsi murni: klasifikasi aset, `computeStats`, `evaluateBudget` (ratchet), `parseBaselineJson` (validasi input), `formatBytes`. Tanpa I/O â€” teruji tanpa DOM. |
| `scripts/check-bundle-size.ts` | **Baru.** Wrapper IO: jalan `dist/`, muat baseline, cetak tabel, exit 1 saat ratchet dilanggar; `--update` untuk re-baseline sadar. |
| `scripts/bundle-baseline.json` | **Baru.** Baseline terukur build pertama: jsGzip 68 749 B Â· cssGzip 30 205 B Â· fontsRaw 393 476 B Â· transferGzip 496 608 B. |
| `scripts/bundle-budget.test.ts` | **Baru.** 21 test unit: klasifikasi, agregasi, batas ratchet tepat +10% lulus / +10,1% gagal, toleransi kustom, baseline nol, validasi baseline malformed. |
| `package.json` | `verify` kini berakhir dengan `check:budget` (setelah build). |
| `vite.config.ts` | `__dirname` â†’ `import.meta.dirname` â€” warning deprecation configLoader native Vite 8 hilang dari log build. |
| `docs/07-quality/performance-budget.md` | Â§1 diisi angka tervalidasi + status per metrik; Â§2 gerbang bundle ditandai selesai; status dokumen naik ke v0.2. |

**Keputusan implementasi:**

- Skrip **`.ts`**, bukan `.mjs` seperti teks rencana/D24 â€” mengikuti konvensi repo
  (`check-boundaries.ts` juga `.ts` lewat Bun) dan `package.json` yang sudah menunjuk `.ts`,
  sehingga typecheck strict mencakupnya. Deviasi dilaporkan.
- **Dua lapis penegakan:** ratchet +10% dari baseline bersifat fatal (gerbang CI); anggaran
  absolut Â§1 hanya peringatan â€” build pertama memang sudah melebihi target CSS (30,2 > 30 KB),
  font (393,5 > 100 KB), dan transfer (496,6 > 400 KB). Utang terdokumentasi di Â§1; penyelesaiannya
  menurunkan ukuran (subset font, audit dependensi scaffold shadcn â€” usulan ke maintainer),
  bukan menaikkan anggaran (Â§5).
- Metrik ratchet: `jsGzip`, `cssGzip`, `fontsRaw`, `transferGzip` (estimasi transfer = gzip
  seluruh isi dist/).
- CI: action stabil (checkout v4, setup-bun v2, cache v4), Bun dipatok 1.3.14, e2e Chromium saja
  sesuai rencana Task 7c.

**Verifikasi:** `bun run verify` hijau (lint Â· format:check Â· typecheck Â· boundaries Â·
**8 file / 95 test unit** Â· build Â· check:budget OK) Â· `bun run test:e2e` 2 lulus
(Chromium + Firefox) Â· `bunx playwright test --project=chromium` (perintah persis CI) lulus.

### Pra-Task 8 â€” Penutupan gap gerbang + audit dependensi (2026-09-20)

**Status: âœ… SELESAI.** Bukan task dari rencana; rangkaian tindakan persiapan atas keputusan maintainer.
Repo kini sudah git (`origin: github.com/haidar038/cv4e1`, commit awal ter-push oleh maintainer).

| Aksi | Hasil |
| :-- | :-- |
| **Draf `prd.md` Â§10 (MVP definition)** | Ditulis sebagai **v0.1 â€” disetujui maintainer (2026-09-20)**: definisi satu paragraf, daftar periksa fitur per ID `feature-catalog.md`, dan daftar yang ditunda beserta alasannya. Gerbang Fase 1 kini punya kriteria yang dapat dinilai. |
| **ADR-0007 â†’ Accepted** | Status dinaikkan dari Proposed (perubahan satu baris; konten keputusan tidak diubah). Konvensi lisan "Proposed tapi diperlakukan mengikat" berakhir. |
| **Audit + trimming dependensi scaffold** | **8 paket runtime dihapus**: `recharts`, `embla-carousel-react`, `cmdk`, `input-otp`, `react-day-picker`, `date-fns` (tanpa pemakai sama sekali), `react-resizable-panels`, `@shadcn/react` â€” beserta 8 komponen `src/components/ui` yang menjadi satu-satunya pemakainya (chart, carousel, command, calendar, resizable, input-otp, message-scroller, questionnaire). Semua dapat dipulihkan lewat git. **Dipertahankan** (dipakai luas atau dirujuk rencana): `@base-ui/react`, `@phosphor-icons/react`, `class-variance-authority`, `cn`, `shadcn` (theme CSS di `index.css`), 2 `@fontsource-variable/*`, stack Tailwind, `react`, `react-dom`, `dexie`, `zod`. |
| **Efek ke anggaran** | CSS gzip **30,2 â†’ 27,1 KB (âˆ’10,4%) â€” utang CSS LUNAS**; JS tak berubah (komponen scaffold memang tak pernah masuk bundle). Baseline di-record ulang: jsGzip 68 749 B Â· cssGzip 27 064 B Â· fontsRaw 393 476 B Â· transferGzip 493 466 B â€” ratchet kini melindungi perbaikan. Sisa utang: font raw + transfer (subset font â†’ Task 10). |
| **`zustand@5.0.15` dipasang** | Persetujuan maintainer untuk Task 8 (D13). Pembenaran per `dependency-policy.md`: state global dengan subscription per-selector (form 40+ field); tidak di-hand-write karena selector-subscription yang benar itu rumit; **MIT, zero runtime dependency**, ~1,5 KB gzip saat terpakai (belum masuk bundle karena belum diimpor); dipelihara pmndrs, sangat aktif; jika ditinggalkan: store ditulis sebagai modul biasa `getState/setState/subscribe` (migrasi mekanis). |
| **Keputusan metrik lab/field** | LCP/TTI/CLS **ditunda sadar** ke tahap polish/persiapan performance testing (keputusan maintainer, 2026-09-20) â€” tercatat di `performance-budget.md` Â§1. |
| **Rumah subset font + interpretasi gerbang** | Subset font ditambahkan ke Requirements **Task 10** di `cv4every1-fase-1-mvp.md`; aturan interpretasi gerbang Fase 1 untuk anggaran bundle (JS/CSS wajib âœ…; font/transfer âœ… atau utang terjadwal) tercatat di `performance-budget.md` Â§1 â€” final di checkpoint gerbang. |
| **Drift dokumen** | `roadmap.md`: Fase 0 semua checkbox dicentang + gerbang ditandai LULUS; `docs/README.md`: "Enam ADR" â†’ "Tujuh ADR". |

**Verifikasi:** `bun run verify` hijau penuh (lint Â· format:check Â· typecheck Â· boundaries Â·
8 file / 95 test Â· build Â· check:budget OK, tanpa warning CSS) Â· `bun run test:e2e` 2 lulus
(Chromium + Firefox).

## Milestone 1.1 â€” Store Layer (Task 8)

### Task 8 â€” State Management Store (Zustand)

**Requirement:** FR-003, FR-102, FR-103, FR-108, NFR-005, NFR-013
**Status: âœ… SELESAI (2026-09-20).**

| Berkas | Peran |
| :-- | :-- |
| `src/features/store/document-store.ts` | `ResumeDocument` aktif + `draftId` + `dirty` + `lastSavedAt` + `externalNotice` (`zustand/vanilla`) |
| `src/features/store/draft-store.ts` | `DraftSummary[]` + `selectedId` |
| `src/features/store/ui-store.ts` | mode (mirror `meta.mode`), locale, panel terbuka, status autosave, pesan storage |
| `src/features/store/ai-store.ts` | Keranjang inert Fase 2 â€” kosong, tanpa logika, tidak dikonsumsi UI |
| `src/features/store/actions.ts` | Satu-satunya lapisan mutasi: lifecycle draft, edit section generik, `setMode`, multi-tab, wiring `AutoSaveManager` |
| `src/features/store/selectors.ts` | `selectATSViewModel`/`selectCreativeViewModel` memoized berbasis referensi dokumen |
| `src/features/store/store.test.ts` | 21 test: invariant mode, memoization, persist autosave, kuota penuh, storage diblokir, draft rusak, multi-tab (BroadcastChannel nyata), CRUD draft |

**Keputusan implementasi:**

- `zustand/vanilla` `createStore` â€” store murni tanpa React (kriteria "dapat diuji tanpa React",
  state-management Â§8); komponen nanti mengonsumsi via `useStore(store, selector)`.
- Semua mutasi dokumen lewat satu gerbang `applyDocumentUpdate`: validasi ulang sebelum commit
  (store hanya pernah memegang `ValidatedResumeDocument`), no-op terdeteksi dan diabaikan, lalu
  `autosave.registerChange(doc, draftId)`.
- `withMaterializedMeta`: default `meta` (locale/mode) dimaterialisasi di batas store supaya
  invariant "setMode hanya mengubah `meta.mode`" eksak â€” tanpa efek samping materialisasi
  `meta.locale` saat toggle pertama pada dokumen tanpa meta.
- `stableSnapshot`: pembanding konten agnostik terhadap urutan kunci â€” Zod menyusun ulang urutan
  kunci saat re-parse, sehingga `JSON.stringify` mentah menghasilkan no-op palsu.
- Aksi item section generik per `SectionKey` (add/update/remove/move, berbasis index â€” item skema
  tidak punya `id`); dua cast terdokumentasi menjembatani keterbatasan korelasi generik TypeScript
  (bukan `any`, dengan komentar alasan).
- `AutoSaveManager.onSuccess` â†’ set `draftId`/`lastSavedAt`, `notifyTabs('draft_updated')`,
  refresh `DraftStore` â€” menutup titik integrasi sync yang sebelumnya TODO di autosave.
- Multi-tab: `handleExternalMessage` (diekspor untuk test) + `initStoreSync` â€” update dari tab lain
  hanya menaikkan `externalNotice` (tanpa overwrite diam-diam, D4); penghapusan draft yang terbuka
  memindahkan tab ke kondisi kosong. Teruji lewat **BroadcastChannel kedua dengan nama yang sama**
  (integrasi nyata, bukan mock).
- Pesan storage Bahasa Indonesia nada D21: "Gagal menyimpan â€” ekspor manual disarankan." Â·
  "Mode privat: perubahan tidak tersimpan." Â· pesan draft rusak menjelaskan dan menenangkan.
- `zustand` belum masuk bundle (belum diimpor `App`) â€” anggota bundle tidak berubah.

**Acceptance criteria Task 8:** seluruh terpenuhi â€” action lifecycle/edit/order/mode terdefinisi;
invariant mode-switch teruji; selector memoized teruji; store tanpa React (env node); autosave
terpicu dan `DraftStore` diperbarui setelah save; `onExternalUpdate` non-blocking; `AIStore` ada
dan inert.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error Â· format âœ“ Â· typecheck âœ“ Â·
boundaries OK 86 file / 280 specifier Â· **9 file / 116 test unit** Â· build âœ“ Â· check:budget OK) Â·
`bun run test:e2e` 2 lulus (Chromium + Firefox).

## Milestone 1.2 â€” Content Foundation (Task 13a)

### Task 13a â€” Micro-copy ID + Action Verbs Catalog (data saja)

**Requirement:** FR-201, FR-202, FR-204, FR-205, FR-206
**Status: âœ… SELESAI (2026-09-20).** Tanpa UI â€” konsumen menyusul di Task 9 dan 13b.

| Berkas | Peran |
| :-- | :-- |
| `src/content/microcopy/id.ts` | Pak micro-copy Bahasa Indonesia bertipe (D15): IPK, 4 status pendidikan + contoh penulisan, peringatan foto ATS verbatim + tips pasfoto, kontak (+62/08, email, kota, LinkedIn), organisasi, panjang CV. `getMicrocopy(locale)` mengembalikan `null` untuk `en` (FR-204). |
| `src/content/microcopy/microcopy.test.ts` | **Di luar daftar file rencana** (dilaporkan): rumah uji frasa terlarang glossary Â§6 yang menyapu seluruh string modul konten + asersi verbatim/notifikasi foto. |
| `src/content/action-verbs/id.json` | Katalog statis **72 entri** (rentang rencana 60â€“100), 6 kategori, tiap entri `{ verb, category, applicableSections[], examplePhrase }` dengan pola `[placeholder]` (J4). |
| `src/content/action-verbs/index.ts` | Loader bertipe: `getAllVerbs`, `getVerbsForSection`, `getVerbCategories`. |
| `src/content/action-verbs/action-verbs.test.ts` | 7 test: bentuk entri, tanpa duplikat, cakupan kategori, filter per section, pola kalimat. |
| `tsconfig.app.json` | +`resolveJsonModule` (prasyarat impor JSON statis D16). |

**Keputusan implementasi:**

- Katalog hanya merujuk `experience`/`organizations`/`projects` â€” konsisten dengan Task 13b
  (tanpa saran di Education/Skills); `getVerbsForSection('skills' | 'education')` = `[]` teruji.
- Kategori **"Operasional"** (rencana Task 13a/D16) menggantikan "layanan" dari localization-guide
  Â§4 â€” deviasi kecil tercatat; rencana menang.
- Label `discontinued` = **"Berhenti"** (menutup TODO localization-guide Â§3.2, sesuai daftar
  rencana Task 13a); contoh penulisannya menonjolkan transparansi (jumlah sks selesai).
- **Batas modul `content/` â†’ nothing**: union kunci (section, status, locale) dimirror lokal dengan
  komentar rujukan ke `core/` â€” secara struktural identik sehingga konsumen `features/` dapat
  meneruskan nilai `core` langsung; konsistensi antar-union diuji di lapisan features (Task 9/13b).
  Bentuk katalog divalidasi runtime oleh test (content/ tidak boleh mengimpor zod).
- Tidak ada frasa terlarang glossary Â§6 â€” diuji dengan sapuan seluruh string modul konten.
- `content/` belum diimpor `App` â†’ anggota bundle tidak berubah.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error Â· format âœ“ Â· typecheck âœ“ Â·
boundaries OK 90 file / 286 specifier Â· **11 file / 132 test unit** Â· build âœ“ Â· check:budget OK) Â·
`bun run test:e2e` 2 lulus (Chromium + Firefox). Catatan kecil: commit Task 8 memuat perubahan
`tsconfig.json` dengan format yang belum memenuhi Prettier â€” diluruskan (format saja, isi sama).

## Milestone 1.3 â€” Form Terpandu (Task 9)

### Task 9 â€” Form UI: Guided Sections

**Requirement:** FR-101, FR-102, FR-201 s.d. FR-206, NFR-005, NFR-007, NFR-014
**Status: âœ… SELESAI (2026-09-20).** Form terpandu seluruh section terpasang di shell minimal
`App.tsx` (disetujui maintainer: mount sekarang, bukan menunggu shell penuh Task 12).

| Berkas | Peran |
| :-- | :-- |
| `src/features/form/FormLayout.tsx` | Shell form: nav accordion 7 section (satu terbuka, state `openPanel`), progres "Bagian X dari Y", empty state memandu + CTA, peringatan lunak panjang CV, saluran `storageMessage` (role=alert), skip link pratinjau (hanya saat `#cv-preview` ada â€” mekanisme untuk Task 12, tanpa link mati) |
| `src/features/form/sections/*.tsx` | 7 section: Basics (+links+foto), Education (status+contoh penulisan, GPA group), Experience & Organizations (editor item bersama â€” organisasi diperlakukan setara + guidance), Projects, Skills (grup berkategori), Certifications |
| `src/features/form/fields/*` | `FormField` (buffer + wiring aria), `PartialDateField`, `SelectField`, `StringListEditor`/`HighlightsEditor`, `GpaFieldGroup`, `LinkListEditor` |
| `src/features/form/photo/{PhotoUpload.tsx,compress.ts}` | Validasi tipe/2 MB, kompresi Canvas (WebP fallback JPEG, sisi terpanjang 800 px, step-down kualitas â‰¤500 KB), EXIF via `createImageBitmap` `imageOrientation:'from-image'` + fallback `<img>`, simpan Blob via `saveAsset` â†’ `assetRef`, hapus/ganti aset lama, notice ATS F-C3 verbatim |
| `src/features/form/{AutoSaveIndicator,SectionOrderControls,estimatePageCount,field-validation,useBufferedValue,useMicrocopy}.ts(x)` | Indikator D21 (Menyimpanâ€¦/Tersimpan; idle+`lastSavedAt` â†’ Tersimpan), reorder naik/turun D22, heuristik halaman murni, validasi field dari skema Zod core (bukan validator kedua), buffer ketik, hook micro-copy |
| `src/features/drafts/DraftPanel.tsx` | Panel draft D23 (mobile stack, desktop sidebar): baru, ganti nama (dialog), duplikat, hapus (konfirmasi), ekspor unduhan, impor berkas |
| `src/App.tsx` | Shell minimal: `initStoreSync` + `refreshDrafts` + pemulihan `cv4every1:lastDraftId` (localStorage, D14 â€” preferensi UI, bukan konten CV) |
| `src/content/microcopy/id.ts` | Perluasan aditif bertipe: `sections`, `employmentType`, `fields` (label + placeholder contoh nyata + hint), `actions`, `drafts`, `autosave` (D21), `importErrors` (7 reason), `emptyState`, `photoUpload`, `photoErrors`, `validation`, `progress`, `common`, `skip`, plus ekspor `microcopyStructural` |
| `src/features/store/actions.ts` + `store.test.ts` | **Baru:** `importDraftAction(json)` â€” `importResume` validate-first, disimpan sebagai draft BARU lalu dibuka; `ImportError.reason` dikembalikan ke UI (bukan diumumkan store); gagal storage â†’ `storageMessage` D21. `lastSavedAt` saat load ternyata sudah ada sejak Task 8 (`actions.ts:210`) â€” langkah rencana terpenuhi tanpa perubahan |
| `vitest.config.ts`, `src/test/setup.dom.ts` | Dua project vitest: `node` (default, `core/` tetap tanpa DOM) + `jsdom` untuk `*.dom.test.tsx` dengan setup (fake-indexeddb **sebelum** rantai import Dexie, jest-dom, cleanup RTL) â€” sesuai keputusan Task 7b |
| Test baru (13 berkas) | 7 section + FormLayout + FormField + PhotoUpload + AutoSaveIndicator + BasicsForm + DraftPanel (`.dom.test.tsx`) + 4 murni (field-validation, compress, estimatePageCount, section-keys) |

**Keputusan implementasi:**

- **Buffer ketik per field (krusial):** `applyDocumentUpdate` menolak patch yang gagal Zod, sehingga
  email setengah-ketik (`budi@`), skala `3.`, dan tanggal `2021-` akan membuat controlled input macet.
  Pola terpilih: nilai **valid** di-commit per ketikan (autosave tidak pernah tertinggal); nilai
  invalid intermediate tinggal di state lokal dan errornya baru muncul saat blur (`role=alert` +
  `aria-describedby`). Penyederhanaan dari rencana: registry flush `visibilitychange` **tidak
  diperlukan** â€” semua nilai yang bisa di-commit memang sudah ter-commit per ketikan; nilai invalid
  memang tidak dapat masuk dokumen.
- **Adopsi perubahan store lewat render-adjust** (pola resmi React), bukan effect:
  `useBufferedValue`, `StringListEditor`, dan `LinkListEditor` membandingkan kunci proyeksi
  ter-commit; baris kosong yang sedang diketik tidak hilang, perubahan dari tab lain tetap diadopsi.
  Tanpa ref-during-render.
- **FR-204:** `getMicrocopy('en')` tetap `null` (test Task 13a utuh); UI memakai
  `microcopyStructural` â€” label struktural tetap ada (a11y), micro-copy domain Indonesia (IPK, +62,
  foto, panjang CV, contoh status) di-blank sampai pack EN Fase 3. Teruji: locale `en` menyembunyikan
  guidance tanpa merusak label.
- **Heuristik panjang CV (F-C6):** `estimateCvPages` murni dengan ambang terdokumentasi
  (3000 karakter/halaman + 80 per heading item) â€” diuji di batas 2 halaman; disempurnakan bila
  Task 12 memberi paginasi nyata. Bukan skor CV (sweep frasa terlarang otomatis mencakup string baru).
- **Reorder section:** tombol naik/turun (D22) menulis `sectionOrder`; `normalizeOrder` menghormati
  urutan tersimpan (bug pertama ditemukan test dan diperbaiki), kunci tak dikenal diabaikan.
- **Checkbox `current`:** base-ui Checkbox me-render `role=checkbox` pada span (bukan elemen
  labelable), sehingga nama aksesibel via `aria-label` yang identik dengan teks terlihat
  (WCAG 2.5.3 Label in Name); `current` aktif menonaktifkan tanggal selesai.
- **Impor:** gagal validasi tidak pernah menyentuh draft aktif (spec Â§6); pesan per-`reason` dari
  micro-copy; unduhan ekspor via Blob + anchor (`URL.createObjectURL` di-stub pada test jsdom).
- **Konsistensi union Task 13a ditutup** di lapisan features (`section-keys.test.ts`):
  `CatalogSectionKey` â‰¡ `SectionKey`, status pendidikan lengkap di micro-copy, pack struktural
  ter-blank dengan benar.
- **Re-baseline bundle sadar:** shell Hello World â†’ aplikasi nyata (form + primitif base-ui +
  `zustand/react` + konten) memompa JS gzip 68,7 â†’ 183,7 KB (+167%); ratchet D24 di-record ulang
  dengan justifikasi tertulis di `performance-budget.md` Â§1 (v0.4) â€” anggaran absolut **tidak**
  dinaikkan; sisa ruang 16,3 KB dan audit bundle/code-splitting dicatat sebagai keputusan checkpoint
  gerbang Fase 1.
- **Sisa warning lint pada kode baru: 1** (`FormLayout` SkipLink `set-state-in-effect`) â€” disengaja:
  cek `#cv-preview` pasca-mount untuk integrasi Task 12. Warning lain berasal dari scaffold dan satu
  temuan pre-existing di `actions.ts` (destructure `renameDraft`) yang tidak disentuh.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error Â· format âœ“ Â· typecheck âœ“ Â· boundaries OK Â·
**25 file / 219 test unit** Â· build âœ“ Â· check:budget OK) Â· `bun run test:e2e` 2 lulus
(Chromium + Firefox, shell nyata tanpa console error) Â· verifikasi browser nyata: 360 px tanpa
overflow horizontal (0 elemen melewati viewport), teks-zoom 200% tanpa overflow dan tetap berfungsi,
buat draft â†’ autosave "Tersimpan" â†’ reload â†’ draft dipulihkan (D14) dan indikator tetap "Tersimpan".

**Catatan jujur AC:** audit axe di jsdom melaporkan nol pelanggaran; color-contrast butuh layout
nyata sehingga tercatat "incomplete" â€” cakupan kontras penuh menyusul di audit e2e Task 10/12.
Test kompresi foto memakai stub canvas (jsdom tanpa canvas): batas/dimensi/step-down kualitas
terbukti oleh test murni, dan jalur simpan â†’ `assets` â†’ `assetRef` terbukti oleh test integrasi;
Blob yang kembali dari `loadAsset` di jsdom dibatasi structured-clone (integritas Blob round-trip
sudah dibuktikan test repository di env node). Normalisasi EXIF (decode `from-image` + fallback)
tidak dapat diuji unit â€” mengandalkan API browser, terdokumentasi di kode. **Catatan ini ditutup sebagian di entri berikutnya (2026-09-20).**

---

## Penutupan Temuan Review Sebelum Task 13b (2026-09-20)

Bukan task rencana Fase 1: rangkaian tindak lanjut temuan review codebase, disetujui maintainer
sebagai prasyarat Task 13b. **Tanpa perubahan `ResumeDocument`, tanpa migrasi, tanpa ADR** â€” item
dependensi hanya *mendeklarasikan* paket yang sudah dipakai sejak Task 3 (preseden Zustand: cukup
pembenaran `dependency-policy.md` + catatan changelog).

### A â€” Deklarasi dependensi `zod` + `zod-to-json-schema`

**Temuan:** `src/core/schema.ts` dan `schema-parts.ts` mengimpor `zod`, `scripts/generate-json-schema.mjs`
mengimpor `zod-to-json-schema`, tetapi **keduanya tidak ada** di `package.json` maupun blok workspace
`bun.lock`. Zod yang benar-benar terpakai adalah **3.25.76**, ter-hoist dari devDependency `shadcn`
â€” sedangkan tabel dependensi di dokumen ini mengklaim `zod@^4.6.5`. Risikonya nyata: memangkas satu
paket scaffold (yang memang sudah dilakukan untuk 8 paket lain) akan mematahkan build, dan perilaku
build bergantung pada graf dependensi dev.

| Berkas | Perubahan |
| :-- | :-- |
| `package.json` | `zod ^3.25.76` (runtime) Â· `zod-to-json-schema ^3.25.2` (dev) |
| `bun.lock` | 2 baris pada blok workspace â€” dipastikan **nol** pergerakan versi paket lain |

**Verifikasi:** `bun install` â†’ diff lock tepat 2 baris (guardrail dipenuhi) Â· `bun install --frozen-lockfile`
lulus (paritas CI) Â· `bun pm ls zod` â†’ satu versi (`zod@3.25.76`) Â· `bun run gen:schema` â†’
`git diff schemas/` **kosong** (versi yang dideklarasikan menghasilkan JSON Schema identik) Â·
`bun run verify` hijau.

### B â€” Penutupan catatan jujur Task 9 (pipeline foto)

**Temuan 1 â€” sumber pesan jsdom.** Pesan `Not implemented: HTMLCanvasElement's getContext()`
(Â±1Ã— per berkas jsdom) dilacak dengan stack probe: berasal dari **axe-core**
(`_isIconLigature`, rule `color-contrast`), bukan dari kode produk. Penyebab identik dengan laporan
"color-contrast incomplete" â€” satu akar masalah.

**Temuan 2 â€” loop kompresi tidak teruji.** `compressPhoto` menyentuh canvas langsung, sehingga loop
step-down kualitas, keputusan WebPâ†’JPEG, dan jalur `PhotoCompressError` tidak punya test sama sekali.

| Berkas | Perubahan |
| :-- | :-- |
| `src/test/canvas-double.ts` | **Baru.** Context 2D deterministik untuk jsdom: `measureText` proporsional panjang teks dan `getImageData` berpola non-nol â€” sengaja, agar axe tidak mengklasifikasi setiap label sebagai "icon ligature" lalu melewatinya |
| `src/test/setup.dom.ts` | Memasang double (menggantikan probe) + reset per test |
| `src/features/form/photo/compress.ts` | Dipisah: `encodeWithinBudget()` murni tanpa DOM + adapter `compressPhoto(blob, deps?)` dengan seam `decode`/`createCanvas`/`encode`/`supportsWebP` (default = implementasi peramban). Tanda tangan `compressPhoto(file)` di `PhotoUpload.tsx` **tidak berubah** |
| `src/features/form/photo/compress.test.ts` | +11 test (env `node`): urutan kualitas 0,9â†’0,5, hasil pertama yang cocok anggaran, target-vs-jaminan, WebP/JPEG, keberhasilan tidak dibuang saat percobaan berikutnya gagal, `PhotoCompressError` hanya saat semua gagal, dimensi canvas & `drawImage`, `getContext` null, kegagalan decode |
| `src/features/form/photo/PhotoUpload.dom.test.tsx` | Stub canvas lokal dihapus (memakai double terpusat) + asersi nyata: `drawImage` menerima `(0,0,800,600)` dari sumber 1200Ã—900 dan encoder dipanggil `('image/webp', 0.9)` |

**Perbaikan perilaku kecil yang disadari:** sebelumnya `compressPhoto` dapat membuang hasil encode
yang sudah berhasil bila percobaan berikutnya mengembalikan `null` (loop menimpa `output`). Sekarang
hasil terbaik dipertahankan dan error hanya dilempar bila **semua** percobaan gagal â€” sesuai maksud
yang sudah didokumentasikan di kode ("never drop the user's photo").

**Sisa keterbatasan (jujur, tidak diklaim selesai):** piksel nyata hasil kompresi tetap tidak
diverifikasi di jsdom â€” itu tetap milik verifikasi peramban nyata; normalisasi EXIF
(`createImageBitmap` + `imageOrientation: 'from-image'`) tetap hanya bisa diuji di peramban.
Axe `color-contrast` dan audit halaman penuh (`lang`, `title`) **tetap** ditunda ke Task 10/12.

### C â€” Rekonsiliasi tracking

- `plans/cv4every1-fase-1-mvp.md` frontmatter: `confirm-and-reconcile`, `harden-strict-and-tooling`,
  `ci-and-test-rig`, `store-layer`, `content-pillar` â†’ `completed` (sebelumnya `pending` padahal
  Task 7a/7b/7c/8/13a sudah selesai). Sisa `pending` = Task 10â€“15 + gerbang.
- Dokumen ini: klaim `zod@^4.6.5` dikoreksi; blok "Belum dipasang" disusutkan (sisa `vite-plugin-pwa`
  dan `@axe-core/playwright`); tabel dependensi diisi paket dev Task 9; kontradiksi "Fase 1 â€” BELUM
  DIMULAI" dihapus; blok struktur `src/` dan tabel skrip diperbarui.
- **Belum dikerjakan (keputusan maintainer):** `docs/02-requirements/traceability-matrix.md` masih
  outline (diisi saat gerbang Fase 1), dan drift kecil lain (peta repo `AGENTS.md` Â§15 yang menyebut
  `CHANGELOG.md` di root, path `fixtures/resumes/` di glossary, `index.html` masih `lang="en"` dengan
  title `cv4e1`) sengaja dibiarkan â€” `index.html` sudah tercatat sebagai kewajiban Task 14.

### D â€” Wall-clock suite unit test

Terukur di mesin pengembangan Windows 4 core (Bun 1.3.14, Vitest 5.0.1): project `jsdom` turun
**55,7â€“59,1 s â†’ 25,5â€“29,3 s** dan `bun run test:unit` **Â±91 s â†’ Â±27 s**, dengan jumlah test lulus
identik (59 jsdom Â· 230 total). Penawarnya `test.deps.optimizer.client` di `vitest.config.ts`:
dependensi klien berat dibundel sekali per run, sehingga porsi waktu "import" turun 61% â†’ 16%.
Skrip `test:unit:node` (Â±3 s) ditambahkan sebagai jalur cepat lokal; `test:unit` tetap menjalankan
kedua project dan tetap menjadi bagian `verify`/CI (**tidak ada test yang di-skip**). Angka, cara
mengukur ulang, batas yang diketahui, dan alasan menolak `isolate: false` dicatat di
`docs/07-quality/test-strategy.md` Â§7 (status naik ke v0.2).

### E â€” README

Root `README.md` yang masih template scaffold Vite diganti dokumentasi nyata (Inggris + bagian
Bahasa Indonesia sesuai `AGENTS.md` Â§12): apa/kenapa, daftar "yang bukan", status fase jujur
(renderer/PDF/PWA ditulis **direncanakan**, bukan selesai), batasan yang tidak bisa dinegosiasikan,
stack, quickstart Bun, tabel skrip, struktur repo, pintu masuk dokumen, alur kontribusi, dan
**lisensi belum ditentukan (Q1) + belum ada berkas `LICENSE`**.

### Verifikasi penutupan temuan

`bun run verify` hijau penuh â€” lint 0 error Â· format âœ“ Â· typecheck âœ“ Â· boundaries OK Â·
**25 file / 230 test unit** (Â±27 s) Â· build âœ“ Â· `check:budget` OK (jsGzip 184,4 KB / +0,4%; cssGzip
27,3 KB; ratchet +10% tetap aman â€” baseline di-record ulang kemudian saat subset font, lihat bagian
berikutnya) Â· `bun run test:e2e` 2 lulus (Chromium + Firefox) Â· pesan "Not implemented" pada output
jsdom: **0**.

---

## Tiga Item Lanjutan Sebelum Task 13b (2026-09-20)

Bukan task rencana Fase 1: tiga item lanjutan atas permintaan maintainer setelah review. Urutan
pengerjaan di dokumen ini: utang font â†’ harness a11y â†’ traceability matrix. **Tanpa perubahan
`ResumeDocument`, tanpa migrasi, tanpa ADR** (alasan tidak butuh ADR dicatat di tiap bagian).

### Utang anggaran font + transfer LUNAS (2026-09-20)

**Temuan:** `src/index.css` mengimpor entri paket `@fontsource-variable/roboto` dan
`@fontsource-variable/ibm-plex-sans`. Entri paket itu mendeklarasikan **semua** subset â€” cyrillic,
cyrillic-ext, greek, greek-ext, vietnamese, latin, latin-ext â€” sehingga build menyalin 12 berkas
woff2 (393,5 KB) padahal produk hanya menulis teks Latin. Target `performance-budget.md` Â§1 (â‰¤ 100 KB)
terlampaui hampir 4Ã—.

| Berkas | Perubahan |
| :-- | :-- |
| `src/index.css` | Impor paket diganti `@font-face` yang dideklarasikan sendiri untuk subset **Latin** saja (dari `files/*-latin-wght-normal.woff2` milik paket yang sama) â€” tetap dibundel lokal, **tanpa** CDN (NFR-015), `font-display: swap`, rentang bobot dipertahankan (Roboto `100 900`, IBM Plex `100 700`), `unicode-range` Latin disalin dari paket |
| `scripts/bundle-baseline.json` | Baseline di-record ulang agar ratchet +10% (D24) **melindungi** perbaikan, bukan melindungi ukuran lama |
| `docs/07-quality/performance-budget.md` | Â§1 angka baru + status âœ… Â· Â§3 checkbox subsetting/CDN/third-party ditutup dengan bukti Â· v0.5 |
| `plans/cv4every1-fase-1-mvp.md` | Requirement subset font pada Task 10 ditandai selesai lebih awal agar tidak dikerjakan dua kali |

**Hasil (build produksi, `bun run check:budget`):**

| Metrik | Sebelum | Sesudah | Perubahan | Anggaran |
| :-- | :-- | :-- | :-- | :-- |
| `fontsRaw` | 393,5 KB (12 berkas) | **88,8 KB** (2 berkas) | âˆ’77,4% | â‰¤ 100 KB âœ… |
| `transferGzip` | 608,6 KB | **302,7 KB** | âˆ’50,3% | â‰¤ 400 KB âœ… |
| `cssGzip` | 27,3 KB | **25,7 KB** | âˆ’6,0% | â‰¤ 30 KB âœ… |
| `jsGzip` | 183,7 KB | 184,4 KB | +0,4% | â‰¤ 200 KB âœ… (sisa 15,6 KB) |

**Trade-off yang diterima dan dicatat:** karakter di luar `U+0000-00FF` (mis. `Ã©` pada nama)
jatuh ke font sistem. `latin-ext` sengaja **tidak** dibundel: +30,9 KB untuk Plex sendiri, sementara
ruang anggaran tersisa Â±11 KB. Menambahkan subset berarti menaikkan anggaran lewat keputusan di
dokumen anggaran â€” bukan ditambahkan diam-diam.

**Verifikasi:** `bun run build` + `bun run check:budget` (ratchet hijau) Â· `bun run verify` penuh
hijau Â· `e2e/no-egress.spec.ts` membuktikan font tetap dilayani dari origin sendiri.

### Harness audit aksesibilitas halaman penuh (2026-09-20)

**Temuan yang ditutup:** audit axe di jsdom hanya bisa melaporkan `color-contrast` sebagai
"incomplete" (tanpa layout) dan tidak bisa menilai aturan tingkat halaman (`title`, `lang`, satu
`main`). `index.html` juga masih membawa sisa scaffold: `lang="en"` dan judul `cv4e1`.

| Berkas | Perubahan |
| :-- | :-- |
| `e2e/a11y.spec.ts` | **Baru.** Audit axe pada **build produksi**: (1) empty state, (2) form terpandu dengan draft terbuka pada viewport 360 px. Tag WCAG 2.0/2.1/2.2 A+AA. `title`, `lang="id"`, dan tepat satu `main` diasersi eksplisit; laporan pelanggaran diformat agar terbaca di log CI |
| `e2e/no-egress.spec.ts` | **Baru (bonus).** Mengamati jaringan browser selama alur inti (buat draft â†’ buka section): **nol** permintaan ke luar origin â€” bukti nyata untuk NFR-002/009/015, sesuatu yang tidak bisa diamati unit test |
| `index.html` | `lang="en"` â†’ `lang="id"` (antarmuka berbahasa Indonesia) dan `<title>cv4e1</title>` â†’ `cv4every1` |
| `e2e/smoke.spec.ts` | Asersi judul diperbarui â€” kewajiban "Task 14 wajib memperbarui" dari Task 7b kini terpenuhi lebih awal |
| `docs/07-quality/accessibility-plan.md` | v0.2: Â§3 kontras dan Â§5 pengujian otomatis ditutup dengan bukti; catatan struktur dokumen ditambahkan |
| `package.json`, `bun.lock` | devDependency `@axe-core/playwright@4.13.0` |

**Pengaman anti-lulus-semuu:** `expectNoViolations()` tidak hanya memeriksa `violations`, tetapi juga
memastikan axe benar-benar menjalankan rule dan bahwa `color-contrast` **dievaluasi** (bukan
`incomplete`). Tanpa itu, spec ini bisa hijau tanpa membuktikan apa pun â€” persis kegagalan yang
sedang diperbaiki.

**Pembenaran dependensi `@axe-core/playwright` (per `dependency-policy.md`):**

- **Fungsi:** menyuntikkan axe-core ke halaman Playwright dan menjalankan analisis pada layout nyata.
- **Kenapa bukan ditulis sendiri:** secara teknis bisa (~15 baris: `addScriptTag` sumber axe-core +
  `page.evaluate`). Yang dibeli dari wrapper ini adalah kebenaran pemeliharaan: penanganan iframe,
  aliran `run`/`finishRun`, dan keselarasan versi dengan axe-core â€” dipelihara Deque, penulis axe
  sendiri. Untuk alat audit yang hasilnya menentukan klaim WCAG produk, memakai jalur resminya lebih
  murah dipelihara daripada memelihara varian sendiri.
- **Bundle:** dev-only â€” **nol byte** di `dist/` (jsGzip tidak berubah: 184,4 KB).
- **Lisensi:** **MPL-2.0** (weak copyleft per-berkas). Ini **bukan kelas lisensi baru** di graf
  dependensi: `axe-core` sudah devDependency sejak Task 9 dan berlisensi sama. Karena tidak ada
  dependensi runtime baru dan tidak ada kelas lisensi baru, ADR tidak diperlukan (`AGENTS.md` Â§9) â€”
  bila maintainer menilai sebaliknya, keputusan ini dapat dinaikkan menjadi ADR tanpa mengubah kode.
- **Maintenance:** aktif, dipelihara Deque; versi dipatok 4.13.0 agar sejalan dengan `axe-core@4.13.0`.
- **Rencana jika ditinggalkan:** suntikkan sumber `axe-core` (tetap devDependency langsung) lewat
  `addScriptTag` + `page.evaluate`; spec tetap berjalan tanpa paket ini.

**Verifikasi:** `bun run test:e2e` **8 lulus** (Chromium + Firefox; sebelumnya 2) Â· `bun run verify`
hijau Â· audit kontras kini benar-benar dievaluasi di peramban nyata pada desktop **dan** 360 px tanpa
pelanggaran.

**Catatan Task 9 yang kini tertutup:** peringatan jujur "color-contrast butuh layout nyata, lengkap
di e2e Task 10/12" sudah **selesai lebih awal**; yang masih tersisa dari catatan itu hanyalah piksel
foto nyata dan normalisasi EXIF (tetap urusan peramban, didokumentasikan).

### Traceability matrix diisi dari bukti nyata (2026-09-20)

**Temuan:** `docs/02-requirements/traceability-matrix.md` masih outline v0.1 â€” 19 baris, semuanya â¬œ,
dan nama test-nya (`dual-renderer.spec.ts`, `ats-photo-hidden.spec.ts`, â€¦) belum ada di repository.
Dokumen itu justru membuat proyek tampak lebih kosong daripada kenyataannya, dan sebaliknya bisa
memancing tanda âœ… yang tidak berdasar.

| Berkas | Perubahan |
| :-- | :-- |
| `docs/02-requirements/traceability-matrix.md` | v0.2: **19 requirement âœ…** (FR-003/101â€“107/111/201â€“204 Â· NFR-005/007/008/009/012/015), **11 ðŸŸ¡** (terbukti di lapisan data/view model, renderer/UI belum), sisanya â¬œ dengan pemilik task yang eksplisit. Setiap baris âœ… menyebut **path test yang benar-benar ada**, plus celah yang harus ditutup dan cara memperbaruinya |

**Keputusan yang disadari:** kolom Acceptance Criteria **tidak** dicantumkan â€” `acceptance-criteria.md`
masih outline sehingga ID `AC-xxx-a` belum ditulis untuk hampir semua requirement. Menuliskannya
sekarang berarti mengarang kriteria yang belum disepakati (`AGENTS.md` Â§4); kolom itu masuk begitu
AC-nya ditulis.

**Yang sengaja tidak diklaim:** NFR-006 (tidak ada secret di build) dan NFR-011 (data CV tidak masuk
log) tetap â¬œ karena belum ada pemeriksaan otomatis â€” bukan ditandai âœ… karena "kelihatannya begitu".
NFR-014 (zoom 200%) tetap ðŸŸ¡: verifikasi manual di peramban sudah tercatat, test otomatisnya belum ada.**Verifikasi:** matrix hanya memuat requirement yang test-nya dijalankan `bun run verify`
(25 file / 230 test unit) atau `bun run test:e2e` (8 test, Chromium + Firefox) per 2026-09-20.

### Gerbang privasi otomatis, AC penuh, dan pipeline lazy (2026-09-20)

Tiga item susulan dari temuan review, satu commit per item. `bun run verify` hijau (26 file / 249 test
unit) Â· `bun run test:e2e` **8 lulus** Â· baseline bundle di-record ulang secara sadar.

**1 â€” Gerbang privasi otomatis NFR-006 + NFR-011 (`48de3ec`).** `scripts/privacy-rules.ts` (aturan murni,
13 test unit) + `scripts/check-privacy.ts` (CLI), masuk `verify` dan CI **setelah** build:

- **NFR-006:** seluruh `dist/` (.js/.mjs/.css/.html) dipindai pola kredensial (sk-, sk-ant-, AIza, ghp_,
  xox, AKIA, bearer, JWT, blok kunci privat, assignment ke kunci bernama secret). Kutipan pelanggaran
  **disensor** â€” laporan tidak boleh menjadi kebocoran yang dicegahnya. `dist/` kosong/hilang = gagal,
  supaya scan yang terlewat tidak lulus semu.
- **NFR-011:** setiap `console.*` di `src/` harus argumen pertamanya string literal yang persis ada di
  allowlist tertutup (3 pesan diagnostik infrastruktur yang memang ada hari ini). Interpolasi â€”
  variabel, template literal, penggabungan â€” selalu ditolak karena itulah saluran data resume menuju
  konsol. Berkas test dikecualikan (tidak pernah ikut bundle).
- Dokumen: `docs/06-security/privacy-and-data-handling.md` Â§5a baru.

**2 â€” AC Given/When/Then untuk seluruh FR/NFR (`a24df52`).** `acceptance-criteria.md` naik ke v0.2:
**66 AC** untuk FR-001â€¦FR-502 dan NFR-001â€¦NFR-015, termasuk jalur gagal (storage diblokir, kuota,
import malformed, timeout AI) dan invariant AI (grounding dites terhadap invariant, bukan string persis).
`traceability-matrix.md` naik ke v0.3: **kolom AC dikembalikan** sesuai janji di v0.2, dan NFR-006/
NFR-011 naik â¬œ â†’ âœ… dengan gerbang `check:privacy` sebagai bukti â€” janji privasi kini dijaga mesin,
bukan hanya disiplin. Dua celah checklist tertutup; sisanya (script CI matrix, pemetaan ADR, abuse case)
tetap terbuka dengan jujur.

**3 â€” Pipeline impor/ekspor lazy + metrik `initialJsGzip` (`ab61d2e`).**

- `src/storage/export-import-lazy.ts`: parsing envelope, rantai migrasi, dan satu salinan skema Zod
  kini dimuat lewat `import()` dinamis hanya saat aksi ekspor/impor diklik (`DraftPanel`,
  `importDraftAction`). Chunk `export-import` = **1,15 KB gzip** keluar dari JS awal. Kontrak sync
  lama tidak berubah; error `ImportError` tetap sama.
- **Yang jujur TIDAK keluar:** skema Zod utama + validator tetap di chunk awal karena autosave
  memvalidasi pada setiap ketikan â€” tumpukan inti memang selalu dibutuhkan. Renderer ATS/Creative
  (Task 10/11) adalah kelompok lazy berikutnya.
- **Metrik baru `initialJsGzip`:** anggaran 200 KB adalah anggaran *JS awal*, tetapi `jsGzip` lama
  menjumlahkan semua berkas JS di dist/. Metrik baru mengukur hanya JS yang direferensikan
  `dist/index.html`; ratchet kini menjaga keduanya secara independen. Baseline lama (4 metrik) ditolak
  dengan pesan actionable; baseline baru: `initialJsGzip` **184,1 KB / 200 KB** (sisa 15,9 KB),
  `jsGzip` 185,2 KB, `transferGzip` 303,6 KB (+0,9 KB karena chunk lazy ikut dihitung).
- Test anggaran bertambah: `entryJsFiles`, chunk lazy vs eager, baseline legacy ditolak.

---

## Fase 1 â€” Milestone 1.3

### Task 13b â€” Action Verbs Suggestions UI
**Requirement:** FR-205 (AC-205-a), FR-206 (AC-206-a), J4 â€” feature-catalog F-E1 s.d. F-E3
**Status: âœ… SELESAI (2026-09-21).** Panel saran kata kerja per section di samping setiap baris
bullet (Experience, Organizations, Projects); Education dan Skills tetap tanpa saran.

| Berkas | Peran |
| :-- | :-- |
| `src/features/form/fields/insertAtCursor.ts` + `.test.ts` | Pure function penyisipan posisi kursor (pola seam `compress.ts`, tanpa DOM, 11 test node): sisip di `selectionStart`, tak pernah menimpa/menghapus, spasi adaptif tanpa spasi menggantung, clamp posisi. |
| `src/features/form/fields/StringListEditor.tsx` (+ `.dom.test.tsx` baru) | Slot opsional `renderRowSlot` per baris (di antara input dan tombol hapus), ref input, glue sisip + restorasi fokus/karet via `requestAnimationFrame`; baris kini `flex-wrap` agar panel terbuka di baris sendiri. |
| `src/features/form/ActionVerbSuggestions.tsx` | Shell disclosure per baris: trigger ikon dengan nama aksesibel komposit (section + label + posisi â€” tak ambigu antar baris/section), Escape menutup dan mengembalikan fokus ke trigger. |
| `src/features/form/ActionVerbSuggestionsPanel.tsx` | Daftar `getVerbsForSection` dikelompokkan kategori statis (`getVerbCategories`, heading dari katalog â€” bukan hardcode); tiap verb = tombol (nama aksesibel = verb) dengan `examplePhrase` sebagai pola tampilan (J4 â€” bracket `[placeholder]` tidak pernah disisipkan); empty-state defensif bila katalog kosong. |
| `src/features/form/fields/HighlightsEditor.tsx` + `sections/{ExperienceForm,ProjectsForm}.tsx` | Pass-through slot; ExperienceItemEditor (experience + organizations) dan ProjectsForm mengisi slot; Education/Skills tidak. |
| `src/content/microcopy/id.ts` | Grup additif `actionVerbs` (`toggleLabel`, `hint`, `emptyState`) â€” tersapu test frasa terlarang otomatis. |
| `e2e/no-egress.spec.ts` (diperluas, tanpa spec duplikat) | Alur inti kini mencakup buka panel + sisip kata kerja; tetap **nol** permintaan di luar origin (AC-206-a). |
| `e2e/a11y.spec.ts` (+1 test mobile) | Audit axe panel terbuka di 360 px pada build produksi (color-contrast dievaluasi nyata) + panel tak keluar viewport. |
| Docs: plan AC âœ“, `traceability-matrix.md` (FR-205/FR-206 â†’ âœ…), `roadmap.md` âœ“, `performance-budget.md` | Checklist penutup dalam perubahan yang sama (AGENTS.md Â§5/Â§8). |

**Keputusan implementasi:**
- **Popover â†’ disclosure inline (revisi poin keputusan 1, berbasis angka):** varian popover
  (`components/ui/popover.tsx`, base-ui) terukur **+25,4 KB gzip** pada chunk awal â€” graf modul
  positioning/portal â€” dan membuat `check:budget` **RATCHET FAIL** (+13,8% > gerbang fatal +10%).
  Fallback lazy saja tidak menyelamatkan gerbang `jsGzip` (tetap > batas), dan re-baseline +25 KB
  bertentangan dengan peringatan utang JS. Panel kini disclosure inline (base-ui collapsible,
  tanpa portal/floating-ui): kedua gerbang hijau tanpa re-baseline, plus lebih aman di 360 px.
- **Anggaran JS (before/after):** `initialJsGzip` **184.078 â†’ 190.455 B** (+6,4 KB: katalog 72 entri
  Â±4 KB, graf collapsible, shell) â€” sisa ruang 9,5 KB dari 200 KB; `jsGzip` 185.228 â†’ 191.608 B
  (+3,4%); `transferGzip` 303,6 â†’ 310,0 KB. Baseline `scripts/bundle-baseline.json` **tidak** diubah
  (ratchet tetap hijau). Katalog dimuat eager â€” kelompok lazy berikutnya tetap renderer (Task 10/11).
- **Klik = aksi eksplisit (J4):** penyisipan lewat buffer baris `StringListEditor` yang sudah ada +
  `updateSectionItem`; string kata kerja selalu valid. `examplePhrase` hanya tampil sebagai pola.
- **Infra test:** `testTimeout` proyek jsdom dinaikkan 5 s â†’ 15 s (`vitest.config.ts`). Test
  pengetikan panjang (~3 s dalam isolasi) melampaui 5 s saat kontensi fork worker Windows sejak
  suite bertambah 3 berkas; test yang timeout meninggalkan operasi `user-event` yang memicu
  kaskade "multiple elements" pada test berikutnya. Tanpa perubahan assertion.
- Tanpa perubahan `ResumeDocument`, tanpa migrasi, tanpa ADR, tanpa dependensi baru, tanpa `console.*`
  (gerbang `check:privacy` lolos).

**Verifikasi:** `bun run verify` hijau penuh â€” 29 file / **276 test unit** (node 201 Â· jsdom 75) Â·
`bun run test:e2e` **10 lulus** (Chromium + Firefox; sebelumnya 8) Â· `check:budget` âœ… (+3,5% vs
baseline) Â· `check:privacy` âœ….

---

## Fase 1 â€” Milestone 1.4

### Task 10 â€” Renderer ATS (HTML + Print CSS)
**Requirement:** FR-002, FR-004, FR-005, FR-006, FR-007, FR-008, FR-301, FR-302, FR-304, NFR-015 â€”
ADR-0004/0007, rendering-architecture.md Â§2/Â§4, ats-test-plan.md
**Status: âœ… SELESAI (2026-09-21).** Satu halaman pratinjau sekaligus sumber PDF mode ATS dengan
teks yang pulih lengkap dan berurutan saat diekstraksi dari PDF.

| Berkas | Peran |
| :-- | :-- |
| `src/render/ats/ATSRenderer.tsx` | Renderer bodoh â€” satu-satunya prop `vm: ATSViewModel` (tanpa permukaan template/layout, bukti sisi-ATS FR-008); struktur semantik datar tanpa `<div>`; nama kosong tidak pernah menjadi `<h1>` kosong (kontrak rendering). |
| `src/render/ats/sections/*.tsx` | 5 komponen item (Education, Experience [juga organizations], Project, Skills, Certification); highlights selalu `<ul>`; tanggal/IPK/label sudah jadi dari view model. |
| `src/render/ats/print.css` | CSS namespaced `.cv-ats`: tampilan kertas di layar, `@page A4`, isolasi `@media print` (hanya dokumen terlihat), `break-inside: avoid` per item; **nol** grid/flex/column-count/float/text-transform â€” ditegakkan test. |
| `src/render/ats/structural.ts` + `expectations.ts` | Pure checker pelanggaran struktural + derivasi ekspektasi tampilan dari view model (sumber tunggal test node; metode spike: ekspektasi dari dokumen, bukan hardcode). |
| `src/render/ats/ATSRenderer.test.tsx` (**node, tanpa DOM**) | 15 test: tanpa img/table/svg/div meski sumber berfoto; urutan heading = view model; kosong = nol heading; D12 mixed-case; en dash/`+62`/`IPK: 3.52 / 4.00`/`Magang`/`Sekarang`; gerbang stylesheet; meta-test checker; **3 snapshot baseline markup dikomit**. |
| `src/core/normalize-helpers.ts` (+test) | `employmentType` kini diterjemahkan ke label tampilan (`Magang`, bukan `internship`) â€” melengkapi pola `STATUS_LABELS_ID`; aturan tampilan tetap di layer normalisasi (ADR-0004). |
| `src/features/preview/PreviewGate.tsx` (+dom test) | Gate `?preview=ats` sementara (Task 12 mengganti dengan PreviewPane): lazy chunk renderer, view model lewat `selectATSViewModel` memoized; SkipLink `#cv-preview` ikut aktif. |
| `e2e/ats-print.spec.ts` | 3 test: layout cetak + axe halaman pratinjau (2 browser); **ekstraksi PDF** via `page.pdf()` + `pdf-parse` â€” seluruh baris pratinjau pulih berurutan + sentinel `3.52 / 4.00`/`+62` (Chromium); nol permintaan off-origin sepanjang alur imporâ†’renderâ†’cetak. |
| `scripts/module-boundaries.ts` | `TEST_TOOLING` += `react-dom`, `node:fs`, `node:url` untuk test renderer node-project (produk tetap terjaga: build + ratchet menolak penyalahgunaan). |
| Docs: plan AC âœ“, matrix (FR-002/004/005/006/007/008/302 â†’ âœ…), roadmap âœ“, ats-test-plan Â§2 âœ“, visual-regression-plan (keputusan baseline), performance-budget | Checklist penutup dalam perubahan yang sama. |

**Keputusan implementasi:**
- **Renderer lahir lazy** sesuai rencana Â§3 budget: chunk `ATSRenderer` 2,4 KB gzip + CSS 0,5 KB
  terpisah; shell hanya bertambah +1,7 KB (`initialJsGzip` 190,5 â†’ **192,2 KB**, sisa 7,8 KB dari
  200 KB). Baseline JSON tidak di-record ulang â€” semua ratchet hijau.
- **Gate `?preview=ats`** (keputusan maintainer): renderer dijangkau e2e lewat region ber-gate
  query-param + draft terbuka; PreviewPane UX tetap milik Task 12. Task 12 menghapus gate ini.
- **Regresi visual = snapshot markup deterministik** (keputusan maintainer): baseline screenshot
  piksel menunggu satu siklus generate baseline Linux di CI (Task 11/12) â€” rasterisasi font
  berbeda antar-platform; tercatat di visual-regression-plan.md.
- **Impor envelope di e2e**: fixture mentah bukan format impor â€” spec membungkusnya persis
  seperti `exportResume` (envelope terkunci test FR-104/105/106).
- **Temuan vs spike:** `page.pdf()` **bekerja** di Chromium Windows lokal (timeout spike tidak
  terulang) â€” gerbang ekstraksi berjalan lokal dan CI Linux; Firefox melewatkan test PDF karena
  kapabilitas browser (bukan flake), layout+egress tetap diuji di Firefox.
- Tanpa perubahan `ResumeDocument`, tanpa ADR baru, tanpa dependensi baru
  (`@react-pdf/renderer` tetap devDep spike, tidak menyentuh bundle), tanpa `console.*`.

**Verifikasi:** `bun run verify` hijau penuh â€” 31 file / **296 test unit** Â· `check:boundaries`,
`check:privacy`, `check:budget` âœ… (initialJsGzip +4,4% Â· jsGzip +5,7% Â· cssGzip +2,3% Â·
transferGzip +3,7%) Â· `bun run test:e2e` **15 lulus + 1 skip kapabilitas** (Chromium + Firefox).

### Task 11 â€” Renderer Creative (1 template)
**Requirement:** FR-001 (AC-001-a,b), FR-303 (AC-303-a), FR-008 sisi Creative, NFR-007 â€”
ADR-0004/0007, rendering-architecture.md Â§2
**Status: âœ… SELESAI (2026-09-21).** Versi visual dua kolom dari data yang sama â€” berfoto dan
beraksen warna token â€” dengan teks yang tetap terekstraksi penuh dari PDF, ditutup test
divergensi lintas mode (AC-001-a).

| Berkas | Peran |
| :-- | :-- |
| `src/render/creative/CreativeRenderer.tsx` | Renderer bodoh â€” hanya `vm: CreativeViewModel` + `resolvePhotoUrl` yang disuntikkan (render/ bebas storage). |
| `src/render/creative/templates/default/TemplateDefault.tsx` + `styles.module.css` | Template `default`: flex dua kolom (sidebar foto/kontak/links/keahlian; utama nama/ringkasan/sisa section urut vm), CSS module ber-token OKLCH, DOM order = visual order, isolasi cetak `:global(body *)`, hook kelas stabil `cv-creative`. |
| `src/render/creative/sections/*.tsx` | 4 komponen item â€” komposisi string tampilan **identik dengan ATS** (`joinMeta`/`dateRangeText` dipakai ulang dari `../ats/sections/display`), hanya presentasinya berbeda. |
| `src/render/creative/structural.ts` + `expectations.ts` | Checker kreatif (aturan BERBEDA dari ATS: `<img>` boleh â€” maks 1 dengan alt; terlarang canvas/svg/table/iframe/object/embed) + derivasi ekspektasi urutan baca creative; helper murni diimpor dari ats/. |
| `src/render/creative/CreativeRenderer.test.tsx` (**node**) | 19 test: gate struktural 3 fixture; perilaku foto (resolver â†’ img+alt; undefined â†’ placeholder aria-hidden; tanpa photo â†’ tanpa slot; sidebar kosong tak dirender); heading tepat 1Ã— dengan KEAHLIAN di sidebar; urutan ekspektasi; **test divergensi AC-001-a** (set ATS âŠ† markup Creative dan sebaliknya); sentinel ID; gate stylesheet (token-only, tanpa background-image/text-transform, @page A4, break-inside, object-fit: cover, isolasi cetak); 3 snapshot baseline dikomit. |
| `src/features/preview/usePhotoResolver.ts` (+gate) | Seam foto: `loadAsset` â†’ `URL.createObjectURL` (revoke on cleanup); pasangan `{ref, url}` agar resolver menjawab undefined untuk ref yang tak dimuat. Gate `?preview=creative` lazy chunk kedua; resolver disuntikkan DI SINI (features/ boleh impor storage). |
| `e2e/creative-print.spec.ts` | 3 test: layout + struktur + axe `#cv-preview` + foto nyata via **seed PNG 1Ã—1 ke IndexedDB dari spec** (jalur penuh storageâ†’object URLâ†’imgâ†’PDF); ekstraksi PDF Chromium â€” semua baris pulih berurutan (pencocokan whitespace-insensitive karena URL panjang ter-wrap di sidebar sempit); jalur gagal-muat â†’ placeholder + nol egress. |

**Keputusan implementasi:**
- **Foto e2e dua jalur jujur:** seed via `kind:'backup'` gugur (penyematan aset F-A5 belum
  diimplementasikan); yang dipilih: seed raw IndexedDB (tanpa impor kode produk, gagal keras bila
  skema berubah) untuk jalur foto penuh, dan impor tanpa seed untuk edge case placeholder.
- **Tanpa ikon di template default:** nol perubahan boundaries (`render/` tetap hanya `react`),
  nol byte bundle; `<svg` masuk daftar terlarang checker sehingga ikon masa depan butuh keputusan
  sadar. AC "ikon berlabel teks" terpenuhi vacuously.
- **Aksen warna lewat permukaan, bukan teks berwarna:** token primary/muted berada di bawah
  ambang kontras AA pada ukuran teks CV, jadi warna dipakai di border/background (sidebar,
  garis heading) sementara teks tetap foreground â€” audit axe kontras lulus di peramban nyata.
- **Audit axe di-scope ke `#cv-preview`:** halaman gate sementara menyempitkan form sehingga
  tombol reorder form di luar dokumen terkena rule `target-size` â€” artefak gate yang digantikan
  PreviewPane Task 12; audit shell tetap milik `a11y.spec.ts`.
- **Keterbatasan jujur paginasi:** fragmentasi flex item saat print masih parsial di Chromium/
  Firefox â€” gate PDF membuktikan fixture Â±1 halaman pulih utuh; CV >1 halaman terdokumentasi
  di komentar template + visual-regression-plan sebagai keterbatasan MVP (fallback print-block
  ditolak: melanggar satu-codepath ADR-0007).
- **React 19 preload hoisting:** `renderToStaticMarkup` memunculkan `<link rel="preload">` untuk
  img â€” masuk `<head>`, di luar `#cv-preview`, URL `blob:` diabaikan test egress.
- Tanpa perubahan `ResumeDocument`, tanpa migrasi, tanpa ADR, tanpa dependensi baru, tanpa
  `console.*` (check:privacy lolos), tanpa perubahan `scripts/module-boundaries.ts`.
- Deviasi kecil diakui: aturan checker dipilih "alt wajib ada" (nilai = nama pemilik; draft tanpa
  nama â†’ foto dekoratif `alt=""`), bukan "alt non-kosong" di rencana â€” menghindari salinan
  hardcoded di render/ tanpa mengubah view model.

**Verifikasi:** `bun run verify` hijau penuh â€” 32 file / **319 test unit** Â· `check:boundaries`,
`check:privacy`, `check:budget` âœ… (initialJsGzip 192,7 KB Â· jsGzip 199,3/203,7 KB ratchet Â·
cssGzip 27,0/28,2 KB ratchet Â· transferGzip 319,0 KB) Â· `bun run test:e2e` **20 lulus + 2 skip
kapabilitas** (Chromium + Firefox). Ruang ratchet JS/CSS kini tipis â€” keputusan re-baseline
dicatat sebagai item checkpoint gerbang di `performance-budget.md` Â§1.

---

## Fase 1 â€” Milestone 1.5

### Task 12 â€” Toggle Mode + Preview Pane
**Requirement:** FR-003 (AC-003-a,b), FR-002 (AC-002-a), FR-008 (AC-008-a), J3 â€”
ADR-0004, state-management.md Â§5, accessibility-plan.md Â§2
**Status: âœ… SELESAI (2026-09-21).** Fitur pembeda produk: satu klik mengganti
mode ATSâ†”Creative tanpa reload dan tanpa menyentuh data, dengan penjelasan
kontekstual foto. Gate `?preview=ats|creative` dihapus; renderer tidak diubah.

| Berkas | Peran |
| :-- | :-- |
| `src/features/preview/ModeToggle.tsx` (+`.dom.test.tsx`, 6 test) | Segmented control radio native (keputusan sadar: bukan base-ui ToggleGroup â€” disiplin ukur warisan Task 13b); keyboard panah gratis, fokus tidak hilang, perubahan diumumkan ganda (native + `role="status"` explisit); mutasi hanya lewat `setMode()` |
| `src/features/preview/PhotoNotice.tsx` (+`.dom.test.tsx`, 5 test) | Notice dismissable `role="status"`: teks verbatim `photo.atsHiddenNotice` dipakai ulang (bukan ditulis ulang); "sekali per sesi" = flag in-memory `uiStore.photoNoticeDismissed` (umur tab, tanpa persistensi) |
| `src/features/preview/PreviewPane.tsx` (+`.dom.test.tsx`, 6 test) | Pane sesungguhnya: lazy chunk per renderer (pola gate), view model dari selector memoized, `usePhotoResolver` dipakai ulang, preload idle kedua chunk via `setTimeout` (bukan `requestIdleCallback` â€” jsdom-safe); toggle+notice di LUAR `#cv-preview` agar gerbang ekstraksi tetap dokumen-only; root = labelled region (axe `region`) |
| `src/App.tsx` (+`src/App.dom.test.tsx`, 2 test) | Workspace `max-w-7xl`: desktop berdampingan, mobile tab Form/Pratinjau (`role=tablist`, `aria-selected`, tanpa base-ui Tabs); kedua pane tetap ter-mount (`hidden` di mobile saja) |
| `src/features/form/FormLayout.tsx` (+test) | SkipLink unconditional saat draft terbuka â€” mekanisme Task 9 selesai; warning lint `set-state-in-effect` yang sengaja ditinggalkan kini hilang (24 warning, 0 error) |
| `src/features/store/{ui-store.ts,actions.ts}` + `test-utils.tsx` | Aditif: `photoNoticeDismissed` + `dismissPhotoNotice()` + reset test |
| `src/content/microcopy/id.ts` | Aditif bertipe: grup `preview` (+`modeLabel/atsMode/creativeMode/modeStatus/formTab/previewTab/formLabel/dismissNotice`) â€” struktural, lolos FR-204; tersapu test frasa terlarang otomatis |
| `e2e/mode-switch.spec.ts` | **Baru, 7 test:** tanpa reload (marker window) Â· invariant IndexedDB AC-003-a (kecuali `meta.mode` + metadata storage) Â· notice sekali per sesi Â· keyboard + SR + fokus Â· offline jujur (chunk dihangatkan dulu; SW menunggu Task 14) Â· reduced-motion Â· tab mobile 360 px |
| `e2e/ats-print.spec.ts` + `e2e/creative-print.spec.ts` | Helper dimigrasi dari gate ke UI nyata (tanpa query param; **nama file tidak berubah**); seed foto + `despace()` + axe ter-scope + skip Firefox dipertahankan |
| Docs: plan AC âœ“, frontmatter `dual-engine-ux` âœ“, matrix v0.5 (FR-002/003/008), roadmap âœ“, performance-budget v0.8, accessibility-plan, changelog | Checklist penutup dalam perubahan yang sama |

**Keputusan implementasi (6 poin planning, semua sesuai rencana yang disetujui):**

- **Native dulu:** radio-group + tombol `aria-selected` â€” eager shell hanya +1,1 KB (`initialJsGzip` 192,7 â†’ **193,8 KB**, sisa 6,2 KB); skenario eager-renderer (Â±5,3 KB) ditolak.
- **Tanpa flicker vs lazy:** lazy Ã—2 dipertahankan + preload idle + `Suspense` kosong tanpa animasi (reduced-motion by construction).
- **Sesi = umur tab** (in-memory); reload boleh memunculkan notice lagi â€” harmless untuk guidance.
- **Axe:** print spec tetap scope `#cv-preview`; `a11y.spec.ts` full-page lolos tanpa perubahan (layout baru tidak menyempitkan form sampai kena `target-size` â€” tombol `icon-xs` 24 px tepat di ambang, tanpa overlap).
- **Offline jujur:** `setOffline` pasca-load membuktikan operasi lokal tanpa egress; offline-reload penuh + precache menunggu Task 14.
- **Temuan e2e yang diperbaiki jujur:** (1) `print:` cetak pada lebar kertas (<`lg`) membuat `hidden lg:block` menyembunyikan pratinjau â†’ PDF kosong â€” diperbaiki `print:block` (+`print:hidden` pada tab); (2) klik Playwright pada input `sr-only` diintersep span â€” spec mengklik label terlihat (perilaku pengguna nyata); (3) tunggu h1 ambigu antar mode â€” tunggu `.cv-creative`; (4) foto seed butuh reload agar resolver mengamati via jalur mount normal (perilaku D14).

**Verifikasi:** `bun run verify` hijau penuh â€” 35 file / **331 test unit** Â· `check:boundaries`,
`check:privacy`, `check:budget` âœ… (initialJsGzip 193,8 KB Â· jsGzip 200,4 KB (+8,2% ratchet, âš ï¸ peringatan advisory >200 KB) Â·
cssGzip 27,2 KB (+5,9%) Â· transferGzip 320,3 KB) Â· `bun run test:e2e` **34 lulus + 2 skip
kapabilitas** (Chromium + Firefox). Keputusan re-baseline/pemangkasan kini **wajib** di
checkpoint gerbang Fase 1 (sisa ratchet Â±3,3 KB JS / Â±1,0 KB CSS).

**Polish pasca-checkpoint (2026-09-21, review visual maintainer):** shell `max-w-7xl`
menjepit sidebar Creative (34% dari kolom Â±480 px) â€” shell kini full-width
(`max-w-none` + `xl:px-8`), form berhenti di `xl:max-w-135`, pratinjau satu-satunya
kolom tanpa cap sehingga dokumen mencapai cap 210mm-nya sendiri; di bawah `xl`
split tidak berubah. Tanpa logika baru, tanpa test baru â€” `verify` + `test:e2e`
penuh diulang hijau (34 + 2 skip), `check:budget` tetap âœ… (JS tak berubah;
cssGzip +6,0% â€” 3 utilitas baru). Verifikasi visual akhir milik maintainer
(dev server) karena repo tidak menyimpan baseline piksel.

## Fase 1 â€” Milestone 1.6

### Task 14 â€” PDF Export Flow + PWA Service Worker
**Requirement:** FR-301, FR-304, NFR-001, NFR-003, NFR-012, NFR-009 â€”
ADR-0007, deployment-architecture.md Â§4, local-storage-strategy.md Â§9 (teks Â§9 tetap milik Task 15)
**Status: âœ… SELESAI (2026-09-21).** Tombol cetak memanggil dialog cetak pada mode aktif
dengan panduan header/footer; service worker precache membuat reload offline penuh bekerja;
manifest + ikon lokal membuat aplikasi dapat dipasang â€” tanpa perubahan `ResumeDocument`,
tanpa migrasi, tanpa ADR.

| Berkas | Peran |
| :-- | :-- |
| `src/features/export/PrintButton.tsx` (+`.dom.test.tsx`, 4 test) | Tombol `window.print()` mode aktif + tombol bantuan; di LUAR `#cv-preview` |
| `src/features/export/PrintInstructionsModal.tsx` | Panduan ID Chrome/Firefox/Safari + saran `CV-<slug>-<mode>.pdf` (J5 = teks panduan â€” `window.print()` tak bisa memaksa nama berkas) + "jangan tampilkan lagi" |
| `src/features/export/{slug.ts,print-prefs.ts}` (+test) | `slugifyName` murni (diakritikâ†’ASCII, cap 40, fallback `tanpa-nama`) + flag `localStorage` `cv4every1:printHelpSeen` (preferensi UI, C-T7 aman) |
| `src/features/offline/OfflineIndicator.tsx` (+dom test) | `role="status"` F-G3: diam saat online, banner panduan saat event offline |
| `src/features/offline/register-sw.ts` (+test) | Predikat murni `shouldRegisterServiceWorker` (http(s) saja â€” `file://` jalan tanpa SW) + registrasi manual PROD-only |
| `src/storage/persist.ts` (+test) + `actions.ts` | `requestPersistentStorage()` best-effort saat draft pertama (F-G4); tak pernah throw, tak pernah blokir |
| `src/storage/index.ts` | Barrel: `requestPersistentStorage` |
| `src/pwa/sw.ts` | SW precache-only Cache-API Â±1 KB (lihat keputusan 2); tanpa runtime caching data CV; prune aset basi; navigasi â†’ fallback `index.html` |
| `vite.config.ts`, `src/main.tsx`, `index.html` | Plugin PWA (build-time) + registrasi terjaga + link manifest/theme-color |
| `public/manifest.webmanifest`, `public/icons/{icon.svg,icon-192.png,icon-512.png}` | Identitas D20 (`lang:"id"`, standalone); karya original, tanpa aset remote (C-T10); PNG deterministik via `scripts/generate-pwa-icons.ts` (nol dependensi) |
| `src/content/microcopy/id.ts` | Aditif bertipe: grup `print` + `offline` (guidance di-blank pada pack struktural FR-204; label tombol dipertahankan) |
| `src/features/preview/PreviewPane.tsx`, `src/App.tsx` | Mount tombol cetak (di luar dokumen) + indikator offline |
| `e2e/offline.spec.ts` | **Baru, 3 test Ã—2 browser:** manifest valid + ikon same-origin; alur offline penuh (isiâ†’autosaveâ†’reload offlineâ†’draftâ†’toggleâ†’cetak stub, network log kosong); hapus Cache Storage â†’ draft IndexedDB utuh |
| `e2e/a11y.spec.ts` (+1 test) | Audit axe permukaan baru (modal terbuka + banner offline) |
| Docs: plan AC âœ“, frontmatter `pdf-and-pwa` âœ“, matrix v0.6 (FR-301/304/NFR-001/003 â†’ âœ…; FR-302/303 tetap valid), roadmap âœ“, performance-budget v0.9, accessibility-plan v0.3 | Checklist penutup dalam perubahan yang sama |

**Pembenaran dependensi `vite-plugin-pwa@1.3.0` (per `dependency-policy.md`):**

- **Fungsi:** membangun worker precache + injeksi manifest URL ber-hash dari konfigurasi Vite.
- **Kenapa bukan SW tulisan-tangan penuh:** penamaan cache, pruning aset ber-hash, dan injeksi daftar precache adalah pekerjaan terpecahkan yang rawan bug halus bila ditulis manual â€” bug di sini = kegagalan offline yang sulit didiagnosis.
- **Bundle:** build-time (devDependency); ke `dist/` hanya `sw.js` Â±1 KB â€” nol overhead runtime di luar SW itu sendiri.
- **Lisensi:** **MIT** (bukan kelas lisensi baru). **Maintenance:** aktif (antfu). **Rencana jika ditinggalkan:** `sw.js` adalah berkas biasa â€” ganti dengan SW manual tanpa mengubah kode aplikasi.
- Karena D19/D20 sudah disetujui di rencana dan tidak ada kelas lisensi/runtime baru, ADR tidak diperlukan (tabel ADR Fase 1) â€” bila maintainer menilai sebaliknya, dapat dinaikkan tanpa mengubah kode.

**Keputusan implementasi (6 poin planning):**

1. **Ikon tanpa dep baru:** SVG monogram "CV" gambar-tangan + PNG 192/512 dari skrip Bun murni (`node:zlib`, CRC32 tulisan-tangan) â€” opsi "skrip + devDep rasterizer" gugur karena menambah dep untuk tugas sekali jalan. Lisensi: karya original.
2. **SW `injectManifest` minimal, bukan `generateSW` (deviasi sadar dari teks rencana):** runtime workbox Â±10 KB saja sudah menggagalkan ratchet jsGzip (sisa Â±3,3 KB). Worker Cache-API Â±1 KB: precache shell, prune cache asing + aset basi, klaim langsung (tak mengunci basi). Tanpa runtime caching â€” data CV di IndexedDB tak pernah jadi respons cache.
3. **Modal:** flag `localStorage` cetakan-pertama + reopen bantuan; slug J5 `CV-<slug>-<mode>.pdf` sebagai saran yang diketik pengguna (jujur: API cetak tak bisa memaksa nama).
4. **Klaim offline jujur:** reload offline PENUH (konteks Playwright per test), bukan potong-jaringan-tanpa-reload; yang tak diklaim: kunjungan-pertama-offline, lintas-restart, dialog cetak nyata (fidelitas konten milik print-spec Task 10/11).
5. **Axe:** permukaan baru lolos per komponen + halaman penuh; temuan baru = **aturan query live-region** (role+teks, bukan role+nama â€” kedua engine gagal mencocokkan nama dari konten live-region; lihat `OfflineIndicator.tsx` + accessibility-plan v0.3).
6. **`file://`:** predikat `shouldRegisterServiceWorker` teruji unit; app jalan tanpa SW di luar http(s).

**Temuan e2e yang diperbaiki jujur (3 bug uten, 2 bug spec, 1 bug harness):**

- **`Vary: Origin` vs `caches.match(request)`:** reload offline membuat `#root` kosong â€” precache penuh 17 entri dan halaman terkontrol, tetapi `match(request)` MISS untuk request dokumen (navigasi/skrip/style) karena server statis mengirim `Vary: Origin`, sementara request sintetis HIT. Dibuktikan lewat 4 probe (kontroler â†’ cache â†’ counter â†’ probe sintetik â†’ serve-check). Perbaikan: match berdasar URL string (semantik Workbox-precache) + komentar; kini reload offline hijau di kedua browser.
- **`context.setOffline()` tak memicu event online/offline** di harness ini: banner diuji lewat dispatch event nyata (kontrak komponen = "event offline â†’ banner"); pemblokiran request-nya tetap dibuktikan `offline.spec.ts`.
- **Nama pencocokan live-region** (di atas).
- **Spec:** accordion tertutup secara default (`openPanel: null`) â€” spec harus membuka "Data Diri" dulu; `'Tersimpan'` ganda butuh `.first()` + tunggu debounce 2 s eksplisit (preseden mode-switch) karena teksnya sudah terlihat sejak pembuatan draft; `expect` tak ada di `page.evaluate`; tab mobile `Pratinjau` tak ada di viewport desktop.
- Harness Windows: `tail`/`head` tak ada di PowerShell â€” pakai `Select-String`/`Get-Content`.

**Anggaran (before/after, tanpa re-baseline):** `initialJsGzip` 193,8 â†’ **195,7 KB** (+1,9 KB);
`jsGzip` â†’ **203,3 KB** (+9,8% ratchet â€” pertama menyentuh +10,2% lalu turun setelah ikon
dekoratif phosphor pada tombol dibuang: tombol teks berlabel penuh, nol rugi a11y);
`cssGzip` +6,2%; `transferGzip` 320,3 â†’ **325,4 KB** (+1,6% precache+ikon).
Baseline JSON **tidak** diubah (semua ratchet hijau). **Sisa ratchet Â±0,4 KB JS / Â±0,8 KB CSS â€”
Task 15 praktis pasti menyentuh ratchet; keputusan re-baseline/pemangkasan WAJIB di
checkpoint gerbang Fase 1.**

**Verifikasi:** `bun run verify` hijau penuh â€” 41 file / **346 test unit** Â· `check:boundaries`,
`check:privacy`, `check:budget` âœ… Â· `bun run test:e2e` **42 lulus + 2 skip
kapabilitas** (Chromium + Firefox; skip `page.pdf` Firefox utuh, jangan "diperbaiki").

---

## Fase 1 -- Milestone 1.7

### Task 15 -- Delete All Data + Local Storage Notice
**Requirement:** FR-108, FR-109, FR-111, J9
**Status: SELESAI (2026-09-21).** Danger zone hapus-semua di panel draft
(konfirmasi eksplisit -> tawaran ekspor-dulu -> hapus tiga tempat -> muat ulang
eksplisit) plus peringatan penyimpanan lokal verbatim: banner sekali pasca-save
pertama + footer permanen -- tanpa perubahan `ResumeDocument`, tanpa migrasi,
tanpa ADR, tanpa dependensi baru.

| Berkas | Peran |
| :-- | :-- |
| `src/storage/wipe.ts` (+`wipe.test.ts`, 7 test node) | Orkestrasi tiga tempat: `drafts`+`assets`+`meta`, sapu prefix `cv4every1:` di `localStorage` (bukan `clear()`), hapus precache `cv4every1-precache` saja; seam injeksi ala `persist.ts`; **tak pernah melempar** -- parsial/`file://`/blokir dilaporkan jujur |
| `src/storage/repository.ts` + `index.ts` | `wipeAllData()` kini delegasi (kontrak utuh, plus store `meta`); barrel ekspor API wipe |
| `src/storage/sync.ts` | Pesan baru `data_wiped` + `notifyDataWiped()` (literal console allowlist dipakai ulang -- NFR-011) |
| `src/storage/autosave.ts` | **`discardPending()` baru** -- lihat temuan resurrection di bawah |
| `src/features/store/actions.ts` + `store.test.ts` (+5 test) | `wipeAllDataAction` (wipe -> discard -> reset -> broadcast -> refresh); `handleExternalMessage` reset saat `data_wiped` |
| `src/content/microcopy/id.ts` | Aditif bertipe: grup `dataSafety` + `storageNotice` (notice = verbatim S9); blanking struktural FR-204; tersapu frasa terlarang otomatis |
| `src/features/settings/DataManagement.tsx` (+dom test, 4 test) | Danger zone + dialog ekspor-dulu (gagal-ekspor tak blokir wipe); batal tak menghapus apa pun |
| `src/features/settings/StorageNotice.tsx` (+dom test 5, `storage-prefs.ts` + 2 test) | Banner `role="status"` (hanya pasca-save pertama, dismiss persisten) + footer permanen; keduanya `print:hidden` |
| `src/features/drafts/DraftPanel.tsx`, `src/App.tsx` | Mount danger zone di rumah data; banner + footer full-width (lihat temuan layout) |
| `e2e/wipe-data.spec.ts` | **Baru, 4 test x2 browser** (klaim jujur di header): tiga store kosong pre-reload + kosong pasca-reload; envelope ekspor valid; batal; tab kedua reset tanpa reload; kolektor off-origin tiap test |
| `e2e/a11y.spec.ts` (+1 test) | Audit axe permukaan dialog + banner |
| Docs: plan AC centang, frontmatter `data-safety` completed, matrix (FR-108/109 naik ke sukses, FR-111/NFR-002/009 diperkuat), roadmap centang, performance-budget v0.10 | Checklist penutup dalam perubahan yang sama |

**Keputusan implementasi (7 poin planning, sesuai rencana yang disetujui):**
1. Rumah UI: danger zone di `DraftPanel` + footer mini full-width di `App`.
2. Ekspor-dulu = tombol di dialog (dialog tetap terbuka); gagal-ekspor tak blokir wipe.
3. `localStorage`: sapu prefix `cv4every1:` (mencakup ketiga key yang dikenal hari ini) -- `clear()` ditolak.
4. Copy parsial ID memandu + jujur (`{remainder}` -> draft/pengaturan/cache).
5. Multi-tab: `data_wiped` -> reset ke kosong tanpa reload paksa.
6. Banner transien (save pertama + `lastSavedAt`, bukan kunjungan kosong) + footer permanen; cache tak tersedia = jujur dilewati, wipe tetap sukses.
7. Klaim e2e jujur per-test; `no-egress.spec.ts` tak disentuh (kolektor sendiri di wipe-spec).

**Temuan yang diperbaiki jujur (2 bug produk, 1 bug test):**
- **Resurrection bug (kritikal, produk):** `AutoSaveManager` memegang `currentDoc` selamanya -- reload pasca-wipe memicu flush unload yang **menulis kembali** dokumen terhapus (ditangkap e2e Firefox: `drafts` = 1 pasca-reload; Chromium lolos karena race). Perbaikan: `discardPending()` di `wipeAllDataAction` dan cabang `data_wiped`; test regresi unit (flush pasca-wipe) + e2e Firefox hijau. **Isu sekelas yang DIAMATI tapi di luar scope:** `deleteDraftAction` (single-delete Task 9) punya pola yang sama -- dicatat untuk gerbang, tidak diubah di task ini (AGENTS.md S5).
- **Footer menutupi klik (produk):** footer sebagai item ketiga `lg:flex-row` mencegat pointer -- dibungkus jadi sibling kolom full-width (nol utilitas CSS baru).
- **Pelanggaran kontras (produk):** `variant="destructive"` (= `bg-destructive/10` + `text-destructive`) gagal AA pada tombol yang selalu terlihat -- diganti `outline` + `text-destructive` (lulus axe di semua audit).
- **Bug test saya:** `.filter` Playwright di RTL, `exact` Playwright di RTL, stub `location.reload` (jsdom mengunci) -- reload hanya dibuktikan e2e.
- **Deviasi sadar dari teks rencana:** muat-ulang EKSPLISIT via tombol (bukan auto) -- agar tiga store dapat diverifikasi kosong sebelum reload dan pengguna sempat membaca konfirmasi.

**Anggaran (tanpa re-baseline, baseline TIDAK diubah):** `initialJsGzip` 195,7 -> **198,5 KB**
(+7,8% ratchet, absolut masih OK di bawah 200 KB); `jsGzip` 203,3 -> **206,1 KB**
(**+11,3% -> RATCHET FAIL**, +2,8 KB: wipe/aksi +/-0,5 - dialog +/-1 - notice +/-0,4 -
microcopy +/-1 -- tanpa dep/ikon/primitif baru); `cssGzip` tetap 27,2 KB (+6,2% OK,
nol CSS baru); `transferGzip` -> 328,2 KB (+8,1% OK). Justifikasi re-baseline
sadar di `performance-budget.md` v0.10 -- keputusan milik checkpoint gerbang Fase 1.

**Verifikasi:** `bun run verify` hijau KECUALI `check:budget` merah yang diantisipasi
(lint 0 error - format OK - typecheck OK - boundaries OK - **45 file / 369 test unit** -
build OK - privacy OK) - `bun run test:e2e` **52 lulus + 2 skip kapabilitas**
(Chromium + Firefox; skip `page.pdf` Firefox utuh).

**Polish pasca-Task 15 -- shell full-height (2026-09-22, laporan visual maintainer):**
box halaman berakhir tepat setelah footer karena tak ada baseline tinggi
viewport di rantai `html > body > #root` (margin body sudah 0 via preflight --
diselidiki dan dikesampingkan). Perbaikan: `min-h-dvh` + `print:min-h-0` pada
root `App` (print dikecualikan sadar -- isolasi cetak berbasis visibility,
min-height viewport bisa menambah halaman kosong pada PDF) dan `flex-1` pada
baris workspace sehingga footer menempel di bawah viewport saat konten pendek
(sticky footer; sisa 16 px = padding `p-4` shell, by design). Tanpa CSS baru
kecuali dua utilitas (+/-0,1 KB cssGzip, ratchet tetap hijau). Regresi e2e baru
di `smoke.spec.ts` (footer <= 20 px dari bawah viewport, Chromium + Firefox).
Insiden harness: server `vite preview` lama (reuseExistingServer lokal)
menyajikan build basi dan membuat test baru gagal semu -- dimatikan lalu hijau.
Sampingan: `index.html` dinormalisasi formatnya (format-only, 3 baris Task 14).

**Pass gerbang (2026-09-22, 4 item disetujui maintainer):**
1. Re-baseline sadar DIEKSEKUSI -- baseline baru 198,5 / 206,1 / 27,3 / 88,8 /
   328,2 KB, semua ratchet +0,0% (`performance-budget.md` v0.11). Utang absolut
   jsGzip >200 KB tetap tercatat, bukan gerbang fatal.
2. Commit checkpoint gabungan Task 14+15 (split per-task tak mungkin: file
   bertumpang-tindih) -- lihat pesan commit. Push tetap keputusan maintainer.
3. `testing-result/` masuk `.gitignore` + `.prettierignore` (isi tak disentuh);
   `format:check` repo-wide kembali hijau.
4. Resurrection bug `deleteDraftAction` diperbaiki (satu baris
   `discardPending()` + satu test regresi, pola Task 15) -- unit 370, e2e 54+2.
   Catatan: task `phase-1-gate` sendiri (kriteria prd S10 dkk) tetap pending --
   yang selesai di sini adalah 4 KEPUTUSAN gerbang, bukan verifikasi gerbang.

---

## Gerbang Keluar Fase 1 -- LULUS (2026-09-22)

Verifikasi per kriteria (`cv4every1-fase-1-mvp.md` 12/12 centang, frontmatter
`phase-1-gate` completed, `roadmap.md` gerbang LULUS):

| Kriteria | Bukti |
| :-- | :-- |
| MVP prd S10 | Seluruh fitur P0 + P1 terjadwal terbukti (matrix FR-001..111, NFR-001..015); satu pengecualian tercatat di bawah (F-A5) |
| Alur inti offline J1/J5/J6/J8/J9 | `e2e/offline.spec.ts` (isi-reload-toggle-cetak offline penuh) + `e2e/wipe-data.spec.ts` (J9, nol egress; wipe murni lokal by construction) |
| Ekstraksi PDF ATS + Creative | `ats-print` + `creative-print` Chromium; 2 skip Firefox = kapabilitas `page.pdf`, didokumentasikan |
| Round-trip semua fixture | `export-import.test.ts` (full + empty); `schema.test.ts` (unknown-fields forward-compat) |
| Migrasi semua versi | `migration.test.ts` (rantai, downgrade protection) |
| A11y permukaan baru | `a11y.spec.ts` halaman penuh + `runAxe` per komponen + scope `#cv-preview` |
| Keyboard-only | `FormLayout.dom.test.tsx` walkthrough + focus-trap tests; `mode-switch` keyboard e2e |
| Anggaran | `performance-budget.md` v0.11; `verify` budget semua +0,0% pasca re-baseline sadar |
| Verify hijau, skip | `bun run verify` exit 0 (45/370 unit); 0 skip unit; 2 skip e2e kapabilitas (keputusan: lulus dengan catatan) |
| Secret/PII | `check:privacy` OK; fixture jelas fiktif (`Contoh Nama Fiktif`, example.com); nama e2e sintetis tanpa kontak |
| Frasa terlarang | Sapuan otomatis `microcopy.test.ts` atas seluruh modul konten |
| Changelog Task 7-15 | Entri lengkap |

**Keputusan gerbang (maintainer):** F-A5 (cadangan + foto base64) DITUNDA ke Fase 2
(paragraf MVP S10.1 hanya menuntut `.cv4e.json` sebagai cadangan; portabilitas
assetRef butuh desain) -- tercatat di tabel penundaan rencana. Kriteria
"tanpa skip" diartikan: 0 skip unit + skip kapabilitas browser yang
didokumentasikan. Batasan jujur: reload pasca-wipe dalam kondisi offline tak
dapat mengambil shell (precache ikut terhapus) -- pengguna tetap di dialog
sukses; bukan defect untuk MVP online-first-visit.

**Verifikasi segar saat penutupan:** `bun run verify` exit 0 (45 file / 370 test)
- `bun run test:e2e` 54 lulus + 2 skip (Chromium + Firefox, 0 gagal).

---

## Fase 2 -- AI opsional

Keputusan desain Fase 2 disetujui maintainer (2026-09-22, 9 poin): provider pertama Groq + OpenAICompatible; key memori-sesi saja; consent per operasi pada pengiriman pertama lalu per sesi; minimisasi DF-6 = teks mentah + konteks section + bahasa (tanpa nama/kontak/foto/draft lain); Polish (EN) = operasi teks bukan locale UI; eval ber-key tidak di CI; ADR-0006 Opsi 4 (BYO-key sekarang); angka sah dari input boleh dipertahankan verbatim; F-A5 dikerjakan terakhir.

### Task 16 -- Antarmuka AIProvider + StaticSuggestionProvider
**Requirement:** FR-403, NFR-004 (fondasi fallback; AC-403-a/AC-NFR-004-a baru terpenuhi saat fallback terkabel per kapabilitas di Task 19/20)
**Status: SELESAI (2026-09-22).** Kontrak provider + taksonomi error final; fallback statis offline deterministik dari katalog action-verbs -- tanpa network call, tanpa UI, tanpa key, tanpa perubahan `ResumeDocument`.

| Berkas | Peran |
| :-- | :-- |
| `src/ai/types.ts` | **Baru.** `AIProvider` (+`requiresNetwork`), input/output bullets + polish penuh, tailoring sketsa C3 untuk Fase 3, `AILocale` mirror `LOCALES` core |
| `src/ai/errors.ts` (+`errors.test.ts`, 14 test) | **Baru.** Taksonomi `AIErrorCode` (10 kode) + `AIProviderError` + `isRetryableErrorCode`; hanya kode, tanpa wording |
| `src/ai/noop-provider.ts` (+test, 3 test) | **Baru.** Test double: tak pernah available, menolak semua kapabilitas |
| `src/ai/index.ts` | **Baru.** Barrel |
| `src/ai/README.md` | Aturan nol-dependensi + alasan Static tinggal di features/ |
| `src/features/ai/static-provider.ts` (+test, 9 test) | **Baru.** `StaticSuggestionProvider`: ≤3 saran dari `getVerbsForSection` (rawTask verbatim + placeholder `[dampak yang dapat diukur]`), 1 generik untuk section tanpa verb, `[]` untuk input kosong; polish/tailor → `capability-not-implemented` (titik ekstensi Task 20/21) |
| `src/content/microcopy/id.ts` | Aditif bertipe: grup `aiStatic` (3 string) + blanking struktural FR-204; tersapu test frasa terlarang otomatis |
| Docs: strategy §1 2 checkbox, roadmap Fase 2 baris 1 | Checklist penutup dalam perubahan yang sama |

**Keputusan implementasi:**

- **Static tinggal di `features/ai/`, bukan `src/ai/`:** `ai/` hanya boleh impor `core/` + nol bare package (boundary checker menegakkan; test pun dipindai). Static mengomposisi katalog `content/` → lapisan komposisi `features/` adalah rumahnya yang sah. Tanpa perubahan arsitektur.
- **`ai/` nol-dependensi total (bahkan `zod`):** validasi respons di Task 17 memakai guard tulisan-tangan agar chunk provider lazy tetap minimal dan tak perlu amandemen `MODULE_RULES`.
- **Wording di `content/`, bukan hardcode ala `actions.ts`:** rationale statis impor `microcopyId` langsung (microcopy sudah eager — nol biaya marginal) sehingga sweep frasa terlarang + blanking EN berlaku otomatis.
- **Grounding by construction:** statis hanya memakai ulang rawTask verbatim; `targetRole`/`locale`/`allowedFacts` diterima demi konformansi tanpa menyetir output (terdokumentasi di kode).
- **Interface invariant diuji, bukan string:** determinisme, keanggotaan verb katalog, invariant digit (tak ada digit keluaran di luar input; digit input dipertahankan), bentuk error.

**Verifikasi:** `typecheck` bersih · `check:boundaries` OK (195 file / 823 specifier) · lint 0 error (24 warning pre-existing, nol dari file baru) · format OK · **48 file / 396 test unit** (370 + 26 baru: 14 errors + 3 noop + 9 static; 8 microcopy tetap hijau) · build OK · `check:privacy` OK · `check:budget` OK (initialJsGzip/jsGzip/transferGzip +0,1% dari string `aiStatic` yang eager — semua ratchet hijau; modul `ai/`/`features/ai` belum diimpor App sehingga tak menambah chunk). Matrix FR-401..408/NFR-004 sengaja tak diubah: barisnya sudah benar menunjuk Fase 2 dan belum ada AC yang bisa diklaim.

Full `bun run verify` + e2e dijadwalkan di checkpoint Task 18 (wiring pertama yang menyentuh bundle/UX).

### Follow-up Task 16 -- Pengecualian "Memimpin" + higiene repo (2026-09-22)
Keputusan maintainer atas review: kata kerja kepemimpinan terdengar janggal sebagai pengawali bullet. `StaticSuggestionProvider` kini melewatkan `"Memimpin"` (`EXCLUDED_STARTER_VERBS` terdokumentasi — dilewat, bukan diubah katanya; katalog tetap sumber kurasi) dan slotnya diisi verb berikutnya (56 verb experience menjamin fill-through). +1 test (tak ada saran ber-`actionVerb` "Memimpin", jumlah tetap 3). Bersamaan: `.gitignore` memulihkan baris `testing-result` yang ikut terkomentari + menambah `verify-results/`; typo `vision md` di AGENTS.md kembali `vision.md`. Tanpa perubahan kontrak/interface.

### Task 17 -- Pipeline validasi structured output + grounding check
**Requirement:** FR-404 (AC-404-a), FR-405 (AC-405-a)
**Status: SELESAI (2026-09-22).** Respons AI mentah yang cacat atau mengarang fakta ditolak seluruhnya sebelum menyentuh state apa pun — murni, tanpa jaringan, tanpa `zod` (guard tulisan-tangan agar `ai/` tetap nol-dependensi).

| Berkas | Peran |
| :-- | :-- |
| `src/ai/validation.ts` (+`validation.test.ts`, 16 test) | **Baru.** `extractJsonFromText` (JSON polos + 1 blok fence; prosa di sekitar JSON ditolak, bukan diselamatkan) → guard bentuk (`suggestions` non-kosong; `text` non-kosong; field wajib bertipe tepat; field asing diabaikan) → `checkGrounding` (lapisan sendiri, bukan schema): tiap angka + kandidat entitas (kata kapital, span `[...]` disingkirkan dulu) wajib sudah ada di sumber grounding; angka dinormalisasi (`30 %`=`30%`, `3,52` dipertahankan verbatim — Q8); pelanggaran dideduplikasi dan dibatasi 5 detail |
| `src/ai/errors.ts` (+1 test) | Aditif: `AIProviderError.details` (tak pernah di-log, NFR-011) |
| `src/ai/index.ts`, `src/ai/README.md` | Barrel + baris tabel |

**Keputusan implementasi:**

- **Rationale ikut diperiksa grounding**, bukan hanya `text` — angka karangan di penjelasan sama menyesatkannya.
- **Polish memakai containment yang sama** terhadap teks sumber: tanpa fakta baru, tanpa tanggal berubah (aturan C2) — tanpa validator kedua.
- **Satu-satunya kegagalan test (jujur):** ekspektasi saya bahwa primitif JSON ditolak ekstraksi — salah; ekstraksi primitif valid memang lolos tahap 1 dan ditolak tahap bentuk. Test diperbaiki mendokumentasikan layering itu, bukan kode yang diubah menutupi test.
- Roadmap baris "Generator bullet + validasi structured output" **belum** dicentang: validasi selesai, generator berkabel (Task 19) belum.

**Verifikasi:** `typecheck` bersih · `check:boundaries` OK (197 file / 831 specifier) · lint 0 error (24 warning pre-existing) · format OK · **49 file / 414 test unit** · build OK · `check:privacy` OK · `check:budget` OK (+0,1% tak berubah dari Task 16 — follow-up + Task 17 nol byte eager baru; modul tetap tak diimpor App). **Catatan flake jujur:** satu run suite penuh exit 1 tanpa nama test gagal di output (wall-clock 164 dtk, mesin berat); dua run ulang penuh hijau 49/414 (70–111 dtk). Dugaan kontensi worker Windows seperti preseden Task 13b — bukan kegagalan asersi; dipantau bila berulang.\n
### Task 18 -- Alur BYO-key + layar persetujuan
**Requirement:** FR-402 (AC-402-a), FR-407 (AC-407-a), FR-110; finalisasi ADR-0006 (Opsi 4)
**Status: SELESAI (2026-09-23).** Kunci API hanya di memori sesi, dialog persetujuan mengawal setiap pengiriman pertama, transport Groq + OpenAI-compatible dengan mapping error + validasi Task 17 -- tanpa network call asli di test mana pun, tanpa perubahan ResumeDocument.

| Berkas | Peran |
| :-- | :-- |
| `src/ai/http.ts` (+test) | **Baru.** `postJson`: timeout 30 dtk (AbortController), status ke taksonomi (401/403 auth, 429 rate-limit, 5xx/network, body non-JSON malformed). Tanpa retry, tanpa log |
| `src/ai/chat-provider.ts` (+test) | **Baru.** Base OpenAI-compatible + builder payload DF-6 eksplisit (allowlist field diuji, bukan spread); key kosong tak pernah menyentuh network; tailor Fase 3 |
| `src/ai/groq-provider.ts` (+test) | **Baru.** `api.groq.com/openai/v1`, default `openai/gpt-oss-120b` (dapat dikonfigurasi), JSON mode, temperatur 0.2 |
| `src/ai/openai-compatible-provider.ts` (+test) | **Baru.** Endpoint custom tervalidasi murni (https; http hanya loopback) |
| `src/features/ai/session-keys.ts` (+test) | **Baru.** Vault Map per-tab: set/get/has/clear, tanpa API persistensi (diuji enumerasi) + round-trip test FR-110 |
| `src/features/ai/consent-store.ts` (+test) | **Baru.** Grant per penyedia per sesi (umur tab); absen = tanya dulu; revoke kembali prompt |
| `src/features/ai/ConsentDialog.tsx` + `AiSettings.tsx` (+dom test, axe) | **Baru.** Dialog terkontrol (tutup/Escape = tolak) + pengaturan kunci per penyedia, status FR-408, cabut consent; mount di DraftPanel |
| `src/content/microcopy/id.ts` | Aditif: grup `aiKeys` + `aiConsent` + blanking FR-204; tersapu frasa terlarang |
| `e2e/ai-consent.spec.ts` | **Baru.** Tolak = 0 request (route counter); simpan = configured; reload = kembali unconfigured (bukti memori-sesi di browser nyata) |
| Docs | ADR-0006 Accepted + parameter; privacy-policy S2/S3; strategy S1/S4/S5/S8; threat-model review; test-strategy batas compiler; roadmap baris 2 |

**Keputusan implementasi:**

- **System prompt diinjeksikan, bukan di-inline:** provider menerima `systemPrompt` string; Task 19 memasok isi berkas berversi. Tanpa teks prompt sementara di bundle.
- **Tanpa CSP baru:** endpoint custom runtime tak bisa di-whitelist statis; CSP tetap TODO + batasan dicatat di threat-model (keputusan sadar, bukan kelalaian).
- **Insiden React Compiler (temuan penting):** flow simpan kunci gagal deterministik di build produksi (state basi di handler) sementara hijau di jsdom -- vitest tak menjalankan compiler. Terbukti via pencabutan plugin (hijau) dan diperbaiki surgical dengan `'use no memo'` pada AiSettings (4/4 e2e hijau, compiler tetap aktif global). Unit/jsdom tak bisa menjaga kelas bug ini; e2e build produksi adalah gerbangnya (dicatat di test-strategy).
- **Tiga kegagalan test milik saya, bukan produk:** (1) ekspektasi envelope vs teks mentah di polish test; (2) mock hanging mengabaikan sinyal abort; (3) titik hilang di string asersi dialog. Semua diperbaiki di test.
- **Harness:** webServer e2e timeout 120 dtk saat mesin berat -- build manual + preview persisten + reuseExistingServer sebagai pola kerja.

**Verifikasi:** `typecheck` bersih · `check:boundaries` OK (212 file / 897 specifier) · lint 0 error (24 warning pre-existing, nol dari file baru) · format OK · **56 file / 451 test unit** · build OK · `check:privacy` OK · `check:budget` OK (ratchet +1,4% semua hijau; `initialJsGzip` 201,4 KB melewati garis absolut 200 KB — utang advisory baru, terdokumentasi di performance-budget) · `test:e2e` **58 lulus + 2 skip kapabilitas** (Chromium + Firefox; skip `page.pdf` Firefox utuh). +1,4% JS awal berasal dari seksi pengaturan eager + microcopy; modul `src/ai` (provider + validasi) belum diimpor App sehingga siap lazy penuh di Task 19. Matrix FR-401..408/NFR-004 tetap Fase 2: AC-402-a terbukti di gate + browser, pengiriman nyata (Task 19) belum ada sehingga belum diklaim.

### Housekeeping -- Gerbang NFR-006 mengenali kunci Groq + koreksi indeks ADR
**Requirement:** NFR-006 (`check:privacy`); tanpa perubahan `ResumeDocument`
**Status: SELESAI (2026-09-23).** Celah ditemukan saat meninjau ulang kebijakan key AI (BYO-key vs kunci default): prefiks `gsk_` (kunci Groq) tidak ada di `SECRET_PATTERNS`, sehingga kunci Groq di bundel hanya bergantung pada pola generik `secret-assignment` — yang bisa dilewati minifier dengan meng-inline literal tanpa nama variabel sensitif. Kini kunci Groq tertangkap pola khusus, sehingga aturan "tanpa kunci di bundel" (C-T2) dijaga mesin, bukan disiplin.

| Berkas | Peran |
| :-- | :-- |
| `scripts/privacy-rules.ts` | Aditif: pola `groq-key` (`\bgsk_[A-Za-z0-9]{20,}\b`) setelah blok anthropic |
| `scripts/privacy-rules.test.ts` | Kasus `gsk_…` ditambahkan ke test format kredensial + `'groq-key'` di daftar id |
| `docs/06-security/privacy-and-data-handling.md` §5a | Daftar pola yang dijaga `check:privacy` diperbarui |
| `docs/adr/README.md` | Drift: status ADR-0006 → Accepted (Opsi 4, 2026-09-23); baris ADR-0007 ditambahkan; kandidat "Pipeline PDF" dihapus (sudah diputuskan di ADR-0007) |

**Verifikasi:** `scripts/privacy-rules.test.ts` 13/13 hijau · `typecheck` bersih · lint 0 error (24 warning pre-existing, tidak bertambah) · `format:check` OK · `check:privacy` penuh OK pada `dist/` yang ada (nol positif palsu dari pola baru).

### Task 19 -- Generator bullet C1 + prompt berversi + panel pratinjau + Apply per-item
**Requirement:** FR-401 (AC-401-a/b), FR-404 (AC-404-a), FR-405 (AC-405-a), FR-403 (AC-403-a), FR-402/FR-407/FR-408; tanpa perubahan `ResumeDocument`
**Status: SELESAI (2026-09-23).** Kapabilitas C1 terkabel penuh: prompt berversi disuntikkan sebagai `systemPrompt`, orkestrator DF-6 memanggil provider lalu selalu jatuh ke statis saat gagal, saran hidup di `ai-store` dan masuk dokumen hanya via Apply per-item, trigger inline di tiap baris bullet memakai consent gate yang sudah ada.

| Berkas | Peran |
| :-- | :-- |
| `prompts/id/bullet-generator.v1.md` (+`shared/grounding-rules.v1.md`, `shared/output-schema.v1.json`) | **Baru.** System prompt C1 berversi: tujuan, input/tipe, schema ref, grounding mirror, contoh valid + tidak valid, batas token (input 2000 char, output 800 token), fallback caller-side, changelog versi |
| `src/features/ai/bullet-prompts.ts` (+test, 8 test) | **Baru.** Loader prompt (single import point, `?raw`) + budget token + `truncateBulletText`; drift guard mirror-vs-kanonik; tanpa inline prompt di komponen |
| `src/features/ai/bullet-generator.ts` (+test, 15 test) | **Baru.** Orkestrator: `buildBulletInput` DF-6 allowlist (raw + section + targetRole + locale + allowedFacts) → pilih provider vault (Groq diutamakan) → consent fail-closed → panggil → fallback statis tiap gagal; draft tak pernah disentuh |
| `src/features/store/ai-store.ts` (+test di `store.test.ts`) | **Aktif.** State suggestions/status/source/error + `startBulletRequest`/`resolveBulletRequest` (stale-scope guard) / `clearBulletState`; blok "inert basket" diganti test perilaku |
| `src/features/ai/BulletSuggestionsPanel.tsx` + `BulletGenerator.tsx` (+dom test, 5 test, axe) | **Baru.** Trigger inline (ikon Sparkle, Collapsible seperti ActionVerbSuggestions) + panel: input targetRole opsional, status FR-408, daftar saran + Apply per-item, ConsentDialog reuse; `'use no memo'` + baca store/ref saat event (kelas insiden Task 18) |
| `src/features/form/fields/StringListEditor.tsx` | Aditif: `replaceRow` di slot args (Apply mengganti baris lewat commit path yang sama) |
| `src/features/form/sections/ExperienceForm.tsx`, `ProjectsForm.tsx` | Aditif: trigger generator di slot tiap baris (Organizations otomatis via `ExperienceItemEditor`) |
| `src/content/microcopy/id.ts` | Aditif: grup `aiBullets` (16 string) + blanking FR-204; tersapu frasa terlarang otomatis |
| `fixtures/ai-eval/bullet-grounding-violations.json` (+test, 5 test) | **Baru.** 4 fixture pelanggaran permanen (persen, perusahaan, tanggal, skill) — set hanya bertambah |
| `e2e/ai-bullets.spec.ts` | **Baru.** 4 test production build: jalur AI (consent gate + Apply per-item), fallback tanpa kunci, tolak consent = 0 request, keyboard Enter/Escape |
| Docs | roadmap Fase 2 baris 3 → [x]; ai-product-spec C1 → [x]; performance-budget entri Task 19 |

**Keputusan implementasi:**

- **Bacaan event-time (temuan e2e, bukan teori):** jalur AI mula-mula 0 request di production build sementara hijau di jsdom — pola insiden Task 18. Sebelum memperbaikinya, duplikasi modul antar-chunk disingkirkan dulu sebagai penyebab (chunk `bullet-generator-*.js` mengimpor binding bersama dari `index-*.js` — vault/consent tidak terduplikasi). Panel kini membaca teks baris dari DocumentStore + `targetRole`/consent dari ref saat event, bukan dari prop/state tangkapan render.
- **Balapan asersi milik harness, bukan produk:** `toBeVisible` lolos dari fallback statis pra-grant sebelum retry selesai — dikunci dengan `toHaveCount(2)` (mock AI=2, statis=3).
- **Kegagalan test milik saya (jujur):** `navigator` getter-only di Node (stub via defineProperty); dom test membaca prop padahal panel membaca store (setup tambah `addSectionItem`); `getByLabel` cocok 4 kontrol (ganti role textbox).
- **Batas token DF-6 terkunci (Q4/Q5 yang disetujui):** `targetRole` = input teks opsional per operasi di panel (bukan dari schema); `allowedFacts` = rawTask + targetRole; truncation `[dipotong]` di dalam span `[...]` sehingga tak dihitung pelanggaran grounding.

**Verifikasi:** `typecheck` bersih · `check:boundaries` OK (220 file / 957 specifier) · lint 0 error (24 warning pre-existing, nol dari file baru) · format OK · **60 file / 486 test unit** (451 + 35 baru: 8 prompts + 15 orkestrator + 3 ai-store + 5 panel + 5 eval − 1 inert) · build OK (chunk lazy `bullet-generator` ~3,5 KB gzip di luar JS awal) · `check:privacy` OK · `check:budget` OK (ratchet +4,1%/+5,6% semua hijau; `initialJsGzip` 206,6 KB — utang advisory yang sama, terdokumentasi di performance-budget) · `test:e2e` **66 lulus + 2 skip kapabilitas** (Chromium + Firefox; 4 test baru × 2 browser; skip `page.pdf` Firefox utuh).

### Task 20 -- Polish C2 + prompt berversi ID/EN + panel pratinjau `changes` + Apply
**Requirement:** FR-401 (AC-401-a/b), FR-404 (AC-404-a), FR-405 (AC-405-a), FR-403 (AC-403-a), FR-402/FR-407/FR-408; tanpa perubahan `ResumeDocument`
**Status: SELESAI (2026-09-24).** Kapabilitas C2 terkabel penuh: prompt berversi disuntikkan sebagai `systemPrompt` per mode, orkestrator DF-6 memanggil provider lalu selalu jatuh ke panduan statis saat gagal, kandidat hidup di slice polish `ai-store` dan masuk dokumen hanya via Apply eksplisit, trigger inline di ringkasan + tiap baris bullet memakai consent gate yang sudah ada.

| Berkas | Peran |
| :-- | :-- |
| `prompts/id/polish.v1.md`, `prompts/en/polish.v1.md` (+`shared/polish-output-schema.v1.json`) | **Baru.** System prompt C2 berversi: tujuan, input/tipe (`text` + `mode`), schema ref, grounding mirror, contoh valid + tidak valid dua arah (fakta-baru DAN fakta-hilang — C2-strict), batas token (input 2000 char, output 800 token), fallback caller-side, changelog versi |
| `src/features/ai/polish-prompts.ts` (+test, 9 test) | **Baru.** Loader prompt (single import point, `?raw`) + budget token + `truncatePolishText`; ID untuk mode `id`, EN untuk `en`/`translate-en`; drift guard mirror-vs-kanonik; tanpa inline prompt di komponen |
| `src/features/ai/polish-text.ts` (+test, 15 test) | **Baru.** Orkestrator: `buildPolishInput` DF-6 allowlist (teks terpilih + mode saja) → pilih provider vault (Groq diutamakan) → consent fail-closed → panggil → fallback statis tiap gagal; draft tak pernah disentuh |
| `src/features/ai/static-provider.ts` (+test, 4 test) | **Diisi.** `polishText` statis: teks = input verbatim (tanpa tulis-ulang offline) + checklist per mode di `changes` + frasa dihindari di `warnings`; kosong → nota input-kosong |
| `src/features/store/ai-store.ts` (+test di `store.test.ts`, 3 test) | **Aditif.** Slice polish terpisah (`polishScope`/`Status`/`Suggestion`/`Source`/`ErrorCode`, stale-scope guard, `clearPolishState`) — slice bullet tak tersentuh |
| `src/features/ai/PolishSuggestionsPanel.tsx` + `PolishTrigger.tsx` (+dom test, 7 test, axe) | **Baru.** Trigger inline (ikon Sparkle, Collapsible) + panel: radio mode (default ID), pratinjau `changes`/`warnings`, Apply hanya untuk kandidat AI (statis = panduan tanpa Apply), ConsentDialog reuse; `'use no memo'` + baca store/ref saat event (kelas insiden Task 18) |
| `src/features/form/sections/ExperienceForm.tsx`, `ProjectsForm.tsx` | Aditif: trigger polish di slot tiap baris (Organizations otomatis via `ExperienceItemEditor`) |
| `src/features/form/sections/BasicsForm.tsx` | Aditif: trigger polish di bawah field ringkasan (`updateBasics` sebagai Apply) |
| `src/content/microcopy/id.ts` | Aditif: grup `aiPolish` + `dataFieldsListPolish` di `aiConsent` + blanking FR-204; tersapu frasa terlarang otomatis |
| `fixtures/ai-eval/polish-grounding-violations.json` (+test, 5 test) | **Baru.** 4 fixture pelanggaran permanen (angka-baru, perusahaan-baru, tanggal-berubah, entitas-EN) — set hanya bertambah |
| `e2e/ai-polish.spec.ts` | **Baru.** 4 test production build: jalur AI (consent gate + Apply), fallback tanpa kunci (tanpa Apply), tolak consent = 0 request, keyboard Enter/Escape |
| Docs | roadmap Fase 2 "Polish (ID/EN)" → [x]; ai-product-spec C2 → [x]; performance-budget entri Task 20 |

**Keputusan implementasi:**

- **Statis tanpa Apply (temuan desain, bukan bug):** fallback polish tidak menulis ulang — `text` = input verbatim sehingga Apply adalah no-op. Panel statis menampilkan checklist + frasa dihindari TANPA tombol Apply; kunci sukses-vs-fallback e2e adalah ada/tidaknya Apply (preseden konvensi §12 kickoff).
- **Validasi tak berubah:** `validatePolishOutput` sudah meng-ground `text` ke teks sumber (Task 17) — fakta *hilang* tak terdeteksi containment check, sehingga ia tetap aturan prompt-level (`warnings`) + protokol eval manual, didokumentasikan di header test fixture.
- **Kegagalan test milik saya (jujur):** `getByLabel('Ringkasan')` cocok trigger + textarea di e2e (ganti `getByRole('textbox')`); asersi mode via substring gagal karena escaping JSON (ganti parse payload); status tanpa kunci adalah `unconfiguredNote` FR-408 bukan `staticNote`.
- **Batas token DF-6 (keputusan kickoff yang disetujui):** samakan bullet — input 2000 char, output 800 token, truncasi `… [dipotong]`; payload allowlist = teks + mode.

**Verifikasi:** `typecheck` bersih · `check:boundaries` OK (228 file / 1017 specifier) · lint 0 error (24 warning pre-existing, nol dari file baru) · format OK · **64 file / 529 test unit** (486 + 43 baru: 9 prompts + 15 orkestrator + 3 ai-store + 7 panel + 5 eval + 4 statis) · build OK (chunk lazy `polish-text` ~4,5 KB gzip di luar JS awal) · `check:privacy` OK · `check:budget` OK (ratchet +4,9%/+8,9% semua hijau; `initialJsGzip` 208,2 KB — utang advisory yang sama, terdokumentasi di performance-budget; sisa ruang ratchet jsGzip ±1,1 poin) · `test:e2e` **8/8 polish lulus** (Chromium + Firefox, 4 test × 2 browser).

**Temuan di luar scope (dilaporkan, tidak diperbaiki di task ini):** 12 kegagalan `color-contrast` e2e (a11y 10 + ats-print 2) pra-ada di tree bersih — penyebab terbukti restyle `StorageNotice` maintainer (`99bbf33`, token `text-info`/`bg-info/10`), BUKAN Task 20 (probe axe: satu-satunya pelanggar adalah teks StorageNotice; trigger polish nol pelanggaran). Perlu keputusan maintainer: perbaiki token vs toleransi. Flake beban-paralel sesekali (1 test/run berbeda, lulus saat diisolasi) — pola yang sudah didokumentasikan.

### Tindak lanjut Task 19/20 — ikon polish + hardening fallback statis (umpan balik maintainer)
**Status: SELESAI (2026-09-24).** Tiga keluhan maintainer dari sesi dev: (1) dua trigger spark identik berdampingan — trigger polish kini memakai `PencilLineIcon` (aria tidak berubah, e2e hijau); (2) konsep polish-hanya-saran dikonfirmasi benar (constraint §2.13 suggestion-not-mutation, FR-401) — bukan bug; (3) fallback statis menghasilkan duplikasi kata kerja + placeholder ganda + `targetRole` yang terlihat diabaikan — diperbaiki: dedup prefiks bila baris sudah diawali verb itu, placeholder tunggal bila teks sudah membawa span `[...]`, dan catatan FR-408 di bawah kolom peran saat tanpa kunci (kontrak kejujuran: statis mengabaikan peran, dikunci test).
**Verifikasi:** `typecheck` bersih · lint 0 error (24 warning pre-existing) · format OK · `check:boundaries` OK (228 file / 1018 specifier) · unit 18 statis + 7 panel hijau · build OK · `check:privacy` OK · `check:budget` OK (+5,1%/+9,2% hijau; sisa ruang ratchet jsGzip ±0,8 poin — Task 21 wajib hemat) · e2e ai-bullets + ai-polish Chromium 8/8 production build.

### Task 21 — Retry policy + nota kegagalan per-kode (FR-406/FR-403/FR-408)
**Requirement:** FR-406 (draft utuh + kegagalan dilaporkan), FR-403 (fallback non-AI), FR-408 (status beralasan); tanpa FR/AC baru — tidak ada requirement retry khusus di SRS; tanpa perubahan `ResumeDocument`
**Status: SELESAI (2026-09-24).** Keputusan kickoff yang disetujui: K1a (set retryable tak berubah — `timeout`/`network-error`/`rate-limited`), K2a (maks 3 attempt, backoff ~1 dtk → ~2 dtk + jitter, `Retry-After` dihormati max 10 dtk), K3a (retry diam-diam — tanpa state transien/store baru), K4a (lazy-load tunda, ditarik hanya bila budget jebol — tidak jebol), K5 (pemetaan disetujui).

| Berkas | Peran |
| :-- | :-- |
| `src/ai/retry.ts` (+test, 17 test) | **Baru.** `withRetry` + `computeRetryDelayMs` murni: hanya `AIProviderError` retryable yang dicoba ulang; validasi/grounding/auth/consent/program error dilempar langsung; `shouldStop` menghentikan saat radio mati (lapor `offline`); sleep/random injectable |
| `src/ai/errors.ts` (+test) | Aditif: `retryAfterMs` opsional di `AIProviderError` (hanya 429 ber-header valid) |
| `src/ai/http.ts` (+test) | Aditif: parse header `Retry-After` (detik atau HTTP-date; sampah/negatif → `undefined`, tanpa jatuh ke `Date.parse` liar) |
| `src/ai/index.ts` | Aditif: re-export retry |
| `src/features/ai/bullet-generator.ts` + `polish-text.ts` (+10 test) | Aditif: seam `retry` di options (sleep no-op di test); kedua jalur (seam + produksi) dibungkus `withRetry`; produksi berhenti saat `isOffline()` antar attempt; kandidat gagal validasi/grounding tidak pernah dicoba ulang (1 request) |
| `src/content/microcopy/id.ts` | Aditif: `rateLimitedNote` + `timeoutNote` di `aiBullets`/`aiPolish` + blanking FR-204; tersapu frasa terlarang otomatis |
| `BulletSuggestionsPanel.tsx` + `PolishSuggestionsPanel.tsx` (+4 dom test) | Aditif: cabang nota `rate-limited`/`timeout` sebelum `errorNote` generik; render-murni tanpa state baru (pola anti-stale-closure tak tersentuh) |
| `e2e/ai-retry.spec.ts` | **Baru.** 3 test production build: 429-lalu-sukses bullet (2 saran = retry, bukan 3 statis), 429-persisten (nota kuota + 3 request + draft utuh), 429-lalu-sukses polish (Apply muncul) |
| Docs | roadmap Fase 2 baris retry → [x]; provider-strategy §6 (429 + batasi permintaan) → [x]; fallback-strategy §2/§5 → [x]; performance-budget entri Task 21 |

**Keputusan implementasi:**

- **Bug parser milik saya (jujur):** `Date.parse('-5')` lolos sebagai tanggal hingga test menangkapnya — parser kini menolak nilai berawalan angka/tanda yang bukan detik-valid sebelum mencoba `Date.parse`.
- **Kegagalan test milik saya (jujur):** duplikat import `PolishMode` (salah gabung); asersi seed store sinkron jalan sebelum re-render (ganti `findByText`); `it.each` non-retryable mula-mula menghitung `calls` yang tak pernah naik (ganti closure penghitung).
- **Flake beban-paralel (pola terdokumentasi, bukan defect):** 1 test Firefox gagal `toHaveCount` 5 dtk saat 2 worker paralel, lolos terisolasi (8 dtk) — asersi pasca-retry diberi headroom 15 dtk karena backoff nyata ~1 dtk.
- **Validasi di dalam attempt:** grounding/malformed dilempar provider di dalam `call()`, tapi karena non-retryable ia langsung keluar tanpa retry — kuota user aman (dikunci test `calls === 1`).

**Verifikasi:** `typecheck` bersih · lint 0 error (24 warning pre-existing, nol dari file baru) · format OK · `check:boundaries` OK (230 file / 1024 specifier) · **unit 65 file / 570 test** (535 + 35 baru: 20 retry + 1 errors + 2 http + 4 orkestrator bullet + 4 orkestrator polish + 2 panel bullet + 2 panel polish) · build OK (chunk lazy `bullet-generator` 3,0 KB + `polish-text` 4,5 KB gzip, di luar JS awal) · `check:privacy` OK · `check:budget` OK (+5,2%/+9,5% hijau; sisa ruang ratchet jsGzip ±0,5 poin) · `test:e2e` AI **26/26** (ai-retry 3 + ai-bullets 4 + ai-polish 4 + ai-consent 2, × Chromium + Firefox, production build).

### Task 22 — Set evaluasi terima + runner per-versi-prompt (FR-405/FR-404)
**Requirement:** FR-405 (AC-405-a invariant), FR-404 (AC-404-a tolak schema); tanpa FR/AC baru — tidak ada requirement eval khusus di SRS; tanpa perubahan `ResumeDocument`; tanpa kode produksi (fixture + test + docs saja, bundle tak berubah)
**Status: SELESAI (2026-09-24).** Keputusan kickoff yang disetujui: D1a (runner = file vitest pola eval-fixtures, auto-CI tanpa wiring baru), D2a (provider statis live per kasus + mock ter-pin jalur AI), D3a (subset grounding-relevan eksplisit; injection + kualitas dikecualikan tercatat), D4a (tanpa runner ber-key — manual tetap via UI), D5 (lanjut tanpa menunggu eval manual maintainer).

| Berkas | Peran |
| :-- | :-- |
| `fixtures/ai-eval/bullet-grounding-accept.json` (baru, 8 kasus) | Set terima C1: pendek, angka ada/tak-ada (+placeholder), organisasi, dedup verb-awal, truncate 2000, karakter khusus, entitas input lolos |
| `fixtures/ai-eval/polish-grounding-accept.json` (baru, 4 kasus) | Set terima C2: angka, pendek, mode EN, karakter khusus; `translate-en` dikecualikan by-design (temuan F-T22-1) |
| `src/features/ai/bullet-eval-accept.test.ts` (baru, 10 test) | Runner C1: statis live bersih (allowlist verb eksplisit) + mock valid whole + orkestrator kirim AI + pin nama + kontrol negatif |
| `src/features/ai/polish-eval-accept.test.ts` (baru, 6 test) | Runner C2: statis verbatim + panduan + mock valid whole + orkestrator kirim AI + pin nama + kontrol negatif |
| Docs | evaluation-dataset §1/§3/§4 + prompt-spec §4/§6 dicentang yang termekanisasi; manual-protocol §6 +2 temuan; roadmap Fase 2 baris eval → [x] |

**Keputusan implementasi:**

- **Temuan F-T22-1 (translate-en, dilaporkan bukan diperbaiki):** terjemahan sejati tak bisa lolos containment grounding (kosakata beda bahasa) — mode terdegradasi graceful ke panduan statis. Perbaikan butuh desain dwibahasa (diskusi pra-Fase 3).
- **Batasan F-T22-2 (slot kurasi, diungkap di header test):** verb katalog + rationale template allowlist eksplisit (tujuan FR-403 + dataset §1 mewajibkan verb); angka/entitas-fakta tak pernah allowlist.
- **Kegagalan test milik saya (jujur):** `as const` scope vs `BulletScope`? — lolos; tidak ada; runner hijau percobaan pertama kecuali penambahan asersi `actionVerb` susulan (tetap hijau).

**Verifikasi:** `typecheck` bersih · lint 0 error (24 warning pre-existing) · format OK · `check:boundaries` OK · **unit 67 file / 586 test** (570 + 16 baru: 10 accept bullet + 6 accept polish) · tanpa kode produksi (build/budget/e2e tak terdampak — e2e AI 26/26 warisan tetap acuan).

### Aliran terpadu C1b + marker preview (review maintainer, 2026-09-24)
**Requirement:** FR generik 401/402/403/404/405/406/408 (tanpa FR baru — tidak ada FR "N bullet dari deskripsi" di SRS); tanpa perubahan `ResumeDocument`; di luar Fase 2 tertutup (enhancement, tanpa klaim fase)
**Status: IMPLEMENTASI SELESAI, GERBANG BUDGET FAIL — butuh keputusan maintainer (lihat bawah).** Keputusan Plan yang disetujui: aditif (trigger lama utuh), banner sesi tanpa schema, maks 3 bullet, dedup verb katalog apa pun.

| Berkas | Peran |
| :-- | :-- |
| `prompts/id/achievement-bullets.v1.md` (baru) | Prompt C1b: 1–3 bullet dari deskripsi bebas, larangan verb-stacking, contoh dua-sudut |
| `src/features/ai/achievement-prompts.ts` (+test, 9 test) | Loader versi + budget + truncate + drift guard mirror (pola T19) |
| `src/features/ai/achievement-generator.ts` (+test, 15 test) | Orkestrator: DF-6 deskripsi + retry T21 + slice maks 3 + fallback statis; kontrak `generateBullets` dipakai ulang tanpa ubah interface |
| `src/features/ai/AchievementPanel.tsx` + `AchievementTrigger.tsx` (+dom test, 12 test) | Trigger item-level + tooltip (hover/fokus/long-press 500 ms, hand-rolled tanpa positioning engine) + textarea + Apply append + banner sesi AI; mount di ExperienceItemEditor (otomatis Organizations) + ProjectsForm |
| `src/features/store/ai-store.ts` (+test, 3 test) | Slice achievement (scope/status/source/error + stale guard); clear slice-only |
| `src/content/microcopy/id.ts` | Grup `aiAchievement` (20 string) + blanking FR-204; sapu frasa terlarang otomatis |
| `src/features/ai/static-provider.ts` (+test, 2 test) | Dedup verb katalog apa pun: raw berverb → 1 saran tanpa prefix ("Mengelola Membuat ..." hilang) |
| `src/render/ats/print.css` + creative `styles.module.css` (+2 gate test) | `list-style-type: disc` (preflight me-reset marker); markup tak berubah (snapshot utuh) |
| `e2e/ai-achievement.spec.ts` (baru, 4 test) | Production build: AI path + Apply append, fallback + T-C, tolak consent, keyboard |
| Docs | ai-product-spec C1b; glossary `requestAchievementBullets`; performance-budget entri + koreksi preseden lazy-load; changelog ini |

**Keputusan implementasi:**

- **Tooltip hand-rolled (bukan base-ui):** modul Tooltip base-ui + positioning engine terbukti +19 KB di JS awal (diukur buang-pasang). Pengganti ~30 baris: hover/fokus/long-press + `role="tooltip"` + `aria-describedby` + Escape. Keputusan sadar: hemat puluhan KB, perilaku teruji axe + e2e.
- **Kegagalan test milik saya (jujur):** mock rationale memakai kata di luar input (aturan T22 berlaku untuk mock saya sendiri); `name: 'Susun bullet'` cocok substring di Playwright (ganti `exact: true`); keyboard e2e fokus ke tombol disabled (isi textarea dulu); warning lint `set-state-in-effect` (pindah ke event handler); format mangled 1 baris (kembalikan).
- **Pelanggaran produk:** tidak ada. Semua kegagalan di atas milik harness/test, bukan produk.

**Verifikasi:** `typecheck` bersih · lint 0 error (24 warning pre-existing, sempat 25 dari effect saya — diperbaiki) · format OK · `check:boundaries` OK (239 file / 1095 specifier) · **unit 70 file / 628 test** (586 + 42: 9 prompts + 15 orkestrator + 12 dom + 3 store + 2 gate CSS + 1 statis net) · build OK (chunk lazy `achievement-generator` 3,3 KB gzip) · `check:privacy` OK · `test:e2e` AI **32/32** (achievement 4 + bullets 4 + polish 4 + consent 2, × Chromium + Firefox) · **`check:budget` FAIL: `jsGzip` +12,2% (batas +10%)** — `initialJsGzip` +6,4% ✅, lainnya ✅. Opsi di performance-budget entri; tanpa keputusan, task ini tidak diklaim Done (§8).
