# Performance Budget — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.5 — angka bundle tervalidasi pasca-subset font (2026-09-20); utang CSS, font, dan transfer LUNAS; metrik lab/field ditunda sadar** |
| Terakhir diperbarui | 2026-09-20 |

> Pengguna sasaran memakai ponsel kelas menengah dengan koneksi terbatas. Anggaran ini adalah requirement (NFR-008), bukan target.

---

## 1. Anggaran dan hasil pengukuran

Angka bundle **tervalidasi** dari build produksi (terakhir 2026-09-20 pasca-subset font · Bun 1.3.14 ·
Vite 8.3 · `bun run build`, diukur `scripts/check-bundle-size.ts`; baseline di
`scripts/bundle-baseline.json`).

| Metrik | Anggaran | Baseline pasca-subset font (2026-09-20) | Status |
| :-- | :-- | :-- | :-- |
| JS awal (gzip) | ≤ 200 KB | **184,4 KB** (sebelumnya 183,7 KB) | ✅ terpenuhi, sisa ruang tipis 15,6 KB — lihat catatan utang JS di bawah |
| CSS awal (gzip) | ≤ 30 KB | **25,7 KB** | ✅ terpenuhi |
| Font (raw, woff2) | ≤ 100 KB (di-subset) | **88,8 KB** (sebelumnya 393,5 KB) | ✅ **terpenuhi — utang font lunas** |
| Total transfer kunjungan pertama (estimasi gzip) | ≤ 400 KB | **302,7 KB** (sebelumnya 608,6 KB) | ✅ **terpenuhi — utang transfer lunas** |
| LCP ≤ 2.5 s · TTI ≤ 3.5 s · CLS ≤ 0.1 · Muat ulang offline ≤ 1 s | | belum diukur | ⬜ **ditunda sadar** ke tahap polish/persiapan performance testing (keputusan maintainer, 2026-09-20) |

- [x] **Validasi angka bundle lewat pengukuran** (2026-09-20, diperbarui pasca-audit).
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
- **Utang JS:** sisa ruang terhadap anggaran absolut tinggal 15,6 KB gzip. Sebelum gerbang Fase 1,
  audit bundle + pemisahan kode (§3: renderer/impor dimuat lazy) perlu dievaluasi maintainer agar Task 10–15
  tidak menggelontorkan JS baru tanpa ruang. Ini item keputusan checkpoint gerbang.
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
- [ ] Code splitting: renderer, provider AI, pipeline impor dimuat lazy
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
