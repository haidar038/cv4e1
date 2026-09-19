# Test Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Strategi ada di `test-strategy.md`. Dokumen ini adalah rencana konkret: apa yang diuji, kapan, dan oleh siapa.

---

## 1. Cakupan per fase
- [ ] Fase 0: unit + integrasi pada core dan storage
- [ ] Fase 1: + e2e, regresi visual, ekstraksi PDF, offline, a11y
- [ ] Fase 2: + kontrak AI dan invariant grounding
- [ ] Fase 3: + pipeline impor
- [ ] Fase 4: + lintas peramban penuh, keamanan, performa

## 2. Suite test
- [ ] Daftar suite, apa yang dicakup, berapa lama berjalan
- [ ] Mana yang berjalan pada setiap commit versus terjadwal

## 3. Test manual
Yang tidak bisa diotomatisasi:
- [ ] Peninjauan estetik template
- [ ] Uji pembaca layar
- [ ] Verifikasi cetak fisik (apakah PDF tercetak dengan benar?)
- [ ] Uji perangkat nyata pada Android kelas menengah
- [ ] Uji pengusiran storage Safari iOS

## 4. Kriteria masuk dan keluar
- [ ] Kapan sebuah fase dianggap teruji cukup

## 5. Manajemen cacat
- [ ] Tingkat keparahan: pelanggaran grounding = tinggi; kehilangan data = kritis
- [ ] Pelaporan isu bergantung pada pengguna melampirkan draft yang diekspor (tanpa telemetri)
