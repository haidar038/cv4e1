# Acceptance Criteria — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v0.2 — lengkap untuk seluruh FR/NFR per 2026-09-20** |
| Terakhir diperbarui | 2026-09-20 |

> Kondisi yang dapat diuji untuk setiap requirement. Format Given/When/Then.
> Setiap AC harus dapat dipetakan ke minimal satu test otomatis.
> Kolom pemetaan AC → test ada di `traceability-matrix.md`.

## Aturan penulisan AC

- Satu perilaku yang dapat diamati per AC.
- Tanpa istilah subjektif ("cepat", "mudah", "jelas") kecuali disertai ambang.
- Sertakan jalur kegagalan, bukan hanya jalur bahagia.
- Sertakan invariant untuk fitur AI, bukan perbandingan string persis.
- AC untuk fitur yang belum dibangun tetap ditulis sebagai kontrak — status pelaksanaannya
  dilacak di `traceability-matrix.md`, bukan di sini.

---

## FR-0xx — Model data dan rendering

```gherkin
AC-001-a  (FR-001: satu model kanonik untuk dua mode)
  Given ResumeDocument terisi (pendidikan, pengalaman, proyek, foto)
  When draft yang sama dirender pada mode ATS lalu pada mode Creative
  Then kedua keluaran memuat nilai field yang sama dari model sumber
  And tidak ada data yang hanya hadir di salah satu mode

AC-001-b  (FR-001: perubahan menyatu ke kedua mode)
  Given draft terbuka pada salah satu mode
  When sebuah field diubah
  Then render ulang pada mode mana pun menampilkan nilai baru
  And tidak ada salinan data kedua yang perlu disinkronkan

AC-002-a  (FR-002: foto disembunyikan pada renderer ATS)
  Given draft dengan foto profil terpasang
  When pengguna beralih ke mode ATS
  Then ATSViewModel tidak memiliki field foto sama sekali
  And keluaran render ATS tidak memuat elemen img
  And foto tetap ada di dalam ResumeDocument yang tersimpan
  And pengguna melihat penjelasan mengapa foto disembunyikan

AC-003-a  (FR-003: pindah mode tidak menyentuh data sumber)
  Given draft dengan data terisi dan foto terpasang
  When mode diubah ATS → Creative → ATS
  Then dokumen yang tersimpan identik dengan sebelum perpindahan
  And satu-satunya field yang berubah adalah meta.mode

AC-003-b  (FR-003: mode disimpan per draft)
  Given dua draft dengan mode berbeda
  When pengguna beralih A → B → A
  Then draft A kembali pada mode tersimpannya sendiri

AC-004-a  (FR-004: renderer ATS satu kolom)
  Given resume dengan section jamak
  When draft dirender pada mode ATS
  Then seluruh konten berada dalam satu kolom linear
  And urutan baca dokumen sama dengan urutan visual

AC-004-b  (FR-004: template tidak dapat menambah kolom di ATS)
  Given template dengan tata letak dua kolom
  When mode ATS aktif
  Then keluaran tetap satu kolom
  And tata letak kolom template hanya berlaku pada mode Creative

AC-005-a  (FR-005: renderer ATS tanpa tabel untuk struktur inti)
  Given draft terisi penuh
  When draft dirender pada mode ATS
  Then keluaran tidak memuat elemen table untuk section inti

AC-006-a  (FR-006: section kosong diabaikan kedua mode)
  Given section tanpa isi sama sekali
  When draft dirender pada mode ATS atau Creative
  Then section tersebut tidak muncul — tidak ada heading kosong

AC-006-b  (FR-006: pengosongan section di tengah sesi)
  Given section yang tadinya terisi
  When seluruh isinya dihapus pengguna
  Then heading section menghilang dari keluaran
  And section lain tetap utuh

AC-007-a  (FR-007: urutan sumber dipertahankan)
  Given daftar pengalaman dengan urutan A, B, C
  When draft dirender pada kedua mode
  Then keluaran menghadirkan A, B, C pada urutan yang sama

AC-008-a  (FR-008: aturan mode menang atas template)
  Given template yang mendeklarasikan dua kolom dan menampilkan foto
  When mode ATS aktif
  Then keluaran tetap satu kolom dan tanpa foto
  And tidak ada jalur konfigurasi template yang menimpanya
```

## FR-1xx — Persistence dan portabilitas

