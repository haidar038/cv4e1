# Changelog — cv4every1

Catatan perubahan per fase. Ditulis agar sesi agen AI baru dapat memulai **tanpa menebak state repository**.

| Field | Value |
| :-- | :-- |
| Terakhir diperbarui | 2026-09-20 |
| Fase terakhir selesai | **Fase 1 — Milestone 1.3: Task 9 Form UI Guided Sections** |
| Fase berikutnya | **Fase 1 lanjutan — Task 13b (Action Verbs Suggestions UI), lalu Task 10 (Renderer ATS)** |
| Baseline test | 25 file test · 219 test lulus · `tsc -b --noEmit` bersih (strict aktif) |
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
| `@playwright/test` | 1.63.0 | dev | Task 7b |
| `zustand` | ^5.0.15 | runtime | Pra-Task 8 (D13, disetujui maintainer) |

**Dihapus 2026-09-20 (audit scaffold, lihat entri Pra-Task 8):** `recharts`, `embla-carousel-react`,
`cmdk`, `input-otp`, `react-day-picker`, `date-fns`, `react-resizable-panels`, `@shadcn/react`.

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
| 8 | State Management Store (Zustand) | ✅ selesai (2026-09-20) |
| 9 | Form UI — Guided Sections | ✅ selesai (2026-09-20) |
| 10 | Renderer ATS (HTML + Print CSS) | ⬜ belum |
| 11 | Renderer Creative (1 template) | ⬜ belum |
| 12 | Toggle Mode + Preview Pane | ⬜ belum |
| 13 | Action Verbs Catalog + Suggestions UI | ◑ 13a ✅ (data, 2026-09-20) · 13b ⬜ (UI) |
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

### Pra-Task 8 — Penutupan gap gerbang + audit dependensi (2026-09-20)

**Status: ✅ SELESAI.** Bukan task dari rencana; rangkaian tindakan persiapan atas keputusan maintainer.
Repo kini sudah git (`origin: github.com/haidar038/cv4e1`, commit awal ter-push oleh maintainer).

| Aksi | Hasil |
| :-- | :-- |
| **Draf `prd.md` §10 (MVP definition)** | Ditulis sebagai **v0.1 — disetujui maintainer (2026-09-20)**: definisi satu paragraf, daftar periksa fitur per ID `feature-catalog.md`, dan daftar yang ditunda beserta alasannya. Gerbang Fase 1 kini punya kriteria yang dapat dinilai. |
| **ADR-0007 → Accepted** | Status dinaikkan dari Proposed (perubahan satu baris; konten keputusan tidak diubah). Konvensi lisan "Proposed tapi diperlakukan mengikat" berakhir. |
| **Audit + trimming dependensi scaffold** | **8 paket runtime dihapus**: `recharts`, `embla-carousel-react`, `cmdk`, `input-otp`, `react-day-picker`, `date-fns` (tanpa pemakai sama sekali), `react-resizable-panels`, `@shadcn/react` — beserta 8 komponen `src/components/ui` yang menjadi satu-satunya pemakainya (chart, carousel, command, calendar, resizable, input-otp, message-scroller, questionnaire). Semua dapat dipulihkan lewat git. **Dipertahankan** (dipakai luas atau dirujuk rencana): `@base-ui/react`, `@phosphor-icons/react`, `class-variance-authority`, `cn`, `shadcn` (theme CSS di `index.css`), 2 `@fontsource-variable/*`, stack Tailwind, `react`, `react-dom`, `dexie`, `zod`. |
| **Efek ke anggaran** | CSS gzip **30,2 → 27,1 KB (−10,4%) — utang CSS LUNAS**; JS tak berubah (komponen scaffold memang tak pernah masuk bundle). Baseline di-record ulang: jsGzip 68 749 B · cssGzip 27 064 B · fontsRaw 393 476 B · transferGzip 493 466 B — ratchet kini melindungi perbaikan. Sisa utang: font raw + transfer (subset font → Task 10). |
| **`zustand@5.0.15` dipasang** | Persetujuan maintainer untuk Task 8 (D13). Pembenaran per `dependency-policy.md`: state global dengan subscription per-selector (form 40+ field); tidak di-hand-write karena selector-subscription yang benar itu rumit; **MIT, zero runtime dependency**, ~1,5 KB gzip saat terpakai (belum masuk bundle karena belum diimpor); dipelihara pmndrs, sangat aktif; jika ditinggalkan: store ditulis sebagai modul biasa `getState/setState/subscribe` (migrasi mekanis). |
| **Keputusan metrik lab/field** | LCP/TTI/CLS **ditunda sadar** ke tahap polish/persiapan performance testing (keputusan maintainer, 2026-09-20) — tercatat di `performance-budget.md` §1. |
| **Rumah subset font + interpretasi gerbang** | Subset font ditambahkan ke Requirements **Task 10** di `cv4every1-fase-1-mvp.md`; aturan interpretasi gerbang Fase 1 untuk anggaran bundle (JS/CSS wajib ✅; font/transfer ✅ atau utang terjadwal) tercatat di `performance-budget.md` §1 — final di checkpoint gerbang. |
| **Drift dokumen** | `roadmap.md`: Fase 0 semua checkbox dicentang + gerbang ditandai LULUS; `docs/README.md`: "Enam ADR" → "Tujuh ADR". |

