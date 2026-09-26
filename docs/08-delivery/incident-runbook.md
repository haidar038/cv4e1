# Incident Runbook — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — prosedur F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |

> Tanpa backend, tanpa on-call, tanpa pager. "Insiden" di sini berarti cacat yang sudah terkirim ke pengguna, bukan layanan yang mati.

---

## 1. Klasifikasi insiden

| Tingkat | Definisi | Contoh |
| :-- | :-- | :-- |
| **Kritis** | Kehilangan atau kerusakan data pengguna | Migrasi rusak, autosave gagal diam-diam |
| **Tinggi** | Fitur inti rusak, atau masalah keamanan | Ekspor PDF rusak, XSS, kebocoran data |
| **Sedang** | Fitur non-inti rusak | Fitur AI gagal, satu template rusak |
| **Rendah** | Kosmetik | |

## 2. Skenario dan respons

### S1 — Migrasi menghancurkan data pengguna `KRITIS`

1. Hentikan deploy (jangan push apa pun ke `main`).
2. Publikasikan peringatan (GitHub Release + banner): minta pengguna
   **berhenti membuka aplikasi** sampai diperbaiki (mencegah kerusakan
   berlapis), dan **mengekspor dulu** bila masih bisa dibuka.
3. Reproduksi dari berkas ekspor pengguna (tanpa data server — tidak ada).
4. Perbaiki migrasi + tambah fixture versi pemicu + test → rilis terpisah
   (aturan: rilis migrasi berdiri sendiri).
5. Sediakan alat pemulihan bila memungkinkan (skrip impor-perbaiki).

### S2 — Service worker menyajikan bundle basi `TINGGI`

1. Periksa yang disajikan: `curl -sI <URL>/sw.js` (harus `must-revalidate`)
   dan bandingkan hash dengan build lokal.
2. Bila edge menyajikan basi: periksa `vercel.json` (aturan cache `/sw.js`)
   lalu redeploy.
3. Bila SW di peramban pengguna yang basi: instruksikan hard-refresh
   (`Ctrl+Shift+R`); SW baru memakai `skipWaiting`+`clientsClaim` sehingga
   satu kunjungan segar cukup.
4. → AB-8.

### S3 — Kerentanan keamanan `TINGGI`

1. Nilai dampak: apakah data pengguna terekspos? (Data hidup di perangkat —
   kebocoran berarti XSS/egress, bukan bobol server.)
2. Perbaiki dan rilis segera (kadensi keamanan, `release-process.md` §2).
3. Ungkapkan secara jujur di CHANGELOG + GitHub Release.

### S4 — Ekspor PDF rusak `TINGGI`

1. Fitur inti = pemblokir. Konfirmasi di Tier 1 (matriks peramban).
2. Sementara: arahkan ke mode satunya (ATS ↔ Creative) bila hanya satu
   pipeline yang rusak; sarankan ekspor JSON sebagai cadangan.
3. Perbaiki → uji ekstraksi teks → rilis.

### S5 — Kompromi dependensi `TINGGI`

1. Audit apa yang terkirim: `bun audit`, bandingkan `bun.lock` dengan
   commit sehat terakhir (`git diff <tag-sehat> bun.lock`).
2. Hapus atau sematkan versi; `bun install --frozen-lockfile` di CI
   menolak drift diam-diam.
3. Ungkapkan di CHANGELOG bila versi terkirim ke pengguna.

## 3. Komunikasi

- Tanpa daftar email pengguna. Saluran: GitHub, banner dalam aplikasi, komunitas.
- **Jujur tentang apa yang terjadi dan apa yang tidak bisa kami perbaiki**

## 4. Post-mortem

- Tanpa menyalahkan.
- Setiap insiden menambah minimal satu test.
- Perbarui threat model jika relevan.
