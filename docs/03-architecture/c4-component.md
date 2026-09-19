# C4 Level 3 — Component

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Fokus pada komponen yang penting secara arsitektural. **Jangan memetakan seluruh berkas sumber** — dokumen itu akan basi dalam seminggu.

---

## Komponen yang layak didokumentasikan

### Resume state
- [ ] `useResumeStore` — pemegang state kanonik
- [ ] `resumeActions` — satu-satunya jalur mutasi
- [ ] `autosaveMiddleware`

### Core (murni, tanpa React)
- [ ] `ResumeDocumentSchema` — definisi Zod
- [ ] `validateResumeDocument()`
- [ ] `migrateResumeDocument()` + registri migrasi per versi
- [ ] `normalizeForATS()` / `normalizeForCreative()`

### Rendering
- [ ] `ModeSwitcher`
- [ ] `ATSRenderer` + komponen section
- [ ] `CreativeRenderer` + komponen section
- [ ] `SectionRegistry` — bagaimana renderer menemukan komponen section
- [ ] `PageBreakController`

### Storage
- [ ] `draftRepository`
- [ ] `assetRepository` (Blob foto)
- [ ] `preferencesStore` (localStorage)
- [ ] `storageHealthMonitor` — kuota, persistensi, deteksi pengusiran

### AI
- [ ] Antarmuka `AIProvider`
- [ ] `StaticSuggestionProvider` (bawaan, offline)
- [ ] `GroqProvider`
- [ ] `SuggestionReviewPanel` — penegak "suggestion, not mutation"
- [ ] `OutputValidator` — validasi schema + pemeriksaan grounding

### Konten
- [ ] `ActionVerbCatalog`
- [ ] `MicroCopyProvider`

## Yang perlu dilengkapi
- [ ] Antarmuka komponen (props, tipe kembalian)
- [ ] Alur data di dalam tiap kelompok
- [ ] Titik ekstensi untuk template baru