**Verifikasi:** `bun run verify` hijau penuh (lint · format:check · typecheck · boundaries ·
8 file / 95 test · build · check:budget OK, tanpa warning CSS) · `bun run test:e2e` 2 lulus
(Chromium + Firefox).

## Milestone 1.1 — Store Layer (Task 8)

### Task 8 — State Management Store (Zustand)

**Requirement:** FR-003, FR-102, FR-103, FR-108, NFR-005, NFR-013
**Status: ✅ SELESAI (2026-09-20).**

| Berkas | Peran |
| :-- | :-- |
| `src/features/store/document-store.ts` | `ResumeDocument` aktif + `draftId` + `dirty` + `lastSavedAt` + `externalNotice` (`zustand/vanilla`) |
| `src/features/store/draft-store.ts` | `DraftSummary[]` + `selectedId` |
| `src/features/store/ui-store.ts` | mode (mirror `meta.mode`), locale, panel terbuka, status autosave, pesan storage |
| `src/features/store/ai-store.ts` | Keranjang inert Fase 2 — kosong, tanpa logika, tidak dikonsumsi UI |
| `src/features/store/actions.ts` | Satu-satunya lapisan mutasi: lifecycle draft, edit section generik, `setMode`, multi-tab, wiring `AutoSaveManager` |
| `src/features/store/selectors.ts` | `selectATSViewModel`/`selectCreativeViewModel` memoized berbasis referensi dokumen |
| `src/features/store/store.test.ts` | 21 test: invariant mode, memoization, persist autosave, kuota penuh, storage diblokir, draft rusak, multi-tab (BroadcastChannel nyata), CRUD draft |

**Keputusan implementasi:**

- `zustand/vanilla` `createStore` — store murni tanpa React (kriteria "dapat diuji tanpa React",
  state-management §8); komponen nanti mengonsumsi via `useStore(store, selector)`.
- Semua mutasi dokumen lewat satu gerbang `applyDocumentUpdate`: validasi ulang sebelum commit
  (store hanya pernah memegang `ValidatedResumeDocument`), no-op terdeteksi dan diabaikan, lalu
  `autosave.registerChange(doc, draftId)`.
- `withMaterializedMeta`: default `meta` (locale/mode) dimaterialisasi di batas store supaya
  invariant "setMode hanya mengubah `meta.mode`" eksak — tanpa efek samping materialisasi
  `meta.locale` saat toggle pertama pada dokumen tanpa meta.
- `stableSnapshot`: pembanding konten agnostik terhadap urutan kunci — Zod menyusun ulang urutan
  kunci saat re-parse, sehingga `JSON.stringify` mentah menghasilkan no-op palsu.
- Aksi item section generik per `SectionKey` (add/update/remove/move, berbasis index — item skema
  tidak punya `id`); dua cast terdokumentasi menjembatani keterbatasan korelasi generik TypeScript
  (bukan `any`, dengan komentar alasan).
- `AutoSaveManager.onSuccess` → set `draftId`/`lastSavedAt`, `notifyTabs('draft_updated')`,
  refresh `DraftStore` — menutup titik integrasi sync yang sebelumnya TODO di autosave.
- Multi-tab: `handleExternalMessage` (diekspor untuk test) + `initStoreSync` — update dari tab lain
  hanya menaikkan `externalNotice` (tanpa overwrite diam-diam, D4); penghapusan draft yang terbuka
  memindahkan tab ke kondisi kosong. Teruji lewat **BroadcastChannel kedua dengan nama yang sama**
  (integrasi nyata, bukan mock).
