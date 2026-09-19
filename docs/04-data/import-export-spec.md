# Import / Export Specification — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — ini kontrak publik** |
| Terakhir diperbarui | 2026-09-15 |

> Begitu orang memiliki berkas dengan format ini, kita terikat padanya. Perlakukan perubahan seperti perubahan API publik.

---

## 1. Format berkas
| Properti | Nilai |
| :-- | :-- |
| Ekstensi | `.cv4e.json` |
| MIME type | `application/json` |
| Encoding | UTF-8 |
| Versi | Field `schemaVersion` |

## 2. Dua jenis ekspor

| Jenis | Isi | Kasus pakai |
| :-- | :-- | :-- |
| **Resume document** | Satu `ResumeDocument` | Berbagi atau memindahkan satu CV |
| **Full backup** | Semua draft, preferensi, aset | Pindah perangkat, cadangan |

**Keduanya tidak pernah memuat API key.** Ini mutlak.

## 3. Amplop
```jsonc
{
  "format": "cv4every1",
  "kind": "resume" | "backup",
  "formatVersion": "1.0.0",
  "exportedAt": "2026-09-15T00:00:00Z",
  "data": { /* ... */ }
}
```
- [ ] Finalkan bentuk amplop
- [ ] TODO: apakah `exportedAt` termasuk PII? (kemungkinan tidak, tapi putuskan sadar)

## 4. Foto dan aset — **keputusan terbuka**

Ketegangan nyata: aset disimpan sebagai Blob dengan `assetRef`, tetapi berkas ekspor harus bisa dibuka di perangkat lain.

| Opsi | Kelebihan | Kekurangan |
| :-- | :-- | :-- |
| Sematkan base64 di ekspor | Portabel sepenuhnya | Ukuran berkas membengkak |
| Kecualikan aset | Berkas kecil | Foto hilang saat pindah perangkat — mengejutkan pengguna |
| Sematkan di `backup`, kecualikan di `resume` | Seimbang | Dua perilaku untuk dijelaskan |

- [ ] **Putuskan dan dokumentasikan.** Usulan: opsi ketiga.
- [ ] Batas ukuran berapa pun pilihannya

## 5. Aturan impor
- [ ] Batas ukuran berkas (TODO: tetapkan) — lihat abuse case
- [ ] Validasi sebelum apa pun menyentuh state
- [ ] Migrasi versi lama secara otomatis, beri tahu hasilnya
- [ ] Tolak versi yang lebih baru dengan pesan yang membantu
- [ ] Field tak dikenal: simpan atau buang? **(TODO — menentukan kompatibilitas maju)**
- [ ] Sanitasi seluruh teks sebelum render
- [ ] **Jangan pernah menimpa draft yang ada tanpa konfirmasi**

## 6. Penanganan error
Setiap kondisi butuh pesan berbahasa Indonesia yang dapat ditindaklanjuti:
- [ ] Bukan JSON
- [ ] JSON valid tetapi bukan berkas cv4every1
- [ ] Versi schema lebih baru dari yang didukung
- [ ] Gagal validasi schema
- [ ] Berkas terlalu besar
- [ ] Aset rusak

**Aturan:** kegagalan impor tidak boleh mengubah state yang ada.

## 7. Round-trip
- [ ] Ekspor lalu impor harus menghasilkan dokumen yang setara secara semantik
- [ ] Diuji pada setiap fixture, setiap rilis
- [ ] Definisikan "setara secara semantik" secara tepat (urutan field? timestamp?)

## 8. Kompatibilitas
- [ ] Rujuk `migration-policy.md`
- [ ] Jaminan apa yang kami berikan kepada pengguna, dalam bahasa awam

## 9. Dokumentasi publik
- [ ] Format ini harus terdokumentasi publik agar alat lain dapat membacanya
- [ ] TODO: pertimbangkan penerjemah dari/ke JSON Resume untuk interoperabilitas
