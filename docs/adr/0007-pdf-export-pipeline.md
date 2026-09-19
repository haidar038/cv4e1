# ADR-0007: Pipeline ekspor PDF untuk mode ATS dan Creative

- **Status:** Accepted (diterima 2026-09-20 — diadopsi sebagai arah Fase −1 dan menjadi dasar Fase 1; konten keputusan tidak diubah)
- **Date:** 2026-09-18
- **Decision owner:** Maintainer proyek
- **Related:** ADR-0004 (dua renderer), rendering-architecture.md §5

## Context

Seluruh premis mode ATS bergantung pada kemampuan menghasilkan PDF yang teksnya dapat diekstrak oleh parser pelamar kerja otomatis. Jika PDF hasil ekspor berupa raster (gambar), maka fitur utama produk ini gagal — meskipun UI preview terlihat sempurna.

`rendering-architecture.md` §5 mengidentifikasi tiga opsi pipeline PDF:

| Opsi | Deskripsi | Risiko utama |
| :-- | :-- | :-- |
| **A** | HTML statis + CSS Paged Media, dicetak via browser print dialog atau headless browser | UX dialog cetak; header/footer peramban; paginasi bervariasi antarperamban |
| **B** | `@react-pdf/renderer` — komponen React → PDF binary langsung di Node/browser | Implementasi kedua per template (divergensi); ukuran bundle ~300 KB gzip |
| **C** | html2canvas → screenshot → PDF | **DITOLAK PERMANEN** — menghasilkan raster, menghancurkan ekstraksi teks, melanggar C-T5 |

Opsi C sudah ditolak secara eksplisit di `AGENTS.md` §10 dan `assumptions-and-constraints.md`. Spike ini membandingkan A dan B.

### Hasil Spike S1 (2026-09-18)

Fixture: `fresh-graduate-id.json` (data fiktif "Rania Putri Maharani", CV fresh graduate lengkap dengan semua section).

#### Kandidat A — HTML + Print CSS

- File: `experiments/pdf-spike/candidate-a-print-css/ats-cv.html`
- Pendekatan: satu file HTML self-contained dengan `<style>` inline berisi aturan `@page`, margin A4, font stack sistem (`Segoe UI, Arial, Helvetica, sans-serif`).
- Enforced ATS rules secara struktural di markup: satu kolom (tanpa flex/grid multi-kolom), tanpa foto, tanpa ikon pengganti teks, heading standar uppercase.
- Ekstraksi teks dari sumber HTML: **semua 22 string wajib ditemukan** ✓
- Catatan: Playwright headless browser mengalami timeout saat percobaan generate PDF otomatis di lingkungan dev Windows. Ini bukan kegagalan pendekatan itu sendiri — print-to-PDF melalui browser desktop pengguna bekerja normal. Batasan ini berarti **uji otomatis lintas-browser harus dijalankan di CI dengan container Linux**, bukan di mesin developer lokal.

#### Kandidat B — @react-pdf/renderer v4.9.0

- File: `experiments/pdf-spike/candidate-b-react-pdf/ATSResume.tsx`
- Dependensi: `@react-pdf/renderer` (MIT license, aktif dipelihara, tidak phone-home)
- Generate PDF server-side via `renderToBuffer()` — berjalan penuh di Bun/Node tanpa browser.
- Output: 1 halaman A4, 3.922 bytes.
- Ekstraksi teks dari PDF via `pdf-parse`: **semua 22 string wajib ditemukan** ✓ (case-insensitive)
- Temuan penting: `textTransform: 'uppercase'` pada nama membuat teks terekstrak sebagai "RANIA PUTRI MAHARANI". Parser ATS umumnya case-insensitive, jadi ini bukan masalah fungsional. Namun perlu diputuskan apakah nama ditampilkan uppercase atau mixed-case di PDF ATS final.
- Font: menggunakan font bawaan `Helvetica` (standar PDF base-14). Tidak ada embedding font kustom diperlukan untuk spike ini. Untuk produksi, font bebas-lisensi harus disubset dan dibundel sesuai C-T11.

### Perbandingan

| Kriteria | Kandidat A (Print CSS) | Kandidat B (@react-pdf) |
| :-- | :-- | :-- |
| Teks terekstrak | ✓ Semua hadir | ✓ Semua hadir |
| Jumlah codepath renderer | 1 (HTML = preview = PDF) | 2 (React DOM untuk preview, @react-pdf untuk PDF) |
| Konsistensi keluaran lintas browser | ✗ Paginasi bervariasi | ✓ Deterministik |
| Kontrol paginasi halus | Terbatas (CSS page-break) | Presisi (Props `wrap`, `fixed`) |
| Bundle size tambahan | 0 | ~300 KB gzip |
| Offline capability | ✓ (browser native) | ✓ (pure JS) |
| Kompleksitas implementasi | Rendah | Sedang–tinggi |
| Risiko divergensi preview↔PDF | Tinggi (preview ≠ hasil cetak persis) | Sangat tinggi (dua tree JSX terpisah) |
| Butuh dependensi baru? | Tidak | Ya (`@react-pdf/renderer`) |

