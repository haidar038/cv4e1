# Vision — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Pemilik dokumen | Maintainer proyek |
| Dokumen ini adalah | Sumber konteks paling atas. Semua dokumen lain tunduk pada dokumen ini. |
| Bahasa dokumen | Bahasa Indonesia. Identifier teknis, ID requirement, dan potongan kode tetap dalam Bahasa Inggris. |

---

## 1. Satu kalimat

**cv4every1 adalah pembuat CV gratis, open-source, local-first, dan tanpa akun, yang memungkinkan siapa pun — terutama fresh graduate Indonesia — menghasilkan CV versi ATS dan versi Creative dari satu sumber data yang sama.**

## 2. Pernyataan visi

Melamar kerja seharusnya tidak dimulai dengan membayar, mendaftar akun, atau menyerahkan data pribadi ke server orang lain.

cv4every1 ingin menjadi cara paling rendah hambatan bagi pelamar kerja Indonesia untuk menghasilkan CV yang layak secara profesional: tanpa biaya, tanpa login, tanpa watermark, tanpa paywall di langkah terakhir, dan berjalan di perangkat pengguna sendiri — termasuk ketika koneksi internet buruk atau tidak ada sama sekali.

Kesuksesan bukan diukur dari berapa banyak pengguna yang terkunci di dalam platform, melainkan dari berapa banyak orang yang bisa keluar dari aplikasi ini sambil membawa berkas CV yang bisa mereka pakai — dan membawa data mereka sendiri dalam format yang bisa dibuka di mana saja.

## 3. Mengapa sekarang, mengapa ini

Tiga kondisi membuat proyek ini masuk akal dibangun saat ini:

1. **Pasar builder gratis sudah ada, tetapi seluruhnya berorientasi Barat.** OpenResume, Oh My CV!, Resumify, dan Reactive Resume sudah membuktikan bahwa model local-first tanpa login layak secara teknis. Tidak satu pun dari mereka memahami konteks pelamar Indonesia: format IPK berskala 4.00, status "menunggu wisuda", kebiasaan menempelkan pasfoto, dan organisasi kemahasiswaan sebagai pengganti pengalaman kerja.
2. **Ketegangan ATS versus Creative belum diselesaikan siapa pun.** Kompetitor memperlakukan ini sebagai pilihan template. Kami memperlakukannya sebagai **dua mode keluaran dengan aturan HR yang berbeda** dari satu data yang sama.
3. **Gelombang AI resume builder justru menaikkan hambatan.** Semakin banyak alat yang mensyaratkan langganan atau API key untuk fitur dasar. Ini bergerak berlawanan arah dengan kebutuhan pengguna yang paling butuh bantuan: fresh graduate tanpa anggaran.

Ruang yang belum diisi siapa pun adalah irisan ketiganya: **local-first + sadar konteks Indonesia + bantuan penulisan yang tetap berguna tanpa AI berbayar.**

## 4. Prinsip produk

Prinsip ini bersifat mengikat. Ketika sebuah keputusan desain, fitur, atau implementasi bertentangan dengan salah satu prinsip di bawah, prinsip yang menang — bukan fiturnya.

### P1 — Local-first, bukan sekadar "privacy-friendly"

Data resume hidup di perangkat pengguna. Tidak ada database server, tidak ada sinkronisasi default, tidak ada telemetri yang membawa isi CV. Keluarnya data dari perangkat harus merupakan tindakan sadar pengguna (export berkas, cetak, atau mengaktifkan AI).

### P2 — Tanpa akun, tanpa dinding

Tidak ada login, tidak ada email wall, tidak ada "daftar dulu untuk unduh". Tidak ada watermark pada keluaran gratis, karena tidak ada keluaran berbayar.

### P3 — Fitur inti harus berjalan offline

Mengisi form, berganti mode, melihat pratinjau, menyimpan draft, mengekspor JSON, dan mencetak PDF harus bekerja setelah app shell terpasang, tanpa koneksi. Apa pun yang tidak bisa offline, bukan fitur inti.

### P4 — AI adalah pelengkap, bukan syarat

