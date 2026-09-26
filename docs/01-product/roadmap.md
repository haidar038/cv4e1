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
- [x] Generator bullet + validasi structured output (Task 19: prompt berversi, orkestrator DF-6, panel pratinjau + Apply per-item, fallback statis terkabel)
- [x] Polish (ID/EN)
- [x] Uji invariant grounding + set evaluasi (Task 22: set terima 8+4 + set tolak 4+4, runner per-versi-prompt di CI; ber-key tetap manual)
- [x] Penanganan rate limit, timeout, dan kegagalan penyedia (Task 21: retry terbatas 1+2 dengan backoff + hormat `Retry-After` max 10 dtk, fallback statis saat habis, nota FR-408 per-kode)

**Gerbang keluar:** nol pelanggaran grounding pada set evaluasi; seluruh fitur AI punya fallback yang lulus test.

**Status gerbang: LULUS (2026-09-25).** Penahan 2026-09-24 terselesaikan: (1) re-baseline sadar opsi (a) atas persetujuan maintainer — build produksi diulang, `check:budget` hijau semua ratchet +0,0% (lihat `docs/07-quality/performance-budget.md` entri re-baseline pasca-C1b); utang absolut >200 KB tetap advisory. (2) eval manual ber-key v1 tercatat di `docs/05-ai/manual-eval-protocol.md` §5.1 (Groq `openai/gpt-oss-120b`, bullet + polish sesuai ekspektasi, nol pelanggaran grounding teramati). Diketahui non-pemblokir: 12 `color-contrast` pra-ada milik restyle StorageNotice — masuk audit aksesibilitas Fase 4, bukan kriteria gerbang AI (grounding + fallback hijau: unit 70 file / 628 test, e2e AI 32/32).

## Fase 3 — Eksperimental

- [x] Impor CV: ekstraksi lapisan teks PDF → fallback OCR → ekstraksi field → UI tinjauan (T3a Done 2026-09-26: re-baseline sadar opsi (a), `check:budget` hijau semua +0,0%; ADR-0010 Accepted)
- [x] Pencocokan deskripsi lowongan (T3b Done: hibrida statis-default + LLM opsional, JD transien, grounding invariant + probe injection; tanpa re-baseline — semua ratchet hijau)
- [x] Pengalih bahasa ID/EN (T3c Done 2026-09-25: pack EN bertipe + fallback per-kunci + katalog verbs EN terpisah + switcher persisten `localStorage`; ADR-0012 Accepted, FR-701–704; tanpa re-baseline — semua ratchet hijau)

**Gerbang keluar:** ditandai eksperimental; hasil selalu lewat tinjauan manusia.

## Fase 4 — Kesiapan produksi

- [x] Audit aksesibilitas penuh — F4a Done 2026-09-26 (e2e 26/26 + keyboard walkthrough; uji SR manual terbuka)
- [x] Uji lintas peramban terhadap matriks — F4b Done 2026-09-26 (matriks v1.0; Chromium/FF/WebKit-probe/Pixel; fisik manual terbuka)
- [x] Tinjauan keamanan dan privasi — F4c Done 2026-09-26 (SafeLink + CSP definitif + ADR-0014; pasang header menunggu Q2)
- [x] Proses rilis, rollback, runbook — F4d Done 2026-09-26 (prosedur v1.0 + vercel.json + dry-run hijau)
- [x] Dokumentasi publik dan halaman pendaratan — F4e Done 2026-09-26 (landing ID/EN + footer legal + README)
- [x] Keputusan lisensi (Q1) — AGPL-3.0, ADR-0013 (2026-09-26)
- [x] Desain dwibahasa translate-en — F4g Done 2026-09-26 (konten CV mengikuti locale dokumen; tanpa FR baru)

## Yang secara sengaja tidak dijadwalkan
- Akun dan sinkronisasi cloud
- Aplikasi native
- Ekspor DOCX
- Template kontribusi komunitas
- Analytics
