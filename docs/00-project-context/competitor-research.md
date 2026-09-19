# Competitor Research — cv4every1

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Terakhir diperbarui | 2026-09-15 |
| Sumber | Riset awal dengan bantuan Perplexity dan ChatGPT, dari laman resmi dan repositori masing-masing proyek |
| Keandalan | **Belum diverifikasi langsung.** Sebagian besar temuan berasal dari materi pemasaran dan README, bukan dari pemakaian langsung. Lihat bagian 8. |
| Jadwal peninjauan ulang | Sebelum rilis publik pertama, lalu tiap kuartal |

---

## 1. Tujuan riset

Menjawab satu pertanyaan sebelum menulis baris kode pertama:

> **Apakah sudah ada yang membangun ini, dan jika ya, apa yang tersisa untuk kami bangun?**

Jawaban singkat: konsep intinya sudah ada presedennya dan matang. Kombinasi tiga pilar kami belum ada.

## 2. Ruang lingkup

Difokuskan pada alat yang berbagi asumsi arsitektural kami — local-first, tanpa login, bisa offline, gratis — karena merekalah yang paling mungkin membuat proyek ini mubazir. Builder komersial berbasis langganan dicatat sebagai konteks pasar, bukan sebagai pembanding langsung.

## 3. Lanskap

### 3.1 Pembanding langsung (local-first, tanpa login, open source)

#### OpenResume — `open-resume.com`

Builder sekaligus parser CV, dibangun dengan Next.js. Data tersimpan di peramban, tanpa pendaftaran. Menganut praktik terbaik Amerika Serikat secara ketat: satu kolom, tanpa foto profil. Punya parser CV internal yang bisa dipakai pengguna untuk melihat bagaimana berkas mereka terbaca mesin.

- **Kekuatan:** kepatuhan ATS paling serius di kelompok ini; parser bawaan; keluaran PDF berbasis teks nyata.
- **Batasan bagi pengguna kami:** hanya Bahasa Inggris; konvensi Amerika Serikat dijadikan satu-satunya kebenaran, termasuk larangan foto tanpa penjelasan konteks; tidak ada mode Creative; tidak ada bantuan penulisan.
- **Yang layak dipelajari:** parser bawaan sebagai alat edukasi adalah ide bagus dan patut dipertimbangkan versinya untuk kami.

#### Oh My CV! — `ohmycv.app`

Editor berbasis Markdown dengan CSS kustom, pratinjau langsung, dukungan banyak CV, ekspor PDF, penyimpanan lokal, tanpa login.

- **Kekuatan:** kontrol penuh bagi pengguna yang paham Markdown dan CSS; sangat cepat bagi kelompok tersebut.
- **Batasan bagi pengguna kami:** mensyaratkan literasi Markdown dan CSS yang tidak dimiliki pengguna sasaran kami; tidak ada form terpandu; tidak ada panduan konvensi; tanpa lokalisasi Indonesia.
- **Yang layak dipelajari:** posisinya membuktikan ada segmen yang menginginkan kontrol penuh. Segmen itu bukan segmen kami.

#### Resumify — `resumify-by-afif.netlify.app`

Enam template, kustomisasi penuh, impor dan ekspor JSON, berjalan offline setelah pemuatan pertama, tanpa backend.

- **Kekuatan:** portabilitas JSON; benar-benar tanpa backend; ringan.
- **Batasan bagi pengguna kami:** hanya Bahasa Inggris; template dipilih di awal; tidak ada aturan khusus mode ATS; tidak ada bantuan penulisan.
- **Yang layak dipelajari:** impor/ekspor JSON sebagai fitur kelas satu memvalidasi pendekatan format portabel kami.

#### Reactive Resume — `rxresu.me`

Paling matang di kelompok ini. Banyak template, jumlah CV tidak terbatas, susun-lepas, dukungan banyak bahasa, ekspor PDF, dapat dihosting sendiri lewat Docker, berorientasi privasi.

