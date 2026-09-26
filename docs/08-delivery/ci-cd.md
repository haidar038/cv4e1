# CI/CD — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — selaras dengan implementasi F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |
| Penyedia CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## 1. Pipeline aktual

```text
push/PR → verify (lint · format · typecheck · boundaries · unit ·
          build · privacy · budget) → e2e Chromium/Linux
```

Selaras dengan `ci.yml` saat ini: job `verify` (Bun 1.3.14,
`bun install --frozen-lockfile`, cache Bun + Playwright), lalu job `e2e`
(`playwright install --with-deps chromium`, `--project=chromium`).
Firefox dan WebKit dijalankan lokal/manual periodik (matriks peramban §6),
bukan di CI.

## 2. Gerbang yang memblokir merge

- [x] Lint dan type-check
- [x] Seluruh test lulus (unit; e2e Chromium di CI)
- [x] Build produksi berhasil
- [x] Anggaran bundle terpenuhi (ratchet +10%)
- [x] Ekstraksi teks PDF mode ATS lulus (CI Chromium, ADR-0007)
- [x] Audit aksesibilitas lulus (lapisan e2e Chromium + jsdom)
- [x] Pemindaian secret bersih (`check:privacy`)
- [ ] JSON Schema sinkron dengan definisi Zod — via `gen:schema`, belum gate otomatis
- [ ] Seluruh fixture lolos validasi schema — tercakup unit, belum gate bernama
- [ ] Pemeriksaan lisensi dependensi — audit manual F4f/ADR-0013; otomatisasi belum ada

## 3. Yang berjalan kapan

| Pemicu | Berjalan |
| :-- | :-- |
| Setiap push/PR | Job `verify` + e2e Chromium |
| Terjadwal | Belum ada — usulan: `bun audit` mingguan (manual hingga ada jadwal) |
| Rilis | Semuanya + lintas peramban periodik + uji asap produksi |

## 4. Rahasia di CI

- Tidak ada secret di CI (tidak ada evaluasi AI ber-key otomatis).
- Evaluasi AI butuh key — manual oleh maintainer, tidak pernah di kode.

## 5. Deploy

- Deploy Vercel tersambung ke `main` (konfirmasi pengaturan di
  `deployment-guide.md` §2); pratinjau per PR bila didukung paket hosting.
- Push ke `main` = keputusan maintainer, tidak pernah otomatis dari agen.

## 6. TODO

- [ ] Jadwal `bun audit` terjadwal
- [ ] Script pemeriksa traceability (setiap FR punya test) — ditunda di luar Fase 4
- [ ] Script pemeriksa frasa terlarang di berkas locale (sebagian tercakup test sweep T3c)
