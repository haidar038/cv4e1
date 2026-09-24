# Fase 3 — Eksperimental (rencana induk)

| Field | Value             |
| :-- | :--               |
| Status | **Rencana — menunggu ADR + keputusan budget C1b** |
| Terakhir diperbarui | 2026-09-24 |
| Prasyarat | Gerbang Fase 2 ditutup (lihat `plans/cv4every1-changelog.md` entri penundaan); `scripts/bundle-baseline.json` hanya berubah via keputusan sadar |
| Gerbang keluar | Ditandai eksperimental; hasil selalu lewat tinjauan manusia (`docs/01-product/roadmap.md` Fase 3) |

> Urutan yang disarankan: ADR impor-OCR + T3a dulu (risiko teknis terbesar: bundle/WASM/offline), lalu T3c (fondasi grounding dwibahasa yang memblokir `translate-en` dan tailoring EN), terakhir T3b. T3b dan T3c dilarang menampilkan angka kecocokan dalam bentuk apa pun.

---

# Task T3a: Impor CV — lapisan teks PDF → fallback OCR → tinjauan manusia

## Requirement

FR-501 (AC-501-a), FR-502 (AC-502-a). Kontrak ekstraksi (format input, batas ukuran, tampilan keyakinan, normalisasi) = requirement baru, belum ada di SRS.

## Context

Impor hari ini hanya `.cv4e.json` (`docs/04-data/import-export-spec.md`). Sketsa OCR ada di `docs/05-ai/ai-product-spec.md` §C4 (semua `[ ]`); asumsi A-T6 menyebut text-layer PDF menangani mayoritas CV digital.

## Goal

Pengguna mengimpor CV lama menjadi kandidat yang ditinjau dan disetujui sebelum menyentuh dokumen final.

## Requirements

- Coba ekstraksi lapisan teks dulu; OCR hanya fallback untuk pindaian/gambar.
- Tampilkan kandidat per field beserta keyakinannya di UI tinjauan; tanpa Apply, dokumen final tidak berubah.
- OCR lokal menjaga data di perangkat; varian LLM (jika ada) wajib consent per operasi (C-T3).
- Fallback non-AI selalu ada: entri manual sebagai jalur utama.

## Non-goals

- OCR via layanan server; klaim akurasi; impor menimpa draft tanpa konfirmasi; impor DOCX.

## Acceptance criteria

- [ ] Unggah PDF digital → kandidat tampil + keyakinan per field → final utuh sebelum setuju (AC-501-a/502-a).
- [ ] PDF pindaian/gambar → fallback OCR atau arahan entri manual yang jelas.
- [ ] Berkas rusak/oversize/gagal OCR → pesan Bahasa Indonesia + state tidak berubah.
- [ ] Foto/aset dari CV lama mengikuti aturan `import-export-spec.md` §4 yang diputuskan.

## Edge cases to handle

- Bom ukuran (AB-1), PDF tanpa lapisan teks, OCR gagal total, field tak dikenal (AB-9), aset rusak, teks injeksi di CV (AB-4), storage penuh saat simpan hasil tinjauan.

## Files likely affected

- `src/storage/import-*` (baru: text-layer, normalisasi kandidat), `src/features/import/` (UI tinjauan), `fixtures/import-*`, `e2e/import.spec.ts`, `docs/04-data/import-export-spec.md` (keluar dari TODO §4/§5).

## Docs to read first

- `docs/04-data/import-export-spec.md`, `docs/05-ai/ai-product-spec.md` §C4, `docs/05-ai/ai-fallback-strategy.md`, `docs/06-security/threat-model.md`, `docs/06-security/abuse-cases.md`, `docs/02-requirements/srs.md` FR-104..110, FR-501/502.

## Definition of Ready (T3a)

