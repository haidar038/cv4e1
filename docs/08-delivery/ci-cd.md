# CI/CD — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Pipeline
```text
PR → lint → type-check → unit → komponen → integrasi → build
   → anggaran bundle → e2e → regresi visual → ekstraksi PDF → a11y
   → (merge) → deploy
```

## 2. Gerbang yang memblokir merge
- [ ] Lint dan type-check
- [ ] Seluruh test lulus
- [ ] Build produksi berhasil
- [ ] Anggaran bundle terpenuhi
- [ ] JSON Schema sinkron dengan definisi Zod
- [ ] Seluruh fixture lolos validasi schema
- [ ] Ekstraksi teks PDF mode ATS lulus
- [ ] Audit aksesibilitas lulus
- [ ] Pemindaian secret bersih
- [ ] Pemeriksaan lisensi dependensi lulus

## 3. Yang berjalan kapan
| Pemicu | Berjalan |
| :-- | :-- |
| Setiap PR | Lint, type, unit, komponen, build, anggaran bundle |
| PR ke main | + e2e, regresi visual, ekstraksi PDF, a11y |
| Terjadwal | + `npm audit`, evaluasi AI (butuh key) |
| Rilis | Semuanya + lintas peramban |

## 4. Rahasia di CI
- [ ] Sesedikit mungkin
- [ ] Evaluasi AI butuh key — simpan sebagai secret repositori, jangan pernah di kode
- [ ] Pemindaian secret pada setiap PR

## 5. Deploy
- [ ] Otomatis dari `main` setelah semua gerbang lulus
- [ ] Deploy pratinjau per PR jika hosting mendukung
- [ ] → `deployment-guide.md`

## 6. TODO
- [ ] Pilih penyedia CI
- [ ] Tulis script pemeriksa traceability (setiap FR punya test)
- [ ] Tulis script pemeriksa frasa terlarang di berkas locale
