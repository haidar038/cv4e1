# Hallucination Policy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — aturan di bawah mengikat, contoh perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Ini melindungi pengguna dari menaruh kebohongan di CV mereka sendiri tanpa sadar. Diperlakukan sebagai kebijakan keamanan, bukan preferensi kualitas.

---

## 1. Larangan mutlak

```text
AI dilarang:
- menciptakan angka;
- menciptakan nama perusahaan;
- menciptakan jabatan;
- menciptakan sertifikasi;
- menciptakan pengalaman;
- menyatakan skill yang tidak diberikan pengguna;
- mengubah tanggal;
- menghapus fakta tanpa menampilkan perubahan.
```

## 2. Contoh

**Input:** `Membantu membuat laporan penjualan mingguan.`

✅ **Valid:**
```text
Membantu menyusun laporan penjualan mingguan untuk mendukung
pemantauan performa tim.
```

❌ **Tidak valid:**
```text
Meningkatkan efisiensi pelaporan sebesar 30%.
```
*(Angka 30% tidak ada di mana pun pada input.)*

✅ **Valid dengan placeholder:**
```text
Menyusun laporan penjualan mingguan, mengurangi waktu penyusunan dari
[X] jam menjadi [Y] jam setelah proses distandardisasi.
```

- [ ] Tambahkan contoh untuk polish, terjemahan, dan penyesuaian lowongan
- [ ] Tambahkan kasus batas: tahun, ukuran tim, nama teknologi

## 3. Suggestion, not mutation
```text
AI hanya menghasilkan kandidat perubahan.
Data resume tidak berubah sampai pengguna memilih Apply.
```
- [ ] Ditegakkan secara struktural: saran hidup di `AIStore`, tidak pernah di `DocumentStore`
- [ ] Ditegakkan lewat test

## 4. Penegakan berlapis
| Lapisan | Mekanisme |
| :-- | :-- |
| Prompt | Aturan grounding disertakan di setiap prompt |
| Schema | `usesPlaceholder`, `warnings` bersifat wajib |
| Kode | Pemeriksaan grounding mengekstrak dan membandingkan angka serta entitas |
| UI | Pratinjau menyoroti apa yang berubah sebelum Apply |
| Test | Uji invariant pada set evaluasi |

**Empat lapisan pertama bisa gagal. Test adalah yang menangkapnya.**

## 5. Menangani pelanggaran
- [ ] Pelanggaran grounding adalah bug **severity tinggi**
- [ ] Tambahkan kasusnya ke set evaluasi
- [ ] Perbaiki prompt, pemeriksaan, atau keduanya
- [ ] Naikkan versi prompt

## 6. Jika pengguna meminta AI mengarang
- [ ] Sistem tetap menolak (P5)
- [ ] Jelaskan alasannya sekali, dengan hormat, tanpa menggurui
- [ ] Jangan menambahkan pengaturan untuk menonaktifkan ini
