# Project Design Document — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Desain teknis tingkat tinggi. **Sengaja dijaga tipis.** Bagian yang cepat berubah dipecah ke dokumen terpisah agar dokumen ini tidak menjadi raksasa yang tidak pernah diperbarui.

---

## 1. Ringkasan teknis
- [ ] Rujuk `architecture-overview.md`

## 2. Framework dan stack
- [ ] Keputusan final (saat ini masih usulan)
- [ ] Alasan tiap pilihan
- [ ] Versi minimum

## 3. Struktur modul
- [ ] Layout `src/` final
- [ ] Aturan batas modul — lihat `architecture-overview.md` §5
- [ ] Penegakan: aturan lint import

## 4. State management
→ `state-management.md`

## 5. Rendering engine
→ `rendering-architecture.md`

## 6. Pipeline PDF
→ `rendering-architecture.md` §PDF — **risiko terbesar, prototipe lebih dulu**

## 7. PWA dan service worker
- [ ] Strategi cache app shell
- [ ] Versioning dan alur pembaruan
- [ ] Menghindari penyajian bundle basi
- [ ] Deteksi status offline

## 8. Storage
→ `../04-data/local-storage-strategy.md`

## 9. Impor/ekspor
→ `../04-data/import-export-spec.md`

## 10. Adapter AI
→ `../05-ai/ai-provider-strategy.md`

## 11. Manajemen aset
- [ ] Alur foto: unggah → validasi → pangkas → kompres → Blob → IndexedDB
- [ ] Strategi bundling dan subsetting font
- [ ] Ikon dan aset PWA

## 12. Penanganan error
- [ ] Batas error dan pemulihan
- [ ] Aturan: **kegagalan apa pun tidak boleh menghilangkan draft**
- [ ] Pesan error yang dapat ditindaklanjuti dan berbahasa manusia

## 13. Testing
→ `../07-quality/test-strategy.md`

## 14. Build dan deployment
→ `deployment-architecture.md`, `../08-delivery/ci-cd.md`

## 15. Keputusan terbuka
- [ ] Pipeline PDF
- [ ] Preact versus React
- [ ] Jumlah template Creative di MVP
- [ ] Apakah state mode global atau per draft
