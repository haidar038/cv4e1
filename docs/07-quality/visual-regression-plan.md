# Visual Regression Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Dua renderer yang dipelihara satu orang akan menyimpang. Ini adalah mekanisme yang menangkapnya (risiko A-T7).

---

## 1. Cakupan
```text
semua fixture × semua mode × semua template
```
- [ ] Lebih banyak fixture berarti lebih banyak perlindungan; jaga jumlah template tetap sedikit

## 2. Yang ditangkap
- [ ] Pergeseran tata letak yang tidak disengaja
- [ ] Section hilang
- [ ] Heading kosong dari section kosong
- [ ] Teks meluber
- [ ] Posisi page break
- [ ] **Foto muncul pada mode ATS** — kegagalan kritis
- [ ] Kebocoran tema antarmode

## 3. Alat
- [ ] TODO: pilih (Playwright screenshot, Percy, atau perbandingan lokal)
- [ ] Syarat: berjalan di CI, biaya nol, hasil deterministik

## 4. Determinisme
- [ ] Ukuran viewport tetap
- [ ] Font dibundel, bukan dari sistem
- [ ] Tanpa tanggal atau nilai acak di fixture
- [ ] Nonaktifkan animasi

## 5. Alur kerja
- [ ] Baseline dikomit
- [ ] Perubahan butuh persetujuan eksplisit
- [ ] Peninjau harus melihat gambar diff, bukan hanya status lulus/gagal

## 6. Uji divergensi renderer
- [ ] Test khusus: untuk setiap fixture, pastikan **semua konten yang sama** muncul di kedua mode
- [ ] Perbedaan yang diizinkan hanya: foto, jumlah kolom, warna, ikon
- [ ] Mendeteksi kasus di mana satu renderer diam-diam berhenti menampilkan sebuah field
