# cv4every1

A free, open-source, local-first CV builder that produces an **ATS-oriented** version and a
**Creative** version of the same CV from **one source of data** — no account, no backend, no
watermark.

Built for Indonesian fresh graduates first: GPA written as `3.52 / 4.00`, campus organizations and
internships treated as real experience, guidance written in Bahasa Indonesia at the point of
filling, and an offline action-verb catalog so writing help is never locked behind a paid API key.

- **Product vision and principles:** [`docs/00-project-context/vision.md`](docs/00-project-context/vision.md)
- **Working rules for contributors and AI agents:** [`AGENTS.md`](AGENTS.md)
- **Full documentation index (Bahasa Indonesia):** [`docs/README.md`](docs/README.md)
- **Public landing page:** [`public/landing.html`](public/landing.html)
  ([English](public/landing-en.html)) — static, no JavaScript, no analytics

## What it is not

cv4every1 does **not** guarantee that a CV passes an ATS, **does not** produce a CV score, **does
not** invent facts about the user (no numbers, employers, titles or skills the user did not
provide), and **does not** require an account, a subscription, or a server. It is not a general
design tool: layout choices are deliberately constrained so the output stays machine-readable.

## Status

Work follows phases in [`docs/01-product/roadmap.md`](docs/01-product/roadmap.md). Phases are used
instead of dates on purpose.

| Phase | State |
| :-- | :-- |
| Phase −1 — risk spike | ✅ done — PDF pipeline decided in [ADR-0007](docs/adr/0007-pdf-export-pipeline.md): HTML + print CSS, no runtime PDF generator |
| Phase 0 — data foundation | ✅ done — `ResumeDocument` schema, validation, normalization, IndexedDB storage, autosave, import/export, migrations, with tests |
| Phase 1 — MVP | ✅ done (2026-09-22) — guided form, ATS + Creative renderers, mode toggle, PDF export, PWA offline, full wipe |
| Phase 2 — optional AI | ✅ done (2026-09-25) — BYO-key flow, bullet/polish/achievement generators with static fallbacks, grounding invariants |
| Phase 3 — experimental | ✅ done (2026-09-26) — PDF import with review, job-description tailoring, ID/EN interface switch |
| Phase 4 — production readiness | 🚧 in progress: license decided (AGPL-3.0, ADR-0013), accessibility audit, cross-browser matrix, security review, release process, public docs + landing |

**Honest note on the current build:** the app works end-to-end (form → preview → PDF → offline). What is still ahead before the first public release: manual screen-reader and physical-device runs, plus the release itself.

## Non-negotiable constraints

These are hard rules, not preferences. Details: [`AGENTS.md`](AGENTS.md) §2 and
[`docs/00-project-context/assumptions-and-constraints.md`](docs/00-project-context/assumptions-and-constraints.md).

- No backend, no server database, no required login for any feature.
- Core flows must work offline once the app shell is installed.
- Static assets only — if it needs a running server, it is out of scope.
- One canonical model (`ResumeDocument`); both renderers read it through view models.
- CV data lives in **IndexedDB**; `localStorage` is only for small UI preferences.
- Nothing is sent over the network unless the user explicitly enables AI for that specific action.
- ATS mode enforces rules (no photo, single column, restricted decoration); a template can never
  override a mode rule, and switching modes never alters source data.
- No third-party runtime scripts, no analytics, no telemetry, no CDN fonts or scripts.
- Export and full wipe must always work.

## Stack

| Layer | Choice |
| :-- | :-- |
| Build | Vite 8 + Bun (package manager) |
| UI | React 19 + TypeScript (strict) + Tailwind CSS 4 + shadcn/base-ui primitives |
| State | Zustand (`vanilla` stores, testable without React) |
| Data | Zod schemas in `src/core/`, Dexie over IndexedDB in `src/storage/` |
| Output | HTML + print CSS (browser print dialog) |
| Tests | Vitest (two projects: `node` and `jsdom`) + Playwright |

## Getting started

