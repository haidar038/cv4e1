# Rendering Architecture — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — memuat risiko terbesar proyek** |
| Terakhir diperbarui | 2026-09-15 |

> Dokumen ini mencegah kedua renderer berkembang tidak konsisten, dan memuat keputusan pipeline PDF yang belum terselesaikan.

---

## 1. Pipeline

```text
ResumeDocument
      ↓
 normalize()          ← aturan mode diberlakukan DI SINI
      ↓
ATSViewModel   CreativeViewModel
      ↓                ↓
ATSRenderer     CreativeRenderer
      ↓                ↓
      └────── PDF Export ──────┘
```

## 2. Rendering contract

### Wajib bagi semua renderer
- [ ] Menampilkan nama
- [ ] Mendukung headline, kontak, pendidikan, pengalaman, proyek, organisasi, keahlian
- [ ] Mengabaikan field kosong tanpa menyisakan heading kosong
- [ ] Mempertahankan urutan data sumber
- [ ] Menghasilkan teks yang dapat diseleksi pada PDF
- [ ] Menangani teks sangat panjang tanpa meluber
- [ ] Format tanggal yang konsisten
- [ ] Format IPK sesuai `../01-product/localization-guide.md`

### Aturan mode ATS *(diberlakukan, bukan disarankan)*
- [ ] Satu kolom
- [ ] Tanpa foto
- [ ] Tanpa ikon yang menggantikan teks
- [ ] Heading standar dari kosakata yang ditentukan
- [ ] Tanpa tabel untuk struktur inti
- [ ] Tanpa teks dekoratif
- [ ] Urutan baca dapat diprediksi
- [ ] Font standar, disematkan

### Izin mode Creative
- [ ] Foto diizinkan
- [ ] Dua kolom diizinkan
- [ ] Aksen warna diizinkan
- [ ] Ikon sebagai pelengkap teks, bukan pengganti
- [ ] **Tetap wajib:** teks dapat diseleksi dan dapat dibaca

### Penegakan
- [ ] Bagaimana aturan mode ditegakkan secara struktural, bukan lewat konvensi
- [ ] Test yang gagal jika sebuah template melanggar aturan modenya

## 3. Sistem template
- [ ] Bagaimana template didaftarkan
- [ ] Apa yang boleh dikustomisasi template versus yang tetap
- [ ] **Template tidak pernah bisa mengesampingkan aturan mode**
- [ ] MVP: berapa template? (usulan: 1 ATS, 1–2 Creative)

## 4. Paginasi
- [ ] Ukuran halaman: A4 dan Letter
- [ ] Aturan page break: jangan memutus di tengah item pengalaman
- [ ] Penanganan luberan
- [ ] Peringatan panjang untuk pengguna
- [ ] **Risiko:** perbedaan paginasi lintas peramban (asumsi A-T3)

## 5. Pipeline PDF — **KEPUTUSAN TERBUKA, RISIKO TERTINGGI**

Seluruh premis mode ATS bergantung pada ini. Prototipe sebelum membangun apa pun di atasnya.

| Opsi | Kelebihan | Kekurangan |
| :-- | :-- | :-- |
| **A. Cetak peramban + CSS Paged Media** | Satu jalur kode, tanpa divergensi, teks nyata, font tersemat, nol dependensi | UX dialog cetak, header/footer peramban, paginasi bervariasi antarperamban |
| **B. `@react-pdf/renderer`** | Kontrol presisi, keluaran konsisten, teks nyata | Implementasi kedua per template — **risiko divergensi tinggi**, ukuran bundle |
| **C. html2canvas → PDF** | Kesetiaan visual sempurna | **DITOLAK — menghasilkan raster, menghancurkan ekstraksi teks, melanggar C-T5** |

- [ ] Lakukan spike (`../00-project-context/assumptions-and-constraints.md` §5 R1)
- [ ] Tulis ADR dengan hasilnya — **kandidat ADR-0007**
- [ ] Opsi C dilarang secara permanen, apa pun hasilnya

## 6. Font
- [ ] Font berlisensi bebas, di-subset, dibundel (C-T11)
- [ ] Wajib disematkan di PDF agar ekstraksi teks bekerja
- [ ] Rantai fallback
- [ ] TODO: pilih font — utamakan yang aman untuk parser

## 7. Pengujian
- [ ] Regresi visual: semua fixture × semua mode × semua template
- [ ] Ekstraksi teks: setiap fixture mode ATS harus pulih sepenuhnya
- [ ] Rujuk `../07-quality/ats-test-plan.md` dan `visual-regression-plan.md`
