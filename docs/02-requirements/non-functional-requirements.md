# Non-Functional Requirements — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Pernyataan NFR ada di `srs.md` §4. Dokumen ini menjelaskan **bagaimana masing-masing diukur dan ditegakkan**.

---

## 1. Performa
- [ ] Ukuran app shell, LCP, TTI — nilai konkret di `../07-quality/performance-budget.md`
- [ ] Perangkat dan kondisi jaringan acuan
- [ ] Penegakan: gerbang CI pada ukuran bundle

## 2. Ketersediaan offline
- [ ] Definisi "fitur inti" — daftar eksplisit, bukan frasa umum
- [ ] Penegakan: test end-to-end dengan jaringan dimatikan

## 3. Daya tahan data
- [ ] Interval autosave (TODO: tetapkan nilai)
- [ ] Kehilangan maksimum yang dapat diterima saat crash
- [ ] Perilaku saat kuota terlampaui
- [ ] Perilaku saat pengusiran storage

## 4. Privasi
- [ ] Nol transmisi data resume tanpa persetujuan per operasi
- [ ] Penegakan: test yang gagal jika ada permintaan jaringan tak terduga saat alur inti

## 5. Keamanan
- [ ] Kebijakan CSP
- [ ] Sanitasi input
- [ ] Batas ukuran berkas impor
- [ ] Rujuk `../06-security/security-requirements.md`

## 6. Aksesibilitas
- [ ] WCAG 2.2 AA
- [ ] Penegakan: audit otomatis + daftar periksa keyboard manual

## 7. Kompatibilitas
- [ ] Rujuk `../07-quality/browser-device-matrix.md`

## 8. Kemudahan pemeliharaan
- [ ] Batas jumlah dependensi (TODO: tetapkan angka)
- [ ] Cakupan test pada modul `core/`
- [ ] Batas kompleksitas

## 9. Portabilitas
- [ ] Ekspor terbuka dan terdokumentasi
- [ ] Round-trip tanpa kehilangan
- [ ] Dapat dihosting mandiri dari aset statis

## 10. Observability
- [ ] Tanpa telemetri. Pelaporan isu bergantung pada pengguna melampirkan draft yang diekspor.
- [ ] TODO: pertimbangkan penampil error diagnostik yang murni lokal