- Pesan storage Bahasa Indonesia nada D21: "Gagal menyimpan — ekspor manual disarankan." ·
  "Mode privat: perubahan tidak tersimpan." · pesan draft rusak menjelaskan dan menenangkan.
- `zustand` belum masuk bundle (belum diimpor `App`) — anggota bundle tidak berubah.

**Acceptance criteria Task 8:** seluruh terpenuhi — action lifecycle/edit/order/mode terdefinisi;
invariant mode-switch teruji; selector memoized teruji; store tanpa React (env node); autosave
terpicu dan `DraftStore` diperbarui setelah save; `onExternalUpdate` non-blocking; `AIStore` ada
dan inert.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error · format ✓ · typecheck ✓ ·
boundaries OK 86 file / 280 specifier · **9 file / 116 test unit** · build ✓ · check:budget OK) ·
`bun run test:e2e` 2 lulus (Chromium + Firefox).

## Milestone 1.2 — Content Foundation (Task 13a)

### Task 13a — Micro-copy ID + Action Verbs Catalog (data saja)

**Requirement:** FR-201, FR-202, FR-204, FR-205, FR-206
**Status: ✅ SELESAI (2026-09-20).** Tanpa UI — konsumen menyusul di Task 9 dan 13b.

| Berkas | Peran |
| :-- | :-- |
| `src/content/microcopy/id.ts` | Pak micro-copy Bahasa Indonesia bertipe (D15): IPK, 4 status pendidikan + contoh penulisan, peringatan foto ATS verbatim + tips pasfoto, kontak (+62/08, email, kota, LinkedIn), organisasi, panjang CV. `getMicrocopy(locale)` mengembalikan `null` untuk `en` (FR-204). |
| `src/content/microcopy/microcopy.test.ts` | **Di luar daftar file rencana** (dilaporkan): rumah uji frasa terlarang glossary §6 yang menyapu seluruh string modul konten + asersi verbatim/notifikasi foto. |
| `src/content/action-verbs/id.json` | Katalog statis **72 entri** (rentang rencana 60–100), 6 kategori, tiap entri `{ verb, category, applicableSections[], examplePhrase }` dengan pola `[placeholder]` (J4). |
| `src/content/action-verbs/index.ts` | Loader bertipe: `getAllVerbs`, `getVerbsForSection`, `getVerbCategories`. |
| `src/content/action-verbs/action-verbs.test.ts` | 7 test: bentuk entri, tanpa duplikat, cakupan kategori, filter per section, pola kalimat. |
| `tsconfig.app.json` | +`resolveJsonModule` (prasyarat impor JSON statis D16). |

**Keputusan implementasi:**

- Katalog hanya merujuk `experience`/`organizations`/`projects` — konsisten dengan Task 13b
  (tanpa saran di Education/Skills); `getVerbsForSection('skills' | 'education')` = `[]` teruji.
- Kategori **"Operasional"** (rencana Task 13a/D16) menggantikan "layanan" dari localization-guide
  §4 — deviasi kecil tercatat; rencana menang.
- Label `discontinued` = **"Berhenti"** (menutup TODO localization-guide §3.2, sesuai daftar
  rencana Task 13a); contoh penulisannya menonjolkan transparansi (jumlah sks selesai).
- **Batas modul `content/` → nothing**: union kunci (section, status, locale) dimirror lokal dengan
  komentar rujukan ke `core/` — secara struktural identik sehingga konsumen `features/` dapat
  meneruskan nilai `core` langsung; konsistensi antar-union diuji di lapisan features (Task 9/13b).
  Bentuk katalog divalidasi runtime oleh test (content/ tidak boleh mengimpor zod).
- Tidak ada frasa terlarang glossary §6 — diuji dengan sapuan seluruh string modul konten.
- `content/` belum diimpor `App` → anggota bundle tidak berubah.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error · format ✓ · typecheck ✓ ·
boundaries OK 90 file / 286 specifier · **11 file / 132 test unit** · build ✓ · check:budget OK) ·
`bun run test:e2e` 2 lulus (Chromium + Firefox). Catatan kecil: commit Task 8 memuat perubahan
`tsconfig.json` dengan format yang belum memenuhi Prettier — diluruskan (format saja, isi sama).

## Milestone 1.3 — Form Terpandu (Task 9)

### Task 9 — Form UI: Guided Sections

**Requirement:** FR-101, FR-102, FR-201 s.d. FR-206, NFR-005, NFR-007, NFR-014
**Status: ✅ SELESAI (2026-09-20).** Form terpandu seluruh section terpasang di shell minimal
`App.tsx` (disetujui maintainer: mount sekarang, bukan menunggu shell penuh Task 12).

