# Product Requirements Document — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |
| Sumber kebenaran | `../00-project-context/vision.md` |

> Dokumen ini menjelaskan **nilai produk dan prioritas fitur**, bukan detail implementasi.
> Detail teknis ada di `../03-architecture/`. Requirement yang dapat diuji ada di `../02-requirements/srs.md`.

---

## 1. Product summary
- [ ] Ringkasan satu paragraf — tarik dari `vision.md` §1–2
- [ ] Bentuk produk: PWA web, static hosting, tanpa akun
- [ ] Status rilis dan target fase

## 2. Problem statement
- [ ] Ringkas dari `../00-project-context/problem-statement.md` (M1–M4), jangan disalin utuh
- [ ] Prioritaskan: masalah mana yang paling menyakitkan bagi pengguna utama

## 3. Target users
- [ ] Pengguna utama: fresh graduate Indonesia
- [ ] Sekunder: mahasiswa tingkat akhir, career center kampus, career switcher awal
- [ ] Rujuk `../00-project-context/target-users.md`

## 4. User personas
- [ ] Rujuk `user-personas.md` — jangan duplikasi, cukup ringkas satu baris per persona

## 5. Jobs to be done
- [ ] "Ketika saya melamar kerja pertama, saya ingin CV yang terlihat pantas, supaya saya tidak tersingkir karena format"
- [ ] "Ketika saya melamar ke perusahaan berbeda, saya ingin bentuk CV yang sesuai kanalnya, tanpa mengetik ulang"
- [ ] "Ketika saya tidak tahu harus menulis apa di kolom pengalaman, saya ingin contoh yang bisa saya sesuaikan"
- [ ] "Ketika saya kembali beberapa hari kemudian, saya ingin pekerjaan saya masih ada"
- [ ] TODO: tambahkan JTBD untuk skenario perangkat bersama dan kondisi offline

## 6. Product principles
- [ ] Salin ringkas P1–P10 dari `vision.md` §4 sebagai daftar, dengan tautan balik

## 7. Core user journeys
Ringkasan; detail di `user-journeys.md`.

| # | Journey | Prioritas |
| :-- | :-- | :-- |
| J1 | Membuat CV baru dari nol | P0 |
| J2 | Mengisi pendidikan dan pengalaman dengan panduan | P0 |
| J3 | Beralih ATS ↔ Creative | P0 |
| J4 | Memakai action verbs tanpa AI | P0 |
| J5 | Mengekspor PDF | P0 |
| J6 | Menutup lalu membuka kembali draft lokal | P0 |
| J7 | Ekspor draft dan impor di perangkat lain | P0 |
| J8 | Memakai aplikasi sepenuhnya offline | P0 |
| J9 | Menghapus seluruh data lokal | P0 |
| J10 | Memakai AI untuk memperbaiki bullet | P1 |
| J11 | Mengimpor CV lama lewat OCR | P2 |
| J12 | Menyesuaikan CV dengan deskripsi lowongan | P2 |

## 8. Feature scope
- [ ] Rujuk `feature-catalog.md` untuk daftar lengkap
- [ ] Di sini cukup: kelompok fitur + prioritas + fase

## 9. Out of scope
- [ ] Salin non-goals dari `vision.md` §8
- [ ] Tambahkan yang khusus rilis ini (mis. ekspor DOCX, template komunitas)

## 10. MVP definition

> **v0.1 — disetujui maintainer (2026-09-20).** Disusun dari `vision.md` §5–§6 (Horizon 1),
> `roadmap.md` Fase 1, dan `feature-catalog.md` (seluruh fitur P0 Fase 1). Bagian ini menutup
> gap yang sebelumnya membuat gerbang keluar Fase 1 tidak dapat dinilai (gerbang merujuk ke sini).

### 10.1 Definisi satu paragraf

MVP cv4every1 selesai ketika seseorang yang baru lulus dapat — **dari perangkatnya sendiri,
tanpa membuat akun, dan tanpa koneksi internet setelah app shell terpasang** — mengisi seluruh
bagian CV berbahasa Indonesia dengan panduan kontekstual di titik pengisian; melihat hasilnya
dalam dua mode, **ATS** (satu kolom, tanpa foto, aturan ditegakkan struktural) dan **Creative**
(boleh dua kolom dan berfoto), dari **satu sumber data yang sama** tanpa kehilangan atau
perubahan data saat berpindah mode; menerima saran kata kerja aksi statis yang dapat ia
sesuaikan, tanpa AI; mencetak CV menjadi **PDF yang teksnya dapat diekstraksi** melalui dialog
cetak peramban; menyimpan draft otomatis dan membukanya kembali; mengekspor dan mengimpor
berkas `.cv4e.json` sebagai cadangan; serta menghapus seluruh datanya dalam satu alur yang
menawarkan ekspor terlebih dahulu. Tidak ada skor CV, tidak ada klaim lolos ATS, dan tidak ada
fitur yang mensyaratkan AI, akun, atau server.