```gherkin
AC-101-a  (FR-101: draft lokal tanpa akun)
  Given peramban tanpa akun terdaftar
  When draft dibuat dan diedit
  Then data tersimpan di IndexedDB perangkat ini
  And tidak ada formulir akun, login, atau email yang muncul
  And tidak ada permintaan jaringan yang terkirim

AC-101-b  (FR-101: storage tidak tersedia)
  Given penyimpanan diblokir peramban
  When draft dibuat dan diedit
  Then draft tetap dapat diedit dari memori
  And status penyimpanan diberitahukan kepada pengguna (lihat FR-111)

AC-102-a  (FR-102: autosave tanpa tindakan eksplisit)
  Given draft terbuka
  When sebuah field diubah tanpa menekan tombol simpan
  Then perubahan tersimpan otomatis ke IndexedDB
  And indikator status menampilkan siklus Menyimpan… → Tersimpan

AC-102-b  (FR-102: autosave bertahan tutup tab)
  Given perubahan telah terautosave
  When tab ditutup lalu dibuka kembali
  Then perubahan terakhir yang terautosave tersedia

AC-103-a  (FR-103: beberapa draft terpisah)
  Given satu draft aktif terisi
  When draft kedua dibuat
  Then keduanya tersimpan dengan identitas sendiri
  And isi draft pertama tidak berubah

AC-103-b  (FR-103: beralih antar draft)
  Given dua draft dengan isi berbeda
  When pengguna beralih antar keduanya
  Then masing-masing menampilkan isinya sendiri

AC-104-a  (FR-104: ekspor JSON)
  Given draft terisi
  When pengguna mengekspor draft
  Then unduhan berupa envelope .cv4e.json dengan schemaVersion yang valid

AC-104-b  (FR-104: round-trip)
  Given hasil ekspor sebuah draft
  When berkas itu diimpor kembali
  Then dokumen yang dihasilkan identik dengan sumbernya

AC-105-a  (FR-105: impor JSON valid)
  Given berkas ekspor yang valid
  When berkas diimpor
  Then draft baru dibuat dengan isi berkas
  And draft aktif yang sudah ada tidak berubah

AC-105-b  (FR-105: impor envelope versi lama)
  Given envelope dengan schemaVersion lama yang masih didukung
  When berkas diimpor
  Then isinya dimigrasi ke versi kini tanpa kehilangan data (lihat FR-107)

AC-106-a  (FR-106: impor bukan JSON)
  Given berkas yang bukan JSON
  When berkas diimpor
  Then pesan error dapat dipahami — bukan stack trace mentah
  And draft aktif tetap utuh

AC-106-b  (FR-106: struktur tidak dikenal atau versi lebih baru)
  Given JSON dengan struktur tidak dikenal, atau schemaVersion lebih baru dari aplikasi
  When berkas diimpor
  Then alasan kegagalan yang spesifik ditampilkan
  And tidak ada draft baru yang dibuat

AC-107-a  (FR-107: migrasi tanpa kehilangan data)
  Given envelope dari setiap versi lama yang didukung
  When envelope dimuat atau diimpor
  Then setiap field lama hadir di dokumen hasil
  And tidak ada field yang hilang atau dikosongkan oleh migrasi

AC-107-b  (FR-107: downgrade tidak dilakukan)
  Given envelope dengan schemaVersion lebih baru dari aplikasi
  When envelope dimuat
  Then dokumen tidak dimigrasi turun dan tidak ditimpa
  And pengguna menerima penjelasan versi yang tidak didukung

AC-108-a  (FR-108: hapus seluruh data lokal)
  Given draft dan asset tersimpan
  When pengguna memilih hapus semua dan mengonfirmasi
  Then IndexedDB (drafts dan assets) kosong
  And tidak ada sisa resume yang dapat dimuat lagi

AC-109-a  (FR-109: pemberitahuan penyimpanan lokal)
  Given pengguna membuka aplikasi
  When antarmuka utama tampil
  Then pemberitahuan bahwa data hanya tersimpan di perangkat ini terlihat

AC-110-a  (FR-110: tanpa API key di ekspor — kondisi kini)
  Given aplikasi tanpa API key apa pun
  When ekspor mana pun dibuat
  Then berkas hasil tidak memuat kunci, token, atau kredensial

AC-110-b  (FR-110: tanpa API key di ekspor — saat key pertama ada, Fase 2)
  Given API key berada di memori sesi
  When ekspor mana pun dibuat
  Then kunci tidak ada di dalam payload ekspor

AC-111-a  (FR-111: storage diblokir tetap dapat dipakai)
  Given penyimpanan diblokir (mis. mode privat)
  When aplikasi dibuka dan draft diedit
  Then aplikasi tetap berfungsi dari memori
  And status penyimpanan diberitahukan dengan penjelasan yang jelas

AC-111-b  (FR-111: kuota terlampaui)
  Given kuota penyimpanan terlampaui saat autosave
  When penyimpanan gagal
  Then draft aktif di memori tetap utuh
  And kegagalan dilaporkan tanpa kehilangan teks yang sedang diketik
```

