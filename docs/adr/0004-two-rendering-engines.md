# ADR-0004: Dua renderer dari satu model kanonik

- **Status:** Accepted
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek

## Context

Pilar diferensiasi utama cv4every1 adalah Dual-Engine Switcher: pengguna mengisi satu form dan menghasilkan CV versi ATS maupun versi Creative.

Ini bukan sekadar pemilihan template. Kedua mode memberlakukan aturan yang berbeda:
- Mode ATS menyembunyikan foto, memaksa satu kolom, melarang tabel untuk struktur inti, dan membatasi dekorasi
- Mode Creative mengizinkan foto, dua kolom, dan aksen warna

Kompetitor memperlakukan ini sebagai pilihan tema. Kami memperlakukannya sebagai mode yang menegakkan aturan, dan menjelaskan aturan itu kepada pengguna.

## Options

1. **Satu renderer, pengaturan tema** — satu codepath, mode sebagai konfigurasi
2. **Dua renderer, model data terpisah** — independen sepenuhnya
3. **Dua renderer, satu model kanonik dengan view model ternormalisasi**
4. **Renderer berbasis template yang digerakkan konfigurasi** — mode didefinisikan sebagai data

## Decision

**Opsi 3.** Satu `ResumeDocument` kanonik. Fungsi `normalize()` murni menurunkan `ATSViewModel` dan `CreativeViewModel`. Dua renderer terpisah mengonsumsi view model masing-masing.

**Aturan mode diberlakukan di lapisan normalisasi, bukan di renderer.** Renderer bersifat bodoh: mereka menampilkan apa yang diberikan view model.

## Consequences

**Positif**
- Berpindah mode tidak mungkin kehilangan data — data sumber tidak pernah disentuh
- Aturan mode dapat diuji tanpa DOM, karena `normalize()` adalah fungsi murni
- Aturan mode tidak bisa dilanggar template, karena template tidak pernah melihat data yang seharusnya disembunyikan
- Kebebasan visual di mode Creative tidak mengancam disiplin di mode ATS
- Menambah template di dalam satu mode tidak menyentuh aturan mode

**Negatif**
- **Dua renderer akan cenderung menyimpang** seiring waktu, terutama dengan satu pemelihara
- Setiap section baru harus diimplementasikan dua kali
- Lapisan normalisasi menambah tingkat tidak langsung yang harus dipahami kontributor baru
- Regresi visual harus mencakup semua fixture × semua mode × semua template, sehingga waktu CI tumbuh

**Mitigasi divergensi** — ini adalah konsekuensi negatif paling serius:
- Rendering contract eksplisit yang mendaftarkan apa yang wajib didukung setiap renderer
- Uji khusus: untuk setiap fixture, pastikan seluruh konten yang sama muncul di kedua mode; satu-satunya perbedaan yang diizinkan adalah foto, jumlah kolom, warna, dan ikon
- Jaga jumlah template tetap sedikit (P10)

## Rejected alternatives

**Satu renderer dengan pengaturan tema** tidak dapat menegakkan aturan mode secara struktural. Sebuah template pada akhirnya akan menampilkan foto di mode ATS, karena tidak ada yang mencegahnya. Penegakan lewat konvensi akan gagal.

**Dua model data terpisah** menghancurkan alasan fitur ini ada. Seluruh nilainya terletak pada satu data untuk dua keluaran.

**Renderer berbasis konfigurasi** menarik dan mungkin akan lebih baik dalam jangka panjang, tetapi mengharuskan merancang bahasa template sebelum kami memahami apa yang sebenarnya dibutuhkan template. Terlalu dini. Dapat ditinjau ulang setelah dua sampai tiga template terbukti dipakai.
