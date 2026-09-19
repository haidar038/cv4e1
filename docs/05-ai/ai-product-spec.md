# AI Product Specification — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — Fase 2 ke atas** |
| Terakhir diperbarui | 2026-09-15 |

> **AI adalah pelengkap, bukan syarat.** Setiap kapabilitas di sini wajib punya fallback non-AI yang berfungsi (P4).
> Jika sebuah desain membuat AI menjadi wajib untuk fitur inti, desain itu salah.

---

## 1. Prinsip
- [ ] Offline-first tetap bawaan; AI muncul sebagai peningkatan saat pengguna online dan menyetujui
- [ ] BYO-key; tidak pernah menyematkan kunci di frontend
- [ ] Fallback statis untuk setiap kapabilitas
- [ ] **Suggestion, not mutation** — data tidak berubah sampai Apply
- [ ] Minimisasi data — kirim field terpilih, bukan seluruh CV
- [ ] Kuota penyedia adalah konfigurasi, bukan asumsi arsitektur

## 2. Kapabilitas menurut fase

### C1 — Generator bullet *(Fase 2, prioritas tertinggi)*
- [ ] Input: deskripsi tugas mentah, konteks section, target peran, bahasa, fakta yang boleh dipakai
- [ ] Output: 3 alternatif bullet, masing-masing dengan kata kerja aksi dan dampak
- [ ] Placeholder metrik ketika angka tidak tersedia — **tidak pernah mengarang angka**
- [ ] Alasan singkat per saran
- [ ] Fallback: Action Verbs Catalog + pola kalimat

### C2 — Polish *(Fase 2)*
- [ ] Hanya memperbaiki: tata bahasa, kejelasan, panjang, konsistensi, kata kerja aksi
- [ ] **Tidak boleh** menambah fakta, mengubah tanggal, atau menghapus informasi
- [ ] Mode: Polish (ID), Polish (EN), Terjemahkan ke Inggris
- [ ] Fallback: panduan statis, contoh frasa yang disarankan dan dihindari

### C3 — Penyesuaian dengan deskripsi lowongan *(Fase 3)*
- [ ] Output: kata kunci yang ditemukan, kata kunci yang belum didukung data, section yang perlu diperkuat, pertanyaan klarifikasi
- [ ] **Tidak pernah mengklaim skill baru untuk pengguna**
- [ ] **Risiko keamanan:** teks lowongan yang ditempel adalah input tak tepercaya — lihat `../06-security/abuse-cases.md`
- [ ] Fallback: pencocokan kata kunci sederhana tanpa AI

### C4 — Impor CV / OCR *(Fase 3, eksperimental)*
```text
Unggah → ekstraksi lapisan teks PDF → fallback OCR → ekstraksi field kandidat
  → validasi schema → tampilan keyakinan → tinjauan manusia → simpan
```
- [ ] **Coba ekstraksi lapisan teks lebih dulu** — sebagian besar CV digital tidak butuh OCR sama sekali
- [ ] OCR lokal (Tesseract WASM) menjaga data di perangkat; LLM lebih akurat tetapi mengirim data keluar
- [ ] Hasil ekstraksi **tidak pernah** langsung masuk ke CV final
- [ ] Tampilkan keyakinan per field
- [ ] Fallback: entri manual (yang memang jalur utama)

## 3. Titik masuk UX
- [ ] Di mana AI muncul di antarmuka
- [ ] Bagaimana tampil saat nonaktif — **nonaktif dengan alasan, bukan menghilang** (FR-408)
- [ ] Alur persetujuan pertama kali
- [ ] Panel pratinjau saran

## 4. Yang tidak akan dibangun
- [ ] Penulisan ulang CV secara otomatis
- [ ] Penilaian atau skor CV
- [ ] Saran "lowongan yang cocok untuk Anda"
- [ ] Apa pun yang menerapkan perubahan tanpa tinjauan pengguna
- [ ] AI sebagai syarat fitur inti apa pun
