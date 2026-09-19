# Performance Budget — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.4 — angka bundle tervalidasi pasca-Task 9 (shell nyata menggantikan Hello World); metrik lab/field ditunda sadar** |
| Terakhir diperbarui | 2026-09-20 |

> Pengguna sasaran memakai ponsel kelas menengah dengan koneksi terbatas. Anggaran ini adalah requirement (NFR-008), bukan target.

---

## 1. Anggaran dan hasil pengukuran

Angka bundle **tervalidasi** dari build produksi (terakhir 2026-09-20 pasca-Task 9 · Bun 1.3.14 ·
Vite 8.3 · `bun run build`, diukur `scripts/check-bundle-size.ts`; baseline di
`scripts/bundle-baseline.json`).

| Metrik | Anggaran | Baseline pasca-Task 9 | Status |
| :-- | :-- | :-- | :-- |
| JS awal (gzip) | ≤ 200 KB | **183,7 KB** (sebelumnya 68,7 KB) | ✅ terpenuhi, sisa ruang tipis 16,3 KB — lihat catatan utang JS di bawah |
| CSS awal (gzip) | ≤ 30 KB | **27,3 KB** | ✅ terpenuhi |
| Font (raw, woff2) | ≤ 100 KB (di-subset) | **393,5 KB** | ❌ utang terdokumentasi — subset font dijadwalkan di Task 10 |
| Total transfer kunjungan pertama (estimasi gzip) | ≤ 400 KB | **608,6 KB** | ❌ utang terdokumentasi — ikut turun setelah subset font; pertumbuhannya disebabkan shell nyata (lihat bawah) |
| LCP ≤ 2.5 s · TTI ≤ 3.5 s · CLS ≤ 0.1 · Muat ulang offline ≤ 1 s | | belum diukur | ⬜ **ditunda sadar** ke tahap polish/persiapan performance testing (keputusan maintainer, 2026-09-20) |

- [x] **Validasi angka bundle lewat pengukuran** (2026-09-20, diperbarui pasca-audit).
- **Interpretasi gerbang Fase 1** (usulan tercatat; final diputuskan maintainer di checkpoint gerbang):
  gerbang dianggap lulus untuk anggaran bundle bila JS dan CSS ✅ **dan** font/transfer ✅ atau
  memiliki utang terdokumentasi dengan rencana penyelesaian yang sudah terjadwal
  (saat ini: subset font di Task 10).
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
- **Utang JS baru:** sisa ruang terhadap anggaran absolut tinggal 16,3 KB gzip. Sebelum gerbang Fase 1,
  audit bundle + pemisahan kode (§3: renderer/impor dimuat lazy) perlu dievaluasi maintainer agar Task 10–15
  tidak menggelontorkan JS baru tanpa ruang. Ini item keputusan checkpoint gerbang, bukan blokir Task 9.
- Sisa utang: font `@fontsource-variable/*` belum di-subset (strategi §3) — **rumahnya Task 10**
  (renderer menyentuh font), bukan anggaran yang dinaikkan (§5).

## 2. Penegakan
- [x] Gerbang CI pada ukuran bundle — `bun run check:budget` di job `verify`; gagal jika ada metrik naik >10% dari baseline (D24)
- [ ] Lighthouse CI pada PR
- [ ] Laporan analisis bundle

## 3. Strategi
- [ ] Code splitting: renderer, provider AI, pipeline impor dimuat lazy
- [ ] Subsetting font untuk karakter Latin
- [ ] Tanpa font CDN (C-T11)
- [ ] Tanpa skrip pihak ketiga (C-T10)
- [ ] Optimasi gambar untuk foto pengguna

## 4. Yang tidak masuk anggaran awal
- [ ] Provider AI (lazy, Fase 2)
- [ ] Pipeline OCR (lazy, Fase 3, kemungkinan besar)
- [ ] Template tambahan (lazy)

## 5. Peringatan
Jika React + Tailwind + Dexie + Zod tidak muat dalam anggaran, pertimbangkan Preact atau framework lebih ringan — **sebelum** menurunkan anggarannya (asumsi A-T4).
