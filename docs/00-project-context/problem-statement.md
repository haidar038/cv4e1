# Problem Statement — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Tingkat keyakinan | Sedang. Sebagian klaim di bawah masih hipotesis dan ditandai demikian. |

---

## 1. Ringkasan masalah

Fresh graduate Indonesia menghadapi tiga hambatan sekaligus ketika membuat CV, dan tidak ada satu alat pun yang menyelesaikan ketiganya:

1. **Hambatan pengetahuan** — mereka tidak tahu konvensi format yang diharapkan HR Indonesia, dan tidak tahu bahwa CV mereka mungkin dibaca mesin sebelum dibaca manusia.
2. **Hambatan format ganda** — lowongan berbeda menuntut bentuk CV yang berbeda, dan alat yang ada memaksa memilih satu bentuk sejak awal.
3. **Hambatan akses** — alat yang benar-benar membantu menuntut pembayaran, pendaftaran, koneksi stabil, atau ketiganya, tepat pada kelompok yang paling tidak mampu menanggungnya.

Akibatnya, sebagian pelamar mengirimkan CV yang gagal diproses dengan benar karena alasan yang tidak ada hubungannya dengan kualifikasi mereka.

## 2. Siapa yang mengalaminya

Fokus utama: fresh graduate D3/S1 Indonesia yang melamar pekerjaan pertama, biasanya 0–2 tahun setelah lulus, sering kali mengerjakan CV dari ponsel atau laptop pinjaman, dengan kuota data terbatas.

Rincian segmen: `target-users.md`.

## 3. Rincian masalah

### M1 — Ketidaktahuan tentang konvensi lokal

Fresh graduate menerima nasihat CV yang saling bertentangan dari internet, senior, dan dosen. Pertanyaan yang berulang:

- Apakah IPK dicantumkan? Bagaimana menuliskan skalanya?
- Bagaimana menulis pendidikan jika sudah lulus sidang tetapi belum wisuda?
- Apakah pasfoto wajib, dianjurkan, atau justru merugikan?
- Apakah pengalaman organisasi dan kepanitiaan layak ditulis kalau belum pernah kerja?
- Berapa halaman yang pantas?

**Mengapa alat yang ada tidak membantu:** panduan bawaan pada builder global ditulis untuk konvensi Amerika Serikat — yang secara eksplisit melarang foto dan tidak mengenal konsep IPK berskala 4.00 dengan predikat. Nasihat itu sebagian benar, sebagian menyesatkan, dan pengguna tidak punya cara membedakannya.

**Biaya kesalahan:** format yang salah bisa membuat CV terbaca aneh oleh parser atau terlihat tidak profesional oleh HR, padahal isinya memadai.

### M2 — Dilema ATS versus Creative, dan kerja ganda yang ditimbulkannya

Pelamar Indonesia realistis mengirim lamaran lewat beberapa kanal sekaligus: portal karier korporat, formulir agregator lowongan, email langsung, dan pesan WhatsApp ke HR. Kanal-kanal ini menghargai bentuk CV yang berbeda.

- CV satu kolom yang ketat lebih aman melewati parser otomatis, tetapi terasa hambar saat dikirim langsung ke manusia di startup atau agensi kreatif.
- CV dua kolom dengan foto dan aksen warna terasa tepat untuk kanal manusia, tetapi berisiko terbaca berantakan oleh parser.

**Kondisi sekarang:** pengguna membuat dan memelihara dua berkas terpisah. Ketika satu diperbarui, satunya tertinggal. Ketika mereka ingin pindah bentuk, mereka menyusun ulang dari nol.

**Mengapa alat yang ada tidak menyelesaikannya:** kompetitor memperlakukan ini sebagai pemilihan template. Beberapa memang bisa berganti template tanpa kehilangan data, tetapi tidak satu pun memperlakukan mode ATS sebagai mode yang *memberlakukan aturan* — menyembunyikan foto, memaksa satu kolom, dan menjelaskan alasannya kepada pengguna.

### M3 — Deskripsi tugas, bukan pencapaian

