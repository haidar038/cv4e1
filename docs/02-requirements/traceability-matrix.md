# Traceability Matrix — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.3 — AC lengkap, diisi dari bukti nyata per 2026-09-20** |
| Terakhir diperbarui | 2026-09-20 |

> Memetakan Requirement → Acceptance Criteria (`acceptance-criteria.md`, v0.2) → bukti test yang
> benar-benar ada di repository → Status.
> **Aturan pengisian:** ✅ hanya diberikan bila ada test otomatis nyata yang menjalankan requirement
> itu **hari ini**. Fitur yang belum dibangun berstatus ⬜, bukan "segera hadir".

## Legenda

| Simbol | Arti |
| :-- | :-- |
| ✅ | Ada test otomatis yang membuktikan requirement untuk lapisan yang sudah dibangun |
| 🟡 | Sebagian: jalur data/view model terbukti, tetapi bagian renderer/UI-nya belum ada atau belum diuji |
| ⬜ | Belum ada test — fitur belum dibangun, atau jalurnya belum diuji |

**Baseline bukti:** 29 file / 276 test unit (`bun run test:unit`) + 10 test e2e
(`bun run test:e2e`, Chromium & Firefox, terhadap build produksi yang disajikan `vite preview`)
+ gerbang `check:privacy` dan `check:budget` di `bun run verify`/CI.

---

## 1. Terbukti penuh (✅)

