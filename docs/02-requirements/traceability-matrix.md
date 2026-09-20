# Traceability Matrix — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.2 — diisi dari bukti nyata per 2026-09-20** |
| Terakhir diperbarui | 2026-09-20 |

> Memetakan Requirement → bukti test yang benar-benar ada di repository → Status.
> **Aturan pengisian:** ✅ hanya diberikan bila ada test otomatis nyata yang menjalankan requirement
> itu **hari ini**. Fitur yang belum dibangun berstatus ⬜, bukan "segera hadir".

## Legenda

| Simbol | Arti |
| :-- | :-- |
| ✅ | Ada test otomatis yang membuktikan requirement untuk lapisan yang sudah dibangun |
| 🟡 | Sebagian: jalur data/view model terbukti, tetapi bagian renderer/UI-nya belum ada atau belum diuji |
| ⬜ | Belum ada test — fitur belum dibangun, atau jalurnya belum diuji |

**Catatan tentang kolom Acceptance Criteria:** `acceptance-criteria.md` masih outline — ID `AC-xxx-a`
belum ditulis untuk hampir semua requirement. Kolom itu karena itu **tidak** dicantumkan di sini:
menuliskannya sekarang berarti mengarang kriteria yang belum disepakati (`AGENTS.md` §4). ID AC akan
masuk sebagai kolom begitu `acceptance-criteria.md` terisi.

**Baseline bukti:** 25 file / 230 test unit (`bun run test:unit`) + 8 test e2e
(`bun run test:e2e`, Chromium & Firefox, terhadap build produksi yang disajikan `vite preview`).

---

## 1. Terbukti penuh (✅)

