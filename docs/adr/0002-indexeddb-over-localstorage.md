# ADR-0002: IndexedDB sebagai penyimpanan lokal utama

- **Status:** Accepted
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek
- **Depends on:** ADR-0001

## Context

Tanpa backend (ADR-0001), aplikasi harus menyimpan data CV terstruktur, beberapa draft, dan aset lokal berupa foto profil — semuanya di peramban.

Kebutuhan konkret:
- Data terstruktur dengan versi schema
- Blob biner (foto) yang bisa berukuran ratusan kilobyte
- Beberapa draft per pengguna
- Penulisan autosave yang sering tanpa memblokir UI
- Kapasitas yang cukup untuk semua hal di atas

## Options

1. **localStorage** — API sederhana, sinkron
2. **IndexedDB** — terstruktur, asinkron, mendukung Blob
3. **Hanya berkas** — tanpa penyimpanan otomatis, pengguna menyimpan manual
4. **SQLite lewat WASM** — database tersemat penuh

## Decision

**IndexedDB** untuk seluruh data CV, draft, dan aset. **localStorage** hanya untuk preferensi UI kecil: locale, tema, mode terakhir, id draft terakhir. Berkas JSON untuk ekspor portabel.

Data CV tidak pernah berada di localStorage. Ini adalah batasan mengikat (C-T7).

## Consequences

**Positif**
- Mendukung data terstruktur dan Blob dalam satu penyimpanan
- API asinkron tidak memblokir thread utama saat autosave
- Kapasitas jauh lebih besar daripada kuota ~5 MB localStorage
- Versioning database bawaan mendukung migrasi schema
- Berfungsi offline
- Dukungan luas di peramban modern

**Negatif**
- Membutuhkan lapisan adapter; API mentahnya berat
- Menambah dependensi (Dexie) atau kode boilerplate yang cukup banyak
- **Penyimpanan peramban dapat diusir**, dan IndexedDB tidak kebal terhadap ini
- Safari iOS dapat menghapus penyimpanan situs setelah periode tidak dipakai jika PWA tidak dipasang — ini adalah kasus terburuk dan harus diuji secara khusus
- Lebih sulit diinspeksi saat debugging dibanding localStorage
- Sebagian mode privat memblokir atau membatasi IndexedDB; aplikasi harus tetap berfungsi dengan degradasi yang jelas (C-T12)

**Mitigasi**
- Minta `navigator.storage.persist()`
- Dorong ekspor sebagai cadangan sesungguhnya
- Deteksi dan tangani kuota terlampaui tanpa kehilangan state dalam memori
- Peringatan jujur kepada pengguna bahwa penyimpanan peramban bukan cadangan

## Rejected alternatives

**localStorage** tidak memadai: kuota sekitar 5 MB tidak muat untuk foto, API-nya sinkron sehingga autosave yang sering akan memblokir UI, dan ia hanya menyimpan string sehingga data terstruktur perlu serialisasi manual di setiap operasi.

**Hanya berkas** menghilangkan autosave. Pengguna sasaran mengerjakan CV dalam sesi pendek yang terputus-putus, sering mepet tenggat. Kehilangan pekerjaan karena tab tertutup adalah kegagalan yang tidak bisa diterima.

**SQLite lewat WASM** menambah beban bundle yang besar untuk kebutuhan kueri yang tidak kami miliki. Kami menyimpan puluhan record, bukan puluhan ribu, dan tidak melakukan kueri relasional. Ini melanggar prinsip "membosankan itu fitur" (P10).
