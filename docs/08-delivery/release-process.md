# Release Process — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — prosedur F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |
| Hosting | Vercel, `https://cv4e1.vercel.app` (domain sendiri sudah ada, penyambungan DNS manual — lihat `deployment-guide.md` §7) |

---

## 1. Versioning

- Aplikasi memakai Semver (`package.json`): rilis publik pertama yang
  diusulkan adalah **v0.1.0**. Angka mayor `0` berarti API/format masih boleh
  berubah antar rilis minor — kompatibilitas data dijamin oleh rantai migrasi,
  bukan oleh angka versi aplikasi.
- **Versi schema terpisah dari versi aplikasi** — keduanya bergerak sendiri.
  Naiknya versi aplikasi tidak berarti schema berubah; naiknya schema selalu
  disebut eksplisit di `CHANGELOG.md`.
- Kepada pengguna, yang ditampilkan adalah versi aplikasi + tanggal rilis.
  Versi schema tidak ditampilkan di UI (hanya di dalam berkas `.cv4e.json`).

## 2. Kadensi

- Berbasis fase, bukan tanggal (proyek satu orang).
- Perbaikan keamanan dirilis segera, mengikuti `incident-runbook.md` S3.

## 3. Langkah rilis (dieksekusi berurutan, tanpa lompatan)

```bash
# 1. Bekukan main: tidak ada merge selain perbaikan pemblokir rilis.
# 2. Gerbang penuh lokal (wajib hijau semua):
bun run verify
# 3. Suite e2e penuh, serial (pola flake paralel → workers=1):
node node_modules/@playwright/test/cli.js test --workers=1
# 4. Uji lintas-peramban periodik (prosedur browser-device-matrix.md §6):
#    - WebKit desktop + emulasi Pixel 5 untuk subset inti
#    - Uji fisik di perangkat acuan bila tersedia
# 5. Jalankan production-checklist.md sampai habis.
# 6. Perbarui CHANGELOG.md (aturan §5) dan tandai versi di package.json.
git add -A && git commit -m "chore(release): vX.Y.Z" && git tag vX.Y.Z
# 7. Push (keputusan maintainer — tidak pernah otomatis):
git push origin main --tags
# 8. Deploy: sinkronisasi Vercel dari main (konfirmasi pengaturan di
#    deployment-guide.md §2); verifikasi header + cache via §4 di bawah.
# 9. Uji asap §4 di URL produksi. Bila gagal → rollback-plan.md.
# 10. Terbitkan GitHub Release dengan catatan dari CHANGELOG.md.
```

Aturan yang tidak bisa ditawar (dari `rollback-plan.md`):

- **Jangan pernah merilis migrasi schema dan perubahan besar lain di rilis
  yang sama.** Rilis migrasi berdiri sendiri agar rollback selalu aman.

## 4. Uji asap setelah rilis (di URL produksi)

| Pemeriksaan | Perintah / cara | Mengapa |
| :-- | :-- | :-- |
| Aplikasi termuat | Buka URL, `#root` terisi | Jelas |
| Header keamanan terpasang | `curl -sI <URL> \| Select-String 'content-security-policy\|strict-transport'` | CSP/HSTS dari `vercel.json` |
| SW tidak basi | `curl -sI <URL>/sw.js` → `cache-control: .*must-revalidate`; bandingkan isi dengan build lokal | AB-8 |
| Draft lama masih terbuka | Buka dengan profil berisi draft versi sebelumnya | **Paling penting** — migrasi rusak = kehilangan data |
| Impor berkas ekspor versi lama | Impor `.cv4e.json` dari rilis sebelumnya | Kompatibilitas |
| Ekspor PDF berfungsi | Cetak → PDF → teks terekstraksi | Fitur inti |
| Offline setelah reload | Muat → matikan jaringan → reload → draft ada | Fitur inti |
| Tautan source ada | Cari tautan repositori dari aplikasi + landing | Kewajiban keterbukaan AGPL |

## 5. CHANGELOG

- Ditulis untuk pengguna (Bahasa Indonesia), bukan untuk pengembang.
- Selalu sebutkan perubahan schema.
- Selalu sebutkan bila ekspor lama terdampak.

## 6. Komunikasi

- Rilis GitHub (catatan = isi `CHANGELOG.md` versi itu).
- Banner dalam aplikasi untuk perubahan yang memengaruhi data pengguna
  (migrasi schema, perubahan format ekspor).
- Tanpa email pengguna (tidak ada daftar) — GitHub + banner + README.
