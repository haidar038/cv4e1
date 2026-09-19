# Prompt untuk Memulai Fase 1 — cv4every1

> **Cara pakai:** buka sesi chat baru, lampirkan tiga berkas ini sebagai konteks, lalu salin-tempel seluruh isi di bawah garis pemisah sebagai pesan pertama.
>
> Berkas yang dilampirkan:
> - `plans/cv4every1-fase-1-mvp.md` — rencana lengkap Fase 1
> - `plans/cv4every1-changelog.md` — baseline Fase 0 + state repository terverifikasi
> - `AGENTS.md` — aturan operasional (wajib)

---

Anda adalah agen implementasi untuk proyek **cv4every1** — pembuat CV gratis, open-source, local-first, offline-capable, tanpa akun, yang menghasilkan versi ATS dan Creative dari satu sumber data.

Repository: `c:\Users\BinaryVerse\Documents\Websites\cv4e1`

Kita akan memulai **Fase 1 (MVP)**. Baca dan patuhi instruksi berikut secara berurutan.

## 1. Pembacaan wajib sebelum apa pun

**Selalu:**
- `AGENTS.md` — seluruhnya, terutama §2 (batasan keras), §3 (context map), §4 (sebelum menulis kode), §6 (kewajiban test), §7 (Definition of Ready), §8 (Definition of Done), §10 (larangan), §12 (aturan bahasa)
- `docs/00-project-context/vision.md`

**Khusus Fase 1 (sesuai `docs/context-map.md`):**
- `docs/01-product/roadmap.md` — Fase 1 dan gerbang keluarnya
- `docs/02-requirements/srs.md` — FR-001…008, FR-101…111, FR-201…206, FR-301…304, NFR-001…015
- `docs/03-architecture/architecture-overview.md` — §3 stack, §5 batas modul
- `docs/03-architecture/state-management.md`
- `docs/03-architecture/rendering-architecture.md`
- `docs/03-architecture/data-flow.md`
- `docs/01-product/localization-guide.md`
- `docs/00-project-context/glossary.md` — §6 frasa terlarang, §7 padanan UI
- `docs/00-project-context/target-users.md` — §6 konteks pemakaian & nada
- `docs/04-data/resume-schema.md` + `docs/04-data/local-storage-strategy.md`
- `docs/07-quality/test-strategy.md`, `docs/07-quality/accessibility-plan.md`, `docs/07-quality/performance-budget.md`, `docs/07-quality/ats-test-plan.md`
- `docs/adr/0004-two-rendering-engines.md`, `docs/adr/0007-pdf-export-pipeline.md`
- `docs/06-security/dependency-policy.md` — sebelum menambah dependensi apa pun

Additionally, read the two attached plan files: `plans/cv4every1-fase-1-mvp.md` and `plans/cv4every1-changelog.md`.

**Jangan membaca seluruh pohon `docs/`.** Hanya yang tercantum di atas.

## 2. Konteks yang harus Anda terima sebagai fakta

- **Fase 0 sudah selesai** untuk jalur data: schema Zod, normalisasi view model, IndexedDB (Dexie), autosave, import/export, migrasi. Baseline: **6 file test, 51 test lulus**, typecheck bersih.
- **Task 7 belum selesai** — dan ini temuan penting:
  - TypeScript `strict` **tidak aktif** di `tsconfig.app.json`
  - `playwright.config.ts` belum ada, `e2e/` masih kosong
  - `.github/workflows/` belum ada
  - Boundary checker modul belum ada
  - Prettier belum ada
  - Anggaran performa di dokumen masih angka usulan
- `src/render/`, `src/features/`, `src/content/` masih kosong (README saja). `src/App.tsx` masih `Hello World`.

**Jangan percaya bahwa sesuatu sudah ada tanpa memverifikasinya.** Baca berkas nyatanya.

## 3. Urutan pengerjaan — jangan dilompati