| Requirement | AC | Pernyataan (ringkas) | Bukti test nyata |
| :-- | :-- | :-- | :-- |
| **FR-003** | AC-003-a,b | Berpindah mode tidak mengubah/menghapus data sumber | `src/features/store/store.test.ts` — *mode switching invariant*: `setMode` hanya mengubah `meta.mode`; mode tersimpan per draft |
| **FR-101** | AC-101-a | Draft tersimpan lokal tanpa akun | `src/storage/repository.test.ts` (save/load/list) · `src/features/drafts/DraftPanel.dom.test.tsx` (buat + daftar) |
| **FR-102** | AC-102-a,b | Autosave tanpa tindakan eksplisit pengguna | `src/features/store/store.test.ts` (perubahan menandai dirty + autosave menyimpan) · `src/features/form/AutoSaveIndicator.dom.test.tsx` (`Menyimpan…` → `Tersimpan`, bertahan setelah reload) |
| **FR-103** | AC-103-a,b | Mendukung beberapa draft | `src/storage/repository.test.ts` (urut `updatedAt`, fallback judul) · `src/features/drafts/DraftPanel.dom.test.tsx` (ganti nama, duplikat, hapus) |
| **FR-104** | AC-104-a,b | Ekspor draft sebagai JSON | `src/storage/export-import.test.ts` (round-trip penuh + dokumen kosong) · `DraftPanel.dom.test.tsx` (unduhan envelope) |
| **FR-105** | AC-105-a,b | Impor JSON valid | `src/storage/export-import.test.ts` · `store.test.ts` (`importDraftAction` sebagai draft **baru**) · `DraftPanel.dom.test.tsx` |
| **FR-106** | AC-106-a,b | Pesan error impor yang dapat dipahami | `export-import.test.ts` (tujuh `ImportErrorReason`) · `store.test.ts` (reason spesifik, draft aktif tak tersentuh) · `DraftPanel.dom.test.tsx` (pesan `NOT_JSON`) |
| **FR-107** | AC-107-a,b | Migrasi tanpa kehilangan data | `src/core/migration.test.ts` (versi terkini, proteksi downgrade, satu langkah, rantai, tanpa jalur) |
| **FR-111** | AC-111-a | Tetap dapat dipakai saat storage diblokir | `store.test.ts` (draft di memori tetap utuh, status dilaporkan) · `AutoSaveIndicator.dom.test.tsx` (pesan mode privat) |
| **FR-201** | AC-201-a | Saran format IPK beserta skala | `src/content/microcopy/microcopy.test.ts` (format kanonik `3.52 / 4.00`) · `src/features/form/sections/EducationForm.dom.test.tsx` (peringatan skala kosong) |
| **FR-202** | AC-202-a | Pilihan status pendidikan sesuai konteks Indonesia | `microcopy.test.ts` (empat label + contoh penulisan) · `EducationForm.dom.test.tsx` |
| **FR-203** | AC-203-a | Menjelaskan **alasan** foto disembunyikan di mode ATS | `microcopy.test.ts` (teks verbatim) · `src/features/form/photo/PhotoUpload.dom.test.tsx` (muncul di ATS, tidak di Creative) |
| **FR-204** | AC-204-a,b | Micro-copy Indonesia nonaktif saat locale bukan `id` | `microcopy.test.ts` (pack `en` = null) · `EducationForm.dom.test.tsx` (guidance disembunyikan) · `src/features/form/section-keys.test.ts` (pack struktural mengosongkan string domain, label tetap ada) |
| **FR-205** | AC-205-a | Saran kata kerja sadar section: katalog terfilter (`src/content/action-verbs/action-verbs.test.ts`, `src/features/form/section-keys.test.ts`); UI saran per bullet dengan penyisipan pada posisi kursor tanpa menimpa teks (`src/features/form/ActionVerbSuggestions.dom.test.tsx`, `src/features/form/fields/insertAtCursor.test.ts`, `src/features/form/fields/StringListEditor.dom.test.tsx`) |
| **FR-206** | AC-206-a | Saran bekerja offline: `e2e/no-egress.spec.ts` membuka panel saran dan menyisipkan kata kerja pada build produksi dengan **nol** permintaan di luar origin |
| **NFR-005** | AC-NFR-005-a | Dapat dioperasikan sepenuhnya dengan keyboard | `src/features/form/FormLayout.dom.test.tsx` (walkthrough keyboard-only, tanpa jebakan fokus, reorder via tombol) · test section memakai `user-event` di seluruh `*.dom.test.tsx` |
| **NFR-006** | AC-NFR-006-a,b | Build produksi tanpa API key rahasia | `scripts/privacy-rules.test.ts` (13 test: pola kredensial, kutipan disensor, allowlist tertutup) · gerbang `bun run check:privacy` memindai `dist/` nyata di `verify` + CI |
| **NFR-007** | AC-NFR-007-a | WCAG 2.2 AA | Audit axe per komponen: `src/features/form/test-utils.tsx` `runAxe()` dipakai 9 berkas `*.dom.test.tsx` · **halaman penuh**: `e2e/a11y.spec.ts` (kontras warna, `lang`, `title`, satu `main`, pada build produksi, desktop + 360 px) |
| **NFR-008** | AC-NFR-008-a | Anggaran performa app shell | `scripts/bundle-budget.test.ts` (batas ratchet, agregasi, baseline malformed) · gerbang `check:budget` di `verify` + CI · angka di `docs/07-quality/performance-budget.md` |
| **NFR-009** | AC-NFR-009-a | Tidak ada skrip pihak ketiga saat runtime | `e2e/no-egress.spec.ts` (alur inti memicu **nol** permintaan ke luar origin) |
| **NFR-011** | AC-NFR-011-a | Data resume tidak pernah masuk log | `scripts/privacy-rules.test.ts` (interpolasi/variabel selalu ditolak; hanya pesan tetap allowlist) · audit `console.*` di `src/` oleh `check:privacy` di `verify` + CI |
| **NFR-012** | AC-NFR-012-a | Dapat disajikan sebagai aset statis tanpa runtime server | `bun run build` di `verify`/CI · seluruh `test:e2e` berjalan terhadap `dist/` yang disajikan `vite preview` (`playwright.config.ts`) |
| **NFR-015** | AC-NFR-015-a | Font dibundel, bukan diambil dari CDN | `src/index.css` `@font-face` menunjuk berkas `@fontsource-variable` yang dibundel · `e2e/no-egress.spec.ts` · metrik `fontsRaw` (88,8 KB) di `check:budget` |

## 2. Terbukti sebagian (🟡)