## FR-2xx — Panduan dan lokalisasi

```gherkin
AC-201-a  (FR-201: saran format IPK beserta skala)
  Given kolom IPK pada locale id
  When pengguna menulis nilai tanpa skala
  Then saran format kanonik dengan skala tampil sebagai bantuan
  And bantuan itu bukan error — penyimpanan tidak diblokir

AC-202-a  (FR-202: pilihan status pendidikan Indonesia)
  Given pemilih status pendidikan pada locale id
  When pemilih dibuka
  Then pilihan memuat status konteks Indonesia — termasuk menunggu wisuda
  And setiap pilihan menyertakan contoh penulisan

AC-203-a  (FR-203: alasan foto disembunyikan)
  Given foto terpasang dan mode ATS aktif
  When permukaan foto tampil
  Then penjelasan alasan disembunyikan terlihat
  And teksnya berupa bantuan, bukan kegagalan
  And foto tetap tersimpan untuk mode Creative

AC-204-a  (FR-204: micro-copy Indonesia hanya pada locale id)
  Given locale bukan id
  When form pendidikan tampil
  Then micro-copy khusus Indonesia tidak tampil
  And label standar tetap ada

AC-204-b  (FR-204: micro-copy Indonesia aktif pada locale id)
  Given locale id
  When form pendidikan tampil
  Then micro-copy khusus Indonesia tampil

AC-205-a  (FR-205: saran kata kerja aksi per section)
  Given section pengalaman terbuka
  When pengguna meminta saran kata kerja
  Then saran berasal dari katalog yang dikurasi untuk section itu
  And section berbeda mendapat daftar yang sesuai konteksnya

AC-206-a  (FR-206: saran kata kerja bekerja offline)
  Given tanpa koneksi jaringan
  When saran kata kerja diminta
  Then saran tetap tampil dari katalog lokal
  And tidak ada permintaan jaringan yang terkirim
```

## FR-3xx — Keluaran

```gherkin
AC-301-a  (FR-301: PDF mengikuti mode aktif)
  Given mode ATS aktif
  When pengguna mengekspor PDF
  Then hasil mencerminkan pratinjau mode ATS
  And bukan pratinjau mode lain

AC-301-b  (FR-301: PDF mode Creative)
  Given mode Creative aktif
  When pengguna mengekspor PDF
  Then hasil mencerminkan pratinjau mode Creative

AC-302-a  (FR-302: teks PDF ATS dapat diekstraksi)
  Given PDF hasil ekspor mode ATS
  When teks PDF diekstraksi
  Then seluruh konten resume hadir sebagai teks yang dapat diseleksi
  And tidak ada halaman yang berupa gambar hasil rasterisasi

AC-303-a  (FR-303: teks PDF Creative dapat diekstraksi)
  Given PDF hasil ekspor mode Creative
  When teks PDF diekstraksi
  Then konten utama resume hadir sebagai teks yang dapat diekstraksi

AC-304-a  (FR-304: ekspor PDF tanpa API eksternal)
  Given tanpa koneksi jaringan
  When pengguna mengekspor PDF
  Then PDF selesai dibuat
  And tidak ada permintaan keluar-origin selama ekspor
```

## FR-4xx — AI opsional

