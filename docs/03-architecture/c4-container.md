# C4 Level 2 — Container

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> "Container" dalam pengertian C4 adalah unit yang dapat dijalankan atau dideploy. Karena kami tanpa backend, sebagian besar di sini adalah modul dalam satu bundel — didokumentasikan sebagai container karena batasnya bermakna secara arsitektural.

---

## Container

| # | Container | Tanggung jawab | Teknologi |
| :-- | :-- | :-- | :-- |
| 1 | UI / Form layer | Pengisian data, navigasi, pratinjau | React |
| 2 | Resume state layer | Memegang `ResumeDocument` kanonik | Zustand |
| 3 | Validation layer | Validasi schema, normalisasi | Zod |
| 4 | Migration layer | Transformasi antarversi schema | TypeScript murni |
| 5 | ViewModel layer | Menurunkan view model per mode | TypeScript murni |
| 6 | ATS renderer | Merender view model ATS | React |
| 7 | Creative renderer | Merender view model Creative | React |
| 8 | PDF export layer | Mengubah render menjadi PDF | TODO |
| 9 | IndexedDB adapter | Persistence draft dan aset | Dexie |
| 10 | Import/export service | Baca/tulis berkas `.cv4e.json` | File API |
| 11 | Action verbs catalog | Saran statis offline | JSON statis |
| 12 | Locale / content layer | Micro-copy dan panduan | JSON statis |
| 13 | AI provider adapter | Antarmuka `AIProvider` | TypeScript |
| 14 | PWA service worker | Cache app shell, offline | Workbox |

## Aturan ketergantungan
- [ ] Diagram panah antar-container
- [ ] Larangan: 6 dan 7 tidak boleh menyentuh 9, 10, atau 13
- [ ] Larangan: 13 tidak boleh menulis langsung ke 2 — hanya lewat alur persetujuan
- [ ] Penegakan: aturan lint import

## Yang perlu dilengkapi
- [ ] Antarmuka antar-container
- [ ] Container mana yang murni (dapat diuji tanpa DOM)
- [ ] Container mana yang dimuat lazy
