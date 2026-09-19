# Contributing to cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Untuk agen AI, [`AGENTS.md`](AGENTS.md) yang mengikat. Dokumen ini menambahkan alur kerja manusia.
> Kontribusi eksternal dibuka setelah MVP.

---

## Sebelum berkontribusi
- [ ] Baca [`AGENTS.md`](AGENTS.md) §2 — batasan yang tidak bisa dinegosiasikan
- [ ] Baca [`docs/00-project-context/vision.md`](docs/00-project-context/vision.md)
- [ ] Periksa apakah sudah ada ADR yang membahas topiknya

## Alur kerja
- [ ] Penamaan branch: TODO
- [ ] Commit: Conventional Commits
- [ ] Format deskripsi PR → `AGENTS.md` §13
- [ ] Pemeriksaan yang wajib lulus → `docs/08-delivery/ci-cd.md` §2
- [ ] Aturan peninjauan: TODO

## Yang membutuhkan diskusi lebih dulu
- Perubahan schema apa pun
- Dependensi baru
- Apa pun yang menyentuh batas AI
- Apa pun yang memengaruhi perilaku offline
- Template baru

## Yang tidak akan diterima
- Fitur yang melanggar batasan HARD di `docs/00-project-context/assumptions-and-constraints.md` §2
- Analytics atau telemetri
- Skrip pihak ketiga saat runtime
- Apa pun yang mensyaratkan akun atau backend
- Apa pun yang membuat sistem menyatakan fakta yang tidak diberikan pengguna

## Standar kode
- [ ] TypeScript strict
- [ ] Pakai identifier dari `docs/00-project-context/glossary.md`
- [ ] Aturan batas modul → `docs/03-architecture/architecture-overview.md` §5
- [ ] Test wajib → `AGENTS.md` §6

## Data pengujian
- [ ] **Data fiktif saja.** Jangan pernah memasukkan nama, kontak, atau riwayat orang sungguhan.

## Menerjemahkan
- [ ] Bahasa Indonesia adalah sumber; bahasa lain mengikuti
- [ ] Micro-copy khas Indonesia tidak diterjemahkan — ia dinonaktifkan pada locale lain
- [ ] → `docs/01-product/localization-guide.md`