```gherkin
AC-401-a  (FR-401: tanpa persetujuan, dokumen tidak berubah)
  Given saran AI sedang ditampilkan
  When pengguna tidak menekan Terapkan
  Then ResumeDocument tidak berubah — saran hanyalah kandidat

AC-401-b  (FR-401: terapkan hanya yang disetujui)
  Given saran AI ditampilkan
  When pengguna menekan Terapkan
  Then hanya perubahan yang disetujui yang masuk ke dokumen

AC-402-a  (FR-402: persetujuan eksplisit sebelum kirim data)
  Given pengguna meminta operasi AI
  When operasi akan mengirim data ke penyedia AI
  Then dialog persetujuan eksplisit tampil sebelum pengiriman
  And tanpa persetujuan, tidak ada permintaan jaringan yang terkirim

AC-403-a  (FR-403: fallback non-AI untuk setiap kapabilitas)
  Given AI tidak tersedia — tanpa koneksi, tanpa kunci, atau dimatikan
  When kapabilitas dipakai
  Then jalur non-AI menghasilkan keluaran yang dapat dipakai
  And fitur tetap dapat diselesaikan dari awal sampai akhir

AC-404-a  (FR-404: keluaran AI divalidasi terhadap schema)
  Given respons AI yang tidak sesuai schema
  When respons diproses
  Then respons ditolak seluruhnya
  And pengguna melihat pesan kegagalan
  And draft tidak berubah

AC-405-a  (FR-405: tanpa fakta yang dikarang — invariant)
  Given input tanpa angka, nama pemberi kerja, atau entitas tertentu
  When pengguna meminta saran AI
  Then tidak ada keluaran yang memuat angka atau entitas yang tidak ada pada input
  And dampak yang tidak diketahui disajikan sebagai placeholder terukur
  And pemeriksaan dilakukan terhadap invariant, bukan pencocokan string persis

AC-406-a  (FR-406: kegagalan penyedia tidak merusak draft)
  Given operasi AI berjalan
  When penyedia mengalami timeout atau error
  Then draft tetap utuh dan dapat terus diedit
  And kegagalan dilaporkan tanpa kehilangan data

AC-407-a  (FR-407: API key hanya ke penyedia terpilih)
  Given API key berada di memori sesi
  When operasi AI berjalan
  Then kunci hanya terkirim ke penyedia yang dipilih pengguna
  And tidak ada tujuan jaringan lain yang menerima kunci

AC-408-a  (FR-408: status AI tidak tersedia disertai alasan)
  Given kapabilitas AI tidak tersedia
  When antarmuka kapabilitas itu tampil
  Then status tidak tersedia terlihat
  And alasannya dapat ditindaklanjuti oleh pengguna
```

## FR-5xx — Impor CV (Fase 3)

```gherkin
AC-501-a  (FR-501: hasil ekstraksi ditinjau sebelum disimpan)
  Given CV lama diunggah untuk ekstraksi
  When hasil ekstraksi siap
  Then hasil ditampilkan untuk ditinjau
  And tidak ada penyimpanan sebelum pengguna meninjaunya

AC-502-a  (FR-502: ekstraksi tidak menyentuh resume final)
  Given hasil ekstraksi ditampilkan
  When pengguna belum menyetujui
  Then resume final tidak berubah
```

## FR-6xx — Penyesuaian lowongan (Fase 3, ADR-0011)

```gherkin
AC-601-a  (FR-601: hasil penyesuaian ditinjau sebelum ada perubahan)
  Given deskripsi lowongan ditempel pada satu section
  When hasil penyesuaian siap
  Then kata kunci didukung/belum, section yang perlu diperkuat, dan
    pertanyaan klarifikasi ditampilkan untuk ditinjau
  And tidak ada perubahan pada draft sebelum dan sesudah tinjauan

AC-602-a  (FR-602: tanpa skill/fakta baru, tanpa mutasi langsung)
  Given hasil penyesuaian ditampilkan
  When pengguna meninjau seluruh daftar
  Then tidak ada tombol atau aksi yang menulis ke resume final
  And setiap kata kunci yang dikutip cocok dengan input sumbernya

AC-603-a  (FR-603: deskripsi lowongan transien)
  Given sesi penyesuaian selesai atau dibatalkan
  When draft disimpan, dimuat ulang, diekspor, atau dihapus total
  Then teks lowongan tidak ditemukan di storage mana pun

AC-604-a  (FR-604: fallback statis offline)
  Given jaringan dimatikan dan tanpa kunci AI
  When deskripsi lowongan dianalisis
  Then daftar celah kata kunci tetap tampil dari pencocokan statis
```

## NFR — Non-functional