Setiap kapabilitas AI wajib memiliki jalur non-AI yang tetap memberi nilai. Pengguna tanpa API key, tanpa kuota, atau tanpa internet harus tetap bisa menyelesaikan CV dari awal sampai PDF.

### P5 — Sistem tidak mengarang fakta tentang pengguna

Tidak ada angka, nama perusahaan, jabatan, sertifikasi, atau skill yang dibuat sistem. AI hanya boleh mengusulkan; data tidak berubah sampai pengguna menekan Apply. Placeholder terukur (`[X]%`) lebih baik daripada angka palsu.

### P6 — Data pengguna bersifat portabel dan dapat dihapus

Export penuh harus selalu tersedia. Hapus total harus selalu tersedia, satu klik, tanpa negosiasi. Format ekspor adalah JSON yang terdokumentasi, bukan format kepemilikan.

### P7 — Jujur soal ATS

Kami merancang **ATS-oriented**, bukan menjamin lolos ATS. Tidak ada klaim "dijamin lolos", "ATS score 98%", atau skor kepatuhan yang dibuat-buat. Yang kami janjikan adalah properti yang bisa diverifikasi: satu kolom, teks terekstraksi, heading standar, urutan baca yang dapat diprediksi.

### P8 — Aksesibel bagi "every1"

Nama produk mengandung janji. Target WCAG 2.2 AA, dapat dioperasikan penuh dengan keyboard, bekerja pada layar kecil dan perangkat Android kelas menengah, serta hemat bandwidth.

### P9 — Bahasa Indonesia sebagai warga kelas satu

Bahasa Indonesia bukan hasil terjemahan belakangan. Micro-copy, contoh, peringatan, dan kamus kata kerja aksi dirancang dalam Bahasa Indonesia terlebih dahulu, lalu diterjemahkan ke Bahasa Inggris.

### P10 — Membosankan itu fitur

Prioritaskan teknologi yang stabil dan dependensi yang sedikit. Setiap dependensi baru adalah utang keamanan dan pemeliharaan pada proyek yang dikelola satu orang.

## 5. Tiga pilar diferensiasi

Ketiga pilar ini adalah alasan proyek ini ada. Jika salah satu dilepas, proyek kehilangan alasan untuk eksis di samping kompetitor yang sudah matang.

### Pilar 1 — Dual-Engine Switcher

**Masalah:** Pelamar Indonesia sering butuh dua bentuk CV yang berbeda untuk lowongan yang berbeda — ATS untuk portal korporat, Creative untuk startup, agensi, atau lamaran lewat email/WhatsApp langsung ke HR. Di alat lain, ini berarti menyusun ulang, atau mengetik ulang.

**Solusi kami:** Satu `ResumeDocument` kanonik. Dua renderer yang membaca data yang sama melalui view model yang ternormalisasi. Toggle satu klik.

| | Mode ATS | Mode Creative |
| :-- | :-- | :-- |
| Kolom | Satu kolom | Boleh dua kolom |
| Foto profil | Disembunyikan otomatis | Opsional, dipakai |
| Warna | Monokrom / aksen minimal | Aksen warna diizinkan |
| Ikon | Tidak boleh menggantikan teks | Boleh sebagai pelengkap |
| Heading | Kosakata standar yang dikenali parser | Bebas secara visual, tetap semantik |
| Layout engine | Tanpa tabel untuk struktur inti | Fleksibel |
| Teks pada PDF | Wajib dapat diseleksi dan diekstraksi | Wajib dapat diseleksi dan diekstraksi |

**Yang membuatnya berbeda dari "ganti template":** Mode ATS memberlakukan *aturan*, bukan sekadar gaya. Foto disembunyikan bukan karena template tidak punya slot foto, melainkan karena mode ATS melarangnya — dan aplikasi menjelaskan alasannya kepada pengguna saat itu terjadi.

**Invariant:** berpindah mode tidak boleh pernah menghilangkan atau mengubah data sumber. Foto tetap tersimpan saat mode ATS aktif; ia hanya tidak dirender.

