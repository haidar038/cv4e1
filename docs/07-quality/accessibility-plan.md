# Accessibility Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.3 — permukaan Task 14 (cetak + offline) diaudit (2026-09-21)** |
| Terakhir diperbarui | 2026-09-21 |

> Nama produk mengandung janji. Aksesibilitas adalah requirement, bukan peningkatan, dan tidak ditunda ke fase akhir.

---

## 1. Target
- [ ] WCAG 2.2 Level AA
- [ ] Operasi keyboard penuh
- [ ] Kompatibel pembaca layar
- [ ] Berfungsi pada pembesaran 200%

## 2. Cakupan area
| Area | Kebutuhan |
| :-- | :-- |
| Form | Label, deskripsi, hubungan pesan error, fieldset |
| Navigasi | Urutan fokus logis, skip link, tanpa jebakan fokus |
| Toggle mode | Diumumkan ke pembaca layar; perubahan dijelaskan |
| Pratinjau | Alternatif teks untuk konten visual |
| Pesan error | Terhubung ke field, dapat ditindaklanjuti, diumumkan |
| Dialog modal | Manajemen fokus, dapat ditutup dengan Escape |
| Micro-copy | Dapat diakses, bukan hanya muncul saat hover |
| Panel saran AI | Dapat dinavigasi keyboard |

## 3. Kontras dan visual
- [x] Kontras teks minimal 4.5:1 — diuji `e2e/a11y.spec.ts` pada build produksi (axe rule
      `color-contrast`, desktop + 360 px). jsdom hanya bisa melaporkan "incomplete", jadi bukti
      otomatisnya harus dari peramban nyata; spec menolak lulus bila rule kontras tidak dievaluasi.
      Insiden 2026-09-26: token `--info` (`oklch(0.55 …)`, rasio 4,04:1) menjatuhkan 6 test e2e di CI;
      digelapkan ke `oklch(0.48 0.16 240)` (rasio 5,29:1) — satu-satunya pemakai token teks-info
      adalah `StorageNotice`.
- [ ] Indikator fokus terlihat jelas di mana-mana
- [ ] Jangan andalkan warna saja untuk menyampaikan makna
- [ ] Hormati `prefers-reduced-motion`
- [ ] Hormati `prefers-color-scheme`

## 4. Mobile
- [ ] Ukuran target sentuh minimal
- [ ] Tidak ada fungsi yang hanya bisa lewat hover
- [ ] Zoom tidak dinonaktifkan

## 5. Pengujian
- [x] Otomatis: axe di CI pada setiap halaman — dua lapis: per komponen di jsdom
      (`src/features/form/test-utils.tsx` → `runAxe()`, dipakai 9 berkas `*.dom.test.tsx`) dan
      **halaman penuh** di `e2e/a11y.spec.ts` (tag WCAG 2.0/2.1/2.2 A+AA; `title`, `lang`,
      satu `main`, dan kontras warna).
- [x] Task 12: `ModeToggle` (radio native + live region), `PhotoNotice`
      (dismissable `role="status"`), dan tab mobile Form/Pratinjau diaudit axe
      per komponen (`src/features/preview/*.dom.test.tsx`, `src/App.dom.test.tsx`
      pola); keyboard-only, pengumuman SR, fokus, dan `prefers-reduced-motion`
      dibuktikan `e2e/mode-switch.spec.ts` pada build produksi.
- [x] Task 14: `PrintButton` + `PrintInstructionsModal` (dialog base-ui: focus
      trap, Escape menutup, fokus kembali) diaudit axe per komponen
      (`src/features/export/PrintButton.dom.test.tsx`, modal terbuka) dan
      halaman penuh (`e2e/a11y.spec.ts`: tombol cetak, bantuan, dialog, banner
      offline); `OfflineIndicator` (`role="status"`, diam saat online).
      **Aturan query live-region** (temuan Task 14): region `role="status"`
      diuji via role + teks, bukan role + nama — kedua engine (Testing
      Library/jsdom dan Playwright/Chromium) gagal mencocokkan nama aksesibel
      dari konten live-region (node dilaporkan Name ""), sementara pencocokan
      teks bekerja di keduanya. Lihat komentar `OfflineIndicator.tsx`.
- [x] Struktur dokumen: `index.html` memakai `lang="id"` (antarmuka berbahasa Indonesia) dan judul
      `cv4every1`; diuji eksplisit di `e2e/a11y.spec.ts` dan `e2e/smoke.spec.ts`.
- [ ] Manual: walkthrough hanya keyboard per rilis
- [ ] Manual: uji pembaca layar (NVDA, VoiceOver) per rilis mayor
- [ ] Daftar periksa per PR untuk permukaan yang berubah

## 6. Aksesibilitas keluaran PDF
- [ ] TODO: apakah PDF hasil ekspor perlu di-tag untuk aksesibilitas?
- [ ] Minimum: teks dapat diseleksi (sudah menjadi requirement)
- [ ] Pertimbangkan: bahasa dokumen, urutan baca