```gherkin
AC-NFR-001-a  (NFR-001: fitur inti offline setelah app shell terpasang)
  Given app shell terpasang dan jaringan diputus
  When fitur inti dipakai — edit, autosave, ekspor JSON, saran kata kerja
  Then semuanya berfungsi tanpa internet
  And tidak ada permintaan jaringan yang terkirim

AC-NFR-002-a  (NFR-002: tanpa egress data resume saat offline)
  Given mode offline
  When seluruh alur inti dijalankan
  Then tidak ada permintaan jaringan yang terkirim

AC-NFR-002-b  (NFR-002: egress hanya dengan persetujuan per operasi — Fase 2)
  Given fitur AI aktif
  When data resume akan keluar perangkat
  Then pengiriman hanya terjadi setelah persetujuan eksplisit untuk operasi itu
  And operasi lain tidak mewarisi persetujuan sebelumnya

AC-NFR-003-a  (NFR-003: PDF tanpa API eksternal)
  Given tanpa API eksternal dan tanpa koneksi
  When ekspor PDF dijalankan
  Then PDF dihasilkan sepenuhnya di perangkat
  (kontrak sama dengan AC-304-a)

AC-NFR-004-a  (NFR-004: fallback non-AI wajib)
  Given setiap kapabilitas AI yang ada
  When AI dinonaktifkan
  Then kapabilitas tetap dapat diselesaikan lewat jalur non-AI
  (kontrak sama dengan AC-403-a)

AC-NFR-005-a  (NFR-005: dapat dioperasikan penuh dengan keyboard)
  Given pengguna hanya memakai keyboard
  When seluruh alur inti dijalankan — navigasi section, isi form, reorder, simpan
  Then setiap kontrol dapat dijangkau dan dioperasikan
  And tidak ada jebakan fokus

AC-NFR-006-a  (NFR-006: tanpa secret di build produksi)
  Given build produksi pada dist/
  When check:privacy dijalankan
  Then tidak ada literal berbentuk kredensial di berkas keluaran
  And bila ada, gate gagal dengan pola yang disebut dan kutipan yang disensor

AC-NFR-006-b  (NFR-006: pemeriksaan bagian dari verify)
  Given repository pada kondisi apa pun
  When bun run verify atau CI berjalan
  Then check:privacy dijalankan setelah build dan kegagalannya menggagalkan verify

AC-NFR-007-a  (NFR-007: WCAG 2.2 AA)
  Given halaman utama dan form terpandu pada build produksi
  When audit axe dengan tag WCAG 2.0/2.1/2.2 A+AA dijalankan — desktop dan 360 px
  Then tidak ada pelanggaran yang dilaporkan

AC-NFR-008-a  (NFR-008: anggaran performa app shell)
  Given baseline bundle tercatat
  When check:budget dijalankan
  Then setiap metrik tidak melebihi baseline × 1,10
  And pelanggaran menggagalkan verify dengan metrik yang disebut

AC-NFR-009-a  (NFR-009: tanpa skrip pihak ketiga saat runtime)
  Given alur inti pada build produksi
  When halaman dimuat dan digunakan
  Then tidak ada permintaan ke origin selain origin aplikasi
  And tidak ada skrip pihak ketiga yang dieksekusi

AC-NFR-010-a  (NFR-010: matriks dukungan peramban)
  Given matriks dukungan yang berlaku
  When suite e2e dijalankan
  Then lulus di setiap peramban matriks — saat ini Chromium dan Firefox

AC-NFR-011-a  (NFR-011: data resume tidak pernah masuk log)
  Given seluruh sumber produk
  When check:privacy mengaudit pemanggilan console
  Then setiap pemanggilan adalah pesan tetap dalam allowlist
  And pemanggilan dengan interpolasi atau variabel menggagalkan gate

AC-NFR-011-b  (NFR-011: bukti runtime)
  Given alur inti dengan data terisi
  When alur dijalankan pada build produksi
  Then tidak ada isi resume yang muncul pada konsol

AC-NFR-012-a  (NFR-012: aset statis tanpa runtime server)
  Given keluaran build pada dist/
  When disajikan sebagai aset statis
  Then aplikasi berfungsi penuh tanpa runtime server

AC-NFR-013-a  (NFR-013: kehilangan data maksimum satu interval autosave)
  Given perubahan telah terautosave
  When aplikasi crash atau tab dimuat ulang secara paksa
  Then maksimum kehilangan adalah perubahan sejak autosave terakhir

AC-NFR-014-a  (NFR-014: pembesaran teks 200%)
  Given pembesaran teks peramban 200%
  When seluruh alur inti dijalankan
  Then tidak ada konten yang hilang dan fokus tetap terlihat
  (diverifikasi manual saat ini; test otomatis menyusul)

AC-NFR-015-a  (NFR-015: font dibundel, bukan CDN)
  Given halaman dimuat tanpa koneksi
  When font dirender
  Then font berasal dari bundel lokal
  And tidak ada permintaan font ke CDN
```