### Pilar 2 — Edukasi berbahasa Indonesia dan lokalisasi kampus

**Masalah:** Kesalahan yang membuat CV fresh graduate ditolak seringkali bukan soal isi, melainkan soal konvensi yang tidak pernah diajarkan kepada mereka.

**Solusi kami:** panduan mikro kontekstual pada titik pengisian, bukan artikel bantuan terpisah.

Contoh yang harus ada di MVP:

- **IPK:** menawarkan format `3.50 / 4.00`, memperingatkan bila skala tidak dicantumkan, dan menyarankan untuk tidak menampilkan IPK di bawah ambang tertentu — sebagai saran, bukan paksaan.
- **Status pendidikan:** pilihan yang sesuai realitas Indonesia — *Lulus*, *Menunggu wisuda*, *Sedang menempuh*, *Tidak selesai* — dengan contoh penulisan untuk masing-masing.
- **Peringatan foto pada mode ATS:** "Versi ATS menyembunyikan foto profil agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative."
- **Pengalaman organisasi:** memperlakukan kepanitiaan, BEM/HMJ, KKN, dan asisten praktikum sebagai pengalaman yang sah, dengan contoh penulisan yang berorientasi hasil.
- **Kontak:** format nomor telepon Indonesia, peringatan soal alamat email yang tidak profesional, saran menuliskan kota tanpa alamat lengkap.

**Yang membuatnya berbeda dari i18n:** ini bukan terjemahan antarmuka. Ini adalah pengetahuan domain tentang perekrutan di Indonesia yang ditanamkan sebagai konten produk.

### Pilar 3 — Action Verbs Generator offline

**Masalah:** Fresh graduate menulis deskripsi tugas ("Bertugas membuat laporan mingguan") alih-alih pencapaian. Bantuan untuk ini biasanya dikunci di balik AI berbayar.

**Solusi kami:** katalog kata kerja aksi statis berbahasa Indonesia dan Inggris, dikategorikan menurut konteks (teknis, manajerial, analitis, kreatif, komunikasi, layanan) dan menurut section (Experience, Projects, Organisasi, Volunteer), lengkap dengan pola kalimat berorientasi dampak yang bisa diisi pengguna.

Katalog ini adalah data JSON statis yang dibundel dalam aplikasi. Nol permintaan jaringan. Nol API key. Nol biaya. Ia juga menjadi **fallback wajib** untuk setiap fitur AI penulisan (lihat P4).

**Yang membuatnya berbeda dari "AI polish":** ia selalu tersedia, hasilnya dapat diprediksi, dan ia tidak pernah bisa mengarang.

## 6. Cakrawala produk

### Horizon 1 — Fondasi yang solid (MVP)

Satu orang bisa membuka aplikasi tanpa koneksi, mengisi form berbahasa Indonesia yang memandu, melihat CV-nya dalam dua mode, mengekspor PDF, menyimpan draft secara lokal, dan mengekspor berkas draft untuk cadangan.

### Horizon 2 — Bantuan penulisan opsional

Pengguna yang mau boleh memasang API key mereka sendiri untuk mendapat saran bullet dan perbaikan bahasa. Semua pengguna lain tetap mendapatkan saran statis.

### Horizon 3 — Pengurangan friksi masuk dan penyesuaian lowongan

Impor CV lama (ekstraksi teks PDF terlebih dahulu, OCR sebagai fallback) untuk menghindari pengetikan ulang, dan pencocokan terhadap deskripsi lowongan yang menunjukkan kata kunci mana yang belum didukung data pengguna — tanpa pernah mengarang skill baru.

### Horizon 4 — Efek komunitas

Katalog template yang dikontribusikan komunitas, paket bahasa daerah/regional, serta materi yang bisa dipakai career center kampus. Nilai proyek meningkat tanpa mengubah prinsipnya.

## 7. Seperti apa bentuk keberhasilan

Metrik disusun agar bisa diukur tanpa melacak pengguna. Sebagian besar diverifikasi lewat pengujian, bukan analytics.

