# AI Evaluation Dataset — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Keluaran AI tidak deterministik. **Jangan menguji string persis.** Uji invariant.

---

## 1. Invariant yang diuji
- [ ] Output berupa JSON yang valid
- [ ] **Tidak ada angka yang tidak ada di input**
- [ ] **Tidak ada tanggal baru**
- [ ] **Tidak ada nama perusahaan atau institusi baru**
- [ ] Setiap bullet memuat kata kerja aksi
- [ ] Output sesuai bahasa yang diminta
- [ ] Data asli tidak berubah sebelum Apply
- [ ] Timeout menghasilkan fallback
- [ ] Error penyedia tidak menghapus draft

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
- [ ] TODO: apakah dijalankan di CI? Butuh API key — mungkin manual atau terjadwal
- [ ] Simpan hasil per versi prompt
- [ ] Ambang kelulusan: **nol pelanggaran grounding**

## 4. Memelihara set
- [ ] Setiap pelanggaran grounding yang ditemukan menjadi fixture permanen
- [ ] Set hanya bertambah, tidak pernah menyusut
