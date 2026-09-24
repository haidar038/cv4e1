# Architecture Decision Records

Satu keputusan per berkas. Menjelaskan **mengapa**, bukan **apa** — "apa" ada di `../03-architecture/`.

## Aturan

- **Append-only.** Jangan pernah mengedit ADR yang sudah `Accepted` untuk mengubah maknanya. Buat ADR baru dan tandai yang lama `Superseded by ADR-XXXX`.
- **Status:** `Proposed` · `Accepted` · `Superseded` · `Rejected`
- **Format:** Status, Date, Context, Options, Decision, Consequences (positif **dan** negatif), Rejected alternatives.
- Konsekuensi negatif yang jujur adalah bagian paling berharga dari sebuah ADR. Jangan dihilangkan.

## Daftar

| # | Judul | Status |
| :-- | :-- | :-- |
| [0001](0001-local-first-no-backend.md) | Local-first, tanpa backend | Accepted |
| [0002](0002-indexeddb-over-localstorage.md) | IndexedDB sebagai penyimpanan utama | Accepted |
| [0003](0003-json-as-portable-format.md) | JSON sebagai format portabel | Accepted |
| [0004](0004-two-rendering-engines.md) | Dua renderer dari satu model kanonik | Accepted |
| [0005](0005-ai-as-optional-capability.md) | AI sebagai kapabilitas opsional | Accepted |
| [0006](0006-byo-key-or-server-proxy.md) | BYO-key versus proxy server | Accepted (Opsi 4, 2026-09-23) |
| [0007](0007-pdf-export-pipeline.md) | Pipeline ekspor PDF untuk mode ATS dan Creative | Accepted (2026-09-20) |
| [0008](0008-pdf-import-ocr-pipeline.md) | Pipeline impor PDF: lapisan teks dulu, OCR fallback | Proposed (2026-09-25) |
| [0009](0009-unknown-fields-and-asset-policy.md) | Field tak dikenal + kebijakan aset ekspor | Proposed (2026-09-25) |

## Kandidat ADR berikutnya

| Topik | Pemicu |
| :-- | :-- |
| Font bundel versus font sistem | Sebelum Fase 1 |
| Analytics atau tanpa analytics | Sebelum rilis publik (usulan: tanpa) |
| Lisensi proyek | Sebelum rilis publik (pertanyaan terbuka Q1) |
| Strategi multi-tab | Sebelum Fase 1 |
| Kebijakan dependensi pihak ketiga | Berkelanjutan |
| Tailoring lowongan (schema, sanitasi, grounding) | Sebelum T3b |
| Locale EN / i18n | Sebelum T3c |