```text
Milestone 1.0  Task 7a (strict + Prettier) → 7b (Playwright + boundary checker) → 7c (CI + budget)
Milestone 1.1  Task 8   — State store (Zustand)
Milestone 1.2  Task 13a — Micro-copy ID + Action Verbs Catalog (data saja)
Milestone 1.3  Task 9   — Form terpandu  →  Task 13b — saran kata kerja
Milestone 1.4  Task 10  — Renderer ATS   →  Task 11  — Renderer Creative
Milestone 1.5  Task 12  — Toggle mode + pratinjau
Milestone 1.6  Task 14  — Ekspor PDF (print CSS) + PWA
Milestone 1.7  Task 15  — Hapus semua data + peringatan penyimpanan
Gerbang         verifikasi gerbang keluar → laporkan → BERHENTI
```

**Milestone 1.0 wajib dikerjakan lebih dulu.** Jangan menulis komponen React sebelum strict mode, rig test, dan CI ada.

**Fase 2 (AI) tidak boleh disentuh.** Tidak ada provider, tidak ada API key, tidak ada panggilan jaringan.

## 4. Format kerja per task

Gunakan template task `AGENTS.md` §11. Untuk setiap task:

1. Tulis **Definition of Ready** (§7) dan konfirmasi terpenuhi sebelum mulai.
2. Sebutkan **Requirement ID** yang dilayani (`FR-xxx`/`NFR-xxx`). Jika tidak ada, **katakan** — jangan mengarang.
3. Tulis test sesuai jenis perubahan (`AGENTS.md` §6) — bukan setelahnya.
4. **Checkpoint laporan** di akhir setiap milestone: apa yang selesai, apa yang diuji, apa yang gagal, keputusan apa yang diperlukan. Tunggu konfirmasi.
5. Perbarui `plans/cv4every1-changelog.md` setelah setiap task selesai.

## 5. Keputusan desain D13–D24 — WAJIB dikonfirmasi sebelum Task 8

Baca tabel lengkapnya di `plans/cv4every1-fase-1-mvp.md` bagian "Keputusan Desain D13–D24". Ringkasnya:

| # | Usulan |
| :-- | :-- |
| D13 | Zustand untuk state (~1,5 KB, MIT) |
| D14 | Tanpa router; view state + `lastDraftId` di localStorage |
| D15 | Micro-copy sebagai modul **TypeScript bertipe**, bukan JSON mentah |
| D16 | Action Verbs Catalog: JSON statis ~60–100 entri, 6 kategori |
| D17 | 1 template Creative |
| D18 | Kompresi foto via Canvas: maks 2 MB masuk → maks 500 KB / 800 px |
| D19 | Ekspor PDF via `window.print()` + print CSS + modal instruksi |
| D20 | PWA: `cv4every1`, `lang: "id"`, ikon lokal |
| D21 | Teks indikator autosave Bahasa Indonesia |
| D22 | Susun ulang section dengan tombol naik/turun (bukan drag-and-drop) |
| D23 | Panel daftar draft (side sheet mobile / sidebar desktop) |
| D24 | Penegakan anggaran bundle via skrip + baseline |

**Sajikan tabel konfirmasi, sebutkan deviasi sadar dari dokumen (D15 dan D14 adalah deviasi), lalu tunggu persetujuan.** Jangan mulai Task 8 sebelum itu.

## 6. Batasan keras — melanggar berarti cacat, bukan "fitur berhasil"

Dari `AGENTS.md` §2 dan §10:

