# Acceptance Criteria — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Kondisi yang dapat diuji untuk setiap requirement. Format Given/When/Then.
> Setiap AC harus dapat dipetakan ke minimal satu test otomatis.

---

## Contoh format

```gherkin
AC-002-a  (FR-002: sembunyikan foto pada renderer ATS)
  Given draft dengan foto profil terpasang
  When pengguna beralih ke mode ATS
  Then foto tidak muncul pada pratinjau
  And foto tidak muncul pada PDF hasil ekspor
  And foto tetap ada di dalam ResumeDocument yang tersimpan
  And pengguna melihat penjelasan mengapa foto disembunyikan
```

```gherkin
AC-405-a  (FR-405: tanpa fakta yang dikarang)
  Given input pengalaman tanpa angka apa pun
  When pengguna meminta saran bullet AI
  Then tidak ada saran yang memuat angka yang tidak ada pada input
  And placeholder terukur dipakai jika dampak disebutkan
```

---

## Yang perlu ditulis

- [ ] AC untuk FR-001 sampai FR-008 — model data dan rendering
- [ ] AC untuk FR-101 sampai FR-111 — persistence dan portabilitas
- [ ] AC untuk FR-201 sampai FR-206 — panduan dan lokalisasi
- [ ] AC untuk FR-301 sampai FR-304 — keluaran
- [ ] AC untuk FR-401 sampai FR-408 — AI opsional
- [ ] AC untuk FR-501 sampai FR-502 — impor CV
- [ ] AC untuk NFR-001 sampai NFR-015

## Aturan penulisan AC
- [ ] Satu perilaku yang dapat diamati per AC
- [ ] Tanpa istilah subjektif ("cepat", "mudah", "jelas") kecuali disertai ambang
- [ ] Sertakan jalur kegagalan, bukan hanya jalur bahagia
- [ ] Sertakan invariant untuk fitur AI, bukan perbandingan string persis
