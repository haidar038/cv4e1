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
- [ ] **Minimisasi data:** field terpilih saja, tidak pernah seluruh CV
- [ ] TODO: daftar tepat per kapabilitas
- [ ] Apakah nama ikut terkirim? (usulan: tidak, kecuali benar-benar dibutuhkan)
- [ ] Apakah kontak ikut terkirim? (usulan: tidak pernah)

## 3. Persetujuan
- [ ] Persetujuan eksplisit sebelum pengiriman pertama (FR-402)
- [ ] Layar persetujuan menampilkan: penyedia mana, data apa, apa akibatnya
- [ ] Persetujuan dapat dicabut
- [ ] TODO: sekali per sesi, sekali per penyedia, atau tiap operasi?

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