Tanpa pengalaman kerja formal, fresh graduate menulis apa yang mereka *ditugaskan* lakukan, bukan apa yang *dihasilkan*:

> "Bertugas menginput data penjualan ke sistem."

Bentuk yang lebih kuat membutuhkan kata kerja aksi dan dampak — tetapi mengetahui bahwa itu diperlukan, dan mampu merumuskannya, adalah keterampilan tersendiri yang jarang diajarkan.

**Mengapa alat yang ada tidak membantu:** bantuan penulisan semakin dikunci di balik integrasi AI berbayar atau yang mensyaratkan API key. Alat gratis umumnya hanya menyediakan kotak teks kosong.

**Catatan penting:** sebagian bantuan AI justru menciptakan masalah baru dengan menghasilkan angka yang tidak pernah diberikan pengguna ("Meningkatkan efisiensi 30%"). Ini mendorong pengguna berbohong di CV mereka sendiri, sering kali tanpa sadar.

### M4 — Hambatan akses: biaya, akun, dan koneksi

Pola umum pada builder CV komersial: pengguna mengisi seluruh data, lalu paywall muncul di langkah unduh. Alat lain menuntut pendaftaran akun sebelum apa pun bisa dilakukan.

Untuk pengguna sasaran kami, ini bermasalah pada tiga tingkat:

- **Biaya:** langganan bulanan untuk satu berkas PDF adalah pengeluaran yang tidak masuk akal bagi orang yang sedang mencari pekerjaan pertama.
- **Privasi dan kepercayaan:** CV berisi nama lengkap, nomor telepon, alamat email, riwayat pendidikan, dan sering foto. Menyerahkan itu ke layanan yang model bisnisnya tidak jelas adalah risiko nyata.
- **Konektivitas:** di luar kota besar, koneksi tidak stabil dan kuota mahal. Aplikasi yang butuh online terus-menerus untuk mengedit form adalah penghalang praktis, bukan sekadar ketidaknyamanan.

**Catatan geografis:** proyek ini dikembangkan dari Indonesia timur, di mana asumsi tentang kualitas koneksi yang lazim dipakai pengembang di kota besar sering tidak berlaku. Ini bukan detail sepele — ia mengubah prioritas arsitektur.

## 4. Solusi yang dipakai pengguna saat ini, dan kekurangannya

| Solusi sekarang | Mengapa dipilih | Di mana gagal |
| :-- | :-- | :-- |
| Template Microsoft Word / Google Docs | Familiar, gratis, offline (Word) | Layout rapuh; tabel dan text box sering merusak ekstraksi teks; tidak ada panduan; membuat versi kedua berarti menyalin manual |
| Canva | Cantik, banyak template, gratis | Berorientasi visual; keluaran sering buruk untuk parser; butuh akun dan koneksi; ekspor tertentu berbayar |
| Builder CV komersial | Cepat, terpandu | Paywall di langkah unduh, wajib akun, data di server pihak ketiga |
| OpenResume / Oh My CV! / Resumify | Gratis, local-first, tanpa login | Berbahasa Inggris; konvensi Amerika Serikat; tidak ada mode ATS yang memberlakukan aturan; tidak ada bantuan penulisan offline |
| Meniru CV teman | Konkret dan kontekstual | Mereplikasi kesalahan sekaligus praktik baik; tidak ada cara mengetahui mana yang mana |
| ChatGPT dan sejenisnya | Bisa menulis dan merapikan | Butuh koneksi dan kadang biaya; sering mengarang angka; keluaran berupa teks, bukan berkas PDF yang siap kirim |

## 5. Hipotesis dan cara mengujinya

Klaim-klaim ini menggerakkan keputusan produk tetapi **belum divalidasi**. Setiap klaim disertai cara membuktikan salahnya.

