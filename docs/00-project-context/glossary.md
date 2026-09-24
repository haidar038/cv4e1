# Glossary — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Tujuan | Kosakata bersama untuk manusia dan agen AI. Ketika istilah di sini dipakai dalam dokumen, kode, atau isu, artinya adalah yang tertulis di sini. |

**Aturan:** istilah dalam kolom `Identifier` adalah bentuk yang harus dipakai di dalam kode, nama berkas, dan ID requirement. Jangan menciptakan sinonim.

---

## 1. Istilah domain produk

| Istilah | Identifier | Definisi |
| :-- | :-- | :-- |
| **ATS** | — | *Applicant Tracking System.* Perangkat lunak yang dipakai pemberi kerja untuk menerima, mengurai, dan menyaring lamaran. Sering kali membaca PDF sebelum manusia melihatnya. |
| **ATS-oriented** | `ats` | Dirancang agar mudah diurai mesin: satu kolom, teks yang bisa diseleksi, heading standar, urutan baca yang dapat diprediksi. **Bukan** jaminan lolos ATS. Frasa "ATS-compliant" dan "dijamin lolos ATS" dilarang di seluruh copy produk. |
| **Mode ATS** | `mode: "ats"` | Mode keluaran yang memberlakukan aturan ATS-oriented. Menyembunyikan foto, memaksa satu kolom, membatasi dekorasi. |
| **Mode Creative** | `mode: "creative"` | Mode keluaran yang mengizinkan foto, dua kolom, dan aksen warna, tetapi tetap mewajibkan teks yang dapat diseleksi. |
| **Dual-Engine Switcher** | — | Fitur pembeda utama: satu data sumber, dua renderer, berpindah dengan satu klik tanpa kehilangan data. |
| **Action verbs** | `actionVerbs` | Kata kerja operasional berorientasi hasil untuk memulai bullet pengalaman. Contoh: *Meningkatkan*, *Mengkoordinasikan*, *Mengoptimalkan*. |
| **Action Verbs Catalog** | `action-verbs.json` | Kamus statis berisi kata kerja aksi dan pola kalimat, dibundel dalam aplikasi. Nol permintaan jaringan. Menjadi fallback wajib bagi fitur AI penulisan. |
| **Micro-copy** | — | Teks panduan pendek dan kontekstual di dalam form. Berbeda dari label dan dari halaman bantuan. |
| **IPK** | `gpa` | Indeks Prestasi Kumulatif. Dituliskan dengan skalanya: `3.50 / 4.00`. Di dalam kode memakai identifier `gpa` dengan field `value`, `scale`, dan `label`. |
| **Status pendidikan** | `education[].status` | Nilai yang diizinkan: `graduated`, `awaiting-ceremony` (menunggu wisuda), `in-progress`, `discontinued`. |
| **Fresh graduate** | — | Lulusan D3/D4/S1, 0–2 tahun setelah lulus. Kelompok pengguna utama. |
| **Pasfoto / foto profil** | `basics.photo` | Foto potret pada CV. Norma kuat di Indonesia. Disimpan selalu, dirender hanya pada mode Creative. |
| **Draft** | `ResumeDraft` | Satu CV yang sedang dikerjakan, tersimpan lokal, dengan metadata seperti nama dan waktu perubahan terakhir. Pengguna boleh punya beberapa. |
| **Template** | `template` | Perwujudan visual di dalam satu mode. Satu mode dapat memiliki beberapa template. Template tidak pernah mengesampingkan aturan mode. |

## 2. Istilah data

