# Assumptions and Constraints — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Tujuan | Membuat eksplisit apa yang kami anggap benar tanpa bukti, dan apa yang mengikat kami tanpa bisa dinegosiasikan. |
| Bagi agen AI | Batasan bertanda **HARD** tidak boleh dilanggar. Jika sebuah task menuntut pelanggaran, hentikan pekerjaan dan minta klarifikasi. |

---

## 1. Asumsi

Asumsi adalah hal yang kami anggap benar tanpa bukti memadai. Masing-masing disertai dampak jika ternyata salah.

### 1.1 Asumsi pengguna

| ID | Asumsi | Keyakinan | Cara memvalidasi | Dampak jika salah |
| :-- | :-- | :-- | :-- | :-- |
| A-U1 | Fresh graduate Indonesia butuh lebih dari satu bentuk CV | Sedang | Wawancara pengguna | Dual-engine turun dari pilar menjadi kenyamanan |
| A-U2 | Pengguna memahami "ATS" setelah dijelaskan singkat, bukan sebelumnya | Tinggi | Uji moderasi | Butuh onboarding yang lebih berat |
| A-U3 | Pengguna bersedia mengekspor draft sendiri sebagai cadangan | **Rendah** | Uji kegunaan | Risiko kehilangan data naik tajam; butuh mekanisme cadangan yang lebih agresif |
| A-U4 | Kebiasaan menempel pasfoto cukup kuat sehingga penyembunyian otomatis akan mengejutkan | Tinggi | Uji moderasi | Penjelasan bisa lebih ringan |
| A-U5 | Mengisi form di ponsel dapat diterima jika dirancang baik | Sedang | Analitik? Tidak ada. Uji langsung | Perlu dorongan kuat ke penggunaan desktop |
| A-U6 | Pengguna lebih percaya alat yang tidak meminta akun | Sedang | Wawancara | Positioning berubah, arsitektur tidak |
| A-U7 | Saran kata kerja aksi statis dianggap berguna, bukan kaku | Sedang | Uji dengan 5–10 pengguna | Pilar 3 melemah; AI naik prioritas |
| A-U8 | Sebagian besar CV pengguna sasaran muat dalam 1–2 halaman | Tinggi | Analisis contoh CV nyata | Butuh penanganan paginasi yang lebih rumit |

### 1.2 Asumsi pasar

| ID | Asumsi | Keyakinan | Cara memvalidasi | Dampak jika salah |
| :-- | :-- | :-- | :-- | :-- |
| A-M1 | Tidak ada kompetitor yang menggabungkan ketiga pilar kami | Sedang | Ulangi riset kompetitor secara berkala | Perlu memikirkan ulang alasan proyek ini ada |
| A-M2 | HR Indonesia benar-benar memakai sistem ATS dalam jumlah yang berarti | **Rendah** | Wawancara HR/recruiter | Pilar 1 melemah; fokus bergeser ke keterbacaan manusia |
| A-M3 | Career center kampus adalah jalur distribusi yang layak | Sedang | Hubungi 3–5 kampus | Butuh strategi distribusi lain |
| A-M4 | Kompetitor tidak akan menambahkan konteks Indonesia yang dalam dalam waktu dekat | Sedang | Pantau rilis mereka | Parit pertahanan menyempit; percepat kedalaman lokal |
| A-M5 | Free tier penyedia AI akan tetap tersedia dalam bentuk tertentu | Rendah | — | Tidak berdampak: AI bersifat opsional secara desain |

### 1.3 Asumsi teknis

