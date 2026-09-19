# Changelog — cv4every1

Catatan perubahan per fase. Ditulis agar sesi agen AI baru dapat memulai **tanpa menebak state repository**.

| Field | Value |
| :-- | :-- |
| Terakhir diperbarui | 2026-09-20 |
| Fase terakhir selesai | **Fase 0 — Fondasi Data & Persistensi (termasuk Task 7a closure)** |
| Fase berikutnya | **Fase 1 — MVP (Milestone 1.0 selesai: 7a ✅ · 7b ✅ · 7c ✅; bukti CI hijau menunggu repo git/GitHub)** |
| Baseline test | 8 file test · 95 test lulus · `tsc -b --noEmit` bersih (strict aktif) |
| Package manager | Bun (`bun.lock` dikomit) |

> Konvensi penomoran task mengikuti `cv4every1-bootstrap-dan-spike-pdf.md` dan planning Fase 0. **Nomor task tidak pernah didaur ulang** (AGENTS.md §5).

---

## Fase −1 — Spike Risiko

**Status: SELESAI.**

| Item | Status | Bukti |
| :-- | :-- | :-- |
| S1 — Kesetiaan PDF | ✅ | `docs/adr/0007-pdf-export-pipeline.md` |
| Gerbang keluar: S1 lulus atau pipeline didesain ulang | ✅ | ADR-0007 → **Opsi 4: HTML + Print CSS (Kandidat A)** |

### Keputusan ADR-0007 yang mengikat Fase 1

- PDF dihasilkan lewat **dialog cetak peramban** (`window.print()`), bukan generator PDF terprogram.
- **Satu codepath** untuk preview dan PDF → apa yang dilihat pengguna adalah apa yang tercetak.
- **Nol dependensi PDF runtime.** `@react-pdf/renderer` tetap `devDependency` (artefak spike), tidak masuk bundle.
- Rasterisasi (html2canvas) **ditolak permanen** (C-T5).
- Kelemahan yang diterima: UX dialog cetak, header/footer peramban, variasi paginasi lintas peramban.
- Uji ekstraksi teks otomatis **harus di CI Linux container**, bukan mesin developer Windows (temuan spike).

---

## Fase 0 — Fondasi Data & Persistensi

**Status: SELESAI untuk jalur data. UTANG TEKNIS pada rig pengujian lanjutan (lihat di bawah).**

Gerbang keluar Fase 0: *data dapat disimpan, dimuat, diekspor, diimpor, dan dimigrasi, dengan test.*

| Item gerbang | Status | Bukti |
| :-- | :-- | :-- |
| Disimpan & dimuat | ✅ | `src/storage/repository.ts` · `repository.test.ts` |
| Autosave | ✅ | `src/storage/autosave.ts` (debounce 2s, flush on hide) |
| Beberapa draft | ✅ | `listDrafts()` terurut `updatedAt` desc |
| Diekspor & diimpor | ✅ | `src/storage/export-import.ts` · `export-import.test.ts` |
| Dimigrasi | ✅ | `src/core/migration.ts` · `migration.test.ts` |
| Dengan test | ✅ | 51 test lulus (6 file) |
| Rig pengujian final + CI + anggaran performa | ✗ | **Utang teknis — lihat di bawah** |

### Task 2 — Spike S1 (PDF)

Lihat Fase −1 di atas. Tidak ada artefak kode yang masuk `src/`.

### Task 3 — ResumeDocument Schema + Validasi (Zod)

**Requirement:** FR-001, NFR-006

| Berkas | Peran |
| :-- | :-- |
| `src/core/schema-parts.ts` | Sub-skema granular: `basics`, `sections`, `education`, `experience`, `projects`, `skills`, `certifications`, `gpa`, `link`, `photo`, `meta`, `partialDate` |
| `src/core/schema.ts` | Skema kanonik `resumeDocumentSchema`, tipe terinferensi, `validateResumeDocument()`, `createEmptyResumeDocument()` |
| `scripts/generate-json-schema.mjs` | Generator JSON Schema deterministik dari Zod |
| `schemas/resume.schema.json` | **Tergenerate** — jangan diedit manual |
| `fixtures/empty-document.json` | Dokumen minimal |
| `fixtures/full-document.json` | Dokumen lengkap (data fiktif) |
| `fixtures/unknown-fields.json` | Uji forward-compatibility |
| `src/core/schema.test.ts` | 9 test |

