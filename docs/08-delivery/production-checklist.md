# Production Checklist — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — prosedur F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |

> Dijalankan sebelum setiap rilis. Setiap item tidak dicentang adalah keputusan sadar, bukan kelalaian.

---

## Fungsionalitas

- [ ] Seluruh alur inti berfungsi offline
- [ ] Draft bertahan setelah tab ditutup dan dibuka kembali
- [ ] Ekspor lalu impor menghasilkan dokumen setara
- [ ] Migrasi dari setiap versi schema yang didukung lulus
- [ ] Ekspor PDF berfungsi di seluruh peramban Tier 1
- [ ] Ekstraksi teks PDF mode ATS lulus untuk seluruh fixture
- [ ] Mode switch tidak kehilangan data
- [ ] Hapus semua data benar-benar bersih

## Kualitas

- [ ] Seluruh test lulus (`bun run verify` + e2e penuh serial)
- [ ] Regresi visual ditinjau, bukan sekadar lulus
- [ ] Audit aksesibilitas bersih (`e2e/a11y.spec.ts` + lapisan jsdom)
- [ ] Anggaran performa terpenuhi (`check:budget` hijau, tanpa `--update` sepihak)
- [ ] Uji lintas-peramban periodik dijalankan (matriks §6) bila rilis menyentuh render/PWA

## Keamanan dan privasi

- [ ] Tanpa secret di bundel atau riwayat git (`check:privacy` hijau)
- [ ] Header keamanan terpasang dan terverifikasi (`curl -sI`, lihat uji asap)
- [ ] Tanpa permintaan jaringan tak terduga saat alur inti (`no-egress` hijau)
- [ ] `bun audit` bersih atau risiko diterima secara tertulis
- [ ] Tanpa data resume di log mana pun
- [ ] Tanpa PII di fixture
- [ ] Tanpa API key di ekspor mana pun (test `session-keys` hijau)

## AI (jika rilis menyentuh AI)

- [ ] Set evaluasi dijalankan, nol pelanggaran grounding
- [ ] Fallback diverifikasi untuk setiap pemicu
- [ ] Layar persetujuan akurat
- [ ] Tanpa API key di ekspor mana pun

## Konten

- [ ] Tanpa frasa terlarang (glossary §6)
- [ ] Micro-copy Bahasa Indonesia ditinjau oleh penutur asli
- [ ] Teks pemberitahuan penyimpanan ada dan dapat dipahami
- [ ] Pemberitahuan privasi akurat

## Dokumentasi

- [ ] CHANGELOG diperbarui (aturan `release-process.md` §5)
- [ ] Dokumen schema sesuai implementasi
- [ ] ADR ditambahkan untuk keputusan baru
- [ ] Traceability: setiap FR yang disentuh punya test (manual hingga TODO traceability-matrix dikerjakan)

## Rilis

- [ ] Rencana rollback dikonfirmasi (baca ulang `rollback-plan.md` §1–§2)
- [ ] Aturan "migrasi tidak dicampur perubahan besar" dipatuhi
- [ ] Alur pembaruan service worker diuji (SW baru mengklaim, cache lama terpangkas)
- [ ] Uji asap `release-process.md` §4 disiapkan dan lolos di URL produksi
- [ ] Tautan source mudah ditemukan (kewajiban keterbukaan AGPL)