| Jangan pernah | Alasan |
| :-- | :-- |
| Menambah backend, database, atau server | C-T1 |
| Menaruh API key/token/secret di repo, bundle, atau berkas yang dikomit | C-T2 |
| Mengirim data resume ke jaringan tanpa persetujuan eksplisit per operasi | C-T3 |
| Menyimpan konten CV di `localStorage` | C-T7 — konten CV hanya di IndexedDB |
| Menambah analytics atau telemetry | C-T10 |
| Memuat font/skrip dari CDN saat runtime | C-T10, C-T11, NFR-015 |
| Merasterisasi PDF (html2canvas, screenshot-to-PDF) | C-T5 — menghancurkan ekstraksi teks |
| Menulis "ATS-compliant", "dijamin lolos ATS", atau skor CV apa pun | Glossary §6 |
| Membuat template/renderer mengesampingkan aturan mode | AGENTS.md §2.15 |
| Mengubah data sumber saat berpindah mode | AGENTS.md §2.16 |
| Membuat `render/` atau `core/` melanggar batas modul | `architecture-overview.md` §5 |
| Menaruh aturan bisnis (aturan mode, validasi) di dalam komponen React | AGENTS.md §5 |
| Menambah dependensi tanpa pembenaran tertulis `dependency-policy.md` | AGENTS.md §5 |
| Memakai data pribadi nyata di fixture atau test | Privasi |
| Menandai task selesai dengan test gagal atau di-skip | AGENTS.md §8 |

**Jika sebuah permintaan menuntut melanggar salah satunya: BERHENTI, sebutkan batasan mana yang dilanggar, dan minta keputusan. Jangan cari akal-akalan.**

## 7. Wajib dipakai, bukan dibangun ulang

Fase 0 sudah menyediakan lapisan data yang teruji. **Pakai, jangan duplikasi:**

| Kapabilitas | API |
| :-- | :-- |
| Validasi dokumen | `validateResumeDocument()` — `src/core/schema.ts` |
| Dokumen kosong | `createEmptyResumeDocument()` |
| View model ATS | `toATSViewModel()` — `src/core/normalize.ts` |
| View model Creative | `toCreativeViewModel()` |
| Autosave (debounce 2s) | `AutoSaveManager` — `src/storage/autosave.ts` |
| CRUD draft | `saveDraft` / `loadDraft` / `listDrafts` / `deleteDraft` |
| Aset foto | `saveAsset` / `loadAsset` / `deleteAsset` |
| Hapus semua | `wipeAllData()` (diperluas ke `src/storage/wipe.ts` di Task 15) |
| Multi-tab | `notifyTabs` / `onExternalUpdate` — `src/storage/sync.ts` |
| Ekspor/impor | `exportResume()` / `importResume()` |
| Migrasi | `migrateDocument()` — `src/core/migration.ts` |

## 8. Test yang wajib menyertai setiap jenis perubahan

Dari `AGENTS.md` §6:

| Jenis perubahan | Test wajib |
| :-- | :-- |
| Data model / schema | Unit validasi; migrasi dari setiap versi; round-trip ekspor/impor |
| Renderer / template | Regresi visual semua fixture; **ATS juga: test ekstraksi teks PDF** |
| Form / UI | Test komponen; test navigasi keyboard |
| Storage | Kuota penuh, storage diblokir, perilaku multi-tab |
| Import / export | Input rusak, terlalu besar, field tak dikenal, versi salah |
| Offline | E2E dengan jaringan dimatikan |
| Aksesibilitas | Audit otomatis + walkthrough keyboard-only |

**Jangan pernah menguji keluaran AI dengan string persis** — uji invariant (relevan Fase 2).

## 9. Bahasa dan nada

- Kode, identifier, tipe, nama berkas: **Bahasa Inggris**.
- Copy antarmuka: **Bahasa Indonesia lebih dulu**. Nada memandu, tidak menggurui. Pengguna sedang cemas mencari kerja.
- `docs/**`: Bahasa Indonesia.
- Commit: Conventional Commits (`feat(form): …`, `fix(storage): …`, `test(renderer): …`).

Contoh nada:

- ❌ `Error: Foto tidak diperbolehkan.`
- ✅ `Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.`

## 10. Definition of Done per task

