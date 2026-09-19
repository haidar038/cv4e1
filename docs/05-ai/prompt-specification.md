# Prompt Specification — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Prompt disimpan sebagai berkas berversi. **Jangan pernah menaruh prompt di dalam komponen UI.**

---

## 1. Struktur berkas
```text
prompts/
├── id/
│   ├── bullet-generator.v1.md
│   ├── polish.v1.md
│   └── jd-tailoring.v1.md
├── en/
│   ├── bullet-generator.v1.md
│   └── polish.v1.md
└── shared/
    ├── grounding-rules.v1.md
    └── output-schema.v1.json
```

## 2. Yang wajib ada di setiap prompt
- [ ] Tujuan
- [ ] Input dan tipenya
- [ ] Output schema (rujuk `structured-output-spec.md`)
- [ ] Aturan grounding (sertakan `shared/grounding-rules.v1.md`)
- [ ] Bahasa
- [ ] Contoh valid
- [ ] **Contoh tidak valid** — sering lebih berguna daripada contoh valid
- [ ] Batas token
- [ ] Perilaku fallback
- [ ] Versi dan catatan perubahan

## 3. Aturan grounding bersama
Harus disertakan di setiap prompt. Lihat `hallucination-policy.md` untuk teks lengkap.

- [ ] Jangan mengarang angka, perusahaan, jabatan, sertifikasi, pengalaman, skill
- [ ] Jangan mengubah tanggal
- [ ] Jangan menghapus fakta tanpa menandainya
- [ ] Pakai placeholder `[X]` untuk metrik yang tidak diberikan
- [ ] Keluarkan hanya JSON yang sesuai schema

## 4. Versioning
- [ ] Prompt bersifat append-only seperti ADR: `v1`, `v2`, jangan edit di tempat
- [ ] Alasan: keluaran dapat berubah drastis; kita harus bisa menelusuri ke belakang
- [ ] Set evaluasi dijalankan terhadap setiap versi prompt

## 5. Konteks yang disisipkan
- [ ] Field mana yang boleh disisipkan ke prompt (minimisasi data)
- [ ] **Sanitasi input pengguna sebelum disisipkan** — ini permukaan prompt injection
- [ ] Anggaran token

## 6. Pengujian
- [ ] Setiap prompt dijalankan terhadap `evaluation-dataset.md`
- [ ] Uji invariant, bukan string persis