**Keputusan implementasi:**

- **D2 diterapkan:** field tak dikenal di root disimpan ke `_unknownFields` (bukan ditolak) — memenuhi kompatibilitas maju & "jangan pernah hilang data pengguna".
- `basics.name` **boleh string kosong** pada level persistence (draft parsial). Validasi "wajib diisi" digeser ke ekspor/cetak.
- Chaining Zod v4: `.regex()` **sebelum** `.default()`.
- Dependensi baru: `zod@4.6.5` (runtime), `zod-to-json-schema` (build-time).

Perintah: `bun run gen:schema` menghasilkan `schemas/resume.schema.json`.

### Task 4 — Normalisasi + View Model Derivation

**Requirement:** FR-001 s.d. FR-008

| Berkas | Peran |
| :-- | :-- |
| `src/core/view-models.ts` | Tipe display: `ATSViewModel`, `CreativeViewModel`, `*Display`, `OrderedSection`, `DateRangeDisplay`, `GpaDisplay` |
| `src/core/normalize-helpers.ts` | Formatter tanggal ID, status pendidikan, heading section, builder per-section |
| `src/core/normalize.ts` | **`toATSViewModel()`** dan **`toCreativeViewModel()`** — fungsi murni |
| `src/core/normalize.test.ts` | 19 test |

**Keputusan implementasi:**

- **Penegakan aturan mode bersifat struktural, bukan flag.** `ATSViewModel` **tidak memiliki field `photo`** sama sekali. Template tidak bisa meng-override karena datanya memang tidak ada (ADR-0004, AGENTS.md §2.15).
- `CreativeViewModel.photo` hanya terisi bila `enabled === true` **dan** `assetRef` ada.
- Section kosong **tidak pernah** masuk output (memenuhi FR-006 secara struktural).
- Urutan section mengikuti `sectionOrder` dokumen sumber; key tak dikenal diabaikan dengan aman.
- Format IPK kanonik `3.52 / 4.00` (localization-guide §3.1).
- Nama bulan Bahasa Indonesia; `current: true` → "Sekarang".
- Dibuktikan murni oleh test: pemanggilan ganda identik, sumber tidak dimutasi.

### Task 5 — Adapter IndexedDB + Autosave + Draft Management

**Requirement:** FR-101 s.d. FR-111, NFR-013

| Berkas | Peran |
| :-- | :-- |
| `src/storage/db.ts` | Dexie, DB `cv4every1` v1 — stores `drafts` (`id, updatedAt`), `assets` (`ref`), `meta` (`key`) |
| `src/storage/repository.ts` | `saveDraft`, `loadDraft`, `listDrafts`, `deleteDraft`, `wipeAllData`, `saveAsset`, `loadAsset`, `deleteAsset` |
| `src/storage/autosave.ts` | `AutoSaveManager` — debounce 2s, flush on `visibilitychange`/`beforeunload` |
| `src/storage/sync.ts` | BroadcastChannel `cv4every1-sync` — `notifyTabs`, `onExternalUpdate` |
| `src/storage/errors.ts` | `StorageFullError`, `StorageBlockedError`, `InvalidDataError` |
| `src/storage/types.ts` | `DraftRecord`, `DraftSummary`, `AssetRecord`, `StorageStatus`, `AutoSaveCallbacks` |
| `src/storage/index.ts` | Barrel export API publik |
| `src/storage/repository.test.ts` | 9 test (dengan `fake-indexeddb`) |

**Keputusan implementasi:**

- **D1:** debounce 2000 ms; snapshot JSON mencegah write redundan.
- **D4:** BroadcastChannel, last-write-wins untuk MVP.
- **D10/D11:** nama DB dan desain object store sesuai keputusan.
- `loadDraft()` **memvalidasi ulang dengan Zod** saat dibaca → mendeteksi korupsi lebih awal.
- `listDrafts()` mengembalikan ringkasan ringan, bukan dokumen penuh.
- `saveDraft()` menerjemahkan `QuotaExceededError` menjadi `StorageFullError`. State memori **tidak pernah** dibuang.
- Dependensi baru: `dexie@4.4.6` (runtime), `fake-indexeddb` (dev).

### Task 6 — Import/Export JSON + Migration Framework

**Requirement:** FR-104 s.d. FR-107, FR-110

