# ATS Test Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — dokumen kualitas paling penting** |
| Terakhir diperbarui | 2026-09-15 |

> **Kami tidak bisa menguji terhadap sistem ATS sungguhan** — sistemnya tertutup dan berbeda-beda.
> Yang bisa kami uji adalah properti yang membuat sebuah dokumen dapat diurai. Itulah yang kami janjikan (P7).

---

## 1. Yang diuji

| Properti | Cara menguji |
| :-- | :-- |
| Teks dapat diekstraksi | `pdftotext` atau pdf.js pada PDF hasil ekspor |
| Urutan baca benar | Bandingkan urutan teks hasil ekstraksi dengan urutan sumber |
| Heading terdeteksi | Cari kosakata heading standar pada hasil ekstraksi |
| Tanpa foto pada mode ATS | Tidak ada gambar tersemat pada PDF mode ATS |
| Satu kolom | Hasil ekstraksi tidak berselang-seling antar-kolom |
| Tautan dapat diekstraksi | URL muncul pada teks hasil ekstraksi |
| Tanggal konsisten | Format tanggal seragam di seluruh dokumen |
| Kata kunci dipertahankan | Seluruh keahlian dan istilah muncul di hasil ekstraksi |
| Tanpa informasi penting hanya di gambar | Tidak ada gambar pembawa teks |
| Perilaku luberan halaman | Konten tidak terpotong |

## 2. Test otomatis
```text
Untuk setiap fixture:
  render mode ATS → ekspor PDF → ekstraksi teks →
  pastikan: nama ada, kontak ada, setiap heading ada,
            setiap teks bullet ada, urutan sesuai sumber
```
- [ ] Ini adalah test paling penting dalam proyek
- [ ] Harus berjalan di CI
- [ ] Gagal berarti memblokir rilis

## 3. Verifikasi eksternal
- [ ] Jalankan PDF hasil ekspor melalui parser publik gratis untuk pemeriksaan silang
- [ ] Bandingkan dengan keluaran kompetitor (riset R1)
- [ ] Bersifat informatif, bukan gerbang rilis — parser eksternal juga bisa salah

## 4. Kosakata heading
- [ ] Definisikan heading standar untuk locale ID dan EN
- [ ] TODO: telaah heading mana yang paling andal dikenali parser
- [ ] Contoh: "Pendidikan" / "Education", "Pengalaman" / "Experience"

## 5. Yang tidak kami klaim
- [ ] Tidak ada jaminan lolos
- [ ] Tidak ada skor
- [ ] Hasil bervariasi antarsistem ATS
- [ ] **Bahasa ini harus konsisten di seluruh produk** — glossary §6

## 6. Fixture
Seluruh fixture di `../04-data/sample-resumes/` harus lulus, termasuk kasus batas: nama panjang, karakter khusus, section kosong, pengalaman sangat panjang.
