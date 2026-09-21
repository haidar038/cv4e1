# Performance Budget — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.7 — renderer Creative lahir lazy (Task 11, 2026-09-21); ruang JS/CSS makin tipis — keputusan checkpoint gerbang** |
| Terakhir diperbarui | 2026-09-21 |

> Pengguna sasaran memakai ponsel kelas menengah dengan koneksi terbatas. Anggaran ini adalah requirement (NFR-008), bukan target.

---

## 1. Anggaran dan hasil pengukuran

Angka bundle **tervalidasi** dari build produksi (terakhir 2026-09-21 pasca-Task 11 · Bun 1.3.14 ·
Vite 8.3 · `bun run build`, diukur `scripts/check-bundle-size.ts`; baseline di
`scripts/bundle-baseline.json`).

| Metrik | Anggaran | Pasca-Task 11 (2026-09-21) | Status |
| :-- | :-- | :-- | :-- |
| JS awal (gzip, `initialJsGzip`) | ≤ 200 KB | **192,7 KB** | ✅ terpenuhi, sisa ruang 7,3 KB — lihat catatan utang JS di bawah |
| Semua chunk JS (gzip, `jsGzip`) | terpantau ratchet | **199,3 KB** (chunk lazy: `export-import` 1,2 KB + `ATSRenderer` 2,4 KB + `CreativeRenderer` 2,9 KB) | ✅ ratchet OK (+7,6%, di bawah gerbang fatal +10%) — sisa ruang ratchet ±4,4 KB |
| CSS awal (gzip) | ≤ 30 KB | **27,0 KB** (termasuk CSS lazy renderer: ATS 0,5 KB + Creative 0,8 KB) | ✅ terpenuhi — sisa ruang ratchet ±1,2 KB |
| Font (raw, woff2) | ≤ 100 KB (di-subset) | **88,8 KB** | ✅ **terpenuhi — utang font lunas** |
| Total transfer kunjungan pertama (estimasi gzip) | ≤ 400 KB | **319,0 KB** | ✅ **terpenuhi — utang transfer lunas** |
| LCP ≤ 2.5 s · TTI ≤ 3.5 s · CLS ≤ 0.1 · Muat ulang offline ≤ 1 s | | belum diukur | ⬜ **ditunda sadar** ke tahap polish/persiapan performance testing (keputusan maintainer, 2026-09-20) |

- [x] **Validasi angka bundle lewat pengukuran** (2026-09-20, diperbarui pasca-audit dan pasca-pipeline lazy).
- **Interpretasi gerbang Fase 1** (usulan tercatat; final diputuskan maintainer di checkpoint gerbang):
  gerbang dianggap lulus untuk anggaran bundle bila JS, CSS, font, dan transfer ✅. Per 2026-09-20
  keempatnya ✅ — **tidak ada utang anggaran yang tersisa**, hanya ruang JS yang tipis (15,6 KB).
- Penegakan tetap dua lapis: ratchet +10% dari baseline bersifat fatal (D24, `check:budget`);
  anggaran absolut dilaporkan sebagai peringatan agar utang tetap terlihat tanpa memblokir pekerjaan.
- **Penyelesaian utang CSS (2026-09-20):** audit dependensi menghapus 8 paket scaffold tak terpakai
  beserta 8 komponen `src/components/ui` satu-satunya pemakainya — CSS gzip turun 30,2 → 27,1 KB
  (−10,4%); baseline di-record ulang agar ratchet melindungi perbaikan.
- **Re-baseline sadar pasca-Task 9 (2026-09-20):** shell `Hello World` digantikan aplikasi form
  nyata — form guided 7 section, panel draft, primitif base-ui yang dipakai (accordion, dialog,
  select, checkbox, progress, field), `zustand/react`, dan katalog konten masuk bundle untuk pertama
  kalinya. JS gzip 68,7 → 183,7 KB (+167%); ratchet +10% (D24) melompat sesuai desain rencana Task 9
  dan di-record ulang secara sadar dengan justifikasi ini — **bukan** anggaran absolut yang dinaikkan (§5).
- **Metrik `initialJsGzip` (2026-09-20):** anggaran 200 KB adalah anggaran *JS awal*, tetapi metrik lama
  `jsGzip` menjumlahkan **semua** berkas JS di dist/ — kunjungan pertama tidak mengunduh semuanya.
  `initialJsGzip` kini mengukur hanya JS yang direferensikan `dist/index.html` (script tag eager);
  chunk lazy masuk `jsGzip` dan ratchet melindungi keduanya secara independen. Baseline lama (4 metrik)
  ditolak dengan pesan actionable; re-baseline sadar setelah perubahan ini.
- **Pipeline impor/ekspor kini lazy (2026-09-20):** `src/storage/export-import-lazy.ts` memuat
  parsing envelope, rantai migrasi, dan satu salinan skema Zod lewat `import()` dinamis — hanya saat
  aksi ekspor/impor diklik (`DraftPanel`, `importDraftAction`); chunk `export-import` = 1,15 KB gzip.
  **Yang jujur TIDAK keluar dari chunk awal:** skema Zod utama dan validator — autosave memvalidasi
  pada setiap ketikan, sehingga tumpukan inti selalu dibutuhkan (keputusan sadar, bukan kelalaian).
  Kelompok kode berikutnya yang layak di-lazy: renderer ATS/Creative (Task 10/11) dan pratinjau.