| Berkas | Peran |
| :-- | :-- |
| `src/storage/export-import.ts` | `exportResume()`, `importResume()` |
| `src/storage/export-import-types.ts` | `ExportEnvelope`, `ImportError` + `ImportErrorReason` |
| `src/core/migration.ts` | `registerMigration()`, `migrateDocument()`, `clearMigrations()` |
| `src/storage/export-import.test.ts` | 8 test |
| `src/core/migration.test.ts` | 5 test |

**Keputusan implementasi:**

- Envelope final: `{ format, kind, formatVersion, exportedAt, data }` sesuai import-export-spec §3.
- `importResume()` **tidak pernah menyentuh state existing** sebelum validasi lolos (aturan import-export-spec §6).
- Error granular: `NOT_JSON`, `INVALID_ENVELOPE_STRUCTURE`, `WRONG_FORMAT_ID`, `UNSUPPORTED_KIND`, `SCHEMA_TOO_NEW`, `MIGRATION_FAILED`, `VALIDATION_FAILED`.
- Proteksi downgrade: versi lebih baru dari aplikasi ditolak dengan pesan membantu.
- Rantai migrasi berurutan + deteksi siklus + validasi setelah migrasi.
- **Belum diimplementasikan:** penyematan base64 foto untuk `kind: "backup"` (keputusan D3) — masih TODO di Task 6 lanjutan / Fase 1 (F-A5).

### Task 7a — Strict TypeScript + Prettier (closure verifikasi)

**Status: ✅ SELESAI (closure).** Verifikasi ulang 2026-09-19 membuktikan pekerjaan substansi
sudah ada di repo: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride` aktif di `tsconfig.app.json` **dan** `tsconfig.node.json`;
`.prettierrc.json` + `.prettierignore` + skrip `format`/`format:check` ada dan lulus.

Verifikasi: `typecheck` bersih · `format:check` lulus · `test` 7 file / 74 test lulus ·
`check:boundaries` OK (87 files, 289 import specifiers) · `lint` 0 error / 26 warning
(warning hanya dari scaffold `src/components/ui`, bukan `core/`/`storage/`/`scripts/`).
Satu-satunya `as any` di `src/` ada di `src/storage/repository.test.ts:163` dengan komentar
penjelas (mock error path — diizinkan AGENTS.md §5). Tidak ada perubahan runtime.

---

## State Repository Terverifikasi (per 2026-09-19)

### Dependensi terpasang

| Paket | Versi | Jenis | Ditambahkan pada |
| :-- | :-- | :-- | :-- |
| `zod` | ^4.6.5 | runtime | Task 3 |
| `dexie` | ^4.4.6 | runtime | Task 5 |
| `zod-to-json-schema` | ^3.25.2 | dev | Task 3 |
| `fake-indexeddb` | ^6.2.5 | dev | Task 5 |
| `vitest` | ^5.0.1 | dev | Task 1 |
| `playwright` | ^1.63.0 | dev | Task 1 |
| `@react-pdf/renderer` | ^4.9.0 | dev | Task 2 (spike, **bukan** runtime) |
| `oxlint` | ^1.81.0 | dev | Task 1 |
| `typescript` | ~6.0.2 | dev | Task 1 |
| `vite` | ^8.3.0 | dev | Task 1 |

**Belum dipasang (dibutuhkan Fase 1):** `zustand`, `vite-plugin-pwa`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `axe-core`/`@axe-core/playwright`. (`@playwright/test` 1.63.0 sudah terpasang dan terpakai sejak Task 7b.)

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
test / test:unit  vitest run
test:e2e          playwright test
verify            lint → format:check → typecheck → check:boundaries → test:unit → build
gen:schema        bun scripts/generate-json-schema.mjs
preview           vite preview
```

**Semua skrip dan workflow CI sudah ada.** Eksekusi CI (bukti hijau di GitHub Actions) menunggu
`git init` dan push ke remote — keputusan maintainer.

### Struktur `src/` saat ini

