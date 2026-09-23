# Roadmap — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Fase, bukan tanggal. Proyek satu orang dengan waktu paruh — estimasi tanggal akan salah dan merusak kepercayaan pada dokumen ini.

---

## Fase −1 — Spike risiko (sebelum apa pun dibangun)

Membuktikan asumsi yang, jika salah, membatalkan rencana. Lihat `../00-project-context/assumptions-and-constraints.md` §5.

- [x] **S1 — Kesetiaan PDF** *(pemblokir)*: render CV statis → ekspor PDF → ekstraksi teks → verifikasi pemulihan di Chrome, Firefox, Safari
- [ ] **S2 — Paginasi**: perilaku 1–2 halaman lintas peramban
- [ ] **S3 — Ketahanan storage**: uji pengusiran IndexedDB di Safari iOS; uji `navigator.storage.persist()`
- [ ] **S4 — Riset**: ekstraksi teks dari keluaran kompetitor (R1), pemetaan aplikasi CV Indonesia (R2)
- [ ] **S5 — Micro-copy**: uji moderasi ringan dengan 5 fresh graduate

**Gerbang keluar:** S1 lulus, atau pipeline PDF didesain ulang lewat ADR.

## Fase 0 — Fondasi

- [x] `ResumeDocument` + Zod schema + JSON Schema tergenerate
- [x] Validasi, normalisasi, view model
- [x] Adapter IndexedDB, autosave, manajemen draft
- [x] Impor/ekspor JSON + uji round-trip
- [x] Kerangka migrasi + fixture
- [x] Rig pengujian, CI, anggaran performa

**Gerbang keluar:** data dapat disimpan, dimuat, diekspor, diimpor, dan dimigrasi, dengan test. — **✅ LULUS (2026-09-20)**

## Fase 1 — MVP

- [x] Form terpandu seluruh section
- [x] Micro-copy Bahasa Indonesia (IPK, status pendidikan, kontak, organisasi)
- [x] Renderer ATS dengan penegakan aturan
- [x] Renderer Creative (1–2 template)
- [x] Toggle mode + peringatan kontekstual foto
- [x] Action Verbs Catalog + UI saran
- [x] Ekspor PDF
- [x] Service worker PWA + offline penuh
- [x] Hapus semua data
- [x] Peringatan penyimpanan lokal + dorongan ekspor

**Gerbang keluar:** kriteria di `prd.md` §10 terpenuhi; seluruh alur inti lulus test offline. — **✅ LULUS (2026-09-22)**

## Fase 2 — AI opsional

- [x] Antarmuka `AIProvider` + `StaticSuggestionProvider` (Task 16)
- [x] Alur BYO-key + layar persetujuan (Task 18)
- [ ] Generator bullet + validasi structured output
- [ ] Polish (ID/EN)
- [ ] Uji invariant grounding + set evaluasi
- [ ] Penanganan rate limit, timeout, dan kegagalan penyedia

**Gerbang keluar:** nol pelanggaran grounding pada set evaluasi; seluruh fitur AI punya fallback yang lulus test.

## Fase 3 — Eksperimental

- [ ] Impor CV: ekstraksi lapisan teks PDF → fallback OCR → ekstraksi field → UI tinjauan
- [ ] Pencocokan deskripsi lowongan (menyorot celah, tidak pernah mengarang skill)
- [ ] Locale Bahasa Inggris

**Gerbang keluar:** ditandai eksperimental; hasil selalu lewat tinjauan manusia.

## Fase 4 — Kesiapan produksi

- [ ] Audit aksesibilitas penuh
- [ ] Uji lintas peramban terhadap matriks
- [ ] Tinjauan keamanan dan privasi
- [ ] Proses rilis, rollback, runbook
- [ ] Dokumentasi publik dan halaman pendaratan
- [ ] Keputusan lisensi (Q1)

## Yang secara sengaja tidak dijadwalkan
- Akun dan sinkronisasi cloud
- Aplikasi native
- Ekspor DOCX
- Template kontribusi komunitas
- Analytics
