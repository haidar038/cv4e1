# Prompt Kickoff Implementasi — cv4every1

**Cara pakai:** Tempel seluruh isi dokumen ini (mulai dari "## Instruksi untuk Agent" ke bawah) sebagai pesan pertama ke Kilo Code (VS Code) atau CodeBuddy, di root repository tempat folder `docs/` sudah ada. Jika repo belum diinisialisasi, biarkan agent membuat struktur proyek terlebih dahulu sesuai Task 1 di bawah.

Karena Kilo Code dan CodeBuddy adalah dua tool terpisah dengan sesi/context yang tidak saling berbagi, jalankan prompt ini secara **penuh dan identik** di masing-masing — jangan asumsikan satu tool "ingat" apa yang dikerjakan tool lain. Gunakan satu sebagai driver utama untuk satu task pada satu waktu untuk menghindari dua agent menulis kode yang saling bertentangan di repo yang sama.

---

## Instruksi untuk Agent

Kamu akan mengimplementasikan **cv4every1** — CV/resume builder open-source, local-first, tanpa akun, untuk fresh graduate Indonesia. Seluruh keputusan produk, arsitektur, data, dan kualitas sudah didokumentasikan di folder `docs/` pada repo ini. **Dokumen-dokumen itu adalah sumber kebenaran. Jangan menebak keputusan yang sudah didokumentasikan, dan jangan mendesain ulang sesuatu yang sudah punya ADR.**

### Langkah 0 — Wajib dibaca sebelum menulis kode apa pun

Baca berkas berikut secara berurutan. Jangan lewati — banyak batasan di sini bersifat mengikat, bukan saran.

1. `AGENTS.md` — aturan operasional, batasan non-negotiable, Definition of Ready/Done, kapan harus berhenti dan bertanya
2. `docs/00-project-context/vision.md` — 10 prinsip produk (P1–P10), tiga pilar diferensiasi, non-goals
3. `docs/00-project-context/assumptions-and-constraints.md` — **§2 batasan HARD** dan **§5 risiko yang harus dibuktikan lebih dulu**
4. `docs/02-requirements/srs.md` — requirement berID (FR-xxx, NFR-xxx)
5. `docs/04-data/resume-schema.md` + `docs/04-data/json-schema.json` — bentuk data kanonik
6. `docs/03-architecture/architecture-overview.md` — lapisan, batas modul, stack yang diusulkan
7. `docs/adr/` — seluruh 6 ADR, terutama ADR-0001 (local-first), ADR-0002 (IndexedDB), ADR-0004 (dua renderer)

Setelah membaca, ringkas pemahamanmu dalam 5–8 kalimat sebelum mulai coding, agar saya bisa mengoreksi kalau ada yang salah tangkap.

### Batasan yang tidak boleh dilanggar (ringkasan — versi lengkap di `AGENTS.md` §2)

- **Tanpa backend, tanpa server, tanpa database eksternal.** Seluruh aplikasi harus bisa berjalan sebagai aset statis dan berfungsi offline setelah load pertama.
- **Tanpa akun, tanpa login.**
- **Tidak ada API key AI yang pernah dibundel di kode, repo, atau file ekspor.**
- Fitur AI harus punya fallback non-AI yang tetap berfungsi (lihat ADR-0005).
- Sistem **tidak boleh mengarang fakta** (angka, capaian, skill) atas nama pengguna.
- Data CV inti disimpan di **IndexedDB**, bukan `localStorage` (ADR-0002).
- Format ekspor adalah **JSON** dengan `schemaVersion` eksplisit (ADR-0003).
- Satu `ResumeDocument` kanonik → dinormalisasi → dua renderer (ATS & Creative) — jangan buat dua model data terpisah (ADR-0004).
- Batas modul di `architecture-overview.md` §5 bersifat mengikat: `core/` tidak boleh bergantung pada React/DOM/storage/jaringan.
- Setiap dependensi baru butuh pembenaran singkat (`docs/06-security/dependency-policy.md`).
- Jangan pernah menaruh data pengguna sungguhan di kode, commit, atau test — hanya data fiktif.

**Jika sebuah task memaksamu melanggar salah satu di atas: berhenti dan tanyakan, jangan diam-diam menyimpang.**

### Urutan pengerjaan — jangan lompat fase

Roadmap penuh ada di `docs/01-product/roadmap.md`. Urutannya mengikat karena **Fase −1 adalah gerbang risiko**: kalau spike PDF gagal, sebagian besar arsitektur di `03-architecture/` perlu didesain ulang sebelum kode lain dibangun di atasnya.

```text
Fase −1  Spike risiko          ← MULAI DI SINI, jangan lewati
Fase  0  Fondasi data & storage
Fase  1  MVP (form, dua renderer, ekspor PDF, offline)
Fase  2  AI opsional
Fase  3  Eksperimental (impor CV, job-match)
Fase  4  Kesiapan produksi
```

Jangan mulai Fase 0 sebelum Task 2 (spike S1) di bawah selesai dan hasilnya dilaporkan.

---

## Task 1: Bootstrap repository

## Requirement
Prasyarat untuk seluruh Fase 0