```text
src/
├── core/          ✅ TERISI — schema, view-models, normalize, migration + 4 test
├── storage/       ✅ TERISI — db, repository, autosave, sync, export-import + 2 test
├── render/        ⬜ kosong (README saja)     ← Fase 1
├── ai/            ⬜ kosong (README saja)     ← Fase 2
├── content/       ⬜ kosong (README saja)     ← Fase 1
├── features/      ⬜ kosong (README saja)     ← Fase 1
├── components/ui/ ✅ shadcn primitives (~70 berkas, dari scaffold)
├── ui/            ⬜ README + button.tsx
├── hooks/         use-mobile.ts
├── lib/utils.ts   cn()
├── App.tsx        ⬜ masih "Hello World"      ← Fase 1
└── index.css      ✅ token Tailwind v4 + fontsource
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

## Fase 1 — MVP

**Status: BELUM DIMULAI.** Rencana lengkap: `cv4every1-fase-1-mvp.md`.

Isi bagian ini **setelah setiap task Fase 1 selesai**, mengikuti format yang sama dengan Fase 0 di atas (Requirement, tabel berkas, keputusan implementasi, bukti test).

### Ringkasan progres Fase 1

| Task | Judul | Status |
| :-- | :-- | :-- |
| 7 | Testing Rig Final + CI Pipeline + Strict TS | ✅ selesai (7a+7b+7c; bukti CI menunggu remote) |
| 8 | State Management Store (Zustand) | ⬜ belum |
| 9 | Form UI — Guided Sections | ⬜ belum |
| 10 | Renderer ATS (HTML + Print CSS) | ⬜ belum |
| 11 | Renderer Creative (1 template) | ⬜ belum |
| 12 | Toggle Mode + Preview Pane | ⬜ belum |
| 13 | Action Verbs Catalog + Suggestions UI | ⬜ belum |
| 14 | PDF Export Flow + PWA Service Worker | ⬜ belum |
| 15 | Delete All Data + Local Storage Notice | ⬜ belum |

**Gerbang keluar Fase 1:** kriteria `prd.md` §10 terpenuhi; seluruh alur inti lulus test offline.

### Log perubahan Fase 1

### Task 7b — Rig Pengujian (Playwright) + Boundary Checker

**Requirement:** NFR-005, NFR-007 (prasyarat rig test Fase 1)
**Status: ✅ SELESAI (2026-09-20).** Substansi rig — boundary checker, Playwright config, skrip agregat —
sudah ada di repo dari sesi sebelumnya tanpa catatan changelog. Sesi ini menutup bagian yang hilang
dan memverifikasi seluruh acceptance criteria Task 7b.

| Berkas | Peran |
| :-- | :-- |
| `e2e/smoke.spec.ts` | **Baru.** Smoke: shell termuat (`#root` berisi konten), nol console error/pageerror, judul `cv4e1` (assertion diganti saat Task 14) |
| `playwright.config.ts` | webServer kini `bun run build && bun run preview --host 127.0.0.1 …` — build selalu segar, host dipaksa IPv4 agar cocok dengan `baseURL` |
| `tsconfig.node.json` | `e2e/` masuk cakupan `typecheck` — spec e2e tidak boleh lolos dari strict TS |
| `.gitignore` | Ditambah artefak test/coverage (`test-results`, `playwright-report`, `blob-report`, `coverage`, `playwright/.cache`) |
| `scripts/module-boundaries.ts`, `check-boundaries.ts`, `source-files.ts`, `module-boundaries.test.ts` | Sudah ada (substansi 7b sebelumnya): aturan `architecture-overview.md` §5 sebagai data, import relatif + `import type` tetap dihitung, test unit kasus lolos dan gagal |
| `vitest.config.ts` | Sudah ada: env `node` default (menegakkan `core/` tanpa DOM) |

**Keputusan implementasi:**

- Smoke spec sengaja shell-agnostik — tidak meng-assert teks "Hello World" — agar tetap hijau saat
  shell nyata menggantikannya di Task 8; perilaku fitur masuk spec tersendiri.
- Assertion judul memakai nilai scaffold `cv4e1` plus komentar penunjuk; **Task 14 wajib
  memperbaruinya bersama `index.html`**.
- Temuan Windows: `vite preview` tanpa `--host` mengikat `::1` (IPv6) saja, sehingga readiness check
  Playwright di `127.0.0.1` timeout 120 s. Diperbaiki dengan `--host 127.0.0.1`. Konsisten dengan
  temuan ADR-0007: kebenaran lintas-platform divalidasi di CI Linux (Task 7c).
- `e2e/` ditambahkan ke `tsconfig.node.json` (di luar daftar file rencana) agar spec tercakup
  `strict` — dilaporkan sebagai deviasi kecil yang menutup celah cakupan typecheck.
