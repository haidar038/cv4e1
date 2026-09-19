# Dependency Policy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Setiap dependensi adalah utang keamanan dan pemeliharaan pada proyek yang dikelola satu orang (P10).

---

## 1. Menambah dependensi membutuhkan
- [ ] Apa fungsinya
- [ ] Mengapa tidak bisa ditulis sendiri dengan usaha yang wajar
- [ ] Dampak terhadap ukuran bundle (angka, bukan perkiraan)
- [ ] Lisensi
- [ ] Status pemeliharaan: commit terakhir, jumlah maintainer, isu terbuka
- [ ] Jumlah dependensi transitif
- [ ] Apa yang terjadi jika paketnya ditinggalkan

## 2. Penolakan otomatis
- [ ] Menghubungi server saat runtime
- [ ] Butuh skrip post-install
- [ ] Lisensi tidak kompatibel
- [ ] Tidak dipelihara lebih dari 12 bulan tanpa alternatif
- [ ] Menarik lebih dari N dependensi transitif (TODO: tetapkan N)
- [ ] Menduplikasi sesuatu yang sudah ada di pohon dependensi

## 3. Lisensi yang diizinkan
- [ ] MIT, Apache-2.0, BSD, ISC
- [ ] TODO: finalkan setelah lisensi proyek diputuskan (pertanyaan terbuka Q1)
- [ ] Pemeriksaan lisensi otomatis di CI

## 4. Pemeliharaan
- [ ] Lockfile selalu dikomit
- [ ] `npm audit` di CI
- [ ] Peninjauan dependensi terjadwal (TODO: kadensi)
- [ ] Update tanggung jawab keamanan, bukan otomatis tanpa tinjauan

## 5. Anggaran
- [ ] Batas keras jumlah dependensi runtime (TODO: tetapkan)
- [ ] Anggaran ukuran bundle di CI → `../07-quality/performance-budget.md`