| Dimensi | Indikator | Ambang batas |
| :-- | :-- | :-- |
| Kecepatan hasil | Waktu dari buka aplikasi sampai PDF pertama, pada uji moderasi dengan fresh graduate | < 10 menit |
| Integritas data | Berpindah ATS ↔ Creative tanpa kehilangan atau perubahan field mana pun | 100% fixture lolos |
| Kemandirian offline | Alur inti selesai dengan jaringan dimatikan | 100% alur inti |
| Portabilitas | Round-trip export → import menghasilkan dokumen yang setara secara semantik | 100% fixture lolos |
| Kualitas ATS | Ekstraksi teks PDF mode ATS memulihkan nama, kontak, heading, dan seluruh isi section | 100% fixture lolos |
| Integritas AI | Keluaran AI yang memuat angka atau entitas yang tidak ada di input | 0 kejadian pada set evaluasi |
| Aksesibilitas | Audit otomatis dan uji keyboard | Tanpa pelanggaran WCAG 2.2 AA |
| Performa | App shell pada Android kelas menengah, jaringan lambat | Lihat `07-quality/performance-budget.md` |
| Keberlanjutan | Isu yang dilaporkan dapat direproduksi dari berkas draft yang dilampirkan pengguna | Tanpa perlu akses ke data server |

Yang secara sengaja **tidak** dijadikan metrik keberhasilan: jumlah pengguna terdaftar (tidak ada), durasi sesi (lebih pendek justru lebih baik), tingkat retensi (pengguna yang tidak kembali karena sudah dapat kerja adalah hasil yang baik).

## 8. Non-goals

cv4every1 **tidak**:

1. **Menjamin CV lolos ATS.** Sistem ATS berbeda-beda dan tertutup. Kami merancang untuk keterbacaan, bukan menjual jaminan.
2. **Memberi skor CV.** Tidak ada "ATS score 87%". Angka semacam itu palsu dan menyesatkan.
3. **Menggantikan career coach atau recruiter.** Kami memformat dan memandu; kami tidak menilai kelayakan karier seseorang.
4. **Mengarang pengalaman, angka, prestasi, atau skill.** Tidak dalam kondisi apa pun, termasuk atas permintaan pengguna.
5. **Menyimpan data pengguna di server secara default.** Tidak ada akun, tidak ada sinkronisasi cloud pada MVP.
6. **Menjadikan AI sebagai syarat pemakaian fitur inti.**
7. **Menyertakan API key milik proyek di dalam bundel.** Pengguna memakai kunci mereka sendiri, atau tidak sama sekali.
8. **Menjadi editor desain bebas seperti Canva.** Kontrol tata letak sengaja dibatasi demi keterbacaan mesin dan konsistensi.
9. **Mendukung CV akademik panjang (academic CV) pada MVP.** Struktur publikasi, hibah, dan pengajaran berbeda cukup jauh untuk ditunda.
10. **Menjadi job board, pelacak lamaran, atau jejaring profesional.**
11. **Memonetisasi lewat iklan, penjualan data, atau fitur premium** selama prinsip di atas berlaku.
12. **Mengklaim bahwa "tanpa server berarti sepenuhnya aman".** Penyimpanan peramban punya risikonya sendiri dan kami mendokumentasikannya secara jujur.

## 9. Panduan mengambil keputusan

Ketika tim atau agen AI menghadapi pilihan yang tidak diatur dokumen lain, gunakan urutan ini:

1. **Apakah fitur inti tetap jalan offline?** Jika tidak, tolak atau pindahkan ke jalur opsional.
2. **Apakah ini memaksa pengguna membuat akun, membayar, atau menyerahkan kunci?** Jika ya, tolak.
3. **Apakah ini bisa membuat sistem menyatakan sesuatu yang tidak diberikan pengguna?** Jika ya, tolak.
4. **Apakah data sumber tetap satu dan kanonik?** Jika sebuah fitur butuh data yang hanya dipahami satu renderer, desain ulang.
5. **Apakah pengguna bisa mengekspor dan menghapus semuanya setelah fitur ini ada?** Jika tidak, desain ulang.
6. **Apakah ini menambah dependensi?** Jika ya, butuh pembenaran tertulis (lihat `06-security/dependency-policy.md`).
7. **Apakah ini mengubah bentuk data tersimpan?** Jika ya, butuh ADR dan rencana migrasi.
8. **Jika masih ragu, pilih opsi yang lebih membosankan dan lebih sedikit kodenya.**

