# Sample Resumes

Fixture `ResumeDocument` untuk pengujian dan pengembangan.

**Aturan:** data harus jelas-jelas fiktif. Jangan pernah memasukkan nama, kontak, atau riwayat orang sungguhan.

## Fixture yang dibutuhkan

| Berkas | Menguji | Status |
| :-- | :-- | :-- |
| `fresh-graduate-id.json` | Kasus utama: fresh graduate Indonesia, IPK, organisasi, tanpa pengalaman kerja | ✅ |
| `awaiting-graduation-id.json` | Status `awaiting-ceremony`, pendidikan sedang berjalan | ⬜ |
| `software-engineer-en.json` | Locale Inggris, pengalaman kerja formal | ⬜ |
| `no-experience.json` | Section kosong — tidak boleh menghasilkan heading kosong | ⬜ |
| `long-experience.json` | Luberan halaman, perilaku page break | ⬜ |
| `long-name.json` | Pembungkusan teks, luberan header | ⬜ |
| `missing-optional-fields.json` | Hanya field wajib | ⬜ |
| `with-photo.json` | Penanganan aset, penyembunyian mode ATS | ⬜ |
| `special-characters.json` | Diakritik, emoji, RTL, HTML dalam teks (sanitasi) | ⬜ |
| `schema-v0.9.json` | Pengujian migrasi | ⬜ |

## Cara dipakai
- Regresi visual: semua fixture × semua mode × semua template
- Ekstraksi teks PDF: setiap fixture mode ATS harus pulih sepenuhnya
- Round-trip: ekspor lalu impor setiap fixture
- Migrasi: fixture versi lama harus bermigrasi menjadi dokumen valid
