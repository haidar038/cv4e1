# Browser and Device Matrix — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu ditetapkan** |
| Terakhir diperbarui | 2026-09-15 |

> Pilihan dukungan mengikuti pengguna sasaran: ponsel Android kelas menengah dan laptop pinjaman, bukan perangkat kelas atas.

---

## 1. Tingkatan dukungan

| Tingkat | Arti |
| :-- | :-- |
| **Tier 1** | Didukung penuh, diuji setiap rilis, bug memblokir rilis |
| **Tier 2** | Didukung, diuji berkala, bug diperbaiki |
| **Tier 3** | Berfungsi seadanya, tidak diuji |

## 2. Matriks (usulan — konfirmasi)

| Peramban | Versi | Tier | Catatan |
| :-- | :-- | :-- | :-- |
| Chrome Android | 2 versi terakhir | 1 | **Peramban utama pengguna sasaran** |
| Chrome Desktop | 2 versi terakhir | 1 | |
| Safari iOS | 16.4+ | 1 | **Pengusiran storage adalah masalah nyata di sini** |
| Samsung Internet | 2 versi terakhir | 1 | Umum di Indonesia |
| Firefox Desktop | ESR + terbaru | 2 | |
| Edge Desktop | 2 versi terakhir | 2 | |
| Safari macOS | 2 versi terakhir | 2 | |
| Firefox Android | terbaru | 3 | |

## 3. Perangkat acuan
- [ ] Android kelas menengah (TODO: pilih model acuan)
- [ ] iPhone dengan Safari 16.4+
- [ ] Laptop kelas bawah

## 4. Kemampuan yang dibutuhkan
- [ ] IndexedDB
- [ ] Service worker
- [ ] File API
- [ ] Cetak / generasi PDF
- [ ] Perilaku degradasi jika tidak tersedia (C-T12)

## 5. Perbedaan yang diketahui perlu diuji
- [ ] Paginasi cetak berbeda antarperamban
- [ ] Penyematan font pada PDF
- [ ] Pengusiran IndexedDB di Safari iOS
- [ ] Perilaku pemasangan PWA per platform
