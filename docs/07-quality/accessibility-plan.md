# Accessibility Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Nama produk mengandung janji. Aksesibilitas adalah requirement, bukan peningkatan, dan tidak ditunda ke fase akhir.

---

## 1. Target
- [ ] WCAG 2.2 Level AA
- [ ] Operasi keyboard penuh
- [ ] Kompatibel pembaca layar
- [ ] Berfungsi pada pembesaran 200%

## 2. Cakupan area
| Area | Kebutuhan |
| :-- | :-- |
| Form | Label, deskripsi, hubungan pesan error, fieldset |
| Navigasi | Urutan fokus logis, skip link, tanpa jebakan fokus |
| Toggle mode | Diumumkan ke pembaca layar; perubahan dijelaskan |
| Pratinjau | Alternatif teks untuk konten visual |
| Pesan error | Terhubung ke field, dapat ditindaklanjuti, diumumkan |
| Dialog modal | Manajemen fokus, dapat ditutup dengan Escape |
| Micro-copy | Dapat diakses, bukan hanya muncul saat hover |
| Panel saran AI | Dapat dinavigasi keyboard |

## 3. Kontras dan visual
- [ ] Kontras teks minimal 4.5:1
- [ ] Indikator fokus terlihat jelas di mana-mana
- [ ] Jangan andalkan warna saja untuk menyampaikan makna
- [ ] Hormati `prefers-reduced-motion`
- [ ] Hormati `prefers-color-scheme`

## 4. Mobile
- [ ] Ukuran target sentuh minimal
- [ ] Tidak ada fungsi yang hanya bisa lewat hover
- [ ] Zoom tidak dinonaktifkan

## 5. Pengujian
- [ ] Otomatis: axe di CI pada setiap halaman
- [ ] Manual: walkthrough hanya keyboard per rilis
- [ ] Manual: uji pembaca layar (NVDA, VoiceOver) per rilis mayor
- [ ] Daftar periksa per PR untuk permukaan yang berubah

## 6. Aksesibilitas keluaran PDF
- [ ] TODO: apakah PDF hasil ekspor perlu di-tag untuk aksesibilitas?
- [ ] Minimum: teks dapat diseleksi (sudah menjadi requirement)
- [ ] Pertimbangkan: bahasa dokumen, urutan baca
