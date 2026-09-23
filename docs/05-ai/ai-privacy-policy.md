# AI Privacy Policy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Penggunaan AI adalah satu-satunya jalur yang membuat data resume meninggalkan perangkat. Dokumen ini harus benar-benar tepat, dan pernyataannya harus muncul di produk dalam bahasa awam.

---

## 1. Tiga mode privasi

### Offline
```text
Data tidak dikirim ke server mana pun.
```

### Online tanpa AI
```text
Aplikasi mengambil aset publik seperlunya. Data resume tetap di perangkat.
```

### Online dengan AI
```text
Sebagian data yang Anda pilih dikirim ke penyedia AI yang Anda konfigurasi,
untuk diproses.
```

- [ ] Tampilkan mode aktif di antarmuka
- [ ] Jangan pernah berpindah mode tanpa sepengetahuan pengguna

## 2. Apa yang dikirim, tepatnya
- [x] **Minimisasi data:** field terpilih saja, tidak pernah seluruh CV (ditegakkan struktural di `src/ai/chat-provider.ts` — payload builder eksplisit, diuji allowlist; Task 18)
- [x] Daftar tepat per kapabilitas: bullets = teks mentah + section + targetRole (bila ada) + bahasa + fakta yang boleh dipakai; polish = teks terpilih + mode. Daftar tampil di dialog persetujuan (Task 18; perumusan prompt Task 19)
- [x] Nama ikut terkirim? Tidak — di luar daftar di atas (keputusan Task 18 Q4)
- [x] Kontak ikut terkirim? Tidak pernah (keputusan Task 18 Q4)

## 3. Persetujuan
- [x] Persetujuan eksplisit sebelum pengiriman pertama (FR-402) — dialog `ConsentDialog` + gate, e2e nol-request (Task 18)
- [x] Layar persetujuan menampilkan: penyedia mana, data apa, apa akibatnya
- [x] Persetujuan dapat dicabut — tombol di pengaturan + grant baru ditanya ulang (Task 18)
- [x] Granularitas: dialog penuh pada pengiriman pertama per penyedia per sesi (umur tab), berlaku selebihnya (keputusan Task 18 Q3)

## 4. Yang disimpan penyedia
- [ ] Kami tidak mengendalikan ini — **katakan demikian dengan jujur**
- [ ] Tautkan ke kebijakan penyedia
- [ ] Peringatkan bahwa kebijakan penyedia dapat berubah

## 5. Yang tidak pernah dikirim
- [ ] Foto profil
- [ ] Nomor telepon dan alamat
- [ ] Draft lain
- [ ] API key ke pihak selain penyedia yang dipilih

## 6. Pencatatan log
- [ ] Nol pencatatan isi resume, di build mana pun (NFR-011)
- [ ] Nol telemetri

## 7. Teks yang harus ada di produk
- [ ] Diagram alur data DF-6 dalam bahasa awam
- [ ] Terjemahan Bahasa Indonesia yang bisa dipahami tanpa latar teknis
- [ ] TODO: tulis dan tinjau bersama seseorang yang bukan pengembang