- **Task 13b (2026-09-21):** UI saran kata kerja ditambah secara **eager** — `initialJsGzip`
  184,1 → 190,5 KB (+6,4 KB gzip: katalog 72 entri ±4 KB, panel + graf modul base-ui collapsible,
  shell komponen). Varian popover base-ui diukur **+25,4 KB** (posisi/portal) dan gagal ratchet fatal,
  sehingga panel lahir sebagai disclosure inline; baseline JSON **tidak** di-record ulang karena kedua
  ratchet tetap hijau. Sisa ruang anggaran absolut kini 9,5 KB gzip — peringatan utang JS di bawah
  tetap berlaku untuk Task 10–15 (renderer direncanakan lazy, §3).
- **Task 10 (2026-09-21):** renderer ATS **lahir lazy** sesuai rencana §3 — chunk `ATSRenderer`
  2,4 KB gzip + CSS 0,5 KB keluar dari JS/CSS awal; yang masuk shell hanya gate pratinjau
  (`?preview=ats`, dihapus saat Task 12) dan wrapper lazy (+1,7 KB `initialJsGzip`). Baseline JSON
  **tidak** di-record ulang (semua ratchet hijau). Sisa ruang absolut kini 7,8 KB gzip.
- **Task 11 (2026-09-21):** renderer Creative **lahir lazy** dengan pola yang sama — chunk
  `CreativeRenderer` 2,9 KB gzip + CSS module 0,8 KB terpisah; yang masuk shell hanya cabang gate
  kedua + hook resolver foto (+0,5 KB `initialJsGzip`). Baseline JSON **tidak** di-record ulang
  (semua ratchet hijau). **Ruang kini nyaris habis di dua metrik:** ratchet `jsGzip` tersisa
  ±4,4 KB (199,3 / 203,7 KB) dan ratchet `cssGzip` ±1,2 KB (27,0 / 28,2 KB) — Task 12–15 praktis
  **wajib** lazy untuk kode baru berukuran berarti, dan keputusan re-baseline sadar (atau
  pemangkasan) kini harus diambil di checkpoint gerbang Fase 1, bukan lagi ditunda.
- **Utang JS (diperbarui 2026-09-21):** sisa ruang terhadap anggaran absolut tinggal 7,3 KB gzip.
  Sebelum gerbang Fase 1, audit bundle + pemisahan kode (§3: renderer dimuat lazy) perlu dievaluasi
  maintainer agar Task 12–15 tidak menggelontorkan JS baru tanpa ruang. Ini item keputusan
  checkpoint gerbang.
- **Penyelesaian utang font + transfer (2026-09-20, lebih awal dari Task 10):** impor paket
  `@fontsource-variable/*` menarik **semua** subset (cyrillic, cyrillic-ext, greek, vietnamese,
  latin-ext) — 12 berkas woff2 / 393,5 KB, padahal produk hanya menulis teks Latin. `src/index.css`
  kini mendeklarasikan sendiri `@font-face` untuk subset **Latin** dari kedua keluarga (Roboto
  Variable 43,1 KB + IBM Plex Sans Variable 45,7 KB = **88,8 KB**). Efek: fontsRaw −77,4%,
  CSS gzip 25,7 KB, transfer kunjungan pertama **608,6 → 302,7 KB**. Baseline di-record ulang agar
  ratchet melindungi perbaikan.
  **Trade-off yang diterima:** karakter di luar `U+0000-00FF` (mis. nama dengan `é`) jatuh ke font
  sistem; `latin-ext` sengaja belum dibundel karena menambah 30,9 KB untuk Plex saja dan hanya tersisa
  ~11 KB ruang anggaran. Bila teks non-Latin menjadi kebutuhan nyata, itu berarti penambahan anggaran
  yang harus diputuskan lewat dokumen ini (§5), bukan ditambahkan diam-diam.

## 2. Penegakan
- [x] Gerbang CI pada ukuran bundle — `bun run check:budget` di job `verify`; gagal jika ada metrik naik >10% dari baseline (D24)
- [ ] Lighthouse CI pada PR
- [ ] Laporan analisis bundle

## 3. Strategi
- [x] Code splitting: pipeline impor/ekspor dimuat lazy — `export-import-lazy.ts` (2026-09-20),
      chunk 1,15 KB gzip keluar dari JS awal; renderer menyusul di Task 10/11, provider AI Fase 2
- [x] Subsetting font untuk karakter Latin — `src/index.css` (2026-09-20), 393,5 → 88,8 KB
- [x] Tanpa font CDN (C-T11) — hanya berkas `@fontsource-variable` yang dibundel; dibuktikan
      `e2e/no-egress.spec.ts` (nol permintaan keluar origin)
- [x] Tanpa skrip pihak ketiga (C-T10) — `e2e/no-egress.spec.ts`
- [ ] Optimasi gambar untuk foto pengguna

## 4. Yang tidak masuk anggaran awal
- [ ] Provider AI (lazy, Fase 2)
- [ ] Pipeline OCR (lazy, Fase 3, kemungkinan besar)
- [ ] Template tambahan (lazy)

## 5. Peringatan
Jika React + Tailwind + Dexie + Zod tidak muat dalam anggaran, pertimbangkan Preact atau framework lebih ringan — **sebelum** menurunkan anggarannya (asumsi A-T4).
