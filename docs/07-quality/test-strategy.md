# Test Strategy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.2 — outline + temuan wall-clock terukur (2026-09-20)** |
| Terakhir diperbarui | 2026-09-20 |

> Tanpa tim QA (C-R5), otomatisasi bukan pilihan. Strategi ini mengasumsikan test adalah satu-satunya jaring pengaman.

---

## 1. Piramida test

| Lapisan | Cakupan | Alat |
| :-- | :-- | :-- |
| Unit | `core/` — validasi, migrasi, normalisasi, view model | Vitest |
| Komponen | Form, panel, toggle | Vitest + Testing Library |
| Integrasi | State + storage, impor/ekspor | Vitest |
| End-to-end | Journey pengguna | Playwright |
| Regresi visual | Keluaran renderer | → `visual-regression-plan.md` |
| Ekstraksi PDF | Keterbacaan mode ATS | → `ats-test-plan.md` |
| Offline | Alur inti tanpa jaringan | Playwright |
| Aksesibilitas | WCAG 2.2 AA | axe + keyboard manual |
| Keamanan | Abuse case | Vitest + Playwright |
| Kontrak AI | Invariant, bukan string | Vitest + provider mock |

## 2. Prioritas
Yang paling penting diuji, diurutkan:

1. **Round-trip impor/ekspor** — kehilangan data di sini adalah kerusakan permanen
2. **Migrasi** — sama
3. **Ekstraksi teks PDF mode ATS** — seluruh premis produk
4. **Mode switch tanpa kehilangan data** — fitur pembeda utama
5. **Alur inti offline** — prinsip inti
6. **Invariant grounding AI** — melindungi pengguna dari dirinya sendiri
7. **Aksesibilitas keyboard** — nama produk menjanjikannya

## 3. Aturan test AI
**Jangan pernah membandingkan keluaran AI dengan string persis.** Uji invariant:
- [ ] Output JSON valid
- [ ] Tidak ada angka yang tidak ada di input
- [ ] Tidak ada tanggal, perusahaan, atau institusi baru
- [ ] Bullet memuat kata kerja aksi
- [ ] Bahasa output sesuai
- [ ] Data asli tidak berubah sebelum Apply
- [ ] Timeout menghasilkan fallback
- [ ] Error penyedia tidak menghapus draft

→ `../05-ai/evaluation-dataset.md`

## 4. Fixture
- [ ] Satu set fixture dipakai seluruh lapisan test
- [ ] → `../04-data/sample-resumes/`
- [ ] **Data fiktif saja, selalu**

## 5. Traceability
- [ ] Setiap FR dan NFR punya minimal satu test
- [ ] → `../02-requirements/traceability-matrix.md`
- [ ] CI gagal jika ada requirement tanpa test (TODO: tulis script)

## 6. Yang tidak diuji
- [ ] Kualitas estetik template — subjektif, ditinjau manusia
- [ ] Ketersediaan penyedia AI — di luar kendali kami
- [ ] Perilaku peramban di luar matriks dukungan

## 7. Paralelisme dan wall-clock

Dua project Vitest (keputusan Task 7b): `node` sebagai default — menegakkan `core/` tanpa DOM — dan
`jsdom` khusus `*.dom.test.tsx`. Komponen React, Testing Library, dan axe-core hanya dimuat project kedua.

```text
node   → src/**/*.test.{ts,tsx} kecuali *.dom.test.tsx, scripts/**/*.test.ts
jsdom  → src/**/*.dom.test.tsx  (setup: fake-indexeddb + jest-dom + canvas double)
```

### Angka terukur (2026-09-20)

Mesin pengembangan: Windows, 4 core · Bun 1.3.14 · Vitest 5.0.1. Run hangat (`bunx vitest run --project …`).

| Skenario | Sebelum | Sesudah |
| :-- | :-- | :-- |
| `--project node` (15 file · 160 test) | ~4 s | ~4 s |
| `--project jsdom` (10 file · 59 test) | 55,7–59,1 s | **25,5–29,3 s** |
| `bun run test:unit` (keduanya) | ~91 s | ~29–34 s |

Rincian fase jsdom: sebelumnya **import 61%** · environment 15% · test 17% → sesudah **import 16%** ·
environment 34% · test 40%. Artinya biaya terbesar dahulu adalah mentransformasi dependensi berat
(React, base-ui, axe-core, Dexie) **ulang untuk setiap berkas test**.

Penawarnya: `test.deps.optimizer.client` di `vitest.config.ts` — dependensi klien dibundel sekali per run.
Jumlah test, asersi, dan cakupan **tidak berubah** (59 test jsdom tetap 59).

Bottleneck berikutnya adalah pembuatan environment jsdom per berkas (±35%); belum disentuh karena
alternatifnya (`isolate: false`) membuka risiko kebocoran state singleton di store/db dan ditolak
secara sadar.

### Cara mengukur ulang

```bash
bunx vitest run --project jsdom --reporter=verbose
```

Jika hasilnya tampak janggal (mis. modul lama terpakai setelah mengubah dependensi), hapus cache
optimizer `node_modules/.vite` lalu jalankan ulang. Karena `deps.optimizer` adalah lapisan cache,
verifikasi gerbang tetap memakai run penuh dari bersih sebelum menyimpulkan hasil.

### Jalur cepat lokal

`bun run test:unit:node` (±4 s, tanpa jsdom) untuk iterasi `core/`/`storage/`/store dan skrip.
`bun run test:unit` tetap menjalankan **kedua** project dan tetap menjadi bagian `bun run verify`
serta CI — tidak ada test yang di-skip (`AGENTS.md` §8).

### Batas yang diketahui

- jsdom tidak bisa menilai `color-contrast` (tanpa layout → `incomplete`), dan `index.html`
  (`lang`, `title`) tidak diuji di sini. Audit kontras & halaman penuh milik e2e Task 10/12.
- jsdom tidak punya implementasi canvas; test memakai double deterministik
  (`src/test/canvas-double.ts`) sehingga **piksel nyata** sebuah foto tetap tidak diverifikasi di sini —
  yang diuji adalah logika pipeline (loop encoder, dimensi, jalur gagal), bukan encoder peramban.
- Normalisasi EXIF (`createImageBitmap` + `imageOrientation: 'from-image'`) hanya bisa diverifikasi di
  peramban nyata; tercatat sebagai keterbatasan, bukan sebagai test yang lewat.