| Berkas | Peran |
| :-- | :-- |
| `src/features/form/FormLayout.tsx` | Shell form: nav accordion 7 section (satu terbuka, state `openPanel`), progres "Bagian X dari Y", empty state memandu + CTA, peringatan lunak panjang CV, saluran `storageMessage` (role=alert), skip link pratinjau (hanya saat `#cv-preview` ada — mekanisme untuk Task 12, tanpa link mati) |
| `src/features/form/sections/*.tsx` | 7 section: Basics (+links+foto), Education (status+contoh penulisan, GPA group), Experience & Organizations (editor item bersama — organisasi diperlakukan setara + guidance), Projects, Skills (grup berkategori), Certifications |
| `src/features/form/fields/*` | `FormField` (buffer + wiring aria), `PartialDateField`, `SelectField`, `StringListEditor`/`HighlightsEditor`, `GpaFieldGroup`, `LinkListEditor` |
| `src/features/form/photo/{PhotoUpload.tsx,compress.ts}` | Validasi tipe/2 MB, kompresi Canvas (WebP fallback JPEG, sisi terpanjang 800 px, step-down kualitas ≤500 KB), EXIF via `createImageBitmap` `imageOrientation:'from-image'` + fallback `<img>`, simpan Blob via `saveAsset` → `assetRef`, hapus/ganti aset lama, notice ATS F-C3 verbatim |
| `src/features/form/{AutoSaveIndicator,SectionOrderControls,estimatePageCount,field-validation,useBufferedValue,useMicrocopy}.ts(x)` | Indikator D21 (Menyimpan…/Tersimpan; idle+`lastSavedAt` → Tersimpan), reorder naik/turun D22, heuristik halaman murni, validasi field dari skema Zod core (bukan validator kedua), buffer ketik, hook micro-copy |
| `src/features/drafts/DraftPanel.tsx` | Panel draft D23 (mobile stack, desktop sidebar): baru, ganti nama (dialog), duplikat, hapus (konfirmasi), ekspor unduhan, impor berkas |
| `src/App.tsx` | Shell minimal: `initStoreSync` + `refreshDrafts` + pemulihan `cv4every1:lastDraftId` (localStorage, D14 — preferensi UI, bukan konten CV) |
| `src/content/microcopy/id.ts` | Perluasan aditif bertipe: `sections`, `employmentType`, `fields` (label + placeholder contoh nyata + hint), `actions`, `drafts`, `autosave` (D21), `importErrors` (7 reason), `emptyState`, `photoUpload`, `photoErrors`, `validation`, `progress`, `common`, `skip`, plus ekspor `microcopyStructural` |
| `src/features/store/actions.ts` + `store.test.ts` | **Baru:** `importDraftAction(json)` — `importResume` validate-first, disimpan sebagai draft BARU lalu dibuka; `ImportError.reason` dikembalikan ke UI (bukan diumumkan store); gagal storage → `storageMessage` D21. `lastSavedAt` saat load ternyata sudah ada sejak Task 8 (`actions.ts:210`) — langkah rencana terpenuhi tanpa perubahan |
| `vitest.config.ts`, `src/test/setup.dom.ts` | Dua project vitest: `node` (default, `core/` tetap tanpa DOM) + `jsdom` untuk `*.dom.test.tsx` dengan setup (fake-indexeddb **sebelum** rantai import Dexie, jest-dom, cleanup RTL) — sesuai keputusan Task 7b |
| Test baru (13 berkas) | 7 section + FormLayout + FormField + PhotoUpload + AutoSaveIndicator + BasicsForm + DraftPanel (`.dom.test.tsx`) + 4 murni (field-validation, compress, estimatePageCount, section-keys) |

**Keputusan implementasi:**

- **Buffer ketik per field (krusial):** `applyDocumentUpdate` menolak patch yang gagal Zod, sehingga
  email setengah-ketik (`budi@`), skala `3.`, dan tanggal `2021-` akan membuat controlled input macet.
  Pola terpilih: nilai **valid** di-commit per ketikan (autosave tidak pernah tertinggal); nilai
  invalid intermediate tinggal di state lokal dan errornya baru muncul saat blur (`role=alert` +
  `aria-describedby`). Penyederhanaan dari rencana: registry flush `visibilitychange` **tidak
  diperlukan** — semua nilai yang bisa di-commit memang sudah ter-commit per ketikan; nilai invalid
  memang tidak dapat masuk dokumen.