| # | Hipotesis | Cara menguji | Jika salah |
| :-- | :-- | :-- | :-- |
| H1 | Fresh graduate Indonesia benar-benar membutuhkan dua bentuk CV, bukan satu | Wawancara 10–15 fresh graduate: berapa versi CV yang mereka simpan, dan mengapa | Dual-engine turun menjadi kenyamanan, bukan pilar. Prioritaskan ulang ke arah panduan. |
| H2 | Panduan mikro dalam bahasa Indonesia mengurangi kesalahan format secara nyata | Uji moderasi: tugas mengisi CV dengan dan tanpa micro-copy, hitung kesalahan konvensi | Kurangi cakupan micro-copy; alihkan usaha ke mutu template |
| H3 | Saran statis tanpa AI cukup berguna untuk memperbaiki bullet | Tunjukkan katalog kata kerja aksi ke 5–10 fresh graduate; minta mereka menulis ulang satu bullet | AI naik prioritas dan menjadi pembeda yang lebih penting |
| H4 | Offline menjadi faktor penentu bagi sebagian pengguna sasaran | Tanyakan kondisi koneksi saat terakhir kali menyusun CV | Offline tetap bernilai sebagai prinsip privasi, tetapi bukan alat pemasaran |
| H5 | Pengguna mau dan mampu mengekspor draft sendiri sebagai cadangan | Amati apakah peserta uji menemukan dan memakai tombol Export tanpa diarahkan | Butuh mekanisme cadangan yang lebih agresif atau pengingat berkala |
| H6 | Kebiasaan menempel foto cukup kuat sehingga penyembunyian otomatis akan mengejutkan pengguna | Tunjukkan toggle ATS ke peserta; amati reaksi saat foto menghilang | Perlu penjelasan yang lebih menonjol, atau konfirmasi eksplisit |

**Prasyarat riset sebelum coding** (dari draft riset awal):

- Kumpulkan 10–20 CV fresh graduate Indonesia nyata untuk memetakan variasi penulisan IPK, status pendidikan, dan penggunaan foto.
- Susun 50–100 kata kerja aksi yang lazim di CV Indonesia, lalu kategorikan.
- Uji ekstraksi teks pada PDF hasil OpenResume dan Reactive Resume untuk memahami apa yang benar-benar dipulihkan parser.

## 6. Yang secara sengaja tidak kami pecahkan

- **Menemukan lowongan.** Kami membuat CV, bukan mencarikan kerja.
- **Melacak lamaran.** Fitur berguna, tetapi masalah berbeda dengan pengguna sasaran berbeda.
- **Menilai apakah seseorang layak untuk sebuah posisi.** Di luar wewenang dan etika kami.
- **Mengoptimalkan untuk sistem ATS tertentu.** Sistem-sistem ini tertutup dan berubah; mengejarnya adalah menjanjikan sesuatu yang tidak bisa kami tepati.
- **CV akademik panjang.** Struktur yang berbeda, kelompok pengguna yang berbeda, ditunda.
- **Membuat pengguna terlihat lebih baik daripada kenyataannya.** Kami memformat kebenaran; kami tidak memolesnya menjadi kebohongan.

## 7. Bagaimana kami tahu masalah ini terpecahkan

Fresh graduate yang belum pernah memakai aplikasi ini, tanpa koneksi internet, dengan data mentah seadanya, dapat:

1. memahami konvensi mana yang berlaku untuknya, saat ia mengisi — bukan setelah ditolak;
2. menghasilkan PDF versi ATS yang isinya terekstraksi utuh;
3. beralih ke versi Creative untuk kanal lain, tanpa mengetik ulang apa pun;
4. memperkuat deskripsi pengalamannya tanpa membayar dan tanpa mengarang;
5. menyimpan dan mengambil kembali pekerjaannya, di perangkat yang sama atau berbeda;
6. menghapus jejaknya sepenuhnya kapan pun ia mau.

## 8. Dokumen terkait

- `vision.md` — arah dan prinsip
- `target-users.md` — profil pengguna
- `competitor-research.md` — mengapa solusi yang ada belum cukup
- `assumptions-and-constraints.md` — asumsi yang menopang dokumen ini
- `../01-product/prd.md` — bagaimana masalah ini diterjemahkan menjadi fitur