| Istilah | Identifier | Definisi |
| :-- | :-- | :-- |
| **Canonical data model** | `ResumeDocument` | Satu-satunya representasi sah dari data CV pengguna. Kedua renderer membacanya. Semua impor dinormalisasi ke bentuk ini; semua ekspor berasal darinya. |
| **View model** | `ATSViewModel`, `CreativeViewModel` | Bentuk turunan dan ternormalisasi dari `ResumeDocument`, disiapkan untuk satu renderer. Bersifat derivatif — tidak pernah disimpan, tidak pernah menjadi sumber kebenaran. |
| **Schema version** | `schemaVersion` | String semver pada setiap `ResumeDocument`. Menentukan jalur migrasi. |
| **Migration** | `migrate(doc)` | Transformasi deterministik dari `ResumeDocument` versi lama ke versi terkini. Tidak boleh menghilangkan data pengguna. |
| **Round-trip** | — | Export lalu import kembali. Harus menghasilkan dokumen yang setara secara semantik. Salah satu uji utama. |
| **Portable format** | `.cv4e.json` | Format berkas publik untuk draft. JSON biasa dengan `schemaVersion`. |
| **Resume export** | `kind: "resume"` | Ekspor hanya data satu CV. |
| **Backup export** | `kind: "backup"` | Ekspor seluruh draft, preferensi, dan aset. **Tidak pernah** menyertakan API key. |
| **Asset** | `assets` | Berkas biner yang dirujuk CV — pada praktiknya foto profil. Disimpan sebagai Blob di IndexedDB, dirujuk lewat `assetRef`. |
| **Fixture** | — | Berkas `ResumeDocument` tetap yang dipakai pengujian. Disimpan di `fixtures/resumes/`. |

## 3. Istilah arsitektur

| Istilah | Identifier | Definisi |
| :-- | :-- | :-- |
| **Local-first** | — | Data hidup di perangkat pengguna sebagai kondisi normal, bukan sebagai cache. Server tidak dibutuhkan agar aplikasi berfungsi. |
| **Offline-capable** | — | Alur inti selesai tanpa jaringan setelah app shell terpasang. |
| **PWA** | — | *Progressive Web App.* Aplikasi web yang dapat dipasang dan dapat berjalan offline lewat service worker. |
| **App shell** | — | HTML, CSS, dan JS minimal yang di-cache agar aplikasi bisa dibuka offline. |
| **Service worker** | — | Skrip yang mengintersepsi permintaan jaringan dan menyajikan aset dari cache. |
| **IndexedDB** | — | Penyimpanan terstruktur peramban. Penyimpanan utama kami untuk draft dan aset. |
| **localStorage** | — | Penyimpanan kunci-nilai peramban. Dipakai **hanya** untuk preferensi UI kecil, tidak pernah untuk data CV. |
| **Storage eviction** | — | Peramban menghapus data situs di bawah tekanan penyimpanan atau kebijakan privasi. Risiko nyata, harus dimitigasi dan dikomunikasikan. |
| **Renderer** | `ATSRenderer`, `CreativeRenderer` | Komponen yang mengubah view model menjadi keluaran visual. |
| **Rendering contract** | — | Aturan yang harus dipatuhi kedua renderer. Lihat `../03-architecture/rendering-architecture.md`. |
| **Trust boundary** | — | Batas tempat asumsi keamanan berubah. Untuk kami: peramban pengguna, berkas yang diimpor, dan penyedia AI. |

## 4. Istilah AI

| Istilah | Identifier | Definisi |
| :-- | :-- | :-- |
| **AI provider** | `AIProvider` | Antarmuka yang diimplementasikan setiap sumber saran. Aplikasi inti tidak pernah memanggil API penyedia secara langsung. |
| **Static provider** | `StaticSuggestionProvider` | Implementasi `AIProvider` bawaan yang memakai Action Verbs Catalog. Berjalan offline. Selalu tersedia. |
| **BYO-key** | — | *Bring Your Own Key.* Pengguna memasukkan API key miliknya sendiri. Proyek tidak pernah mengirimkan kunci. |
| **Grounding** | — | Aturan yang membatasi keluaran AI hanya pada fakta yang diberikan pengguna. |
| **Hallucination** | — | Keluaran AI yang menyatakan fakta yang tidak ada pada input. Contoh: angka, nama perusahaan, sertifikasi. Dianggap sebagai bug tingkat keparahan tinggi. |
| **Suggestion, not mutation** | — | Prinsip inti: keluaran AI adalah kandidat. `ResumeDocument` tidak berubah sampai pengguna menekan Apply. |
| **Structured output** | — | Keluaran AI yang wajib berbentuk JSON sesuai schema. Teks bebas ditolak. |
| **Metric placeholder** | `[X]`, `[jumlah]` | Penanda untuk angka yang belum diberikan pengguna. AI wajib memakai ini alih-alih mengarang angka. |
| **Fallback** | — | Jalur non-AI yang tetap memberi nilai ketika AI tidak tersedia, gagal, atau ditolak. Wajib untuk setiap fitur AI. |
| **Achievement bullets** | `requestAchievementBullets` | Aliran terpadu: deskripsi pencapaian bebas menjadi 1–3 bullet poles; tiap kandidat ditempel sebagai baris baru lewat Apply. |
| **Prompt injection** | — | Teks berbahaya di dalam input pengguna (misalnya deskripsi lowongan yang ditempel) yang berusaha membajak instruksi model. Diperlakukan sebagai kasus penyalahgunaan yang harus diuji. |