| Requirement | Pernyataan (ringkas) | Bukti test nyata |
| :-- | :-- | :-- |
| **FR-003** | Berpindah mode tidak mengubah/menghapus data sumber | `src/features/store/store.test.ts` — *mode switching invariant*: `setMode` hanya mengubah `meta.mode`; mode tersimpan per draft |
| **FR-101** | Draft tersimpan lokal tanpa akun | `src/storage/repository.test.ts` (save/load/list) · `src/features/drafts/DraftPanel.dom.test.tsx` (buat + daftar) |
| **FR-102** | Autosave tanpa tindakan eksplisit pengguna | `src/features/store/store.test.ts` (perubahan menandai dirty + autosave menyimpan) · `src/features/form/AutoSaveIndicator.dom.test.tsx` (`Menyimpan…` → `Tersimpan`, bertahan setelah reload) |
| **FR-103** | Mendukung beberapa draft | `src/storage/repository.test.ts` (urut `updatedAt`, fallback judul) · `src/features/drafts/DraftPanel.dom.test.tsx` (ganti nama, duplikat, hapus) |
| **FR-104** | Ekspor draft sebagai JSON | `src/storage/export-import.test.ts` (round-trip penuh + dokumen kosong) · `DraftPanel.dom.test.tsx` (unduhan envelope) |
| **FR-105** | Impor JSON valid | `src/storage/export-import.test.ts` · `store.test.ts` (`importDraftAction` sebagai draft **baru`) · `DraftPanel.dom.test.tsx` |
| **FR-106** | Pesan error impor yang dapat dipahami | `export-import.test.ts` (tujuh `ImportErrorReason`) · `store.test.ts` (reason spesifik, draft aktif tak tersentuh) · `DraftPanel.dom.test.tsx` (pesan `NOT_JSON`) |
| **FR-107** | Migrasi tanpa kehilangan data | `src/core/migration.test.ts` (versi terkini, proteksi downgrade, satu langkah, rantai, tanpa jalur) |
| **FR-111** | Tetap dapat dipakai saat storage diblokir | `store.test.ts` (draft di memori tetap utuh, status dilaporkan) · `AutoSaveIndicator.dom.test.tsx` (pesan mode privat) |
| **FR-201** | Saran format IPK beserta skala | `src/content/microcopy/microcopy.test.ts` (format kanonik `3.52 / 4.00`) · `src/features/form/sections/EducationForm.dom.test.tsx` (peringatan skala kosong) |
| **FR-202** | Pilihan status pendidikan sesuai konteks Indonesia | `microcopy.test.ts` (empat label + contoh penulisan) · `EducationForm.dom.test.tsx` |
| **FR-203** | Menjelaskan **alasan** foto disembunyikan di mode ATS | `microcopy.test.ts` (teks verbatim) · `src/features/form/photo/PhotoUpload.dom.test.tsx` (muncul di ATS, tidak di Creative) |
| **FR-204** | Micro-copy Indonesia nonaktif saat locale bukan `id` | `microcopy.test.ts` (pack `en` = null) · `EducationForm.dom.test.tsx` (guidance disembunyikan) · `src/features/form/section-keys.test.ts` (pack struktural mengosongkan string domain, label tetap ada) |
| **NFR-005** | Dapat dioperasikan sepenuhnya dengan keyboard | `src/features/form/FormLayout.dom.test.tsx` (walkthrough keyboard-only, tanpa jebakan fokus, reorder via tombol) · test section memakai `user-event` di seluruh `*.dom.test.tsx` |
| **NFR-007** | WCAG 2.2 AA | Audit axe per komponen: `src/features/form/test-utils.tsx` `runAxe()` dipakai 9 berkas `*.dom.test.tsx` · **halaman penuh**: `e2e/a11y.spec.ts` (kontras warna, `lang`, `title`, satu `main`, pada build produksi, desktop + 360 px) |
| **NFR-008** | Anggaran performa app shell | `scripts/bundle-budget.test.ts` (batas ratchet, agregasi, baseline malformed) · gerbang `check:budget` di `verify` + CI · angka di `docs/07-quality/performance-budget.md` |
| **NFR-009** | Tidak ada skrip pihak ketiga saat runtime | `e2e/no-egress.spec.ts` (alur inti memicu **nol** permintaan ke luar origin) |
| **NFR-012** | Dapat disajikan sebagai aset statis tanpa runtime server | `bun run build` di `verify`/CI · seluruh `test:e2e` berjalan terhadap `dist/` yang disajikan `vite preview` (`playwright.config.ts`) |
| **NFR-015** | Font dibundel, bukan diambil dari CDN | `src/index.css` `@font-face` menunjuk berkas `@fontsource-variable` yang dibundel · `e2e/no-egress.spec.ts` · metrik `fontsRaw` (88,8 KB) di `check:budget` |

## 2. Terbukti sebagian (🟡)

| Requirement | Sudah terbukti | Belum terbukti — pemilik |
| :-- | :-- | :-- |
| **FR-001** | Satu model kanonik (`src/core/schema.test.ts`) diturunkan ke dua view model (`src/core/normalize.test.ts`) | Kedua renderer benar-benar merender model yang sama — Task 10/11 |
| **FR-002** | `ATSViewModel` **tidak punya** field foto sama sekali (`normalize.test.ts`, penegakan struktural) | Renderer ATS benar-benar tidak mengeluarkan `<img>` — Task 10 |
| **FR-006** | Section kosong tidak pernah masuk view model (`normalize.test.ts`; `FormLayout.dom.test.tsx`: section yang dikosongkan hilang dari view model) | Nol heading kosong pada keluaran renderer — Task 10/11 |
| **FR-007** | Urutan section mengikuti `sectionOrder` di view model (`normalize.test.ts`, `store.test.ts`, `FormLayout.dom.test.tsx`) | Urutan yang sama pada keluaran renderer — Task 10/11 |
| **FR-108** | Penghapusan penyimpanan teruji di lapisan storage (`repository.test.ts`: `wipeAllData` mengosongkan drafts + assets) | Alur UI hapus-semua + `localStorage` + Cache Storage — Task 15 |
| **FR-205** | Katalog + pencarian per section teruji (`src/content/action-verbs/action-verbs.test.ts`, `section-keys.test.ts`) | UI saran kata kerja — Task 13b |
| **FR-206** | Katalog adalah JSON statis tanpa jalur jaringan; `content/` dilarang mengimpor apa pun oleh boundary checker | Bukti e2e "saran tampil tanpa permintaan jaringan" — Task 13b/14 |
| **NFR-002** | Tidak ada kode jaringan di `core/`/`storage/`/`render/` (ditegakkan `check:boundaries`); alur inti memicu nol permintaan keluar-origin (`e2e/no-egress.spec.ts`) | Aturan egress untuk AI (persetujuan per operasi) — Fase 2 |
| **NFR-010** | e2e lulus di **Chromium + Firefox** | Matriks peramban penuh (Safari/mobile) — `browser-device-matrix.md`, Fase 4 |
| **NFR-013** | Autosave terpicu per perubahan dan tahan kegagalan kuota (`store.test.ts`, `repository.test.ts`) | Uji pemulihan setelah crash/reload paksa — belum dijadwalkan |
| **NFR-014** | Pembesaran 200% diverifikasi manual di peramban (tercatat di changelog Task 9) | Test otomatis zoom 200% — belum ada |

## 3. Belum ada test (⬜)

| Requirement | Alasan | Pemilik |
| :-- | :-- | :-- |
| FR-004 (satu kolom ATS), FR-005 (tanpa tabel), FR-008 (template tidak menimpa aturan mode) | Renderer ATS belum dibangun | Task 10 |
| FR-301 s.d. FR-304 (ekspor PDF, ekstraksi teks kedua mode, tanpa API eksternal) | Alur cetak & renderer belum ada | Task 10/11/14 |
| FR-109 (pemberitahuan penyimpanan lokal) | Belum dibangun | Task 15 |
| FR-110 (tanpa API key di ekspor) | Belum ada API key sama sekali; tidak ada test eksplisit pada envelope | Fase 2 (saat key pertama ada), dengan test |
| NFR-001 (fitur inti offline setelah app shell terpasang) | Service worker belum ada | Task 14 |
| NFR-003 (ekspor PDF tanpa API eksternal) | Bergantung FR-301 | Task 14 |
| NFR-006 (tidak ada secret di build produksi) | Tidak ada pemeriksaan otomatis | Kandidat script CI — perlu keputusan |
| NFR-011 (data CV tidak pernah masuk log) | Tidak ada pemeriksaan otomatis | Kandidat script/lint rule — perlu keputusan |
| NFR-004, FR-401 s.d. FR-408 (AI opsional: persetujuan, fallback, grounding) | Fase 2 — belum boleh dimulai sebelum gerbang Fase 1 | Fase 2 |
| FR-501, FR-502 (impor CV, hasil selalu ditinjau) | Fase 3 | Fase 3 |

## 4. Celah yang harus ditutup

- [ ] `acceptance-criteria.md`: tulis AC untuk FR-001–FR-008, FR-101–FR-111, FR-201–FR-206,
      FR-301–FR-304, FR-401–FR-408, FR-501–FR-502, NFR-001–NFR-015 — lalu tambahkan kolom AC di sini.
- [ ] Script CI yang gagal bila ada FR/NFR tanpa baris di matrix ini (masih TODO di dokumen ini).
- [ ] Pemetaan ADR → requirement yang terdampak (ADR-0002, 0004, 0007 khususnya).
- [ ] Pemetaan abuse case → test keamanan (`docs/06-security/abuse-cases.md`).
- [ ] Baris NFR-006 dan NFR-011: putuskan apakah diperiksa otomatis atau dinyatakan sebagai pemeriksaan
      manual per rilis.

## 5. Cara memperbarui

1. Perbarui saat menutup task, bukan di akhir fase.
2. Setiap baris ✅ wajib menyebut **path test yang benar-benar ada** — bukan nama spec yang direncanakan.
3. Naikkan status hanya bila test-nya benar-benar dijalankan `bun run verify`/`bun run test:e2e`.
4. Requirement yang belum bisa dipetakan ke test berarti requirement-nya kurang spesifik: perbaiki
   requirement-nya, jangan mengarang test yang semu.
