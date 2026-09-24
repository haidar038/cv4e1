# ADR-0008: Pipeline impor PDF — lapisan teks dulu, OCR sebagai fallback

- **Status:** Proposed (2026-09-25 — menunggu penerimaan maintainer; T3a dilarang mulai sebelum Accepted)
- **Date:** 2026-09-25
- **Decision owner:** Maintainer proyek
- **Related:** ADR-0001 (local-first), ADR-0003 (JSON portabel), ADR-0004 (dua renderer), ADR-0005 (AI opsional), ADR-0006 (BYO-key Opsi 4), ADR-0007 (ekspor PDF), `docs/04-data/import-export-spec.md` §4–§6, `docs/05-ai/ai-product-spec.md` §C4, FR-501/FR-502

## Context

Fase 3 membutuhkan impor CV lama (F-H5): mengubah PDF karya orang menjadi
**kandidat** `ResumeDocument` yang ditinjau manusia sebelum disimpan
(FR-501, FR-502). Batasan yang mengikat keputusan ini:

- C-T1 (tanpa backend), C-T3 (data CV tidak keluar perangkat kecuali
  consent operasi AI spesifik itu), inti offline (C-P1/P2),
  C-P5 (tidak mengarang fakta), NFR-008 (transfer kunjungan pertama ≤ 400 KB).
- Sebagian besar CV digital memiliki lapisan teks — OCR hanya dibutuhkan
  untuk pindaian/gambar (`ai-product-spec.md` §C4, asumsi A-T6).
- Lapisan teks adalah kebalikan pipeline ADR-0007: di sana kita menjamin
  teks *keluar* dengan benar; di sini kita membaca teks *masuk* dengan benar.

## Options

1. **Lapisan teks (pdf.js) → fallback OCR lokal (Tesseract WASM) →
   kandidat heuristik deterministik → tinjauan manusia.** Tanpa LLM di T3a.
2. **Ekstraksi + pemetaan field via LLM** (kirim teks PDF ke penyedia):
   pemetaan paling akurat, tetapi butuh kunci + consent + jaringan —
   melanggar semangat offline untuk fitur eksperimental.
3. **Layanan OCR server:** ditolak di muka — melanggar C-T1.
4. **Tanpa impor PDF** (hanya entri manual + impor JSON): paling aman,
   tetapi mengubur F-H5 tanpa mencoba.
5. **Pemetaan field LLM sebagai varian Opsi 1** (heuristik default, LLM
   opsional di balik consent ADR-0006): dibahas di bawah sebagai
   pekerjaan lanjutan, bukan bagian keputusan ini.

## Decision

**Opsi 1, dengan pemetaan field heuristik deterministik dan LLM
secara eksplisit di luar scope T3a.**

Alur: unggah PDF → validasi ukuran pre-parse (AB-1) → ekstraksi lapisan
teks via pdf.js → bila teks kosong/tipis, render halaman ke gambar lalu
OCR via Tesseract WASM (`ind` + `eng`) → kandidat field via heuristik
(pola header section ID/EN, pola tanggal, email/telepon/tautan —
pola yang sama dengan validasi schema yang ada) → tiap kandidat membawa
**keyakinan** → UI tinjauan (FR-501/502) → simpan hanya via persetujuan
eksplisit. Entri manual tetap jalur utama dan fallback abadi.

Aturan keras pipeline:

- **Teks dulu, piksel kemudian.** OCR tidak pernah berjalan untuk PDF
  yang lapisan teksnya cukup — hemat unduhan aset MB-an dan waktu.
- **Kandidat, bukan kebenaran.** Skor keyakinan heuristik tidak pernah
  ditampilkan sebagai angka kualitas CV (glossary §6).
- **Foto dari CV lama tidak diekstrak di T3a.** Kandidat tanpa foto;
  pengguna menambah foto lewat alur foto yang sudah ada (aturan mode
  ATS tak tersentuh). Gambar ter-embed yang terdeteksi dilaporkan
  sebagai catatan, bukan diimpor diam-diam.
- **Batas provisional** (dikonfirmasi pengukuran saat spike T3a):
  PDF ≤ 10 MB, render OCR ≤ 200 DPI per halaman, maksimal 5 halaman
  diproses (CV lebih panjang → minta pilih halaman atau entri manual).
  Validasi ukuran **sebelum** parse, sebelum apa pun menyentuh state.
- **Nol kode impor di JS awal.** pdf.js dan Tesseract dimuat sebagai
  chunk lazy saat pengguna membuka impor; aset traineddata diambil
  on-demand dan di-cache (Cache Storage) — transfer kunjungan pertama
  NFR-008 tidak tersentuh.
