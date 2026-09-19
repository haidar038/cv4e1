# Structured Output Specification — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> **Jangan pernah bergantung pada teks bebas.** Minta JSON terstruktur, lalu validasi terhadap schema. Keluaran yang tidak valid ditolak, bukan ditambal.

---

## 1. Prinsip
- [ ] Semua keluaran AI berupa JSON
- [ ] Divalidasi terhadap JSON Schema sebelum menyentuh state apa pun
- [ ] Keluaran tidak valid → tolak → fallback, jangan dipaksa sembuh
- [ ] Parsing gagal bukan keadaan darurat; ia adalah jalur yang diharapkan

## 2. Contoh schema output — saran bullet
```jsonc
{
  "suggestions": [
    {
      "text": "Mengkoordinasikan panitia beranggotakan [jumlah] orang untuk ...",
      "actionVerb": "Mengkoordinasikan",
      "usesPlaceholder": true,
      "rationale": "Mengubah deskripsi tugas menjadi pernyataan koordinasi",
      "warnings": []
    }
  ]
}
```
- [ ] Finalkan schema untuk setiap kapabilitas
- [ ] Simpan di `prompts/shared/output-schema.v1.json`

## 3. Pipeline validasi
```text
Respons mentah → ekstrak JSON → parse → validasi schema
  → pemeriksaan grounding → tampilkan pratinjau
```
- [ ] Setiap tahap punya perilaku kegagalan yang terdefinisi
- [ ] **Pemeriksaan grounding adalah lapisan kami sendiri**, bukan bagian dari validasi schema

## 4. Pemeriksaan grounding sebagai kode
- [ ] Ekstrak semua angka dari keluaran; bandingkan dengan angka di input
- [ ] Ekstrak nama entitas; bandingkan dengan input
- [ ] Tolak jika ada yang baru
- [ ] TODO: bagaimana menangani angka yang sah muncul dari input (tahun, jumlah)

## 5. Penanganan kegagalan
| Kegagalan | Perilaku |
| :-- | :-- |
| Bukan JSON | Tolak, fallback ke statis |
| JSON valid, schema tidak cocok | Tolak, fallback |
| Lolos schema, gagal grounding | Tolak, catat sebagai insiden pada set evaluasi |
| Kosong | Fallback |
| Timeout | Fallback, draft tidak tersentuh |

**Dalam semua kasus: draft pengguna tidak berubah.**