- [ ] Requirement ekstraksi baru tertulis + AC testable — BELUM (perlu SRS).
- [ ] Dampak `ResumeDocument`: none/additive/breaking — BELUM (field `confidence`/`source` butuh putusan C-T9).
- [ ] Dampak offline: OCR lokal vs LLM — BELUM (bagian ADR).
- [ ] Dampak aksesibilitas UI tinjauan — BELUM.
- [ ] Dampak privasi: LLM = egress di balik consent — BELUM diputus.
- [ ] Edge cases utama — terdaftar di atas.
- [ ] Dependensi baru (pdf.js, Tesseract WASM): fungsi, alasan tak hand-write, dampak bundle, lisensi, maintenance, rencana bila ditinggalkan — BELUM (wajib per `dependency-policy.md`).

---

# Task T3b: Pencocokan deskripsi lowongan (sorot celah, tanpa mengarang skill)

## Requirement

Belum ada FR/AC — perlu SRS baru. Rujukan konseptual: `ai-product-spec.md` §C3 (sketsa `[ ]`), `feature-catalog.md` F-E6 (P2).

## Context

Pola grounding/invariant + set tolak injection dari Fase 2 dipakai ulang; `tailorToJob` baru sketsa di `ai-provider-strategy.md`.

## Goal

Pengguna menempel deskripsi lowongan dan menerima kata kunci, celah, dan saran section yang masuk dokumen hanya via Apply eksplisit.

## Requirements

- Output = kata kunci ditemukan, kata kunci belum didukung data, section perlu diperkuat, pertanyaan klarifikasi; tidak pernah menyatakan skill baru (C-P5).
- Minimisasi data: hanya field relevan yang dikirim ke provider, di balik consent per operasi.
- Fallback non-AI: pencocokan kata kunci sederhana yang lulus test.
- Sanitise teks lowongan tak tepercaya (AB-3); prompt injection diabaikan dan diuji.

## Non-goals

- Skor kecocokan (dilarang `glossary.md` §6); tulis-ulang CV otomatis; klaim peluang lolos.

## Acceptance criteria

- [ ] Diberi lowongan + dokumen → panel menampilkan keywords/gaps/saran/klarifikasi tervalidasi schema.
- [ ] Injeksi di teks lowongan diabaikan (uji AB-3/AB-4 hijau).
- [ ] Tanpa fakta baru: invariant grounding hijau; draft utuh sebelum Apply.
- [ ] Tanpa kunci/offline → fallback kata kunci + nota FR-408 yang jujur.

## Edge cases to handle

- Lowongan sangat panjang (truncation + penanda `[dipotong]`), bahasa campuran, lowongan kosong, provider timeout/429 (retry T21 dipakai ulang), pengguna meminta AI mengarang (AB-15 → tolak dengan panduan).

## Files likely affected

- `src/features/ai/tailor-*` (orkestrator + panel + prompt loader pola T19), `prompts/id/jd-tailoring.v1.md` (baru), fixture + runner eval tailoring baru, `e2e/ai-tailoring.spec.ts`.

## Docs to read first

- `docs/05-ai/ai-product-spec.md` §C3, `docs/05-ai/prompt-specification.md`, `docs/05-ai/hallucination-policy.md`, `docs/05-ai/ai-fallback-strategy.md`, `docs/06-security/abuse-cases.md`, `docs/00-project-context/glossary.md` §6.

## Definition of Ready (T3b)

- [ ] FR + AC tailoring baru — BELUM (perlu SRS).
- [ ] Dampak `ResumeDocument`: none (saran kandidat, bukan field baru) — TERISI (asumsi, konfirmasi saat desain).
- [ ] Dampak offline: fallback keyword-matcher — TERISI (wajib ada).
- [ ] Dampak aksesibilitas panel — BELUM.
- [ ] Dampak privasi: teks lowongan + field CV ke provider di balik consent — BELUM diputus rinci.
- [ ] Edge cases utama — terdaftar di atas.
- [ ] Dependensi baru — tidak ada (pakai ulang retry/consent/grounding Fase 2).

---

# Task T3c: Locale Bahasa Inggris (pengalih ID/EN)

## Requirement

FR-204/AC-204-a/b (hanya gating micro-copy) ADA; switcher penuh = requirement baru, belum ada di SRS. `use-cases.md` mencatat "Mengganti bahasa antarmuka" sebagai UC yang perlu ditulis.

