# Migration Policy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Prinsip
- [ ] Migrasi bersifat **deterministik** — input sama, output sama, selalu
- [ ] Migrasi **tidak pernah menghapus data pengguna** — bahkan field yang sudah usang
- [ ] Migrasi bersifat **maju saja** — kami tidak menurunkan versi
- [ ] Aplikasi versi N mengimpor dokumen versi N−1 ke bawah
- [ ] Setiap migrasi punya test dan fixture untuk versi lamanya

## 2. Kapan versi dinaikkan
| Perubahan | Kenaikan versi |
| :-- | :-- |
| Menambah field opsional | Minor |
| Menambah enum | Minor |
| Mengganti nama field | **Mayor** |
| Menghapus field | **Mayor** |
| Mengubah tipe field | **Mayor** |
| Mengubah arti field | **Mayor** |

**Perubahan mayor butuh ADR** (AGENTS.md §9).

## 3. Implementasi migrasi
```text
migrate(doc) → cek schemaVersion → jalankan migrasi berurutan → validasi → kembalikan
```
- [ ] Registri migrasi per versi
- [ ] Rantai migrasi, bukan lompat langsung
- [ ] Validasi setelah setiap langkah
- [ ] Apa yang terjadi jika migrasi gagal — **jangan pernah menghancurkan dokumen asli**

## 4. Menangani data usang
- [ ] Field yang dihapus dipindahkan ke `_deprecated` alih-alih dibuang? (TODO — putuskan)
- [ ] Alasan: pengguna mungkin masih membutuhkannya; kami tidak boleh menjadi sebab kehilangan

## 5. Pengujian
- [ ] Fixture untuk setiap versi schema yang pernah dirilis
- [ ] Test: setiap fixture lama bermigrasi menjadi dokumen valid terkini
- [ ] Test: migrasi bersifat idempoten
- [ ] Test: tidak ada field yang hilang secara diam-diam

## 6. Komunikasi kepada pengguna
- [ ] Beri tahu ketika dokumen dimigrasi
- [ ] Jelaskan apa yang berubah, dalam bahasa awam
- [ ] Sarankan ekspor cadangan setelah migrasi