| ID | Asumsi | Keyakinan | Cara memvalidasi | Dampak jika salah |
| :-- | :-- | :-- | :-- | :-- |
| A-T1 | Peramban modern mendukung IndexedDB dengan andal untuk beban kerja kami | Tinggi | Uji lintas peramban | Butuh lapisan penyimpanan alternatif |
| A-T2 | Ekspor PDF sisi klien dapat menghasilkan teks yang dapat diekstraksi secara andal | **Kritis, sedang** | **Buat prototipe lebih dulu** | Seluruh premis mode ATS terancam. Lihat bagian 5. |
| A-T3 | Paginasi CSS cukup dapat diprediksi lintas peramban untuk keluaran 1–2 halaman | Sedang | Prototipe di Chrome, Firefox, Safari | Butuh mesin paginasi terprogram |
| A-T4 | Aplikasi dapat berada di bawah anggaran performa dengan React dan Tailwind | Sedang | Ukur lebih awal | Ganti ke framework lebih ringan atau kurangi cakupan |
| A-T5 | Foto profil dapat ditangani sebagai Blob di IndexedDB tanpa masalah kuota | Tinggi | Uji dengan gambar besar | Butuh kompresi paksa atau batas ukuran |
| A-T6 | Ekstraksi lapisan teks pdf.js menangani sebagian besar CV digital tanpa OCR | Sedang | Uji dengan CV nyata | OCR naik dari fallback menjadi jalur utama; biaya naik |
| A-T7 | Satu orang dapat memelihara dua renderer tanpa keduanya menyimpang | Sedang | Tinjau setelah MVP | Kurangi menjadi satu renderer dengan varian gaya |

### 1.4 Asumsi proyek

| ID | Asumsi | Keyakinan | Dampak jika salah |
| :-- | :-- | :-- | :-- |
| A-P1 | Proyek dikerjakan oleh satu pengembang dengan waktu paruh | Tinggi | Ruang lingkup harus dijaga ketat |
| A-P2 | Anggaran infrastruktur nol atau mendekati nol | Tinggi | Hosting statis saja; tanpa backend |
| A-P3 | Agen AI akan mengerjakan sebagian besar implementasi | Tinggi | Dokumentasi harus cukup eksplisit untuk dieksekusi tanpa pengetahuan tersirat |
| A-P4 | Kontributor eksternal akan muncul setelah rilis publik | Rendah | Jangan mengandalkannya untuk apa pun di jalur kritis |

## 2. Batasan

Batasan tidak dapat dinegosiasikan tanpa mengubah dokumen ini.

### 2.1 Batasan produk — HARD

| ID | Batasan | Sumber |
| :-- | :-- | :-- |
| C-P1 | **HARD** Tidak ada persyaratan akun atau login untuk fitur apa pun | `vision.md` P2 |
| C-P2 | **HARD** Tidak ada tingkatan berbayar, paywall, atau watermark | `vision.md` P2 |
| C-P3 | **HARD** Fitur inti berfungsi offline setelah app shell terpasang | `vision.md` P3 |
| C-P4 | **HARD** Setiap fitur AI memiliki fallback non-AI yang berguna | `vision.md` P4 |
| C-P5 | **HARD** Sistem tidak pernah menyatakan fakta yang tidak diberikan pengguna | `vision.md` P5 |
| C-P6 | **HARD** Ekspor penuh dan hapus total selalu tersedia | `vision.md` P6 |
| C-P7 | **HARD** Tanpa klaim jaminan ATS dan tanpa skor CV | `vision.md` P7 |
| C-P8 | Mode ATS dan Creative membaca `ResumeDocument` yang sama | `vision.md` Pilar 1 |
| C-P9 | Berpindah mode tidak pernah mengubah atau menghapus data sumber | `vision.md` Pilar 1 |

### 2.2 Batasan teknis — HARD

