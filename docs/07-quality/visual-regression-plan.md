# Visual Regression Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.2 — baseline markup kedua renderer aktif; screenshot piksel menyusul** |
| Terakhir diperbarui | 2026-09-21 |

> Dua renderer yang dipelihara satu orang akan menyimpang. Ini adalah mekanisme yang menangkapnya (risiko A-T7).

---

## Keputusan Task 10/11 (ditutup di bagian ini)

- **Regresi visual Fase 1 = snapshot markup deterministik per fixture** (keputusan maintainer,
  Task 10, dipertahankan di Task 11): `renderToStaticMarkup` + `toMatchSnapshot()` —
  baseline `__snapshots__/*.snap` dikomit untuk 3 fixture (empty, full, fresh-graduate) ×
  2 renderer (`ATSRenderer.test.tsx`, `CreativeRenderer.test.tsx`). Perubahan markup apa pun
  butuh review snapshot secara sadar (`vitest -u` + diff yang dibaca manusia).
- **Screenshot piksel menunggu satu siklus generate baseline Linux di CI** — rasterisasi font
  berbeda antar-platform (temuan Task 10); menyusul bersama Task 12.
- **Hook kelas stabil:** markup Creative memakai CSS module (nama ter-hash di build), dengan
  satu hook kelas non-modul `cv-creative` di root agar e2e dan isolasi cetak punya selector
  stabil. Class name pada snapshot node terkunci oleh Vitest (nama scoped deterministik).
- **Tanpa ikon di template default (Task 11):** permukaan visual yang perlu diregresikan
  tetap minimal; `<svg` termasuk daftar terlarang checker sehingga penambahan ikon adalah
  keputusan sadar yang otomatis menambah cakupan regresi.
- **Foto di e2e:** jalur foto penuh (storage → object URL → `<img>` → PDF) dibuktikan dengan
  seed PNG 1×1 langsung ke IndexedDB dari spec (`creative-print.spec.ts`); jalur gagal-muat
  (placeholder) dibuktikan pada impor tanpa seed. Pixel foto nyata tetap ranah verifikasi
  peramban (catatan Task 9).

---

## 1. Cakupan
```text
semua fixture × semua mode × semua template
```
- [ ] Lebih banyak fixture berarti lebih banyak perlindungan; jaga jumlah template tetap sedikit

## 2. Yang ditangkap
- [ ] Pergeseran tata letak yang tidak disengaja
- [ ] Section hilang
- [ ] Heading kosong dari section kosong
- [ ] Teks meluber
- [ ] Posisi page break
- [ ] **Foto muncul pada mode ATS** — kegagalan kritis
- [ ] Kebocoran tema antarmode

## 3. Alat
- [ ] TODO: pilih (Playwright screenshot, Percy, atau perbandingan lokal)
- [ ] Syarat: berjalan di CI, biaya nol, hasil deterministik

## 4. Determinisme
- [ ] Ukuran viewport tetap
- [ ] Font dibundel, bukan dari sistem
- [ ] Tanpa tanggal atau nilai acak di fixture
- [ ] Nonaktifkan animasi

## 5. Alur kerja
- [ ] Baseline dikomit
- [ ] Perubahan butuh persetujuan eksplisit
- [ ] Peninjau harus melihat gambar diff, bukan hanya status lulus/gagal

## 6. Uji divergensi renderer
- [ ] Test khusus: untuk setiap fixture, pastikan **semua konten yang sama** muncul di kedua mode
- [ ] Perbedaan yang diizinkan hanya: foto, jumlah kolom, warna, ikon
- [ ] Mendeteksi kasus di mana satu renderer diam-diam berhenti menampilkan sebuah field