## 10. Posisi terhadap kompetitor

> Untuk **fresh graduate dan pelamar kerja Indonesia** yang membutuhkan CV profesional tanpa biaya, akun, atau koneksi yang stabil, **cv4every1** adalah pembuat CV open-source local-first yang menghasilkan versi ATS dan Creative dari satu data. Berbeda dari **OpenResume, Oh My CV!, Resumify, dan Reactive Resume**, cv4every1 memperlakukan kepatuhan ATS sebagai mode yang memberlakukan aturan, memperlakukan Bahasa Indonesia dan konvensi perekrutan Indonesia sebagai desain inti, dan memastikan bantuan penulisan tetap berguna tanpa API berbayar.

Analisis lengkap: `competitor-research.md`.

## 11. Risiko strategis

| Risiko | Dampak | Sikap kami |
| :-- | :-- | :-- |
| Kompetitor menambahkan lokalisasi Bahasa Indonesia | Sedang | Terjemahan mudah ditiru; pengetahuan domain (status pendidikan, kebiasaan foto, organisasi kampus, format IPK) jauh lebih sulit. Perdalam di sana. |
| Toggle ATS/Creative dianggap sekadar "ganti tema" | Tinggi | Tunjukkan aturan yang diberlakukan secara eksplisit di UI. Perbedaannya harus terasa, bukan cuma terlihat. |
| Beban pemeliharaan pada proyek satu orang | Tinggi | Dependensi sedikit, tanpa backend, tanpa on-call. Lihat P10. |
| Kebijakan free tier penyedia AI berubah | Rendah | AI bersifat opsional dan disembunyikan di balik antarmuka provider. Kuota bukan asumsi arsitektur. |
| Akurasi OCR mengecewakan pengguna | Sedang | Diposisikan eksperimental, selalu lewat tinjauan manusia, tidak pernah langsung masuk ke CV final. |
| Penghapusan storage peramban menghilangkan draft | Tinggi | Ajarkan export sejak awal, minta storage persisten, tampilkan peringatan jujur. |
| Ekspektasi "dijamin lolos ATS" | Sedang | Tolak framing itu di seluruh copy produk. Lihat P7. |

## 12. Pertanyaan terbuka

Butuh keputusan sebelum atau selama Horizon 1.

| # | Pertanyaan | Dibutuhkan pada |
| :-- | :-- | :-- |
| Q1 | ✅ Diputus: AGPL-3.0 (ADR-0013, 2026-09-26). MIT ditolak karena mengizinkan SaaS tertutup tanpa kontribusi. | Diputus 2026-09-26 |
| Q2 | Apakah nama domain dan identitas visual sudah ditetapkan? | Sebelum Horizon 1 |
| Q3 | Apakah Horizon 2 memakai BYO-key saja, atau menyediakan proxy server opsional yang dihosting sendiri? | ADR-0006 |
| Q4 | Berapa banyak template Creative yang layak dipelihara di MVP? Usulan: dua. | Horizon 1 |
| Q5 | Apakah ada analytics sama sekali? Usulan: tidak ada pada MVP. | Sebelum rilis publik pertama |
| Q6 | Apakah Bahasa Inggris masuk MVP atau ditunda ke Horizon 2? | Horizon 1 |

## 13. Dokumen terkait

- `problem-statement.md` — masalah yang dipecahkan dan buktinya
- `target-users.md` — untuk siapa dan bukan untuk siapa
- `competitor-research.md` — lanskap dan celah
- `glossary.md` — istilah bersama
- `assumptions-and-constraints.md` — apa yang kami anggap benar dan apa yang mengikat kami
- `../01-product/prd.md` — cakupan dan prioritas fitur
- `../../AGENTS.md` — aturan operasional untuk agen AI
