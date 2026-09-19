# Performance Budget — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.2 — angka bundle tervalidasi; metrik lab/field masih usulan** |
| Terakhir diperbarui | 2026-09-20 |

> Pengguna sasaran memakai ponsel kelas menengah dengan koneksi terbatas. Anggaran ini adalah requirement (NFR-008), bukan target.

---

## 1. Anggaran dan hasil pengukuran build pertama

Angka bundle di bawah **sudah divalidasi** dari build produksi pertama
(2026-09-20 · Bun 1.3.14 · Vite 8.3 · `bun run build`, diukur oleh
`scripts/check-bundle-size.ts`; baseline tersimpan di `scripts/bundle-baseline.json`).
Metrik lab/field (LCP, TTI, CLS, offline) **belum divalidasi** — butuh Lighthouse CI dan
perangkat uji, sehingga tetap berlabel usulan.

| Metrik | Anggaran | Ukuran build pertama | Status |
| :-- | :-- | :-- | :-- |
| JS awal (gzip) | ≤ 200 KB | **68,7 KB** | ✅ terpenuhi |
| CSS awal (gzip) | ≤ 30 KB | **30,2 KB** | ⚠️ melebihi 0,2 KB |
| Font (raw, woff2) | ≤ 100 KB (di-subset) | **393,5 KB** | ❌ melebihi — font belum di-subset |
| Total transfer kunjungan pertama (estimasi gzip) | ≤ 400 KB | **496,6 KB** | ❌ melebihi — didominasi font |
| LCP ≤ 2.5 s | | belum diukur | ⬜ usulan |
| TTI ≤ 3.5 s | | belum diukur | ⬜ usulan |
| CLS ≤ 0.1 | | belum diukur | ⬜ usulan |
| Muat ulang offline ≤ 1 s | | belum diukur | ⬜ usulan |

- [x] **Validasi angka bundle lewat pengukuran** (2026-09-20) — metrik lab/field menyusul.
- Anggaran absolut **tidak** dijadikan gerbang gagal-CI saat ini. Gerbang yang fatal adalah
  ratchet +10% dari baseline (D24, `check:budget`); pelanggaran anggaran absolut dilaporkan
  sebagai peringatan agar utang tetap terlihat tanpa memblokir pekerjaan.
- Sumber utang yang sudah teridentifikasi: CSS dipompa Tailwind yang memindai ±70 komponen
  `src/components/ui` warisan scaffold yang belum dipakai (audit dependensi diusulkan ke
  maintainer), dan font `@fontsource-variable/*` belum di-subset (strategi §3).
- Penyelesaiannya **harus menurunkan ukuran, bukan menaikkan anggaran** (§5).

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
