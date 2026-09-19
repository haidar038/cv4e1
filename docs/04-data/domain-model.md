# Domain Model — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Konsep domain dan hubungannya, tidak bergantung pada bentuk serialisasi.
> Bentuk konkret ada di `resume-schema.md` dan `json-schema.json`.

---

## 1. Entitas inti

```text
ResumeDraft
  ├── id, name, createdAt, updatedAt
  └── ResumeDocument
        ├── schemaVersion
        ├── meta         (locale, mode terakhir, template)
        ├── basics       (nama, headline, kontak, ref foto)
        └── sections[]
              ├── Education[]
              ├── Experience[]
              ├── Project[]
              ├── Organization[]
              ├── Skill[]
              └── Certification[]

Asset  (Blob foto, dirujuk lewat assetRef — tidak disematkan)
Preferences  (locale, tema, mode terakhir — di localStorage, bukan di dokumen)
```

## 2. Aturan pemodelan
- [ ] **Field bersifat semantik, bukan presentasional.** Simpan `gpa.scale`, bukan `gpaDisplayString`.
- [ ] Tidak ada field yang hanya bermakna bagi satu template
- [ ] Tidak ada state UI di dalam dokumen
- [ ] Aset dirujuk, tidak disematkan
- [ ] Urutan data sumber bermakna dan harus dipertahankan

## 3. Invariant
- [ ] `schemaVersion` selalu ada
- [ ] `basics.name` wajib; sisanya opsional
- [ ] Section kosong valid dan tidak boleh menghasilkan heading kosong saat render
- [ ] `photo.assetRef` boleh ada meskipun mode ATS aktif — penyembunyian adalah urusan render
- [ ] Tanggal disimpan sebagai `YYYY-MM` atau `YYYY-MM-DD`; pemformatan urusan render

## 4. Konsep khusus Indonesia
- [ ] `gpa` sebagai objek `{ value, scale, label }` — bukan angka tunggal
- [ ] `education[].status` enum mencakup `awaiting-ceremony`
- [ ] `Organization` sebagai entitas kelas satu, bukan varian `Experience`
- [ ] TODO: apakah `Organization` dan `Experience` berbagi bentuk atau terpisah? Keputusan ini memengaruhi renderer.

## 5. Yang perlu dilengkapi
- [ ] Definisi field lengkap tiap entitas
- [ ] Field wajib versus opsional
- [ ] Aturan validasi tiap field
- [ ] Batas panjang
- [ ] Nilai default
