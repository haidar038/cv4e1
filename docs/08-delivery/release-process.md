# Release Process — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Versioning
- [ ] Semver untuk aplikasi
- [ ] **Versi schema terpisah dari versi aplikasi** — keduanya bergerak sendiri
- [ ] TODO: bagaimana keduanya ditampilkan ke pengguna

## 2. Kadensi
- [ ] Berbasis fase, bukan tanggal (proyek satu orang)
- [ ] Perbaikan keamanan dirilis segera

## 3. Langkah rilis
- [ ] Jalankan `production-checklist.md`
- [ ] Perbarui CHANGELOG
- [ ] Tandai versi
- [ ] Build dan deploy
- [ ] Verifikasi service worker memperbarui dengan benar
- [ ] Uji asap di produksi
- [ ] Verifikasi draft dari versi sebelumnya masih dapat dibuka

## 4. Uji asap setelah rilis
| Pemeriksaan | Mengapa |
| :-- | :-- |
| Aplikasi termuat | Jelas |
| Draft lama masih terbuka | **Paling penting** — migrasi yang rusak = kehilangan data |
| Impor berkas ekspor versi lama | Kompatibilitas |
| Ekspor PDF berfungsi | Fitur inti |
| Offline berfungsi setelah muat ulang | Fitur inti |
| Service worker memperbarui, tidak menyajikan versi basi | AB-8 |

## 5. CHANGELOG
- [ ] Ditulis untuk pengguna, bukan untuk pengembang
- [ ] Selalu sebutkan perubahan schema
- [ ] Selalu sebutkan bila ekspor lama terdampak

## 6. Komunikasi
- [ ] Rilis GitHub
- [ ] Catatan dalam aplikasi untuk perubahan yang memengaruhi data pengguna
