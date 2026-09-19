# Test Strategy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

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