## Context
Repo saat ini hanya berisi `docs/`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`. Belum ada kode aplikasi.

## Goal
Struktur proyek siap pakai yang mencerminkan batas modul di `architecture-overview.md`, dengan tooling dasar terpasang dan berjalan.

## Requirements
- Inisialisasi proyek Vite + React + TypeScript (strict mode)
- Setup Tailwind CSS
- Buat struktur folder `src/core/`, `src/storage/`, `src/render/`, `src/ai/`, `src/content/`, `src/features/` sesuai tabel batas modul — masing-masing sekadar placeholder + `README.md` singkat yang mengutip aturan dependensinya
- Setup ESLint + Prettier + TypeScript strict
- Setup Vitest (unit) dan Playwright (e2e) — cukup smoke test yang lulus, belum test fitur
- Setup CI dasar (lint + typecheck + test) — lihat `docs/08-delivery/ci-cd.md` untuk arah, tapi ini boleh minimal dulu
- **Jangan** memasang Dexie, Zod, Zustand, atau vite-plugin-pwa di task ini — itu masuk Task 3 (Fase 0), bukan bootstrap. Stack di `architecture-overview.md` §3 masih berstatus **usulan**, konfirmasikan ke saya sebelum mengunci pilihan yang belum tentu final (khususnya kalau kamu punya pertimbangan teknis untuk stack berbeda).

## Non-goals
- Tidak ada UI form, tidak ada rendering CV, tidak ada penyimpanan data — itu di task-task berikutnya

## Acceptance criteria
- [ ] `npm run dev` menjalankan shell aplikasi kosong tanpa error
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` semua lulus
- [ ] Struktur folder mencerminkan batas modul dengan README per folder
- [ ] Tidak ada dependensi yang dipasang tanpa saya setujui dulu (lihat requirement di atas)

## Files likely affected
- Root config (`package.json`, `tsconfig.json`, `vite.config.ts`, `.eslintrc`, dst)
- `src/**`

## Docs to read first
- `docs/03-architecture/architecture-overview.md` §3, §5
- `docs/06-security/dependency-policy.md`
- `AGENTS.md` §5 (Code), §6 (Testing)

---

## Task 2: Spike S1 — kesetiaan ekspor PDF *(gerbang wajib, blocking)*

## Requirement
`docs/01-product/roadmap.md` Fase −1, `docs/00-project-context/assumptions-and-constraints.md` §5 R1

## Context
Ini **risiko tertinggi seluruh proyek**. Mode ATS mengklaim ramah sistem pelacak lamaran — klaim itu tidak berarti apa-apa kalau teks di PDF hasil ekspor tidak bisa diekstrak dengan bersih. `html2canvas` sudah ditolak permanen (menghasilkan raster, merusak ekstraksi teks) — jangan pertimbangkan opsi itu.

## Goal
Punya bukti konkret (bukan asumsi) tentang metode ekspor PDF mana yang mempertahankan teks yang bisa diekstrak, lintas peramban utama.

## Requirements
- Render satu halaman CV statis dan sederhana (pakai fixture `docs/04-data/sample-resumes/fresh-graduate-id.json`) dengan minimal dua kandidat pendekatan dari `docs/03-architecture/rendering-architecture.md` (mis. print CSS + Paged Media, vs `@react-pdf/renderer`)
- Ekspor masing-masing ke PDF
- Untuk tiap PDF: jalankan ekstraksi teks (copy-paste manual dan/atau `pdftotext`) dan verifikasi seluruh konten (termasuk urutan section, bullet, tanggal) terekstrak dengan benar dan berurutan
- Uji di Chrome, Firefox, dan Safari (WebKit — Playwright bisa bantu ini)
- Dokumentasikan hasil sebagai draft ADR-0007 (`docs/adr/0007-pdf-pipeline.md`), ikuti format ADR yang sudah ada di `docs/adr/`

## Non-goals
- Bukan implementasi renderer produksi — ini eksperimen sekali pakai untuk mengambil keputusan
- Bukan desain visual final

## Acceptance criteria
- [ ] Minimal dua pendekatan dicoba dan didokumentasikan
- [ ] Hasil ekstraksi teks untuk tiap pendekatan × tiap peramban dicatat sebagai tabel pass/fail
- [ ] Draft ADR-0007 ditulis dengan rekomendasi jelas dan konsekuensi negatifnya, mengikuti format enam ADR yang sudah ada
- [ ] Kalau seluruh pendekatan gagal di satu peramban tertentu, itu dilaporkan eksplisit, bukan disembunyikan

## Edge cases to handle
- CV dengan section kosong (mis. tanpa pengalaman organisasi)
- Teks panjang yang perlu wrap
- Karakter Bahasa Indonesia (é, akronim, tanda baca umum di CV Indonesia)

## Files likely affected
- Direktori eksperimen sementara (boleh di luar `src/`, mis. `experiments/pdf-spike/`)
- `docs/adr/0007-pdf-pipeline.md` (baru)

## Docs to read first
- `docs/03-architecture/rendering-architecture.md`
- `docs/00-project-context/assumptions-and-constraints.md` §5
- `docs/adr/0004-two-rendering-engines.md`
- Format ADR lain di `docs/adr/` sebagai contoh

## Setelah Task 2 selesai

**Jangan lanjut ke Fase 0 tanpa konfirmasi saya.** Laporkan hasil spike, termasuk kalau hasilnya negatif atau ambigu — itu justru temuan paling penting di titik ini.

---

## Catatan untuk sesi lanjutan

Setiap kali membuka sesi baru dengan Kilo Code atau CodeBuddy untuk task berikutnya (Fase 0 dan seterusnya), mulai dengan meminta agent membaca ulang `AGENTS.md` §3 (context map) dan dokumen spesifik yang relevan dengan task tersebut — jangan asumsikan konteks terbawa dari sesi sebelumnya. Gunakan template task di `AGENTS.md` §11 (format yang dipakai di atas) untuk setiap task baru yang kamu berikan.