- [ ] Kriteria penerimaan terpenuhi
- [ ] Test ditambahkan dan lulus
- [ ] `lint`, `format:check`, `typecheck`, `check:boundaries`, `test` lulus
- [ ] Build produksi lulus
- [ ] Anggaran performa masih terpenuhi
- [ ] Perilaku offline diverifikasi (jika relevan)
- [ ] Aksesibilitas diperiksa pada permukaan yang berubah
- [ ] Tinjauan privasi: tidak ada data keluar perangkat, tidak ada log berisi konten CV
- [ ] Tidak ada frasa terlarang `glossary.md` §6 di copy baru
- [ ] Tidak ada secret/PII/data nyata di diff
- [ ] Changelog diperbarui
- [ ] ADR ditambahkan jika ada keputusan arsitektural (lihat tabel ADR di rencana)

## 11. Deliverable pertama Anda

Sebelum menulis satu baris kode pun, hasilkan laporan ini:

1. **Ringkasan pemahaman** 5–8 kalimat tentang proyek dan posisi Fase 1, untuk saya koreksi.
2. **Konfirmasi gap Task 7** — verifikasi ulang sendiri terhadap repository (jangan percaya changelog saya):
   - Apakah `strict` benar belum aktif di `tsconfig.app.json`?
   - Apakah `playwright.config.ts` benar belum ada?
   - Apakah `.github/` benar belum ada?
   - Apakah boundary checker dan Prettier benar belum ada?

   Laporkan apa adanya.
3. **Tabel keputusan D13–D24** dengan status usulan, alasan, dan penanda eksplisit mana yang merupakan **deviasi dari dokumen** (D14, D15).
4. **Definition of Ready** untuk Task 7a, 7b, 7c (Milestone 1.0).
5. **Rencana konkret Milestone 1.0**: berkas yang disentuh, pendekatan, risiko, test yang ditambahkan.
6. **Daftar dependensi baru** yang akan dipasang di Fase 1 beserta pembenaran `dependency-policy.md` — untuk persetujuan sebelum pemasangan.
7. **Konflik dokumen yang Anda temukan**, jika ada. Kontradiksi adalah bug: laporkan, jangan tebak.

**Setelah laporan ini: BERHENTI dan tunggu persetujuan.** Jangan lanjut ke implementasi Milestone 1.0 tanpa konfirmasi.

## 12. Aturan berhenti

Berhenti dan bertanya (bukan menebak) ketika:

- Permintaan bertabrakan dengan batasan keras §2.
- Requirement ambigu dan dua tafsir menghasilkan bentuk data berbeda.
- Perubahan menuntut dependensi baru yang tidak bisa dibenarkan.
- Perubahan akan mengubah `ResumeDocument` dan belum ada rencana migrasi.
- Anda tidak bisa menulis test untuk perilaku yang diminta.
- Dokumen saling bertentangan.
- Sesuatu menuntut sistem menyatakan fakta yang tidak diberikan pengguna.

**Bertanya itu murah. Keputusan arsitektur yang salah dan menyebar ke enam puluh berkas tidak.**

---

## Lampiran — Daftar berkas konteks untuk dilampirkan

Minimal:

```text
AGENTS.md
plans/cv4every1-fase-1-mvp.md
plans/cv4every1-changelog.md
docs/00-project-context/vision.md
docs/02-requirements/srs.md
docs/03-architecture/architecture-overview.md
docs/03-architecture/state-management.md
docs/03-architecture/rendering-architecture.md
docs/04-data/resume-schema.md
docs/adr/0004-two-rendering-engines.md
docs/adr/0007-pdf-export-pipeline.md
```

Disarankan menambahkan:

```text
docs/01-product/roadmap.md
docs/01-product/localization-guide.md
docs/00-project-context/glossary.md
docs/00-project-context/target-users.md
docs/07-quality/test-strategy.md
docs/07-quality/accessibility-plan.md
docs/07-quality/performance-budget.md
docs/07-quality/ats-test-plan.md
docs/06-security/dependency-policy.md
```