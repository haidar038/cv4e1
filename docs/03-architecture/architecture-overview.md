# Architecture Overview — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — keputusan stack masih usulan** |
| Terakhir diperbarui | 2026-09-15 |

> Titik masuk untuk pertanyaan arsitektur. Rincian ada di dokumen saudaranya; alasan keputusan ada di `../adr/`.

---

## 1. Gambaran satu paragraf
Aplikasi web statis yang berjalan sepenuhnya di peramban. Tanpa backend, tanpa database server. Satu `ResumeDocument` kanonik disimpan di IndexedDB, dinormalisasi menjadi view model, lalu dirender oleh dua renderer. PDF dihasilkan di sisi klien. AI bersifat opsional, di balik antarmuka provider, dan tidak pernah berada di jalur kritis.

## 2. Diagram lapisan

```text
                    ┌──────────────────────────────┐
                    │        UI / Form Layer        │
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │   Resume State (canonical)    │
                    │      ResumeDocument           │
                    └───┬──────────┬────────────┬──┘
                        │          │            │
          ┌─────────────▼──┐  ┌────▼─────┐  ┌───▼──────────┐
          │  Validation &  │  │ Storage  │  │ Normalize →  │
          │   Migration    │  │ IndexedDB│  │  ViewModel   │
          └────────────────┘  └──────────┘  └───┬──────┬───┘
                                                │      │
                                      ┌─────────▼─┐ ┌──▼────────┐
                                      │ATSRenderer│ │ Creative  │
                                      └─────┬─────┘ └─────┬─────┘
                                            └──────┬──────┘
                                           ┌───────▼───────┐
                                           │  PDF Export   │
                                           └───────────────┘

   Opsional dan terisolasi:  AIProvider ──► Static | Groq | OpenAI-compatible | Ollama
```

## 3. Stack yang diusulkan

> **Belum final.** Konfirmasi sebelum implementasi; setiap pilihan bawah ini butuh keputusan sadar.

| Lapisan | Usulan | Alasan | Alternatif |
| :-- | :-- | :-- | :-- |
| Build | Vite | Cepat, keluaran statis | — |
| UI | React + TypeScript | Familiar bagi maintainer | Preact (lebih ringan), Svelte |
| Styling | Tailwind CSS | Cepat, tanpa CSS runtime | CSS Modules |
| State | Zustand | Kecil, tanpa boilerplate | useReducer + Context |
| Storage | Dexie (IndexedDB) | Menghilangkan boilerplate IndexedDB | idb, IndexedDB mentah |
| Validasi | Zod | Satu sumber → tipe TS + JSON Schema | Valibot, Ajv |
| PWA | vite-plugin-pwa | Workbox tanpa konfigurasi manual | Service worker manual |
| PDF | **TODO — lihat `rendering-architecture.md`** | Risiko terbesar proyek | — |
| Test | Vitest + Playwright | Unit sampai e2e | — |

**Aturan mengikat:** setiap dependensi baru butuh pembenaran (`../06-security/dependency-policy.md`).

## 4. Batasan arsitektural
- [ ] Salin batasan HARD dari `../00-project-context/assumptions-and-constraints.md` §2.2

## 5. Batas modul

| Modul | Boleh bergantung pada | Tidak boleh bergantung pada |
| :-- | :-- | :-- |
| `core/` | — | React, DOM, storage, jaringan |
| `storage/` | `core/` | React, render |
| `render/` | `core/` | storage, jaringan, `ai/` |
| `ai/` | `core/` | storage, render |
| `content/` | — | apa pun |
| `features/` | semua di atas | — |

**Mengapa penting:** `core/` yang murni membuat validasi, migrasi, dan derivasi view model dapat diuji tanpa DOM, dan mencegah aturan bisnis bocor ke komponen.

## 6. Yang secara sengaja tidak ada
- Tanpa backend, tanpa API, tanpa database
- Tanpa lapisan autentikasi
- Tanpa state management server (React Query dan sejenisnya)
- Tanpa analytics atau error reporting saat runtime
- Tanpa SSR — statis sepenuhnya

## 7. Risiko arsitektur utama
- [ ] **Pipeline PDF** — belum terbukti; lihat `../00-project-context/assumptions-and-constraints.md` §5 R1
- [ ] **Divergensi renderer** — dimitigasi rendering contract + regresi visual
- [ ] **Pengusiran storage** — dimitigasi dorongan ekspor + storage persisten
- [ ] **Anggaran performa dengan React** — ukur sejak awal

## 8. Dokumen terkait
`pdd.md` · `c4-context.md` · `c4-container.md` · `c4-component.md` · `data-flow.md` · `state-management.md` · `rendering-architecture.md` · `deployment-architecture.md` · `../adr/`
