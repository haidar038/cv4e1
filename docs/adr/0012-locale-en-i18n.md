# ADR-0012: Pengalih bahasa ID/EN — pack bertipe, fallback aman, lint dwibahasa

- **Status:** Accepted (2026-09-25 — disetujui maintainer bersama FR-701–FR-704; membuka implementasi T3c)
- **Date:** 2026-09-25
- **Decision owner:** Maintainer proyek
- **Related:** P9 + Q6 (`docs/00-project-context/vision.md`), F-G5 (`docs/01-product/feature-catalog.md`, P1, Fase 3), FR-204/AC-204-a/b, FR-701–FR-704 (diusulkan bersama ADR ini, preseden FR-601–FR-604/ADR-0011), ADR-0002, D15 (typed microcopy di `src/content/microcopy/id.ts`), glossary §6–§7, `localization-guide.md` (outline v0.1)

## Context

P9 menetapkan Bahasa Indonesia sebagai warga kelas satu: micro-copy dirancang
dalam Bahasa Indonesia dulu, lalu diterjemahkan ke Bahasa Inggris. F-G5
(Pengalih bahasa ID/EN, P1, Fase 3) adalah implementasi prinsip itu, sekaligus
menjawab Q6 vision (Bahasa Inggris ditunda ke Fase 3, bukan MVP).

Tiga fakta yang membatasi desain:

1. **Belum ada FR-xxx untuk switcher di SRS.** Yang ada hanya FR-204/AC-204-a/b
   (micro-copy Indonesia nonaktif saat locale bukan `id` — gating, bukan
   switcher penuh). Penomoran FR-701–FR-704 di bawah diusulkan bersamaan dengan
   penerimaan ADR ini, mengikuti preseden T3b (FR-601–FR-604 diputus bersama
   penerimaan ADR-0011).
2. **Struktur aktual berbeda dari outline.** Microcopy tinggal di
   `src/content/microcopy/id.ts` sebagai pack bertipe — penyimpangan sadar D15
   dari `localization-guide.md` §5 (`locales/*.json`), karena pack bertipe
   membuat build gagal bila kunci hilang. `getMicrocopy` mengembalikan `null`
   untuk locale `en`, `useMicrocopy` jatuh ke `microcopyStructural` (label
   struktural ada, guidance Indonesia dikosongkan — FR-204). `ui-store.locale`
   bertipe `'id' | 'en'` default `'id'`; `mirrorDocumentPreferences` menyalin
   `meta.locale` dokumen saat dibuka. Yang belum ada: pack EN, persistensi
   preferensi di `localStorage`, dan komponen switcher.
3. **`localization-guide.md` masih outline v0.1.** §5 (layout `locales/*.json`)
   dan §4 (path katalog lama) sudah usang terhadap kode; ADR ini mencatat
   penyimpangan sadar lanjutan, bukan mengikuti outline mentah-mentah.

## Options

1. **Framework i18n runtime.** Ekosistem matang (plural, interpolasi, lazy-load
   locale), tetapi: menambah dependensi runtime untuk dua locale (melanggar
   P10 — setiap dependensi adalah utang pada proyek satu orang), menambah bobot
   bundle untuk nilai yang sebagian besar bisa ditulis manual, dan pola
   string-key mentah kehilangan jaminan build-gagal-bila-kunci-hilang milik
   D15. Ditolak.
2. **File JSON mentah per outline §5 (`locales/id/*.json`, `en/...`).**
   Sesuai dokumen lama, tetapi: kunci hilang baru ketahuan saat runtime,
   tanpa autocomplete, dan aturan blanking FR-204 harus diimplementasikan
   terpisah dari tipe. Kehilangan satu-satunya keunggulan struktural yang
   sudah terbukti di Fase 1. Ditolak sebagai struktur utama.
3. **Pack bertipe mirror + fallback per-kunci ke ID (dipilih).**
   `src/content/microcopy/en.ts` sebagai mirror bertipe `MicrocopyPack` yang
   sama dengan `id.ts`; kunci EN yang hilang jatuh ke string ID per-kunci
   (tidak pernah null/crash/permukaan kosong); guidance khas Indonesia tetap
   blank di EN (FR-204 dipertahankan); tanggal/angka via `Intl` bawaan;
   katalog Action Verbs EN terpisah; pack EN ditulis manual manusia.

## Decision

**Opsi 3, dengan pagar eksplisit:**

- **Struktur pack.** `en.ts` adalah mirror bertipe `MicrocopyPack` — kunci
  yang belum diterjemahkan membuat build gagal (D15), bukan halaman kosong
  saat runtime. `getMicrocopy('en')` mengembalikan pack EN; fallback berjalan
  **per-kunci** ke string ID, dicatat oleh test sweep agar kunci yang belum
  diterjemahkan terlihat di CI, bukan oleh pengguna.
- **Cakupan ID-vs-EN.** Guidance khas Indonesia (IPK, +62, norma foto,
  saran panjang CV, contoh penulisan status, organisasi kampus) tetap blank
  pada locale `en` (AC-204-a dipertahankan); label struktural selalu ada
  untuk aksesibilitas; locale `id` tetap utuh (AC-204-b).
