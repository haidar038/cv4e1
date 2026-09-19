# User Journeys — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Format tiap journey: pemicu → langkah → titik keputusan → kondisi kegagalan → hasil → requirement terkait.
> Journey menjadi dasar `../02-requirements/use-cases.md` dan test end-to-end.

---

## J1 — Membuat CV baru dari nol `P0`
- [ ] Pemicu: pengguna pertama kali membuka aplikasi
- [ ] Langkah kunci: kondisi kosong → pilih mulai → isi identitas dasar → autosave pertama
- [ ] Momen penting: kapan menjelaskan bahwa data tersimpan lokal — jangan terlalu dini, jangan terlambat
- [ ] Kegagalan: storage diblokir → harus tetap bisa dipakai, dengan peringatan jelas

## J2 — Mengisi pendidikan dan pengalaman dengan panduan `P0`
- [ ] Micro-copy IPK muncul saat field IPK difokuskan
- [ ] Pemilih status pendidikan dengan contoh penulisan
- [ ] Section organisasi diperlakukan setara dengan pengalaman kerja
- [ ] Kegagalan: pengguna melewati panduan → jangan memaksa

## J3 — Beralih ATS ↔ Creative `P0`
- [ ] **Momen pembeda utama produk.** Rancang dengan hati-hati.
- [ ] Foto menghilang → peringatan kontekstual menjelaskan alasannya, bukan sekadar memberi tahu
- [ ] Invariant: nol kehilangan data, dapat dibalik sepenuhnya
- [ ] TODO: apakah pilihan mode disimpan per draft atau global?

## J4 — Memakai action verbs tanpa AI `P0`
- [ ] Pemicu: pengguna berhenti di kolom deskripsi bullet
- [ ] Saran per konteks section, bukan daftar umum
- [ ] Menyisipkan pola, bukan kalimat jadi — pengguna tetap yang menulis

## J5 — Mengekspor PDF `P0`
- [ ] Pilih mode → pratinjau → ekspor
- [ ] Penamaan berkas: TODO tentukan pola
- [ ] Kegagalan: paginasi meluber → apa yang dilihat pengguna?

## J6 — Menutup lalu membuka kembali draft `P0`
- [ ] Pemulihan otomatis tanpa pertanyaan
- [ ] Beberapa draft: daftar, ganti nama, duplikat, hapus

## J7 — Ekspor draft dan impor di perangkat lain `P0`
- [ ] Ekspor `.cv4e.json` → pindah → impor
- [ ] Foto ikut atau tidak? Lihat `../04-data/import-export-spec.md`
- [ ] Kegagalan: versi schema lebih lama → migrasi diam-diam, beri tahu hasilnya

## J8 — Memakai aplikasi sepenuhnya offline `P0`
- [ ] Kunjungan pertama online → kunjungan berikutnya offline
- [ ] Indikator status offline
- [ ] Fitur AI harus tampil nonaktif dengan alasan yang jelas, bukan menghilang

## J9 — Menghapus seluruh data lokal `P0`
- [ ] Mudah ditemukan, tidak tersembunyi di pengaturan lanjutan
- [ ] Konfirmasi + tawarkan ekspor sebelum menghapus
- [ ] Harus benar-benar menghapus: IndexedDB, localStorage, cache

## J10 — Memakai AI untuk memperbaiki bullet `P1`
- [ ] Persetujuan sebelum data dikirim pertama kali
- [ ] Tampilkan saran → pengguna memilih → Apply
- [ ] Kegagalan: timeout, rate limit, output cacat → fallback statis, draft tidak tersentuh

## J11 — Mengimpor CV lama `P2`
- [ ] Unggah → ekstraksi teks → fallback OCR → field kandidat → tinjauan manusia → simpan
- [ ] Tidak pernah langsung masuk ke CV final

## J12 — Menyesuaikan dengan deskripsi lowongan `P2`
- [ ] Tempel deskripsi → tampilkan kata kunci yang cocok dan yang belum didukung data
- [ ] Tidak pernah menambahkan skill yang tidak dimiliki pengguna
- [ ] Waspadai prompt injection dari teks yang ditempel

## Journey lintas fungsi yang perlu ditulis
- [ ] Kehilangan data karena pengusiran storage — bagaimana pengguna menemukannya dan apa yang kami lakukan
- [ ] Pertama kali di ponsel versus desktop
- [ ] Skenario perangkat bersama