## Context

Struktur locale disiapkan sejak Task 13a; aturan di `docs/01-product/localization-guide.md` §5–§6; preferensi `locale` tinggal di `localStorage` per ADR-0002 (bukan data CV).

## Goal

Pengguna mengganti bahasa antarmuka ID↔EN dengan fallback aman bila kunci terjemahan hilang.

## Requirements

- Switcher ID/EN yang persisten (preferensi kecil di `localStorage`); default `id`.
- Locale `en` menonaktifkan micro-copy khas Indonesia (AC-204-a); locale `id` menampilkannya (AC-204-b).
- Kunci hilang → fallback ID tanpa crash; format tanggal/angka mengikuti locale aktif.
- Copy EN lolos lint frasa terlarang yang sama (`localization-guide.md` §6).

## Non-goals

- Terjemahan isi CV otomatis (`translate-en` tetap degradasi graceful hingga desain dwibahasa selesai); pluralisasi sempurna; locale ketiga.

## Acceptance criteria

- [ ] Given locale `en` → micro-copy ID hilang, label EN tampil; Given kembali `id` → sebaliknya.
- [ ] Kunci hilang → fallback + tanpa layar kosong (diuji).
- [ ] Preferensi bertahan setelah tab ditutup; alur inti tetap offline.
- [ ] Keyboard-only mencapai dan mengoperasikan switcher; audit axe bersih di permukaannya.

## Edge cases to handle

- Kunci terjemahan hilang sebagian, format tanggal ID vs EN, katalog Action Verbs EN (terpisah vs pemetaan — putusan ADR), teks panjang Jermanik memecah layout.

## Files likely affected

- `src/content/locales/id/*.json`, `en/...` (baru/isi), switcher UI, `src/content/microcopy/*`, lint frasa terlarang dwibahasa, `e2e/locale.spec.ts`.

## Docs to read first

- `docs/01-product/localization-guide.md`, `docs/00-project-context/glossary.md` §6, `docs/adr/0002-indexeddb-over-localstorage.md`, `docs/02-requirements/acceptance-criteria.md` AC-204.

## Definition of Ready (T3c)

- [ ] FR + AC switcher baru — BELUM (perlu SRS + UC).
- [ ] Dampak `ResumeDocument`: none — TERISI (locale = preferensi UI).
- [ ] Dampak offline: none (paket lokal) — TERISI, waspadai bobot bundle (pelajaran C1b).
- [ ] Dampak aksesibilitas: switcher keyboard + pengumuman locale — BELUM diuji.
- [ ] Dampak privasi: tidak ada egress — TERISI.
- [ ] Edge cases utama — terdaftar di atas.
- [ ] Dependensi baru — tidak ada (tanpa framework i18n kecuali dijustifikasi).

---

## ADR yang dibutuhkan sebelum implementasi (AGENTS.md §9)

1. **Pipeline impor PDF/OCR** — text-layer vs Tesseract WASM vs LLM; bundle/offline (C-T10), egress (C-T3), batas ukuran, perlakuan foto/aset, alternatif ditolak + konsekuensi negatif.
2. **Tailoring lowongan** — schema input/output, minimisasi data, sanitasi injection, grounding-sebagai-kode, fallback keyword-matcher, consent per operasi, kenapa bukan skor (§6).
3. **Locale EN / i18n** — struktur `src/content/locales/`, fallback kunci hilang, cakupan terjemah vs khusus-`id`, tanggal/plural, strategi Action Verbs EN, lint dwibahasa.
4. **Kebijakan field tak dikenal + aset base64** (kandidat di `docs/adr/README.md`, TODO `import-export-spec.md` §4) — wajib sebelum hasil OCR dinormalisasi; field baru → bump versi + migrasi (C-T9).
5. **Justifikasi dependensi runtime baru** (pdf.js, tesseract.js bila dipilih) per `dependency-policy.md` — boleh gabung ke ADR nomor 1.
