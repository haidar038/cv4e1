# Local Persistence Strategy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Judulnya sengaja **bukan** "localStorage strategy". Data resume tidak pernah berada di localStorage.

---

## 1. Pembagian penyimpanan

| Penyimpanan | Isi | Alasan |
| :-- | :-- | :-- |
| **IndexedDB** | Draft, `ResumeDocument`, aset foto | Data terstruktur, dukungan Blob, kapasitas besar |
| **localStorage** | Locale, tema, mode terakhir, id draft terakhir | Kecil, sinkron, tidak kritis |
| **Berkas** | Ekspor portabel `.cv4e.json` | Cadangan sesungguhnya |
| **Cache Storage** | App shell (service worker) | Offline |

**Aturan mengikat:** data resume tidak pernah masuk localStorage (C-T7).

## 2. Desain IndexedDB
- [ ] Nama database, versi
- [ ] Object store: `drafts`, `assets`, `meta`
- [ ] Key dan index
- [ ] TODO: definisikan bentuk tiap store

## 3. Autosave
- [ ] Interval debounce (TODO: tetapkan)
- [ ] Apa yang terjadi ketika penulisan gagal — **jangan pernah kehilangan state dalam memori**
- [ ] Umpan balik "tersimpan" ke pengguna

## 4. Kuota dan kegagalan
- [ ] Mendeteksi kuota terlampaui
- [ ] Perilaku: jangan gagal diam-diam; beri tahu dan tawarkan ekspor
- [ ] Batas ukuran foto untuk menghindari kuota terlampaui
- [ ] Perilaku ketika IndexedDB diblokir sepenuhnya (mode privat, perangkat terkunci) — C-T12

## 5. Persistensi dan pengusiran — **risiko utama**
- [ ] Minta `navigator.storage.persist()` — kapan dan bagaimana
- [ ] **Safari iOS adalah kasus terburuk**: penyimpanan situs dapat dihapus setelah periode tidak dipakai jika PWA tidak dipasang. Uji ini secara khusus (spike S3).
- [ ] Bagaimana mendeteksi bahwa data hilang, dan apa yang dilihat pengguna
- [ ] Strategi dorongan ekspor

## 6. Penanganan aset foto
- [ ] Disimpan sebagai Blob, bukan data URL (alasan: ukuran dan memori)
- [ ] Batas ukuran dan dimensi
- [ ] Kompresi saat diunggah
- [ ] Pembersihan aset yatim

## 7. Menghapus semua data
- [ ] Harus menghapus IndexedDB, localStorage, dan Cache Storage
- [ ] Tawarkan ekspor sebelum menghapus
- [ ] Dapat diverifikasi lewat test

## 8. Beberapa tab
- [ ] TODO: putuskan strategi — lihat `../03-architecture/state-management.md` §6

## 9. Pemberitahuan kepada pengguna

Teks yang harus muncul di produk, dalam Bahasa Indonesia:

```text
Data Anda tersimpan di peramban pada perangkat ini. Membersihkan data
peramban, mode penyamaran, atau pembersihan otomatis dapat menghapus
draft Anda. Gunakan Ekspor Draft untuk membuat salinan cadangan.
```

- [ ] Kapan ditampilkan: jangan terlalu dini (mengganggu), jangan terlambat (tidak berguna)
- [ ] TODO: tentukan pemicunya

## 10. Catatan keamanan
Penyimpanan lokal tidak otomatis aman hanya karena tidak ada server. OWASP mengingatkan agar penyimpanan sisi klien dan cache diperiksa secara eksplisit, tidak dianggap aman begitu saja.

Mitigasi kami bukan berpura-pura penyimpanan lokal aman, melainkan:
- [ ] Minimalkan skrip pihak ketiga
- [ ] CSP ketat
- [ ] Sanitasi input
- [ ] Jangan simpan API key sebagai perilaku bawaan
- [ ] Dokumentasikan bahwa perangkat dan peramban adalah batas kepercayaan
- [ ] Sediakan ekspor dan hapus total
- [ ] Sajikan lewat HTTPS
- [ ] **Jangan pernah mengklaim "data sepenuhnya aman"**
