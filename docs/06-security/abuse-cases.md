# Abuse Cases — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Yang bisa dilakukan penyerang — atau sekadar pengguna ceroboh — yang belum dipikirkan desain normal.
> Setiap baris di sini harus punya test.

---

## Abuse case

| # | Skenario | Dampak | Mitigasi | Test |
| :-- | :-- | :-- | :-- | :-- |
| AB-1 | Berkas JSON sangat besar diimpor | Tab hang atau crash | Batas ukuran sebelum parsing | ⬜ |
| AB-2 | Bom dekompresi gambar | Memori habis | Batas dimensi sebelum decoding | ⬜ |
| AB-3 | Prompt injection di deskripsi lowongan | AI mengabaikan aturan grounding | Sanitasi, perlakukan sebagai data, uji invariant | ⬜ |
| AB-4 | CV memuat instruksi yang ditujukan ke AI | Sama seperti AB-3 | Sama | ⬜ |
| AB-5 | API key palsu atau salah | Error membingungkan | Validasi, pesan jelas, fallback | ⬜ |
| AB-6 | Penyedia mengembalikan JSON cacat | Crash atau data rusak | Validasi schema, tolak, fallback | ⬜ |
| AB-7 | Penyedia mengembalikan JSON valid berisi karangan | Pengguna berbohong di CV tanpa sadar | Pemeriksaan grounding | ⬜ |
| AB-8 | Service worker menyajikan bundle lama | Perbaikan tidak sampai ke pengguna | Cache berversi, alur pembaruan | ⬜ |
| AB-9 | Impor dengan field tak dikenal | Data rusak atau hilang diam-diam | Kebijakan field tak dikenal yang eksplisit | ⬜ |
| AB-10 | XSS lewat field summary | Pencurian data | Sanitasi, tanpa innerHTML | ⬜ |
| AB-11 | XSS lewat URL tautan | Pencurian data | Validasi skema URL | ⬜ |
| AB-12 | Impor dengan versi schema lebih baru | Crash atau kerusakan diam-diam | Tolak dengan pesan membantu | ⬜ |
| AB-13 | Kuota storage sengaja dihabiskan | Kehilangan data | Deteksi, peringatkan, tawarkan ekspor |⬜ |
| AB-14 | Beberapa tab menulis draft yang sama | Kehilangan data | Kebijakan multi-tab | ⬜ |
| AB-15 | Pengguna meminta AI mengarang pengalaman | Kerusakan pada pengguna sendiri | Tolak; jelaskan sekali | ⬜ |
| AB-16 | Berkas ekspor dibagikan tanpa sengaja beserta foto | Kebocoran PII | Dokumentasikan isi ekspor dengan jelas | ⬜ |

## Yang perlu ditambahkan
- [ ] Penyalahgunaan saat offline
- [ ] Skenario pemulihan setelah pengusiran storage
- [ ] Skenario penyalahgunaan pada perangkat bersama
