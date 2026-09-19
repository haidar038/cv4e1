# Incident Runbook — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Tanpa backend, tanpa on-call, tanpa pager. "Insiden" di sini berarti cacat yang sudah terkirim ke pengguna, bukan layanan yang mati.

---

## 1. Klasifikasi insiden

| Tingkat | Definisi | Contoh |
| :-- | :-- | :-- |
| **Kritis** | Kehilangan atau kerusakan data pengguna | Migrasi rusak, autosave gagal diam-diam |
| **Tinggi** | Fitur inti rusak, atau masalah keamanan | Ekspor PDF rusak, XSS, kebocoran data |
| **Sedang** | Fitur non-inti rusak | Fitur AI gagal, satu template rusak |
| **Rendah** | Kosmetik | |

## 2. Skenario dan respons

### S1 — Migrasi menghancurkan data pengguna `KRITIS`
- [ ] Segera: hentikan deploy, publikasikan peringatan
- [ ] Arahkan pengguna untuk berhenti membuka aplikasi sampai diperbaiki (mencegah kerusakan lebih lanjut)
- [ ] Perbaiki migrasi, tambahkan test, rilis
- [ ] Sediakan alat pemulihan jika memungkinkan

### S2 — Service worker menyajikan bundle basi `TINGGI`
- [ ] Perbaiki versioning cache
- [ ] Sediakan instruksi hard-refresh
- [ ] → AB-8

### S3 — Kerentanan keamanan `TINGGI`
- [ ] Nilai dampak: apakah data pengguna terekspos?
- [ ] Perbaiki dan rilis segera
- [ ] Ungkapkan secara jujur di CHANGELOG

### S4 — Ekspor PDF rusak `TINGGI`
- [ ] Ini adalah fitur inti; perlakukan sebagai pemblokir
- [ ] Sarankan solusi sementara jika ada

### S5 — Kompromi dependensi `TINGGI`
- [ ] Audit apa yang terkirim
- [ ] Hapus atau sematkan versi
- [ ] Ungkapkan

## 3. Komunikasi
- [ ] Tanpa daftar email pengguna. Saluran: GitHub, banner dalam aplikasi, komunitas.
- [ ] **Jujur tentang apa yang terjadi dan apa yang tidak bisa kami perbaiki**

## 4. Post-mortem
- [ ] Tanpa menyalahkan
- [ ] Setiap insiden menambah minimal satu test
- [ ] Perbarui threat model jika relevan
