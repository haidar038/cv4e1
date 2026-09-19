# ADR-0001: Local-first, tanpa backend

- **Status:** Accepted
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek

## Context

cv4every1 membuat CV untuk pelamar kerja Indonesia, terutama fresh graduate. Data CV adalah PII: nama lengkap, nomor telepon, alamat email, riwayat pendidikan, dan sering kali foto.

Tiga kondisi membentuk keputusan ini:

1. **Anggaran nol.** Tidak ada dana untuk server, database, atau operasi berkelanjutan. Proyek dikelola satu orang dengan waktu paruh.
2. **Kepercayaan.** Pengguna sasaran menyerahkan PII ke layanan yang model bisnisnya tidak mereka pahami. Kami ingin menghilangkan pertanyaan itu sepenuhnya.
3. **Konektivitas.** Sebagian pengguna berada pada koneksi tidak stabil dengan kuota terbatas. Aplikasi yang membutuhkan server untuk mengedit form adalah penghalang praktis.

## Options

1. **Backend penuh** — database, akun, sinkronisasi
2. **Backend tipis** — tanpa akun, tetapi penyimpanan server opsional
3. **Local-first, tanpa backend** — seluruhnya di peramban, aset statis
4. **Aplikasi desktop native** — Electron atau Tauri

## Decision

**Opsi 3.** cv4every1 berjalan sepenuhnya di peramban dan dideploy sebagai aset statis. Tidak ada database server, tidak ada API, tidak ada akun. Data hidup di penyimpanan peramban pada perangkat pengguna.

## Consequences

**Positif**
- Biaya operasional nol; proyek dapat bertahan tanpa pendanaan
- Tanpa akun berarti tanpa gesekan pendaftaran, tanpa pengumpulan email, tanpa pengelolaan kata sandi
- PII pengguna tidak pernah melewati infrastruktur kami — klaim privasi kami dapat diverifikasi, bukan sekadar janji
- Offline menjadi wajar, bukan sesuatu yang harus direkayasa belakangan
- Dapat dihosting mandiri dengan menyalin berkas statis
- Tidak ada yang bisa "down" selain hosting statis; tidak perlu on-call

**Negatif**
- **Tidak ada sinkronisasi antarperangkat.** Pengguna harus memindahkan berkas ekspor secara manual.
- **Tidak ada cadangan sisi server.** Jika peramban menghapus penyimpanan, data hilang secara permanen. Ini adalah risiko produk terbesar yang ditimbulkan keputusan ini.
- Tidak bisa memperbaiki data pengguna yang rusak dari jarak jauh
- Tanpa analytics berarti kami mengetahui sedikit sekali tentang pemakaian nyata
- Isu tidak dapat direproduksi tanpa pengguna melampirkan berkas ekspornya
- Semua kompleksitas berpindah ke sisi klien: migrasi, validasi, generasi PDF

**Mitigasi risiko kehilangan data**
- Minta penyimpanan persisten dari peramban
- Ajarkan ekspor sejak awal, bukan sebagai fitur tersembunyi
- Peringatan jujur bahwa penyimpanan peramban bukan cadangan
- Ekspor cadangan penuh dalam format terbuka

## Rejected alternatives

**Backend penuh** bertentangan dengan anggaran nol dan dengan proposisi privasi. Ia juga mengharuskan akun, yang ditolak secara eksplisit di `vision.md` P2.

**Backend tipis dengan penyimpanan opsional** terdengar seperti jalan tengah, tetapi memperkenalkan seluruh beban operasional backend penuh — hosting, keamanan, pencadangan, pemantauan — sambil hanya melayani sebagian kecil pengguna. Ia juga mengaburkan cerita privasi, yang justru kekuatan utama proyek ini.

**Aplikasi native** menghilangkan jangkauan web, mempersulit distribusi, dan menambah proses rilis per platform untuk proyek satu orang.
