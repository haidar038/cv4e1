# Use Cases — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Format tiap use case: ID · Aktor · Prakondisi · Pemicu · Alur utama · Alur alternatif · Alur pengecualian · Poskondisi · FR terkait.
> Use case menjadi dasar langsung test end-to-end di `e2e/`.

---

## UC-001 — Membuat CV pertama
- [ ] Aktor: pengunjung pertama kali
- [ ] Prakondisi: tidak ada draft tersimpan
- [ ] FR terkait: FR-101, FR-102, FR-109
- [ ] Pengecualian: storage diblokir (FR-111)

## UC-002 — Mengisi pendidikan dengan panduan IPK
- [ ] FR terkait: FR-201, FR-202
- [ ] Alternatif: pengguna mengabaikan saran format

## UC-003 — Beralih ke mode ATS
- [ ] FR terkait: FR-001, FR-002, FR-003, FR-203
- [ ] **Poskondisi kritis:** data sumber tidak berubah; foto masih tersimpan

## UC-004 — Menyisipkan kata kerja aksi
- [ ] FR terkait: FR-205, FR-206
- [ ] Prakondisi: offline (harus tetap berfungsi)

## UC-005 — Mengekspor PDF
- [ ] FR terkait: FR-301, FR-302, FR-303, FR-304
- [ ] Pengecualian: konten meluber melewati batas halaman

## UC-006 — Mengekspor draft ke berkas
- [ ] FR terkait: FR-104, FR-110

## UC-007 — Mengimpor draft dari berkas
- [ ] FR terkait: FR-105, FR-106, FR-107
- [ ] Pengecualian: JSON cacat, versi schema lebih baru, berkas terlalu besar, field tak dikenal

## UC-008 — Memakai aplikasi offline
- [ ] FR terkait: NFR-001, NFR-002, FR-408

## UC-009 — Menghapus semua data
- [ ] FR terkait: FR-108
- [ ] Alternatif: pengguna mengekspor lebih dulu saat ditawarkan

## UC-010 — Meminta saran bullet AI
- [ ] FR terkait: FR-401, FR-402, FR-404, FR-405
- [ ] Pengecualian: tanpa key, rate limit, timeout, output cacat (FR-403, FR-406)

## UC-011 — Memasang dan mengelola API key
- [ ] FR terkait: FR-407, FR-110

## UC-012 — Mengimpor CV lama (Fase 3)
- [ ] FR terkait: FR-501, FR-502

## UC-013 — Mengganti bahasa antarmuka (Fase 3, ADR-0012)
- [ ] Aktor: pengguna yang membutuhkan antarmuka Bahasa Inggris
- [ ] Prakondisi: aplikasi terbuka pada locale apa pun
- [ ] Pemicu: pengguna memilih bahasa lain pada pengalih
- [ ] Alur utama: pilih bahasa → antarmuka tampil dalam bahasa itu → preferensi tersimpan
- [ ] Alternatif: kunci EN hilang → fallback Bahasa Indonesia tampil, tanpa crash (FR-703)
- [ ] **Poskondisi kritis:** data sumber tidak berubah; preferensi bertahan setelah tab ditutup
- [ ] FR terkait: FR-701, FR-702, FR-703, FR-704
- [ ] Pengecualian: localStorage diblokir — preferensi hanya berlaku sesi itu

## Use case yang perlu ditambahkan
- [ ] Mengelola beberapa draft
- [ ] Pemulihan setelah pengusiran storage
- [ ] Beberapa tab terbuka bersamaan