- **Pack EN ditulis manual.** Machine-translate dilarang (AGENTS.md §12);
  padanan istilah mengikuti glossary §7; nada memandu mengikuti
  `localization-guide.md` §1–§2.
- **Tanggal/plural.** Format tanggal dan angka mengikuti locale aktif lewat
  `Intl.DateTimeFormat`/`Intl.NumberFormat` bawaan — tanpa pustaka tanggal,
  tanpa dependensi baru. Pluralisasi hanya minimal Inggris
  (`1 item / N items`); plural sempurna adalah non-goal.
- **Action Verbs EN.** Katalog terpisah (`en.json` dengan contoh kalimat
  sendiri), bukan pemetaan 1:1 dari `id.json` — kata kerja Inggris tidak
  selalu punya padanan tunggal dan butuh pola kalimat berorientasi dampak
  sendiri. Katalog tetap data statis lokal (FR-206 berlaku untuk EN juga).
- **Preferensi dan invariant data.** Preferensi switcher tinggal di
  `localStorage` (preferensi UI kecil, ADR-0002); default `id`. Urutan awal
  saat aplikasi dibuka: preferensi tersimpan → `meta.locale` dokumen yang
  dibuka → `id`. Mengganti bahasa menulis preferensi + `ui-store`, **tidak
  pernah menulis isi `ResumeDocument`** (analog invariant mode: switching
  modes never alters source data). Bila `localStorage` diblokir, preferensi
  hanya berlaku sesi itu (semangat FR-111).
- **Isi CV tidak diterjemahkan.** `translate-en` tetap degradasi graceful
  hingga desain dwibahasa selesai (non-goal T3c).
- **Lint dwibahasa.** Pemeriksaan frasa terlarang glossary §6 dijalankan ke
  **kedua** pack (ID + EN); test sweep string mencakup pack EN sejak pack
  itu mendarat.
- **Dampak schema: nihil.** Locale adalah preferensi UI; tidak ada perubahan
  `ResumeDocument`, tidak ada migrasi.

## Consequences

**Positif**

- Nilai inti F-G5 (antarmuka EN yang bisa dipakai) bekerja offline, tanpa
  dependensi baru, tanpa data keluar perangkat — P1/P3 terpenuhi di level
  kemampuan.
- Jaminan struktural, bukan janji proses: kunci hilang = build gagal atau
  fallback ID yang teruji, bukan layar kosong.
- Jejak Fase 1 dipakai ulang (pack bertipe, blanking FR-204, test sweep +
  forbidden-phrase) — tidak ada pola baru yang dipelihara.
- Bobot pack EN hanya teks statis yang wajib dibaca (pelajaran C1b: teks
  yang wajib dibaca = byte); diukur terhadap baseline bundle, bukan
  baseline ulang sepihak.

**Negatif**

- Setiap string baru wajib ditulis dua kali (ID + EN) oleh manusia —
  biaya kurasi permanen untuk tiap perubahan copy.
- Fallback per-kunci berarti pengguna EN bisa melihat campuran EN/ID selama
  pack belum lengkap — degradasi jujur, tetapi tetap pengalaman campuran.
- `Intl` bawaan mengikuti data locale peramban; format tanggal EN bisa
  sedikit berbeda antar peramban — diterima karena non-kritis untuk CV.
- Katalog Action Verbs EN ganda = dua kurasi yang dipelihara (ID + EN).

**Mitigasi negatif**

- Test sweep mendaftarkan setiap kunci fallback-ID agar kelengkapan pack EN
  terlihat di CI dan bisa dicicil.
- Nota jujur tidak diperlukan per-kunci (fallback adalah perilaku desain
  yang diputus di sini), tetapi permukaan switcher menyebut bahwa
  terjemahan dilengkapi bertahap bila pack belum penuh saat Accepted.
- Kunci baru tanpa padanan EN memblokir build (D15) — kelalaian tidak bisa
  lolos diam-diam.

## Rejected alternatives

**Framework i18n (Opsi 1):** mengorbankan P10 dan menambah bobot bundle
untuk dua locale yang bisa ditulis manual. Bisa hidup kembali hanya bila
locale ketiga diputuskan — dengan ADR baru, bukan pelebaran diam-diam.

**JSON mentah (Opsi 2):** cadangan bila pack bertipe terbukti tidak
memadai; kehilangan jaminan build-gagal-bila-kunci-hilang tanpa keuntungan
yang terukur.

**Pemetaan Action Verbs 1:1 (varian dalam Opsi 3):** ditolak karena contoh
kalimat butuh konteks bahasa masing-masing; pemetaan menghasilkan kalimat
yang kaku atau salah nuansa.

**Pustaka tanggal/plural (varian dalam Opsi 3):** ditolak — `Intl` bawaan
cukup untuk dua locale; pustaka hanya dibenarkan bila locale ketiga butuh
aturan plural kompleks.

**Machine-translate untuk pack EN (varian dalam Opsi 3):** dilarang
AGENTS.md §12; pack EN ditulis dan ditinjau manusia.