- **Adopsi perubahan store lewat render-adjust** (pola resmi React), bukan effect:
  `useBufferedValue`, `StringListEditor`, dan `LinkListEditor` membandingkan kunci proyeksi
  ter-commit; baris kosong yang sedang diketik tidak hilang, perubahan dari tab lain tetap diadopsi.
  Tanpa ref-during-render.
- **FR-204:** `getMicrocopy('en')` tetap `null` (test Task 13a utuh); UI memakai
  `microcopyStructural` — label struktural tetap ada (a11y), micro-copy domain Indonesia (IPK, +62,
  foto, panjang CV, contoh status) di-blank sampai pack EN Fase 3. Teruji: locale `en` menyembunyikan
  guidance tanpa merusak label.
- **Heuristik panjang CV (F-C6):** `estimateCvPages` murni dengan ambang terdokumentasi
  (3000 karakter/halaman + 80 per heading item) — diuji di batas 2 halaman; disempurnakan bila
  Task 12 memberi paginasi nyata. Bukan skor CV (sweep frasa terlarang otomatis mencakup string baru).
- **Reorder section:** tombol naik/turun (D22) menulis `sectionOrder`; `normalizeOrder` menghormati
  urutan tersimpan (bug pertama ditemukan test dan diperbaiki), kunci tak dikenal diabaikan.
- **Checkbox `current`:** base-ui Checkbox me-render `role=checkbox` pada span (bukan elemen
  labelable), sehingga nama aksesibel via `aria-label` yang identik dengan teks terlihat
  (WCAG 2.5.3 Label in Name); `current` aktif menonaktifkan tanggal selesai.
- **Impor:** gagal validasi tidak pernah menyentuh draft aktif (spec §6); pesan per-`reason` dari
  micro-copy; unduhan ekspor via Blob + anchor (`URL.createObjectURL` di-stub pada test jsdom).
- **Konsistensi union Task 13a ditutup** di lapisan features (`section-keys.test.ts`):
  `CatalogSectionKey` ≡ `SectionKey`, status pendidikan lengkap di micro-copy, pack struktural
  ter-blank dengan benar.
- **Re-baseline bundle sadar:** shell Hello World → aplikasi nyata (form + primitif base-ui +
  `zustand/react` + konten) memompa JS gzip 68,7 → 183,7 KB (+167%); ratchet D24 di-record ulang
  dengan justifikasi tertulis di `performance-budget.md` §1 (v0.4) — anggaran absolut **tidak**
  dinaikkan; sisa ruang 16,3 KB dan audit bundle/code-splitting dicatat sebagai keputusan checkpoint
  gerbang Fase 1.
- **Sisa warning lint pada kode baru: 1** (`FormLayout` SkipLink `set-state-in-effect`) — disengaja:
  cek `#cv-preview` pasca-mount untuk integrasi Task 12. Warning lain berasal dari scaffold dan satu
  temuan pre-existing di `actions.ts` (destructure `renameDraft`) yang tidak disentuh.

**Verifikasi:** `bun run verify` hijau penuh (lint 0 error · format ✓ · typecheck ✓ · boundaries OK ·
**25 file / 219 test unit** · build ✓ · check:budget OK) · `bun run test:e2e` 2 lulus
(Chromium + Firefox, shell nyata tanpa console error) · verifikasi browser nyata: 360 px tanpa
overflow horizontal (0 elemen melewati viewport), teks-zoom 200% tanpa overflow dan tetap berfungsi,
buat draft → autosave "Tersimpan" → reload → draft dipulihkan (D14) dan indikator tetap "Tersimpan".

**Catatan jujur AC:** audit axe di jsdom melaporkan nol pelanggaran; color-contrast butuh layout
nyata sehingga tercatat "incomplete" — cakupan kontras penuh menyusul di audit e2e Task 10/12.
Test kompresi foto memakai stub canvas (jsdom tanpa canvas): batas/dimensi/step-down kualitas
terbukti oleh test murni, dan jalur simpan → `assets` → `assetRef` terbukti oleh test integrasi;
Blob yang kembali dari `loadAsset` di jsdom dibatasi structured-clone (integritas Blob round-trip
sudah dibuktikan test repository di env node). Normalisasi EXIF (decode `from-image` + fallback)
tidak dapat diuji unit — mengandalkan API browser, terdokumentasi di kode.