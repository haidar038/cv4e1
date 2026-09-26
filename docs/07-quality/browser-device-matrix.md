# Browser and Device Matrix — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — ditetapkan + bukti uji F4b (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |

> Pilihan dukungan mengikuti pengguna sasaran: ponsel Android kelas menengah dan laptop pinjaman, bukan perangkat kelas atas.

---

## 1. Tingkatan dukungan

| Tingkat | Arti |
| :-- | :-- |
| **Tier 1** | Didukung penuh, diuji setiap rilis, bug memblokir rilis |
| **Tier 2** | Didukung, diuji berkala, bug diperbaiki |
| **Tier 3** | Berfungsi seadanya, tidak diuji |

## 2. Matriks

| Peramban | Versi | Tier | Bukti uji F4b |
| :-- | :-- | :-- | :-- |
| Chrome Android | 2 versi terakhir | 1 | Emulasi Pixel 5 (Chromium): smoke, locale, no-egress, wipe-data, ats-print hijau; tes khusus mobile (tab Form/Pratinjau, a11y 360 px) hijau. Perangkat fisik: manual (§6). |
| Chrome Desktop | 2 versi terakhir | 1 | CI Linux (Chromium, gate e2e) + lokal Windows: seluruh suite hijau. |
| Safari iOS | 16.4+ | 1 | Proksi WebKit desktop: smoke, locale, mode-switch, a11y, import-pdf, wipe-data, offline-sebagian hijau. Terbatas engine (§5). Perangkat fisik: manual (§6). |
| Samsung Internet | 2 versi terakhir | 1 | Berbasis Chromium — tercakup penalaran Chromium; tanpa perilaku khusus yang diketahui. Perangkat fisik: manual (§6). |
| Firefox Desktop | ESR + terbaru | 2 | Lokal Windows: seluruh suite hijau (baseline Fase 3). |
| Edge Desktop | 2 versi terakhir | 2 | Berbasis Chromium — tercakup penalaran Chromium. Spot-check manual (§6). |
| Safari macOS | 2 versi terakhir | 2 | Proksi WebKit sama seperti iOS (§5). Perangkat fisik: manual (§6). |
| Firefox Android | terbaru | 3 | Berfungsi seadanya, tidak diuji. |

## 3. Perangkat acuan

Kelas yang ditetapkan (unit fisik menyusul — uji fisik adalah langkah manual maintainer, §6):

- [ ] Android kelas menengah (kelas Redmi Note / Galaxy A, Chrome + Samsung Internet)
- [ ] iPhone dengan Safari 16.4+ (kasus terburuk pengusiran storage)
- [ ] Laptop kelas bawah (Chrome + Edge)

## 4. Kemampuan yang dibutuhkan

- [x] IndexedDB — dipakai semua alur; string/objek terbukti di Chromium, Firefox, WebKit. **Batas engine:** Blob→IndexedDB gagal (`UnknownError`) pada WebKit Playwright/Windows (probe mentah F4b, tanpa kode aplikasi) — Safari asli mendukungnya; jalur foto di WebKit belum terbukti di sini, wajib uji fisik (§6).
- [x] Service worker — precache 28 entri; reload offline terbukti di Chromium/Firefox. **Batas harness:** navigasi offline di WebKit Playwright rusak (`reload` = internal error, `goto` = gantung) — bukan bukti bug aplikasi; uji fisik (§6).
- [x] File API — impor JSON/PDF dan upload foto terbukti di Chromium/Firefox/WebKit (kecuali tulis Blob IDB di WebKit, lihat di atas).
- [x] Cetak / generasi PDF — CSS print + isolasi teruji via `emulateMedia` di semua engine; ekstraksi teks PDF (`page.pdf`, hanya-Chromium) adalah gate CI Chromium/Linux (ADR-0007).
- [ ] Perilaku degradasi jika tidak tersedia (C-T12) — belum diuji sistematis; bagian dari uji fisik §6.

## 5. Perbedaan yang diketahui dan pelajaran harness F4b

- [x] Paginasi cetak berbeda antarperamban — CSS print terverifikasi di semua engine; paginasi kertas sesungguhnya per peramban = manual (§6, S2).
- [x] Penyematan font pada PDF — font Latin dibundel lokal (OFL-1.1), tanpa CDN; tidak ada temuan lintas-engine.
- [ ] Pengusiran IndexedDB di Safari iOS — mitigasi `persist()` ada (`src/storage/persist.ts`, best-effort + unit test); perilaku sungguhan = manual di iPhone (§6, S3).
- [x] Perilaku pemasangan PWA per platform — manifest valid dari origin sendiri (teruji); instalasi sungguhan = manual (§6).
- **Pelajaran harness (dicatat agar tidak diulang):** spec off-origin meng-hardcode origin `:4173` — config uji sementara wajib memakai port yang sama, bukan port bebas. Tes ber-asumsi-desktop (`#cv-preview` visible, radio ModeToggle terklik) tidak berlaku di viewport mobile — produk menampilkan tab Form/Pratinjau sesuai desain; jalur mobile dibuktikan tes khusus mobile, bukan dengan memaksa tes desktop lolos di layar kecil.
- Probe WebKit dijalankan via config sementara yang sudah dihapus setelah run — tidak ada artefak uji sementara di repo.

## 6. Prosedur uji fisik manual (pemilik: maintainer)

Di tiap perangkat acuan §3, jalankan dan catat hasilnya sebelum rilis:

1. Alur inti: buat → isi → simpan → reload → tetap ada.
2. Ganti mode ATS ↔ Creative tanpa kehilangan data.
3. Ekspor PDF di tiap mode; teks terekstraksi dan berurutan.
4. Upload foto → muncul di Creative, tersembunyi di ATS.
5. Matikan jaringan → reload → aplikasi dan draft tetap terbuka.
6. Paginasi 1–2 halaman pada CV panjang di tiap peramban (S2).
7. Amati retensi storage semalam + perilaku `persist()` di Safari iOS (S3).
8. Pasang PWA (bila didukung) dan ulangi langkah 1–5.
