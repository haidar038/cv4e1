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
| [0006](0006-byo-key-or-server-proxy.md) | BYO-key versus proxy server | **Proposed** |

## Kandidat ADR berikutnya

| Topik | Pemicu |
| :-- | :-- |
| Pipeline PDF (cetak versus renderer terprogram) | Setelah spike S1 — **prioritas tertinggi** |
| Font bundel versus font sistem | Sebelum Fase 1 |
| Analytics atau tanpa analytics | Sebelum rilis publik (usulan: tanpa) |
| Lisensi proyek | Sebelum rilis publik (pertanyaan terbuka Q1) |
| Kebijakan field tak dikenal saat impor | Sebelum format ekspor dianggap stabil |
| Strategi multi-tab | Sebelum Fase 1 |
| Kebijakan dependensi pihak ketiga | Berkelanjutan |
