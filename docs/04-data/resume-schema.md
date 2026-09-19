# Resume Schema — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — dokumen paling kritis di folder ini** |
| Terakhir diperbarui | 2026-09-15 |
| Versi schema saat ini | `1.0.0` (draft) |

> **Tanpa database server, schema JSON adalah kontrak persistence utama.** Ia menggantikan sebagian fungsi database: menentukan bentuk data, menjaga kompatibilitas, mendukung validasi, menjadi format cadangan, menjadi kontrak antar-renderer, dan menjadi konteks bagi agen AI.
>
> **Sumber kebenaran:** definisi Zod di `src/core/schema.ts`. `json-schema.json` digenerate darinya — **jangan diedit manual.**

---

## 1. Lapisan
| Lapisan | Apa | Di mana |
| :-- | :-- | :-- |
| Model internal | Bentuk dalam memori | `src/core/types.ts` |
| Skema validasi | Zod | `src/core/schema.ts` |
| Format berkas publik | `.cv4e.json` | `import-export-spec.md` |
| JSON Schema | Tergenerate | `json-schema.json` |

## 2. Versioning
- [ ] Semver. Mayor = perubahan yang merusak.
- [ ] Aturan: **aplikasi versi N harus dapat mengimpor dokumen versi N−1 ke bawah**
- [ ] Aplikasi tidak wajib mengekspor kembali format lama
- [ ] Migrasi harus deterministik dan tidak boleh menghapus data pengguna
- [ ] Rujuk `migration-policy.md`

## 3. Struktur tingkat atas
```jsonc
{
  "schemaVersion": "1.0.0",
  "meta":     { "locale": "id", "mode": "ats", "template": "ats-default" },
  "basics":   { /* identitas dan kontak */ },
  "sections": { /* education, experience, projects, organizations, skills, certifications */ },
  "sectionOrder": ["education", "experience", "organizations", "projects", "skills"]
}
```

## 4. Contoh `basics`
```jsonc
{
  "name": "Nama Pengguna",
  "headline": "Fresh Graduate Informatika",
  "email": "nama@example.com",
  "phone": "+62...",
  "location": "Ternate, Maluku Utara",
  "links": [{ "label": "LinkedIn", "url": "https://..." }],
  "summary": "...",
  "photo": { "enabled": true, "assetRef": "asset_01H..." }
}
```

## 5. Contoh `education`
```jsonc
{
  "institution": "Universitas Contoh",
  "degree": "S1 Informatika",
  "startDate": "2021-08",
  "endDate": "2025-08",
  "gpa": { "value": "3.50", "scale": "4.00", "label": "IPK" },
  "status": "graduated",
  "highlights": ["..."]
}
```

> **Mengapa `gpa` berupa objek:** menyimpan `3.5` sebagai angka menghilangkan skalanya, dan skala adalah justru yang membuat IPK Indonesia dapat dipahami. Ini contoh tepat dari aturan "semantik, bukan presentasional".

## 6. Yang perlu dilengkapi
- [ ] Definisi lengkap tiap section
- [ ] Field wajib versus opsional
- [ ] Batas panjang tiap field teks
- [ ] Format tanggal dan penanganan "sekarang"
- [ ] Nilai enum: `education[].status`, tingkat `skills`
- [ ] Nilai default untuk dokumen baru
- [ ] Aturan field tak dikenal saat impor — **simpan atau buang?** Menentukan kompatibilitas maju.
- [ ] Bentuk `sectionOrder` dan interaksinya dengan section kustom

## 7. Field yang secara sengaja TIDAK ada
Dicatat agar tidak ditambahkan diam-diam.

| Field | Alasan |
| :-- | :-- |
| Pilihan warna, font, ukuran per dokumen | Presentasional; milik template |
| `atsScore` atau semacamnya | Melanggar P7 |
| Riwayat atau metadata AI di dalam dokumen | Menggembungkan ekspor; simpan terpisah jika perlu |
| API key | Tidak pernah, di mana pun |
| Foto tersemat sebagai base64 | Menggembungkan berkas; pakai `assetRef` — **tetapi lihat `import-export-spec.md`** soal portabilitas antarperangkat |

## 8. Alat
- [ ] Generate `json-schema.json` dari Zod dalam CI; gagal jika hasilnya tidak sinkron
- [ ] Validasi seluruh fixture terhadap schema dalam CI