| Requirement | AC | Sudah terbukti | Belum terbukti — pemilik |
| :-- | :-- | :-- | :-- |
| **FR-001** | AC-001-a,b | Satu model kanonik (`src/core/schema.test.ts`) diturunkan ke dua view model (`src/core/normalize.test.ts`) | Kedua renderer benar-benar merender model yang sama — Task 10/11 |
| **FR-002** | AC-002-a | `ATSViewModel` **tidak punya** field foto sama sekali (`normalize.test.ts`, penegakan struktural) | Renderer ATS benar-benar tidak mengeluarkan `<img>` — Task 10 |
| **FR-006** | AC-006-a,b | Section kosong tidak pernah masuk view model (`normalize.test.ts`; `FormLayout.dom.test.tsx`: section yang dikosongkan hilang dari view model) | Nol heading kosong pada keluaran renderer — Task 10/11 |
| **FR-007** | AC-007-a | Urutan section mengikuti `sectionOrder` di view model (`normalize.test.ts`, `store.test.ts`, `FormLayout.dom.test.tsx`) | Urutan yang sama pada keluaran renderer — Task 10/11 |
| **FR-108** | AC-108-a | Penghapusan penyimpanan teruji di lapisan storage (`repository.test.ts`: `wipeAllData` mengosongkan drafts + assets) | Alur UI hapus-semua + `localStorage` + Cache Storage — Task 15 |
| **NFR-002** | AC-NFR-002-a | Tidak ada kode jaringan di `core/`/`storage/`/`render/` (ditegakkan `check:boundaries`); alur inti memicu nol permintaan keluar-origin (`e2e/no-egress.spec.ts`) | Aturan egress untuk AI (persetujuan per operasi, AC-NFR-002-b) — Fase 2 |
| **NFR-010** | AC-NFR-010-a | e2e lulus di **Chromium + Firefox** | Matriks peramban penuh (Safari/mobile) — `browser-device-matrix.md`, Fase 4 |
| **NFR-013** | AC-NFR-013-a | Autosave terpicu per perubahan dan tahan kegagalan kuota (`store.test.ts`, `repository.test.ts`) | Uji pemulihan setelah crash/reload paksa — belum dijadwalkan |
| **NFR-014** | AC-NFR-014-a | Pembesaran 200% diverifikasi manual di peramban (tercatat di changelog Task 9) | Test otomatis zoom 200% — belum ada |

## 3. Belum ada test (⬜)

| Requirement | AC | Alasan | Pemilik |
| :-- | :-- | :-- | :-- |
| FR-004 (satu kolom ATS), FR-005 (tanpa tabel), FR-008 (template tidak menimpa aturan mode) | AC-004-a,b · AC-005-a · AC-008-a | Renderer ATS belum dibangun | Task 10 |
| FR-301 s.d. FR-304 (ekspor PDF, ekstraksi teks kedua mode, tanpa API eksternal) | AC-301-a,b · AC-302-a · AC-303-a · AC-304-a | Alur cetak & renderer belum ada | Task 10/11/14 |
| FR-109 (pemberitahuan penyimpanan lokal) | AC-109-a | Belum dibangun | Task 15 |
| FR-110 (tanpa API key di ekspor) | AC-110-a,b | Belum ada API key sama sekali; AC-110-a (kondisi kini) terbukti secara vak — ditegakkan `check:privacy` di `dist/`, tetapi test eksplisit pada envelope menyusul | Fase 2 (saat key pertama ada), dengan test |
| NFR-001 (fitur inti offline setelah app shell terpasang) | AC-NFR-001-a | Service worker belum ada | Task 14 |
| NFR-003 (ekspor PDF tanpa API eksternal) | AC-NFR-003-a | Bergantung FR-301 | Task 14 |
| NFR-004 (fallback non-AI) | AC-NFR-004-a | Belum ada kapabilitas AI yang bisa difallback-kan | Fase 2 |
| FR-401 s.d. FR-408 (AI opsional: persetujuan, fallback, grounding) | AC-401-a,b s.d. AC-408-a | Fase 2 — belum boleh dimulai sebelum gerbang Fase 1 | Fase 2 |
| FR-501, FR-502 (impor CV, hasil selalu ditinjau) | AC-501-a · AC-502-a | Fase 3 | Fase 3 |

## 4. Celah yang harus ditutup

- [x] `acceptance-criteria.md`: AC untuk seluruh FR-001–FR-502 dan NFR-001–NFR-015 (v0.2, 2026-09-20).
- [x] Baris NFR-006 dan NFR-011: diputuskan **diperiksa otomatis** — gerbang `check:privacy`
      di `verify`/CI (2026-09-20), lihat `docs/06-security/privacy-and-data-handling.md` §5a.
- [ ] Script CI yang gagal bila ada FR/NFR tanpa baris di matrix ini (masih TODO di dokumen ini).
- [ ] Pemetaan ADR → requirement yang terdampak (ADR-0002, 0004, 0007 khususnya).
- [ ] Pemetaan abuse case → test keamanan (`docs/06-security/abuse-cases.md`).

## 5. Cara memperbarui

1. Perbarui saat menutup task, bukan di akhir fase.
2. Setiap baris ✅ wajib menyebut **path test yang benar-benar ada** — bukan nama spec yang direncanakan.
3. Naikkan status hanya bila test-nya benar-benar dijalankan `bun run verify`/`bun run test:e2e`.
4. Requirement yang belum bisa dipetakan ke test berarti requirement-nya kurang spesifik: perbaiki
   requirement-nya, jangan mengarang test yang semu.