- **Kekuatan:** kedalaman fitur, komunitas aktif, opsi hosting mandiri, sudah mendukung banyak bahasa.
- **Batasan bagi pengguna kami:** berpusat pada akun untuk instans yang dihosting; lebih berat; multibahasa berarti terjemahan antarmuka, bukan pengetahuan konvensi lokal; tidak ada pemisahan mode ATS versus Creative yang memberlakukan aturan.
- **Ancaman kompetitif:** **paling tinggi.** Jika satu proyek akan menutup celah kami, kemungkinan besar ini. Mitigasi kami adalah kedalaman konteks Indonesia, bukan keluasan fitur.

#### easycv — `easycv.vedwix.com`

Dua belas template (profesional dan kreatif), PWA, localStorage, AI opsional dengan kunci sendiri, pencocokan deskripsi lowongan, panel penyempurnaan, ekspor PDF/PNG/JSON.

- **Kekuatan:** paling dekat dengan bentuk akhir yang kami bayangkan, termasuk pola AI BYO-key.
- **Batasan bagi pengguna kami:** localStorage sebagai penyimpanan utama membatasi penanganan aset; tanpa konteks Indonesia; ganti template bukan penegakan aturan mode.
- **Yang layak dipelajari:** pola BYO-key mereka memvalidasi pendekatan AI kami. Pilihan localStorage mereka justru memperkuat argumen kami untuk IndexedDB.

### 3.2 Konteks pasar (tidak dibandingkan langsung)

- **Builder CV komersial berlangganan** — rapi dan terpandu, tetapi umumnya mengunci unduhan di balik pembayaran. Ini justru masalah yang kami tanggapi, bukan standar yang kami kejar.
- **Canva dan sejenisnya** — menang secara visual, kalah pada keterbacaan mesin dan kemandirian offline. Banyak pengguna sasaran kami memakainya karena tidak tahu ada risiko parser.
- **Builder CV berbasis AI** — bertambah cepat. Umumnya menukar privasi dan biaya dengan kenyamanan, dan sebagian menghasilkan metrik yang dikarang. Ini memperkuat P5 kami.
- **Alat parser CV (Affinda, ParserBee, dan sejenisnya)** — relevan sebagai alat verifikasi untuk mode ATS kami, dan sebagai rujukan eksternal bila pengguna butuh OCR sebelum fitur impor kami matang.

## 4. Matriks fitur

Legenda: ● ada — ◐ sebagian — ○ tidak ada — ? belum diverifikasi

| Kapabilitas | OpenResume | Oh My CV! | Resumify | Reactive Resume | easycv | **cv4every1 (target)** |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: |
| Gratis tanpa paywall | ● | ● | ● | ● | ● | ● |
| Tanpa akun | ● | ● | ● | ◐ | ● | ● |
| Open source | ● | ● | ● | ● | ? | ● |
| Penyimpanan lokal | ● | ● | ● | ◐ | ● | ● |
| PWA / bisa offline | ◐ | ◐ | ◐ | ◐ | ● | ● |
| Impor/ekspor JSON | ◐ | ◐ | ● | ● | ● | ● |
| Banyak template | ○ | ◐ | ● | ● | ● | ◐ |
| Ganti template tanpa kehilangan data | ○ | ◐ | ● | ● | ● | ● |
| **Mode ATS yang memberlakukan aturan** | ◐ | ○ | ○ | ○ | ○ | **●** |
| **Sembunyikan foto otomatis di mode ATS** | ○ | ○ | ○ | ○ | ○ | **●** |
| Parser/pemeriksa ATS bawaan | ● | ○ | ○ | ○ | ◐ | ◐ |
| Antarmuka Bahasa Indonesia | ○ | ○ | ○ | ◐ | ○ | ● |
| **Panduan konvensi CV Indonesia** | ○ | ○ | ○ | ○ | ○ | **●** |
| **Bantuan penulisan offline tanpa API** | ○ | ○ | ○ | ○ | ○ | **●** |
| AI opsional dengan kunci sendiri | ○ | ○ | ○ | ◐ | ● | ● (Horizon 2) |
| Impor OCR | ● (parser) | ○ | ○ | ○ | ○ | ◐ (Horizon 3) |
| Pencocokan deskripsi lowongan | ○ | ○ | ○ | ○ | ● | ◐ (Horizon 3) |
| Dapat dihosting sendiri | ● | ● | ● | ● | ? | ● |