| ID | Batasan | Alasan |
| :-- | :-- | :-- |
| C-T1 | **HARD** Tanpa database server, tanpa backend wajib | ADR-0001 |
| C-T2 | **HARD** Tanpa API key atau secret di dalam repositori atau bundel | Keamanan; ADR-0006 |
| C-T3 | **HARD** Data CV tidak pernah dikirim ke jaringan kecuali pengguna mengaktifkan AI secara eksplisit untuk operasi tersebut | Privasi; P1 |
| C-T4 | **HARD** Ekspor PDF tidak boleh membutuhkan API eksternal | P3 |
| C-T5 | **HARD** PDF mode ATS harus berisi teks nyata yang dapat diekstraksi, bukan citra raster | Premis inti mode ATS |
| C-T6 | Deploy sebagai aset statis; harus berjalan dari CDN atau GitHub Pages | Anggaran nol |
| C-T7 | Data CV disimpan di IndexedDB; localStorage hanya untuk preferensi UI | ADR-0002 |
| C-T8 | Format ekspor adalah JSON dengan `schemaVersion`, terdokumentasi publik | ADR-0003 |
| C-T9 | Perubahan schema memerlukan ADR dan jalur migrasi | `../04-data/migration-policy.md` |
| C-T10 | **HARD** Tanpa skrip pihak ketiga yang dimuat saat runtime, termasuk analytics dan font CDN, kecuali disetujui lewat ADR | Permukaan serangan; privasi |
| C-T11 | Font dibundel dan di-subset, bukan diambil dari CDN | Offline + privasi |
| C-T12 | Aplikasi harus berfungsi dengan `localStorage` dan IndexedDB yang diblokir, dengan degradasi yang jelas dan terkomunikasikan | Mode privat, perangkat terkunci |

### 2.3 Batasan kualitas

| ID | Batasan |
| :-- | :-- |
| C-Q1 | Target WCAG 2.2 AA pada seluruh antarmuka |
| C-Q2 | Seluruh fungsi dapat dioperasikan dengan keyboard |
| C-Q3 | Anggaran performa ditegakkan di CI — lihat `../07-quality/performance-budget.md` |
| C-Q4 | Setiap requirement memiliki minimal satu test yang bisa dilacak |
| C-Q5 | Impor/ekspor round-trip diuji pada setiap versi schema yang didukung |
| C-Q6 | Ekstraksi teks PDF mode ATS diuji otomatis pada setiap fixture |

### 2.4 Batasan sumber daya

| ID | Batasan | Konsekuensi |
| :-- | :-- | :-- |
| C-R1 | Satu pengembang, waktu paruh | Ruang lingkup dijaga ketat; non-goals ditegakkan |
| C-R2 | Anggaran infrastruktur nol | Hosting statis; tanpa layanan berbayar di jalur kritis |
| C-R3 | Tanpa anggaran pemasaran | Distribusi lewat komunitas, kampus, dan open source |
| C-R4 | Tanpa desainer khusus | Sistem desain sederhana; template sedikit; utamakan keterbacaan |
| C-R5 | Tanpa tim QA | Otomatisasi pengujian bukan pilihan |
| C-R6 | Tanpa rotasi on-call | Arsitektur harus tidak punya sesuatu yang bisa "down" selain hosting statis |

### 2.5 Batasan hukum dan etika

| ID | Batasan |
| :-- | :-- |
| C-L1 | Data CV adalah PII. Diperlakukan demikian meskipun tidak pernah menyentuh server kami. |
| C-L2 | Pemberitahuan privasi harus menyatakan dengan jujur kapan data meninggalkan perangkat |
| C-L3 | Pemakaian penyedia AI harus menampilkan persetujuan eksplisit sebelum data dikirim |
| C-L4 | Lisensi dependensi harus kompatibel dengan lisensi proyek |
| C-L5 | Nama dan merek kompetitor hanya dipakai secara faktual, tidak merendahkan |
| C-L6 | Tidak memfasilitasi pemalsuan kredensial, termasuk atas permintaan pengguna |

## 3. Ketergantungan

