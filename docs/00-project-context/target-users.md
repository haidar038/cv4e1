# Target Users — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Catatan | Dokumen ini mendefinisikan segmen dan konteks pemakaian. Persona naratif ada di `../01-product/user-personas.md`. |

---

## 1. Prinsip penargetan

Nama produk mengatakan "every1", tetapi produk yang dirancang untuk semua orang berakhir tidak cocok untuk siapa pun. Kami menyelesaikan ketegangan ini dengan cara berikut:

- **Dirancang untuk** satu kelompok utama yang jelas: fresh graduate Indonesia.
- **Dapat dipakai oleh** siapa pun yang butuh CV.
- **Tidak dioptimalkan untuk** kelompok yang kebutuhannya bertabrakan dengan kelompok utama.

Ketika terjadi konflik desain, kebutuhan kelompok utama yang menang.

## 2. Pengguna utama — Fresh graduate Indonesia

### Definisi

Lulusan D3, D4, atau S1 dari perguruan tinggi Indonesia, 0–2 tahun setelah kelulusan, sedang melamar pekerjaan pertama atau kedua. Termasuk mahasiswa tingkat akhir yang sudah mulai melamar sebelum wisuda.

### Karakteristik

| Dimensi | Kondisi khas |
| :-- | :-- |
| Pengalaman kerja formal | Nol sampai satu magang |
| Bahan CV yang tersedia | Pendidikan, organisasi kemahasiswaan, kepanitiaan, proyek kuliah, KKN, asisten praktikum, magang, sertifikat pelatihan |
| Literasi digital | Menengah. Nyaman dengan aplikasi web, tidak akrab dengan konsep ATS |
| Perangkat utama | Ponsel Android kelas menengah; laptop kadang milik sendiri, kadang pinjaman atau lab kampus |
| Kondisi jaringan | Beragam. Sebagian pada koneksi tidak stabil atau kuota terbatas |
| Anggaran untuk alat CV | Nol |
| Bahasa | Bahasa Indonesia sebagai bahasa utama; Inggris pasif dan tidak percaya diri untuk menulis |
| Tekanan waktu | Tinggi. CV sering disusun mepet tenggat lowongan |
| Sumber nasihat | Senior, TikTok/Instagram, career center kampus, grup WhatsApp angkatan |

### Yang mereka butuhkan dari kami

1. Dikatakan dengan jelas konvensi mana yang berlaku, pada saat mereka mengisi.
2. Diberi sesuatu yang bisa ditulis ketika kolom pengalaman terasa kosong.
3. Menghasilkan berkas yang siap kirim tanpa membayar, mendaftar, atau menunggu koneksi.
4. Tidak dipermalukan karena tidak tahu apa itu ATS.

### Yang membuat mereka berhenti memakai

- Diminta membuat akun.
- Menemukan paywall setelah mengisi semuanya.
- Antarmuka berbahasa Inggris penuh dengan istilah asing.
- Kehilangan pekerjaan mereka karena tab tertutup.
- Hasil PDF yang terlihat jelas dibuat dari template gratisan.

## 3. Pengguna sekunder

### S1 — Mahasiswa tingkat akhir yang melamar magang atau MBKM

Sedang menempuh semester akhir, melamar magang bersertifikat, MBKM, atau program manajemen trainee. Butuh cara menuliskan status pendidikan "sedang menempuh" dengan benar dan menyusun CV dari proyek kuliah. Kebutuhan mereka hampir identik dengan kelompok utama; perbedaan utama ada pada penanganan status pendidikan.

### S2 — Career center kampus, dosen pembimbing, dan pembina organisasi

Memakai produk bukan untuk diri sendiri, melainkan untuk direkomendasikan ke puluhan atau ratusan mahasiswa. Mereka membutuhkan sesuatu yang bisa dijelaskan dalam satu sesi, tidak membutuhkan lisensi, tidak menyimpan data mahasiswa, dan tidak memalukan jika direkomendasikan. Kelompok ini adalah jalur distribusi paling realistis bagi proyek tanpa anggaran pemasaran.

### S3 — Pencari kerja awal karier dan pindah jalur

1–5 tahun pengalaman, sedang berpindah industri atau peran. Membutuhkan dual-engine lebih intens dari kelompok utama karena mereka melamar ke jenis perusahaan yang lebih beragam. Fitur penyesuaian terhadap deskripsi lowongan (Horizon 3) paling relevan untuk mereka.

### S4 — Pengguna yang sadar privasi

Memilih produk ini karena arsitekturnya, bukan karena lokalisasinya. Mereka menguji klaim kami — memeriksa tab jaringan, membaca kode, mencoba mode pesawat. Kelompok kecil tetapi berharga: mereka menemukan pelanggaran prinsip lebih cepat daripada kami.

### S5 — Pengguna internasional berbahasa Inggris

Dapat memakai produk setelah lapisan Bahasa Inggris tersedia. Tidak dioptimalkan untuk mereka, tetapi tidak sengaja dihalangi. Micro-copy khas Indonesia harus otomatis nonaktif ketika bahasa diatur ke Inggris.

## 4. Penerima manfaat tidak langsung

### HR dan recruiter Indonesia