**Cara membaca matriks ini:** kolom-kolom yang menjadi alasan proyek ini ada adalah tiga baris bercetak tebal. Di luar itu, kami mengejar paritas, bukan keunggulan. Kami secara sadar menerima posisi lebih lemah pada jumlah template dan kedalaman fitur.

## 5. Analisis celah

### Celah 1 — Mode ATS diperlakukan sebagai tema, bukan sebagai aturan

Setiap alat di atas memperlakukan "ramah ATS" sebagai properti template. Pengguna memilih template ramah ATS, lalu bebas menambahkan apa pun ke dalamnya — termasuk hal yang merusak keramahan itu.

**Tidak ada** yang memperlakukan ATS sebagai *mode* dengan aturan yang berlaku: foto disembunyikan secara paksa, satu kolom dipaksakan, dan pengguna diberi tahu alasannya.

**Ukuran celah:** sedang. Mudah ditiru secara teknis, tetapi membutuhkan pendirian produk yang harus diambil kompetitor secara sadar.

### Celah 2 — Tidak ada yang memahami konteks perekrutan Indonesia

Reactive Resume mendukung banyak bahasa, tetapi itu adalah terjemahan antarmuka. Tidak ada alat yang tahu:

- IPK dituliskan sebagai `3.50 / 4.00`, bukan GPA 3.5/4.0 tanpa skala;
- "menunggu wisuda" adalah status pendidikan yang nyata dan lazim;
- pasfoto adalah norma budaya yang kuat, sehingga menyembunyikannya memerlukan penjelasan, bukan larangan diam-diam;
- BEM, HMJ, KKN, dan asisten praktikum adalah bahan CV yang sah bagi fresh graduate.

**Ukuran celah:** besar. Ini adalah pengetahuan domain, bukan berkas terjemahan. Inilah parit pertahanan kami yang paling dalam.

### Celah 3 — Bantuan penulisan mensyaratkan AI

Bantuan penulisan bergerak ke arah yang sama di seluruh pasar: integrasi AI yang menuntut API key, langganan, atau keduanya. Alat yang benar-benar gratis umumnya hanya menyediakan kotak teks kosong.

Katalog kata kerja aksi statis — dibundel, offline, nol biaya — menempati ruang yang tidak dilayani siapa pun.

**Ukuran celah:** sedang sampai besar. Secara teknis sepele untuk ditiru, tetapi bertentangan dengan arah pasar. Kompetitor cenderung menganggapnya terlalu sederhana untuk dibangun.

### Celah 4 — Local-first tanpa perencanaan ketahanan data

Beberapa alat menyimpan data di localStorage dan berhenti di situ. Tidak ada yang, sejauh yang kami amati, menangani secara serius: pengusiran storage oleh peramban, permintaan storage persisten, peringatan jujur soal perangkat bersama, atau pengingat pencadangan.

Bagi pengguna kami — perangkat bersama, peramban yang sering dibersihkan — ini adalah risiko kehilangan data yang nyata.

**Ukuran celah:** kecil sebagai fitur, besar sebagai pembeda kepercayaan.

## 6. Yang tidak akan kami kejar

Bersikap jujur soal di mana kompetitor lebih unggul menjaga fokus:

| Area | Pemimpin | Sikap kami |
| :-- | :-- | :-- |
| Jumlah template | Reactive Resume, easycv | Dua sampai tiga template yang dipelihara baik mengalahkan dua puluh yang setengah jadi. Serahkan keluasan ke kontribusi komunitas nanti. |
| Kontrol desain bebas | Oh My CV! | Bertentangan dengan pendekatan form terpandu untuk pengguna pemula. |
| Kematangan ekosistem hosting mandiri | Reactive Resume | Kami tanpa backend, jadi hosting mandiri adalah menyalin berkas statis. Cukup. |
| Kedalaman parser CV | OpenResume | Bangun uji ekstraksi teks untuk verifikasi internal, bukan parser lengkap. |
| Keluasan fitur AI | easycv | AI tetap opsional dan sempit secara sengaja. |

## 7. Risiko kompetitif dan mitigasi