## 5. Istilah kualitas dan proses

| Istilah | Identifier | Definisi |
| :-- | :-- | :-- |
| **ADR** | `docs/adr/NNNN-*.md` | *Architecture Decision Record.* Catatan satu keputusan beserta alasan dan alternatif yang ditolak. Bersifat append-only. |
| **Superseded** | — | Status ADR yang digantikan ADR lebih baru. ADR lama tidak dihapus atau diedit diam-diam. |
| **FR / NFR** | `FR-001`, `NFR-001` | Functional Requirement / Non-Functional Requirement. Didefinisikan di `../02-requirements/srs.md`. Dirujuk oleh test, isu, dan PR. |
| **Acceptance criteria** | `AC-xxx` | Kondisi yang dapat diuji yang menentukan sebuah requirement terpenuhi. |
| **Traceability matrix** | — | Pemetaan requirement → acceptance criteria → test. |
| **Definition of Ready** | DoR | Syarat sebuah task boleh dimulai. Lihat `../../AGENTS.md`. |
| **Definition of Done** | DoD | Syarat sebuah task dianggap selesai. Lihat `../../AGENTS.md`. |
| **Text extraction test** | — | Mengekstraksi teks dari PDF yang dihasilkan lalu memeriksa bahwa isinya pulih. Uji utama mode ATS. |
| **Visual regression** | — | Membandingkan tangkapan layar keluaran render antarversi untuk mendeteksi perubahan tata letak yang tidak disengaja. |
| **PII** | — | *Personally Identifiable Information.* Seluruh isi `ResumeDocument` diperlakukan sebagai PII. |

## 6. Istilah yang dilarang

Istilah ini tidak boleh muncul di antarmuka, pemasaran, atau dokumentasi. Jika muncul, itu adalah cacat.

| Istilah terlarang | Alasan | Gunakan sebagai gantinya |
| :-- | :-- | :-- |
| "ATS-compliant", "dijamin lolos ATS" | Menjanjikan sesuatu yang tidak bisa diverifikasi | "ATS-oriented", "dirancang agar mudah dibaca sistem" |
| "ATS score 87%" atau skor sejenis | Angkanya dikarang | Daftar periksa properti yang dapat diverifikasi |
| "Data Anda sepenuhnya aman" | Penyimpanan peramban punya risiko nyata | "Data Anda tersimpan di perangkat ini dan tidak dikirim ke server kami" |
| "AI-powered resume builder" | Melanggar P4; menyiratkan AI adalah inti | "Pembuat CV dengan bantuan penulisan opsional" |
| "Secara otomatis meningkatkan CV Anda" | Menyiratkan mutasi tanpa persetujuan | "Menyarankan perbaikan yang Anda tinjau sebelum diterapkan" |
| "localStorage strategy" (untuk data CV) | Menyesatkan; data CV ada di IndexedDB | "Local persistence strategy" |

## 7. Padanan Bahasa Indonesia untuk antarmuka

Untuk menjaga konsistensi micro-copy. Rincian di `../01-product/localization-guide.md`.

| Inggris | Bahasa Indonesia (dipakai di UI) |
| :-- | :-- |
| Resume / CV | CV |
| Draft | Draft |
| Export | Ekspor |
| Import | Impor |
| Preview | Pratinjau |
| Section | Bagian |
| Experience | Pengalaman |
| Education | Pendidikan |
| Skills | Keahlian |
| Projects | Proyek |
| Organization / Volunteer | Organisasi |
| Summary / Headline | Ringkasan / Headline |
| Apply (saran AI) | Terapkan |
| Discard | Buang |
| Clear all data | Hapus semua data |
| Action verbs | Kata kerja aksi |

## 8. Dokumen terkait

- `vision.md`
- `../01-product/localization-guide.md`
- `../04-data/resume-schema.md`
- `../05-ai/hallucination-policy.md`
