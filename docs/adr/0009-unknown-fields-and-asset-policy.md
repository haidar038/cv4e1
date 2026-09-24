# ADR-0009: Field tak dikenal dipertahankan; aset disematkan di backup saja

- **Status:** Proposed (2026-09-25 — menunggu penerimaan maintainer; menutup TODO `import-export-spec.md` §4–§5)
- **Date:** 2026-09-25
- **Decision owner:** Maintainer proyek
- **Related:** ADR-0002 (IndexedDB), ADR-0003 (JSON portabel), ADR-0008 (pipeline impor), `docs/04-data/import-export-spec.md`, `docs/04-data/migration-policy.md`, C-T7, C-T9

## Context

Dua TODO kontrak publik di `import-export-spec.md` memblokir impor Fase 3
dan stabilitas format ekspor:

1. **§5 — field tak dikenal: simpan atau buang?** Mekanik penyimpanan
   sudah ada sejak Task 3 (D2: field root tak dikenal ditampung di
   `_unknownFields`, bukan ditolak). Yang belum diputus adalah
   *kebijakan*: apakah impor mempertahankannya, apakah ekspor
   menuliskannya kembali, dan apa yang terjadi pada tebakan OCR.
2. **§4 — foto/aset di ekspor.** Aset hidup sebagai Blob di IndexedDB
   dengan `assetRef`; berkas `.cv4e.json` harus bermakna di perangkat
   lain. Tiga opsi di spec (sematkan semua / kecualikan semua / hibrida)
   belum diputus, batas ukuran belum ada.

Prinsip pengikat: C-T9 (migrasi deterministik, tidak pernah hilang data
pengguna), C-T7 (CV di IndexedDB, bukan `localStorage`), FR-110
(ekspor tidak pernah memuat API key — diperluas di sini ke rahasia apa pun).

## Options

**Field tak dikenal:**

1. **Pertahankan round-trip** (status quo D2 dijadikan kebijakan):
   impor menyimpan, ekspor menulis kembali, UI meninjau.
2. Buang diam-diam saat impor: ditolak di muka — melanggar C-T9.
3. Tolak keras (impor gagal bila ada field asing): merusak
   kompatibilitas maju; ditolak.

**Aset di ekspor:**

1. Sematkan base64 di semua jenis ekspor: portabel penuh, berkas
   membengkak, `resume` satu-CV jadi berat dibagikan.
2. Kecualikan di semua jenis ekspor: berkas kecil, foto hilang saat
   pindah perangkat — mengejutkan dan merugikan.
3. **Hibrida (usulan spec): sematkan di `backup`, kecualikan di
   `resume`** — cadangan utuh, berbagi ringan.

## Decision

**Field tak dikenal: Opsi 1 (pertahankan), dengan dua pagar.**

- Impor JSON menyimpan field asing ke `_unknownFields`; ekspor
  menuliskannya kembali apa adanya; round-trip mencakupnya (§7 di
  bawah). UI impor menampilkan catatan jujur
  ("N field tak dikenal dipertahankan") — bukan disembunyikan,
  bukan ditonjolkan sebagai error.
- **Pagar OCR (mengikat ADR-0008):** `_unknownFields` hanya meneruskan
  field yang *sumbernya memilikinya* (impor JSON). Tebakan pipeline
  OCR **dilarang** masuk `_unknownFields` — teks tak terpetakan tampil
  di UI tinjauan sebagai "teks belum terpetakan", tidak diselipkan ke
  dokumen. Ini mencegah karangan terselubung (C-P5) lewat jalur
  kompatibilitas.

**Aset: Opsi 3 (hibrida), dengan batas provisional** (dikonfirmasi
pengukuran saat spike T3a; angka di bawah provisional, bukan final):

- `kind: backup` menyematkan aset sebagai base64; `kind: resume`
  mengecualikan aset dan menulis `assetRef` + catatan
  ("foto tersimpan di perangkat asal, tidak ikut berkas ini").
- Batas: satu aset ≤ 2 MB, total embed per berkas ≤ 5 MB. Aset di
  atas batas dikecualikan dengan peringatan eksplisit per aset
  (nama + ukuran + alasan), bukan gagal total, bukan diam-diam.
  Alasan: IndexedDB menampung MB dengan nyaman, tetapi berkas ekspor
  harus tetap bisa dibagikan lewat kanal biasa.
- Foto yang dikecualikan tidak menghapus apa pun di perangkat asal;
  impor `resume` tanpa aset membuat slot foto kosong yang dapat
  diisi ulang — tidak pernah mengarang foto pengganti.

**Definisi "setara semantik" (§7 spec):** ekspor → impor menghasilkan
dokumen yang sama persis pada perbandingan JSON kanonik (urutan key
diabaikan) **kecuali** amplop (`exportedAt`, `formatVersion` bila
bermigrasi) — termasuk `_unknownFields`, tidak termasuk aset yang
dikecualikan secara sah. Definisi ini menjadi asersi round-trip test.

**Perluasan FR-110:** tidak ada jenis ekspor — `resume`, `backup`,
maupun kandidat impor yang diekspor ulang — yang boleh memuat API key,
token, atau rahasia dalam bentuk apa pun.

## Consequences

**Positif**

- Tidak pernah hilang data diam-diam di impor, ekspor, maupun
  migrasi — satu aturan untuk semua jalur (C-T9 terpenuhi eksplisit).
- Kompatibilitas maju nyata: dokumen versi baru tetap dapat dibuka
  (dengan catatan jujur), bukan ditolak.
- Cadangan utuh (foto ikut), berbagi ringan (foto tidak ikut) —
  perilaku ganda tetapi masing-masing dapat dijelaskan dalam
  satu kalimat.
- Pagar OCR menutup celah karangan via `_unknownFields`.

**Negatif**

- Berkas `backup` berfoto bisa MB-an — lambat dibagikan di koneksi
  terbatas; wajib indikator ukuran sebelum ekspor (pekerjaan UI).
- Dua perilaku aset (`backup` vs `resume`) harus dijelaskan ke
  pengguna; risiko kebingungan "mengapa foto hilang" saat berbagi
  `resume` — dimitigasi catatan eksplisit di berkas + UI.
- Batas 2/5 MB provisional: dapat menolak foto sah beresolusi
  tinggi — pesan harus mengarahkan kompres/ulangi, dan angka final
  menunggu pengukuran.
- `_unknownFields` yang dipertahankan membesar seiring versi —
  migrasi harus memperlakukannya sebagai opasitas (teruskan,
  jangan ditafsirkan).

**Mitigasi negatif**

- Dialog ekspor menampilkan estimasi ukuran sebelum menulis berkas.
- Test round-trip per fixture per rilis memakai definisi §7 di atas.
- Angka batas difinalkan saat spike T3a dengan pengukuran nyata.

## Rejected alternatives

**Buang diam-diam (field):** melanggar C-T9 secara langsung.
Tidak dibahas lagi.

**Tolak keras (field):** menukar kompatibilitas maju dengan
kenyamanan implementasi. Bila suatu versi benar-benar tak dapat
dibaca, penolakan terjadi di gerbang *versi* (pesan membantu,
aturan impor yang ada) — bukan di gerbang *field asing*.

**Sematkan di semua ekspor:** membuat berbagi satu CV semahal
cadangan penuh. Ditolak demi bobot.

**Kecualikan di semua ekspor:** foto hilang saat pindah perangkat
adalah kehilangan data dari sudut pandang pengguna. Ditolak.

**Tebakan OCR ke `_unknownFields`:** karangan terselubung.
Dilarang permanen oleh pagar di atas.
