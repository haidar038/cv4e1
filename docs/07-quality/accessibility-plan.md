# Accessibility Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.4 — audit penuh F4a: seluruh permukaan diaudit di browser nyata, 3 temuan kontras diperbaiki (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |

> Nama produk mengandung janji. Aksesibilitas adalah requirement, bukan peningkatan, dan tidak ditunda ke fase akhir.

---

## 1. Target
- [x] WCAG 2.2 Level AA — audit otomatis hijau di Chromium + Firefox (e2e, jsdom); uji pembaca layar manual masih terbuka, lihat §7
- [x] Operasi keyboard penuh — walkthrough e2e tanpa mouse (NFR-005), lihat §7
- [ ] Kompatibel pembaca layar — markup siap (role, label, live region), tetapi uji NVDA/VoiceOver manual belum dijalankan
- [ ] Berfungsi pada pembesaran 200% — NFR-014, ditunda di luar Fase 4

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
- [x] Indikator fokus terlihat jelas di mana-mana — dibuktikan walkthrough e2e F4a (setiap stop Tab `:focus` dan visible)
- [ ] Jangan andalkan warna saja untuk menyampaikan makna
- [x] Hormati `prefers-reduced-motion` — guard global di `src/index.css` (F4a)
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
- [x] F4a (2026-09-26): lapisan e2e diperluas ke permukaan yang belum pernah dibuka —
      dialog impor PDF, dialog ganti-nama/hapus draft, dialog persetujuan AI, panel
      tailoring beserta hasil statis offline, locale EN (sekaligus `html lang`),
      pratinjau Creative berisi data, alert impor rusak, dan walkthrough hanya-keyboard
      (sweep urutan Tab + alur buat → isi → bantuan cetak → Escape dengan fokus kembali
      ke pemicu). Hasil: 26/26 hijau (Chromium + Firefox).
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
- [x] Putusan F4a (2026-09-26): **minimum, bukan tagging penuh.** PDF dihasilkan lewat
      dialog cetak peramban (ADR-0007), sehingga tagging dikendalikan peramban, bukan
      kode aplikasi. Yang dijamin dan diuji: teks dapat diseleksi, heading standar,
      urutan baca yang dapat diprediksi (lihat `ats-test-plan.md`).
- [ ] Minimum: teks dapat diseleksi (sudah menjadi requirement)
- [ ] Pertimbangkan: bahasa dokumen, urutan baca

## 7. Temuan dan perbaikan F4a (2026-09-26)

Tiga pelanggaran `color-contrast` (serious) ditemukan e2e — semuanya di luar
permukaan yang pernah diaudit, semuanya diperbaiki tanpa mengubah desain:

1. **Teks destructive di atas tint destructive** (3,99:1): token `--destructive`
   digelapkan `oklch(0.577 …)` → `oklch(0.52 0.245 27.325)` (4,68:1 pada tint,
   5,62:1 pada putih). Preseden perbaikan `--info` di §3.
2. **Hover tombol default** (3,55:1): `hover:bg-primary/80` memudarkan background
   di bawah teks terang. Diganti solid `color-mix(in oklch, primary, black 10%)`
   (6,48:1) — pola color-mix yang sama dipakai varian secondary.
3. **Hover tombol destructive** (3,86:1 pada `/20`): hover kini mencerahkan ke
   `/5` (5,13:1), bukan menggelapkan. Aturan yang dicatat di `button.tsx`:
   **state hover wajib menjaga rasio yang sama dengan state istirahat** — axe
   mengaudit apa pun yang sedang disentuh mouse.

Perubahan non-kontras di F4a: guard global `prefers-reduced-motion` di
`src/index.css` (animasi/transisi menjadi instan bila pengguna memintanya).

Susulan F4e (baris legal di footer): `text-muted-foreground` yang lolos di
atas putih GAGAL di atas tint `bg-info/10` — tint menggelapkan background
cukup untuk menjatuhkan rasio di bawah 4.5:1. Aturannya: warna teks di atas
tint harus diukur terhadap tint itu, bukan terhadap putih. Baris legal
memakai `text-info` (5,29:1, pasangan yang sudah terbukti).

**Belum terverifikasi (butuh manusia):** uji pembaca layar NVDA + VoiceOver
untuk alur inti (buat → isi → ganti mode → ekspor PDF → hapus data), dan
walkthrough keyboard manual per rilis. Varian `.dark` tidak bisa diaudit
karena tidak ada pengalih tema di aplikasi — bila pengalih ditambahkan,
seluruh audit harus diulang dalam mode itu.
