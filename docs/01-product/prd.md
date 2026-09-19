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
- [ ] Definisi satu paragraf: apa yang harus bisa dilakukan seseorang agar MVP disebut selesai
- [ ] Daftar periksa fitur MVP
- [ ] Yang sengaja ditunda dari MVP dan alasannya

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