Requires [Bun](https://bun.sh) 1.3.14 (the version CI pins).

```bash
bun install
bun run dev          # development server
bun run test:unit:node   # fast unit run (~3 s, no DOM)
bun run verify       # the full gate: lint, format, types, boundaries, tests, build, budget
```

### Scripts

| Script | Purpose |
| :-- | :-- |
| `dev` | Vite dev server |
| `build` | `tsc -b && vite build` — static output in `dist/` |
| `preview` | Serve the production build locally |
| `lint` | Oxlint |
| `format` / `format:check` | Prettier write / check |
| `typecheck` | `tsc -b --noEmit` (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| `check:boundaries` | Enforces the module dependency table (`docs/03-architecture/architecture-overview.md` §5) |
| `check:budget` | Bundle-size ratchet (+10% vs `scripts/bundle-baseline.json`) |
| `test` / `test:unit` | Vitest, both projects |
| `test:unit:node` / `test:unit:jsdom` | One project only (fast local iteration) |
| `test:e2e` | Playwright |
| `verify` | lint → format:check → typecheck → boundaries → unit tests → build → budget |
| `gen:schema` | Regenerate `schemas/resume.schema.json` from the Zod schema |

## Repository layout

```text
src/
├── core/          ResumeDocument schema, validation, migration, normalization → view models
├── storage/       IndexedDB adapter, autosave, cross-tab sync, import/export
├── content/       Bahasa Indonesia micro-copy and the offline action-verb catalog
├── features/      UI grouped by feature (store, form, drafts, …)
├── components/ui/ shadcn/base-ui primitives
└── test/          jsdom setup and test doubles
docs/              Project documentation (Bahasa Indonesia)
plans/             Development plans and the phase changelog
fixtures/          Test ResumeDocuments (fictional data only)
schemas/           Generated JSON Schema — do not edit by hand
scripts/           Build, boundary, and budget tooling
e2e/               Playwright specs
```

Layer rules are enforced mechanically, not by convention: `core/` may not import React, the DOM,
storage or the network; `render/` may not import `storage/`; `content/` may not import anything.
Run `bun run check:boundaries` after moving files.

## Testing

Every change ships with tests appropriate to what changed (see `AGENTS.md` §6). Current baseline:
**780 unit tests** plus Playwright coverage (Chromium + Firefox locally, Chromium on CI). Measured wall-clock and the
jsdom optimization are documented in
[`docs/07-quality/test-strategy.md`](docs/07-quality/test-strategy.md) §7.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md) first. External contributions
are opened after the MVP ships. Anything touching the data schema, a new dependency, offline
behavior, or AI boundaries needs a discussion before code.

**Test data:** fictional only. Never commit real names, contact details, or resumes.

## License

**AGPL-3.0-only** — see [`LICENSE`](LICENSE) and ADR-0013
(`docs/adr/0013-project-license-agpl-3-0.md`, decided 2026-09-26). You may use, modify, and share
this project under those terms; if you run a modified version on a network server, you must offer
its source code to your users (§13 of the license).

---

## Bahasa Indonesia

**cv4every1** adalah pembuat CV gratis, open-source, **local-first**, dan **tanpa akun** yang
menghasilkan dua versi CV — **ATS-oriented** dan **Creative** — dari **satu sumber data** yang sama.
Tanpa backend, tanpa watermark, dan tanpa paywall di langkah terakhir.

Dibuat untuk fresh graduate Indonesia lebih dulu: IPK ditulis `3.52 / 4.00`, organisasi kampus dan
magang diperlakukan sebagai pengalaman yang sah, panduan berbahasa Indonesia muncul di titik
pengisian, dan katalog kata kerja aksi tersedia offline sehingga bantuan penulisan tidak bergantung
pada API berbayar.

**Yang tidak dijanjikan:** tidak ada jaminan lolos ATS, tidak ada skor CV, dan sistem tidak pernah
mengarang angka, nama perusahaan, jabatan, atau keahlian yang tidak Anda berikan.

**Status jujur saat ini:** form terpandu, autosave, manajemen draft, dan impor/ekspor JSON sudah
berfungsi. Renderer ATS/Creative, ekspor PDF, dan mode offline (service worker) masih **dalam
rencana** — jadi aplikasi belum bisa dipakai dari awal sampai PDF.

### Aturan yang tidak bisa dinegosiasikan

Tidak ada server, tidak ada login, fitur inti harus berjalan offline setelah app shell terpasang,
data CV hanya disimpan di IndexedDB perangkat Anda, aturan mode ATS tidak boleh dilanggar template,
dan berpindah mode tidak pernah mengubah data sumber. Tidak ada analytics, telemetri, atau skrip
pihak ketiga saat runtime. Ekspor dan hapus semua data harus selalu berfungsi.

### Menjalankan

```bash
bun install            # sekali saja
bun run dev            # server pengembangan
bun run test:unit:node # unit cepat (±3 detik)
bun run verify         # gerbang lengkap sebelum PR
```

Dokumentasi lengkap berbahasa Indonesia ada di [`docs/README.md`](docs/README.md), dengan peta
konteks per topik di [`docs/context-map.md`](docs/context-map.md). Aturan operasional (termasuk
untuk agen AI) ada di [`AGENTS.md`](AGENTS.md).

**Lisensi: AGPL-3.0** — lihat [`LICENSE`](LICENSE) dan ADR-0013 (diputus 2026-09-26). Anda boleh
memakai, mengubah, dan membagikan proyek ini di bawah ketentuan tersebut; bila menjalankan versi
modifikasi di server jaringan, source code-nya wajib ditawarkan ke pengguna (§13 lisensi).