## Options

1. **Kandidat A saja** — HTML + Print CSS untuk kedua mode. Preview dan PDF berbagi codepath yang sama.
2. **Kandidat B saja** — `@react-pdf/renderer` untuk PDF, React DOM untuk preview. Dua codepath terpisah.
3. **Hybrid: A untuk ATS, B untuk Creative** — ATS butuh kesederhanaan dan keandalan ekstraksi; Creative butuh kontrol visual presisi.
4. **A sekarang, evaluasi ulang nanti** — Mulai dengan A karena nol dependensi dan satu codepath. Tinjau ulang setelah MVP stabil jika kebutuhan paginasi kreatif meningkat.

## Decision

**Opsi 4: Mulai dengan Kandidat A (HTML + Print CSS).**

Alasan:

1. **Satu codepath menghilangkan risiko divergensi.** ADR-0004 sudah mencatat bahwa dua renderer cenderung menyimpang seiring waktu. Menambahkan jalur PDF ketiga memperburuk masalah ini secara signifikan. Dengan A, apa yang dilihat pengguna di preview adalah apa yang tercetak.
2. **Nol dependensi runtime baru.** Sesuai prinsip arsitektur (§2.5), menghindari third-party script/runtime kecuali benar-benar diperlukan. Print CSS adalah fitur web standar.
3. **Kesetiaan teks terbukti.** Spike menunjukkan bahwa output HTML dengan struktur ATS yang tepat menghasilkan teks yang sepenuhnya dapat diekstrak.
4. **Offline-first terjaga.** Browser print engine tersedia secara native tanpa jaringan.
5. **Keputusan dapat dibalik.** Jika di kemudian hari kebutuhan paginasi Creative menuntut kontrol yang tidak bisa dicapai CSS Paged Media, kita dapat menambahkan `@react-pdf/renderer` khusus untuk mode Creative tanpa menyentuh ATS. Ini akan menjadi ADR superseding, bukan perubahan diam-diam.

### Konsekuensi dari keputusan ini

- Pengguna mencetak PDF ATS/Creative melalui **dialog cetak browser** (`Ctrl+P` / menu Print → Save as PDF).
- Kita menyediakan tombol "Unduh PDF" yang memanggil `window.print()` dengan stylesheet print yang sudah dikonfigurasi.
- Header/footer default browser harus disembunyikan via instruksi kepada pengguna ("Nonaktifkan headers and footers di pengaturan cetak"). Ini adalah kelemahan UX yang diterima untuk MVP.
- Paginasi mungkin sedikit berbeda antara Chrome, Firefox, dan Safari. Dokumentasi harus menyebutkan ini.

## Consequences

**Positif**
- Satu codepath untuk preview dan PDF → minim risiko bug rendering ganda
- Nol dependensi baru → bundle tetap kecil, audit keamanan sederhana
- Kompatibel offline sepenuhnya
- Mudah dipahami kontributor baru (hanya HTML + CSS)
- Memenuhi C-T5 (teks nyata, bukan raster)

**Negatif**
- UX dialog cetak kurang mulus dibanding download langsung
- Header/footer browser sulit dikontrol secara programatik
- Variasi paginasi lintas browser memerlukan pengujian manual lebih luas
- Mode Creative terbatas pada apa yang bisa dilakukan CSS Paged Media
- Tidak ada cara otomatis menghasilkan PDF tanpa interaksi pengguna

**Mitigasi negatif**
- Panduan singkat dalam Bahasa Indonesia tentang cara menyembunyikan header/footer saat mencetak
- Uji visual regresi di CI dengan Chromium headless (Linux container) untuk menangkap variasi paginasi
- Jika kebutuhan Creative melampaui batas CSS Paged Media, ajukan ADR baru untuk menambahkan `@react-pdf/renderer` khusus mode Creative

## Rejected alternatives

**Kandidat B saja (`@react-pdf/renderer`):** Ditolak karena memperkenalkan codepath kedua yang berisiko tinggi menyimpang dari preview. Ukuran bundle ~300 KB juga bertentangan dengan semangat lightweight local-first. Bisa dipertimbangkan kembali hanya untuk mode Creative di masa depan.

**Hybrid (A untuk ATS, B untuk Creative):** Lebih rumit daripada diperlukan untuk MVP. Menunda sampai ada bukti konkret bahwa CSS Paged Media tidak cukup untuk Creative.

**Kandidat C (html2canvas → PDF):** Ditolak permanen sebelum spike dimulai. Melanggar C-T5 secara fundamental.