### 10.2 Daftar periksa fitur MVP

Seluruh fitur P0 Fase 1 dari `feature-catalog.md`, ditambah P1 yang dijadwalkan dalam rencana
Fase 1 (ditandai). Sumber rincian perilaku: `cv4every1-fase-1-mvp.md` Task 8–15.

| Kelompok | Fitur (ID) |
| :-- | :-- |
| Manajemen data | Draft: buat, ganti nama, duplikat, hapus (F-A1) · autosave IndexedDB (F-A2) · ekspor `.cv4e.json` (F-A3) · impor tervalidasi (F-A4) · hapus semua data (F-A6) · migrasi schema (F-A7) · peringatan penyimpanan + dorongan ekspor (F-A8) · ekspor cadangan penuh dengan foto base64 (F-A5, P1 — batas akhir Fase 1) |
| Pengisian konten | Identitas dasar (F-B1) · pendidikan dengan IPK dan status (F-B2) · pengalaman kerja/magang (F-B3) · organisasi/kepanitiaan setara pengalaman (F-B4) · proyek (F-B5) · keahlian (F-B6) · sertifikat (F-B7, P1) · unggah foto untuk mode Creative (F-B8) · susun ulang section dengan tombol (F-B9, P1) |
| Panduan Bahasa Indonesia | Format IPK (F-C1) · status pendidikan dengan contoh (F-C2) · peringatan foto di mode ATS (F-C3) · format kontak (F-C4, P1) · penulisan pengalaman organisasi (F-C5, P1) · panjang CV (F-C6, P2) |
| Dual-engine | Toggle ATS ↔ Creative (F-D1) · penegakan aturan mode ATS (F-D2) · satu template Creative (F-D3) · pratinjau langsung (F-D4) |
| Bantuan penulisan | Action Verbs Catalog statis offline (F-E1) · saran sadar konteks section (F-E2) · pola kalimat berorientasi dampak (F-E3) |
| Keluaran | Ekspor PDF via dialog cetak + modal instruksi (F-F1) · ekstraksi teks teruji otomatis (F-F3) |
| Platform | Service worker PWA (F-G1) · dapat dipasang (F-G2, P1) · indikator status offline (F-G3) · permintaan storage persisten (F-G4, P1) |

### 10.3 Yang sengaja ditunda dari MVP (dan alasannya)

- **Fitur AI (F-E4, F-E5, F-H1–F-H4)** — Fase 2. Prinsip P4: fitur inti harus selesai tanpa AI; AI adalah pelengkap.
- **Pengalih bahasa EN (F-G5)** — Fase 3. Prinsip P9: Bahasa Indonesia dirancang dulu sebagai warga kelas satu; struktur locale disiapkan sejak Task 13a.
- **Impor CV lama / OCR (F-H5)** — Fase 3. Akurasi OCR berisiko mengecewakan; diposisikan eksperimental dengan tinjauan manusia.
- **Pembanding mode berdampingan (F-D5) dan pemilihan tema per mode (F-D6)** — P2. Tidak menambah nilai inti dual-engine; menambah kompleksitas template.
- **Kontrol paginasi lanjutan (F-F2)** — P1, Fase 1/2. Variasi paginasi lintas peramban diterima sebagai trade-off MVP (ADR-0007).
- **Mode gelap (F-G6)** — P2.
- **Ekspor DOCX (F-F4)** — P3, tidak dijadwalkan.
- **Section kustom (F-B10)** — P3.
- **Undo/redo (keputusan D5)** — pasca-MVP; autosave + ekspor manual sudah menutup risiko kehilangan data.
- **Academic CV** — `vision.md` §8.9: struktur publikasi/hibah berbeda jauh, tidak untuk MVP.

## 11. Success metrics
- [ ] Tarik tabel dari `vision.md` §7
- [ ] Tandai mana yang diverifikasi lewat test, bukan analytics (sebagian besar)
- [ ] TODO: tentukan bagaimana "waktu ke PDF pertama" diukur tanpa melacak pengguna

## 12. Risks
- [ ] Risiko produk (bukan teknis) — adopsi, salah paham soal ATS, ekspektasi AI
- [ ] Rujuk `../00-project-context/assumptions-and-constraints.md` §5

## 13. Future opportunities
- [ ] Horizon 3–4 dari `vision.md` §6
- [ ] Ekspor DOCX, template komunitas, paket bahasa daerah, materi career center

## 14. Open questions
- [ ] Tarik Q1–Q6 dari `vision.md` §12, tambahkan yang khusus produk