| Ketergantungan | Jenis | Risiko | Mitigasi |
| :-- | :-- | :-- | :-- |
| Peramban pengguna | Platform | Perbedaan implementasi | Matriks peramban, uji lintas peramban |
| IndexedDB | Platform | Pengusiran storage | `navigator.storage.persist()`, dorong ekspor, peringatan jujur |
| Print/PDF peramban | Platform | Perbedaan paginasi | Prototipe lebih awal; siapkan jalur cadangan |
| Hosting statis | Infrastruktur | Penyedia berubah kebijakan | Aset statis dapat dipindahkan ke mana saja |
| Penyedia AI | Opsional | Kuota, harga, ketersediaan | Antarmuka provider; fallback statis; bukan asumsi arsitektur |
| Dependensi npm | Rantai pasok | Kerentanan, paket ditinggalkan | `../06-security/dependency-policy.md`; jumlah dependensi minimal |
| Font | Aset | Lisensi, ukuran | Font berlisensi bebas, di-subset, dibundel |

## 4. Di luar cakupan

Dinyatakan di sini agar tidak diam-diam masuk kembali.

- Akun pengguna, autentikasi, dan sinkronisasi cloud
- Kolaborasi dan berbagi antarpengguna
- Aplikasi native iOS dan Android
- Surat lamaran, portofolio, dan personal website
- Pelacakan lamaran kerja
- Papan lowongan atau integrasi dengan papan lowongan
- Academic CV, federal resume, dan format khusus lainnya
- Format ekspor DOCX pada MVP (dipertimbangkan setelahnya)
- Analytics apa pun pada MVP
- Sistem template yang dikontribusikan komunitas pada MVP

## 5. Risiko yang harus diturunkan lebih dahulu

Ini adalah asumsi yang, jika salah, membatalkan bagian besar rencana. **Buktikan dengan prototipe sebelum membangun di atasnya.**

### R1 — Kesetiaan PDF dan keterbacaan teks (A-T2, A-T3) — **kritis**

Seluruh premis mode ATS bergantung pada kemampuan menghasilkan PDF berisi teks nyata yang terekstraksi bersih, dari sisi klien, tanpa API eksternal.

**Spike yang harus dilakukan sebelum pekerjaan lain:** render satu CV contoh statis, ekspor ke PDF lewat mekanisme yang dipilih, lalu jalankan ekstraksi teks. Verifikasi bahwa nama, kontak, heading, tanggal, dan seluruh isi bullet pulih dengan urutan yang benar, di Chrome, Firefox, dan Safari.

**Jika gagal:** desain ulang pipeline PDF sebelum apa pun dibangun di atasnya. Opsi cadangan dicatat di `../03-architecture/rendering-architecture.md`.

### R2 — Nilai riil micro-copy (A-U2, A-U7)

Pilar 2 dan 3 mengandaikan panduan kontekstual benar-benar mengubah hasil. Belum diuji.

**Spike:** uji moderasi ringan dengan 5 fresh graduate memakai prototipe kertas atau HTML statis.

### R3 — Ketahanan penyimpanan (A-U3, A-T1)

Jika pengguna tidak mencadangkan dan peramban menghapus storage, orang kehilangan pekerjaannya. Ini adalah kegagalan yang paling merusak kepercayaan.

**Spike:** uji perilaku pengusiran pada Safari iOS secara khusus; uji apakah `navigator.storage.persist()` dikabulkan tanpa pemasangan PWA.

### R4 — Divergensi renderer (A-T7)

Dua renderer yang dipelihara satu orang cenderung menyimpang seiring waktu.

**Mitigasi sejak awal:** rendering contract yang eksplisit ditambah uji regresi visual yang menjalankan kedua renderer pada fixture yang sama.

## 6. Cara memperbarui dokumen ini

- Asumsi yang tervalidasi dipindahkan ke `vision.md` atau `problem-statement.md` sebagai fakta, dengan bukti.
- Asumsi yang terbantah memicu peninjauan fitur yang bergantung padanya.
- Batasan HARD hanya berubah lewat ADR.
- Tinjau dokumen ini pada setiap batas fase.

## 7. Dokumen terkait

- `vision.md` — prinsip yang menjadi sumber batasan
- `problem-statement.md` — hipotesis pengguna
- `competitor-research.md` — asumsi pasar
- `../adr/` — keputusan yang mengubah batasan
- `../../AGENTS.md` — bagaimana agen menegakkan batasan ini