| Risiko | Kemungkinan | Mitigasi |
| :-- | :-- | :-- |
| Reactive Resume atau easycv menambahkan lokalisasi Indonesia | Sedang | Kedalaman mengalahkan terjemahan. Bangun pengetahuan konvensi, bukan sekadar berkas bahasa. Bangun hubungan dengan career center kampus. |
| Alat mapan menambahkan toggle ATS/Creative | Sedang | Toggle saja tidak cukup; penegakan aturan plus edukasi kontekstual adalah pembedanya. |
| Builder AI menjadi cukup murah sehingga gratis | Sedang | Posisi kami bukan "lebih murah", melainkan "berfungsi tanpa koneksi dan tidak mengarang". |
| Proyek baru menempati celah yang sama persis | Rendah | Irisan tiga pilar ini sempit. Eksekusi dan kehadiran komunitas yang menentukan. |
| Kami kehabisan tenaga mengejar paritas fitur | **Tinggi** | Risiko terbesar sesungguhnya adalah internal. Non-goals di `vision.md` ada untuk ini. |

## 8. Keterbatasan riset ini

Dicatat secara jujur agar keputusan tidak dibangun di atas dasar yang lebih rapuh dari yang terlihat:

1. **Sebagian besar temuan berasal dari materi pemasaran dan README**, bukan dari pemakaian langsung. Klaim "tidak ada yang punya X" perlu diverifikasi dengan mencoba sendiri.
2. **Tidak ada verifikasi versi.** Proyek bergerak cepat; temuan ini punya tanggal kedaluwarsa.
3. **Tidak ada pengujian ekstraksi teks aktual** pada keluaran PDF kompetitor. Ini pekerjaan yang paling bernilai untuk dilakukan selanjutnya.
4. **Tidak ada riset pengguna.** Kami menyimpulkan celah dari fitur, bukan dari keluhan pengguna nyata. Lihat hipotesis di `problem-statement.md`.
5. **Kompetitor lokal Indonesia belum dipetakan.** Ada aplikasi pembuat CV berbahasa Indonesia di Play Store dan App Store yang belum ditelaah. Ini lubang terbesar dalam riset ini.

## 9. Tindak lanjut riset

Diurutkan menurut nilai per usaha.

| # | Tindakan | Mengapa penting |
| :-- | :-- | :-- |
| R1 | Ekspor CV uji dari OpenResume, Reactive Resume, dan Canva, lalu ekstraksi teksnya (`pdftotext` atau pdf.js). Catat apa yang hilang. | Menjadi dasar faktual bagi seluruh desain mode ATS |
| R2 | Petakan pembuat CV berbahasa Indonesia di Play Store dan App Store | Lubang terbesar dalam riset ini |
| R3 | Kumpulkan 10–20 CV fresh graduate Indonesia nyata | Sumber data untuk micro-copy dan fixture pengujian |
| R4 | Wawancara 3–5 HR atau recruiter Indonesia | Memvalidasi asumsi mode ATS dengan pihak penerima |
| R5 | Coba setiap kompetitor langsung selama 30 menit, catat temuan | Mengganti klaim tak terverifikasi di dokumen ini |
| R6 | Uji apakah kompetitor benar-benar berfungsi offline (mode pesawat) | Memvalidasi kolom PWA pada matriks |

## 10. Kesimpulan

Konsep inti — CV builder local-first tanpa login dengan penyimpanan di peramban — **sudah ada dan matang**. Membangunnya lagi tanpa pembeda akan menjadi pemborosan waktu.

Irisan yang tidak dilayani siapa pun adalah: **penegakan aturan mode ATS + pengetahuan konvensi perekrutan Indonesia + bantuan penulisan yang tetap berguna tanpa AI berbayar.**

Ketiganya harus dikirimkan bersama. Satu saja tanpa dua lainnya menghasilkan produk yang tidak lebih baik daripada apa yang sudah tersedia gratis.

## 11. Dokumen terkait

- `vision.md` — pernyataan posisi
- `problem-statement.md` — kebutuhan pengguna yang mendasari celah ini
- `assumptions-and-constraints.md` — asumsi yang bersumber dari riset ini
- `../01-product/feature-catalog.md` — bagaimana celah diterjemahkan menjadi fitur