- **Syarat mulai T3a:** spike memposting angka bundle terukur
  (pdf.js chunk + Tesseract core/worker + traineddata `ind`/`eng`
  ter-cache) karena `dependency-policy.md` menuntut angka, bukan
  perkiraan. Estimasi ordo (wajib diverifikasi): pdf.js ratusan KB
  minified; Tesseract inti+worker ~1 MB class + traineddata MB class —
  semuanya di luar JS awal dan di luar kunjungan pertama.

Justifikasi dependensi (ringkas; detail penuh saat spike):

- `pdfjs-dist` (Mozilla, Apache-2.0, dipelihara aktif, nyaris nol
  dependensi transitif): menulis ekstraktor teks PDF sendiri berarti
  menulis ulang parser PDF — tidak wajar. Bila ditinggalkan: kebutuhan
  baca teks PDF stabil, versi di-pin; jalur teks adalah inti impor,
  tetapi impor JSON + entri manual tak terpengaruh.
- `tesseract.js` (Apache-2.0, mendukung `ind` + `eng`): OCR adalah
  fallback-only; bila ditinggalkan atau kualitas `ind` buruk, fitur
  terdegradasi ke entri manual tanpa merusak apa pun. Aset bahasa
  diambil on-demand, bukan dibundel.
- Keduanya lolos penolakan otomatis: tanpa phone-home runtime
  (aset traineddata dari host yang sama dengan app shell),
  lisensi diizinkan, tanpa post-install.

## Consequences

**Positif**

- Data tetap di perangkat di seluruh jalur default (C-T3 tanpa
  pengecualian; tanpa kunci, tanpa jaringan untuk PDF digital).
- PDF digital — kasus mayoritas — terimpor tanpa aset MB-an.
- Heuristik deterministik dapat diuji invariant tanpa mock AI;
  perilakunya stabil antar run (evaluasi §C4 jadi mekanis).
- Konsisten dengan ADR-0005/0006: tanpa AI sebagai syarat,
  tanpa backend, tanpa akun.

**Negatif**

- Kualitas OCR Bahasa Indonesia di bawah layanan server; layout
  dua kolom/tabel dapat menghasilkan urutan teks kacau — inilah
  alasan tinjauan manusia wajib, bukan opsional.
- Aset on-demand MB-an pada pemakaian OCR pertama (pemuatan
  lambat di koneksi terbatas; wajib indikator progres + pembatalan).
- Dua dependensi berat dipelihara satu orang (P10); permukaan
  `npm audit` bertambah.
- Heuristik pemetaan rapuh untuk layout tak biasa — daftar
  "tidak didukung" harus jujur di UI, bukan disembunyikan.
- Batas 5 halaman/10 MB akan menolak sebagian CV panjang —
  pesan harus membantu (arahan pilih halaman / entri manual),
  bukan sekadar error.

**Mitigasi negatif**

- UI tinjauan menampilkan sumber tiap kandidat (teks/OCR) +
  keyakinan; field berkadar rendah wajib diketik ulang.
- Aset traineddata di-cache setelah unduhan pertama; unduhan
  dapat dibatalkan; mode offline memakai cache atau menolak
  dengan jujur (FR-408: nonaktif dengan alasan).
- `npm audit` + pin versi di lockfile; evaluasi ulang tahunan.

## Rejected alternatives

**LLM-only (Opsi 2):** akurasi pemetaan terbaik, tetapi menjadikan
fitur eksperimental bergantung pada kunci + jaringan + egress data —
kebalikan prioritas local-first. Dapat diusulkan lagi sebagai ADR
superseding dengan model consent ADR-0006 bila heuristik terbukti
tak cukup — bukan sekarang.

**Varian LLM-opsional (Opsi 5):** ditunda ke pasca-T3a. Alasan:
permukaan keputusan (minimisasi data, sanitasi injection AB-4,
grounding dwibahasa) layak dapat ADR tailoring-nya sendiri
bersama T3b, bukan diselipkan di ADR impor.

**Layanan OCR server (Opsi 3):** melanggar C-T1. Tidak dibahas lagi.

**Tanpa impor PDF (Opsi 4):** F-H5 adalah janji roadmap Fase 3;
jalur lokal ini membuktikan atau menggugurkan janji itu dengan
risiko terkendali. Bila spike menunjukkan kualitas tak layak,
Opsi 4 kembali sebagai keputusan sadar — bukan default.

**Impor DOCX:** di luar scope. Tidak ada FR, tidak ada spike,
tidak dibahas.