Bukan pengguna, tetapi pembaca akhir dari setiap keluaran. Mode ATS ada karena mereka. Setiap keputusan render harus menjawab: apakah ini membuat berkas lebih mudah atau lebih sulit diproses oleh orang atau sistem di sisi penerima?

Riset lanjutan yang layak dilakukan: wawancara 3–5 HR atau recruiter Indonesia tentang apa yang benar-benar membuat CV sulit diproses dalam praktik mereka.

## 5. Bukan pengguna sasaran

Bukan berarti ditolak, tetapi kebutuhan mereka tidak akan membentuk keputusan produk.

| Kelompok | Alasan |
| :-- | :-- |
| Eksekutif senior dan C-level | CV mereka bergantung pada narasi dan format yang sangat berbeda; volume kebutuhan kecil |
| Akademisi yang butuh academic CV | Publikasi, hibah, pengajaran, dan konferensi membutuhkan model data tersendiri. Ditunda. |
| Desainer yang butuh kontrol tata letak penuh | Kontrol kami sengaja dibatasi. Mereka lebih baik memakai Figma atau InDesign. |
| Perusahaan yang butuh manajemen CV terpusat | Bertentangan langsung dengan local-first dan tanpa akun |
| Pengguna yang menginginkan CV dikarang untuknya | Bertentangan dengan P5. Kami tidak melayani kasus ini. |

## 6. Konteks pemakaian

Konteks ini adalah alasan di balik sebagian besar batasan teknis kami. Rinciannya di `assumptions-and-constraints.md`.

### Konteks perangkat

- **Mobile-first bukan pilihan gaya.** Banyak pengguna akan membuka aplikasi ini pertama kali dari ponsel. Pengisian form harus benar-benar nyaman di layar kecil, meskipun pratinjau CV secara wajar lebih baik di layar lebar.
- **Perangkat bersama itu nyata.** Laptop lab kampus, warnet, laptop kakak. Ini berarti: peringatan yang jelas bahwa data tersimpan di perangkat, dan penghapusan total yang mudah ditemukan.
- **Peramban lama masih beredar.** Matriks dukungan ada di `../07-quality/browser-device-matrix.md`.

### Konteks jaringan

- Pemuatan pertama mungkin terjadi pada koneksi lambat; ukuran app shell penting.
- Pemakaian berikutnya mungkin sepenuhnya offline.
- Pengguna mungkin tidak bersedia menghabiskan kuota untuk fitur AI opsional.

### Konteks waktu

- Sesi pemakaian cenderung pendek dan terputus-putus. Autosave wajib, bukan opsional.
- Pengguna dapat kembali beberapa hari kemudian dan berharap draftnya masih ada.

### Konteks emosional

Menyusun CV saat sedang mencari kerja pertama bukan tugas netral. Ia membawa kecemasan. Nada produk harus memandu tanpa menggurui, dan tidak boleh menambah rasa tidak mampu. Peringatan ditulis sebagai bantuan, bukan sebagai kegagalan.

Contoh perbedaan yang diinginkan:

- Buruk: "Error: Foto tidak diperbolehkan."
- Baik: "Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative."

## 7. Kebutuhan aksesibilitas

Dianggap sebagai persyaratan, bukan peningkatan.

- Navigasi keyboard penuh untuk pengguna yang tidak memakai tetikus.
- Kompatibilitas pembaca layar pada form dan pesan kesalahan.
- Rasio kontras yang memenuhi WCAG 2.2 AA pada seluruh antarmuka.
- Menghormati preferensi `prefers-reduced-motion`.
- Bekerja pada pembesaran teks peramban hingga 200% tanpa kehilangan fungsi.
- Target sentuh yang memadai di layar kecil.

Rincian: `../07-quality/accessibility-plan.md`.

## 8. Implikasi bagi produk

| Karakteristik pengguna | Konsekuensi produk |
| :-- | :-- |
| Anggaran nol | Tidak ada tingkatan berbayar, tidak ada API key wajib, tidak ada watermark |
| Koneksi tidak stabil | Offline-first, app shell kecil, autosave |
| Perangkat bersama | Penghapusan total yang mudah, peringatan penyimpanan lokal yang jujur |
| Bahasa Indonesia sebagai bahasa utama | Micro-copy berbahasa Indonesia sebagai desain inti, bukan terjemahan |
| Tidak familiar dengan ATS | Edukasi kontekstual di dalam alur, bukan di halaman bantuan terpisah |
| Bahan CV tipis | Section untuk organisasi dan proyek diperlakukan setara dengan pengalaman kerja |
| Tekanan waktu | Jalur tercepat ke PDF pertama harus benar-benar pendek |
| Mengirim ke kanal berbeda | Dual-engine dari satu data |
| Cemas soal hasil | Nada yang memandu, bukan menghakimi; tidak ada skor palsu |

## 9. Dokumen terkait

- `problem-statement.md` — masalah yang dialami pengguna ini
- `vision.md` — prinsip yang mengikat
- `../01-product/user-personas.md` — persona naratif
- `../01-product/user-journeys.md` — alur ujung ke ujung
- `../01-product/localization-guide.md` — aturan micro-copy
