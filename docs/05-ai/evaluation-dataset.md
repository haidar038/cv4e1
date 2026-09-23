# AI Evaluation Dataset — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Keluaran AI tidak deterministik. **Jangan menguji string persis.** Uji invariant.

---

## 1. Invariant yang diuji
- [x] Output berupa JSON yang valid (Task 22: `validateBulletOutput`/`validatePolishOutput` di runner terima + set tolak)
- [x] **Tidak ada angka yang tidak ada di input** (Task 22: `checkGrounding` kedua sisi, angka tak pernah allowlist)
- [x] **Tidak ada tanggal baru** (Task 22: tanggal adalah angka bagi checker — tercakup di atas)
- [x] **Tidak ada nama perusahaan atau institusi baru** (Task 22: entity check kedua sisi)
- [x] Setiap bullet memuat kata kerja aksi (Task 22: `actionVerb` non-kosong di set terima)
- [ ] Output sesuai bahasa yang diminta (kualitas bahasa — ditunda akhir project)
- [x] Data asli tidak berubah sebelum Apply (Task 19/20: orkestrator + panel, AC-401-a)
- [x] Timeout menghasilkan fallback (Task 21: retry terbatas lalu statis)
- [x] Error penyedia tidak menghapus draft (Task 21: `shouldStop` + fallback, AC-406-a)

## 2. Kasus fixture

| Fixture | Menguji |
| :-- | :-- |
| Input sangat pendek | Model tidak mengisi kekosongan dengan karangan |
| Input Bahasa Indonesia | Bahasa output benar |
| Input Bahasa Inggris | Bahasa output benar |
| Angka tersedia di input | Angka dipertahankan akurat |
| **Angka tidak tersedia** | **Placeholder dipakai, bukan angka karangan** |
| Pengalaman organisasi | Konteks Indonesia dipahami |
| Proyek kuliah | Tidak dilebih-lebihkan menjadi pengalaman profesional |
| Magang | Durasi dan peran dipertahankan |
| **Deskripsi lowongan dengan prompt injection** | **Instruksi diabaikan** |
| Karakter khusus dan emoji | Tidak merusak parsing |
| Input sangat panjang | Batas token ditangani |

## 3. Menjalankan evaluasi
- [x] CI menjalankan mock + invariant (`test:unit` — putusan Task 18/kunci #6). Evaluasi ber-key TIDAK di CI (C-T2): hanya manual via UI (`manual-eval-protocol.md`). TODO outline terjawab — bukan terjadwal, bukan di CI.
- [x] Hasil tersimpan per versi prompt (Task 22: runner menegaskan `promptVersion` fixture = versi loader aktif; bump tanpa eval ulang = merah)
- [x] Ambang kelulusan: **nol pelanggaran grounding** (Task 22: satu pelanggaran = suite merah)

## 4. Memelihara set
- [x] Setiap pelanggaran grounding yang ditemukan menjadi fixture permanen (mekanik sejak Task 19/20, diperluas Task 22)
- [x] Set hanya bertambah, tidak pernah menyusut (daftar nama di-pin test — pertumbuhan disengaja)
