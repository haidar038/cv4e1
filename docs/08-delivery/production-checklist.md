# Production Checklist — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

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
- [ ] Seluruh test lulus
- [ ] Regresi visual ditinjau, bukan sekadar lulus
- [ ] Audit aksesibilitas bersih
- [ ] Anggaran performa terpenuhi
- [ ] Diuji pada perangkat Android nyata

## Keamanan dan privasi
- [ ] Tanpa secret di bundel atau riwayat git
- [ ] Header CSP terpasang dan diuji
- [ ] Tanpa permintaan jaringan tak terduga saat alur inti
- [ ] `npm audit` bersih atau risiko diterima secara tertulis
- [ ] Tanpa data resume di log mana pun
- [ ] Tanpa PII di fixture

## AI (jika aktif)
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
- [ ] CHANGELOG diperbarui
- [ ] Dokumen schema sesuai implementasi
- [ ] ADR ditambahkan untuk keputusan baru
- [ ] Traceability matrix diperbarui

## Rilis
- [ ] Rencana rollback dikonfirmasi
- [ ] Alur pembaruan service worker diuji
- [ ] Uji asap disiapkan
