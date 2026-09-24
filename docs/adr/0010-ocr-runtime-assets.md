# ADR-0010: Aset runtime OCR dari CDN berversi + Cache Storage

- **Status:** Accepted (2026-09-26 — re-baseline T3a)
- **Date:** 2026-09-26
- **Decision owner:** Maintainer proyek
- **Related:** ADR-0008 (dipersupersede parsial: klausa hosting aset), ADR-0001, NFR-008, C-T3, C-T10, spike T3a (`experiments/import-spike/`, `plans/cv4every1-changelog.md`)

## Context

ADR-0008 memutuskan aset Tesseract (worker, inti WASM, traineddata)
"dari host yang sama dengan app shell". Pengukuran spike T3a
membuktikan klausa itu tak dapat dipertahankan tanpa merusak metrik
yang justru melindunginya:

- `transferGzip` menjumlahkan **setiap** berkas di `dist/`
  (`scripts/bundle-budget.ts`): mem-vendor 6,7 MB (inti ±2,78 MB +
  `ind` 1,14 MB + `eng` 2,82 MB) ke `public/` akan meledakkan metrik
  kunjungan-pertama 20× lipat dan memaksanya di-precache service
  worker — mengunduh 6,7 MB pada kunjungan pertama untuk fitur yang
  dipakai segelintir pengguna.
- Fakta yang meringankan: mengunduh berkas model publik **bukan**
  egress data resume (C-T3 tak tersentuh — tidak ada byte CV yang
  keluar); yang keluar hanya GET anonim ke berkas publik berversi.

## Options

1. **Vendor ke `public/` + ubah semantik `transferGzip`.**
   Jujur secara hosting, tetapi merusak metrik, membengkakkan repo
   ±6,7 MB biner, dan memaksa pengecualian precache SW. Ditolak.
2. **CDN berversi + pin Cache Storage (dipilih).** Worker, inti, dan
   traineddata diambil on-demand dari URL jsdelivr yang di-pin ke
   versi persis, lalu di-pin di Cache Storage; pemakaian berikutnya
   offline-penuh. Tanpa byte OCR di JS awal, di precache, maupun di repo.
3. **Tanpa OCR shipped (teks saja).** Aman, tetapi mengubur fallback
   pindaian yang dijanjikan ADR-0008. Ditolak — atau kembali sebagai
   keputusan sadar bila opsi 2 gagal di e2e manual.

## Decision

**Opsi 2, dengan pagar eksplisit:**

- URL di-pin di kode (`ocr-text.ts`): `tesseract.js@7.0.0`
  (`worker.min.js`), `tesseract.js-core@v7.0.0`, traineddata
  `@tesseract.js-data/{ind,eng}/4.0.0_best_int` — bump hanya via ADR.
- Unduhan terjadi **hanya** saat pengguna menjalankan impor berkas
  berlapisan-tipis (aksi eksplisit), dengan progres + pembatalan +
  nota FR-408 (`ocrDownloadNote`: butuh internet sekali).
- Setelah ter-cache, OCR berfungsi offline penuh (jalur ini diuji
  dengan cache hangat).
- Default mekanisme tesseract.js (worker blob + IDB/cache adapter)
  dipakai apa adanya; tidak ada kredensial, cookie, atau data CV
  yang menyertai GET (GET anonim ke berkas publik).
- Klausa ADR-0008 tentang "host yang sama" **dipersupersede oleh
  ADR ini** untuk aset runtime OCR saja; sisa ADR-0008 utuh
  (teks-dulu, heuristik, tinjauan wajib, tanpa LLM, tanpa foto).

## Consequences

**Positif**

- NFR-008 dan repo tetap ramping: nol byte OCR di bundle, precache,
  maupun git — fitur MB-an berperilaku seperti fitur KB-an sampai
  dipakai.
- Tidak ada egress data resume di seluruh pipeline (C-T3 bersih).
- Versi pin + Cache Storage = deterministik dan offline setelah
  pemakaian pertama; bump versi terlacak sebagai keputusan.
- C-T10 terpenuhi lewat mekanisme yang disediakan constraint itu
  sendiri (persetujuan via ADR ini).

**Negatif**

- OCR pertama butuh internet + mengunduh ±6,7 MB (dua bahasa) —
  berat di koneksi terbatas; wajib progres/pembatalan/catatan jujur.
- Ketergantungan ketersediaan jsdelivr; bila CDN mati saat
  pemakaian pertama, jawaban jujur `OCR_UNAVAILABLE` + entri manual
  (bukan diam).
- Skrip worker + inti WASM dieksekusi dari CDN: rantai pasok
  (supply chain) lebih panjang daripada self-host. Mitigasi:
  pin versi + tindak lanjut SRI/subresource-integrity + evaluasi
  self-host terjadwal (dicatat, bukan dijanjikan tanggal).
- Cache Storage dapat diusir peramban seperti IndexedDB —
  perilaku eviction sama dengan data draft (terdokumentasi di
  strategi penyimpanan).

**Mitigasi negatif**

- Nota unduhan + progres + batal di UI; mode offline ber-cache
  diuji; tanpa cache → tolak dengan alasan (FR-408).
- Tindak lanjut tercatat: SRI pin + evaluasi ulang self-host
  bila metrik budget direstrukturisasi.

## Rejected alternatives

**Vendor `public/` (Opsi 1):** menghancurkan makna `transferGzip`
dan memaksa 6,7 MB ke setiap kunjungan pertama via precache.
Bisa hidup kembali hanya bersama restrukturisasi metrik +
pengecualian precache — paket yang lebih besar dari masalahnya.

**Tanpa OCR (Opsi 3):** cadangan bila opsi 2 gagal terbukti di
lapangan, bukan default.