- Tanpa dependensi baru.

**Verifikasi:** `bun run verify` hijau (lint · format:check · typecheck · boundaries · 7 file / 74 test unit · build) ·
`bun run test:e2e` **2 lulus (Chromium + Firefox)** · bundle produksi: JS 219,95 kB (gzip 68,74 kB),
CSS 198,13 kB (gzip 30,20 kB) — angka dasar untuk Task 7c.

### Task 7c — CI + Anggaran Performa

**Requirement:** NFR-008, NFR-012
**Status: ✅ SELESAI (2026-09-20).** Satu-satunya kriteria yang belum bisa dibuktikan adalah
"CI hijau pada commit terakhir" — repo belum git, sehingga workflow tervalidasi secara lokal
(YAML lolos prettier; setiap command di dalamnya adalah command yang lulus di mesin lokal).

| Berkas | Peran |
| :-- | :-- |
| `.github/workflows/ci.yml` | **Baru.** Job `verify` (setup-bun 1.3.14 → cache `~/.bun/install/cache` → `bun install --frozen-lockfile` → lint → format:check → typecheck → boundaries → test:unit → build → check:budget) lalu job `e2e` (cache `~/.cache/ms-playwright`, `playwright install --with-deps chromium`, `bunx playwright test --project=chromium`). Tanpa secret (C-T2); runner Linux sesuai temuan ADR-0007. |
| `scripts/bundle-budget.ts` | **Baru.** Aturan anggaran sebagai data + fungsi murni: klasifikasi aset, `computeStats`, `evaluateBudget` (ratchet), `parseBaselineJson` (validasi input), `formatBytes`. Tanpa I/O — teruji tanpa DOM. |
| `scripts/check-bundle-size.ts` | **Baru.** Wrapper IO: jalan `dist/`, muat baseline, cetak tabel, exit 1 saat ratchet dilanggar; `--update` untuk re-baseline sadar. |
| `scripts/bundle-baseline.json` | **Baru.** Baseline terukur build pertama: jsGzip 68 749 B · cssGzip 30 205 B · fontsRaw 393 476 B · transferGzip 496 608 B. |
| `scripts/bundle-budget.test.ts` | **Baru.** 21 test unit: klasifikasi, agregasi, batas ratchet tepat +10% lulus / +10,1% gagal, toleransi kustom, baseline nol, validasi baseline malformed. |
| `package.json` | `verify` kini berakhir dengan `check:budget` (setelah build). |
| `vite.config.ts` | `__dirname` → `import.meta.dirname` — warning deprecation configLoader native Vite 8 hilang dari log build. |
| `docs/07-quality/performance-budget.md` | §1 diisi angka tervalidasi + status per metrik; §2 gerbang bundle ditandai selesai; status dokumen naik ke v0.2. |

**Keputusan implementasi:**

- Skrip **`.ts`**, bukan `.mjs` seperti teks rencana/D24 — mengikuti konvensi repo
  (`check-boundaries.ts` juga `.ts` lewat Bun) dan `package.json` yang sudah menunjuk `.ts`,
  sehingga typecheck strict mencakupnya. Deviasi dilaporkan.
- **Dua lapis penegakan:** ratchet +10% dari baseline bersifat fatal (gerbang CI); anggaran
  absolut §1 hanya peringatan — build pertama memang sudah melebihi target CSS (30,2 > 30 KB),
  font (393,5 > 100 KB), dan transfer (496,6 > 400 KB). Utang terdokumentasi di §1; penyelesaiannya
  menurunkan ukuran (subset font, audit dependensi scaffold shadcn — usulan ke maintainer),
  bukan menaikkan anggaran (§5).
- Metrik ratchet: `jsGzip`, `cssGzip`, `fontsRaw`, `transferGzip` (estimasi transfer = gzip
  seluruh isi dist/).
- CI: action stabil (checkout v4, setup-bun v2, cache v4), Bun dipatok 1.3.14, e2e Chromium saja
  sesuai rencana Task 7c.

**Verifikasi:** `bun run verify` hijau (lint · format:check · typecheck · boundaries ·
**8 file / 95 test unit** · build · check:budget OK) · `bun run test:e2e` 2 lulus
(Chromium + Firefox) · `bunx playwright test --project=chromium` (perintah persis CI) lulus.