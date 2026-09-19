# Rollback Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Tanpa server berarti rollback itu mudah **kecuali** untuk satu hal: data yang sudah dimigrasi ada di perangkat pengguna dan tidak bisa di-rollback.

---

## 1. Rollback aset statis
- [ ] Deploy ulang build sebelumnya
- [ ] Verifikasi service worker mengambil versi lama
- [ ] TODO: berapa lama sampai pengguna menerimanya?

## 2. **Masalah migrasi** — risiko utama

Setelah `ResumeDocument` pengguna dimigrasi ke versi baru, me-rollback aplikasi berarti versi lama mungkin tidak bisa membaca data mereka.

Mitigasi:
- [ ] Naikkan versi schema hanya ketika benar-benar perlu
- [ ] Uji migrasi secara menyeluruh sebelum rilis
- [ ] Pertimbangkan menyimpan satu salinan pra-migrasi di IndexedDB sementara (TODO: putuskan)
- [ ] **Jangan pernah merilis migrasi dan perubahan besar lain di rilis yang sama**

## 3. Kriteria rollback
Rollback jika:
- [ ] Data pengguna hilang atau rusak
- [ ] Ekspor PDF rusak
- [ ] Aplikasi gagal dimuat di peramban Tier 1
- [ ] Kerentanan keamanan terkirim ke produksi

## 4. Komunikasi
- [ ] Bagaimana memberi tahu pengguna tanpa memiliki alamat email mereka
- [ ] Rilis GitHub, banner dalam aplikasi, README

## 5. Pemulihan pengguna
- [ ] Jika ada pengguna kehilangan data: berkas ekspor mereka adalah satu-satunya pemulihan
- [ ] **Ini alasan mengapa dorongan ekspor itu penting**
