# Deployment Guide — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — prosedur F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |
| Hosting produksi | Vercel — `https://cv4e1.vercel.app` |

---

## 1. Prasyarat

- Bun 1.3.14 (lihat `bun.lock` yang dikomit; CI memakai versi yang sama).
- Tanpa variabel lingkungan yang dibutuhkan saat runtime (aturan — bila
  suatu hari dibutuhkan, itu adalah perubahan arsitektur dan butuh ADR).

## 2. Build dan pengaturan Vercel

```bash
bun install --frozen-lockfile
bun run build   # menghasilkan dist/ — aset statis
```

Pengaturan proyek di dashboard Vercel (konfirmasi sekali, lalu biarkan):

- Framework Preset: Vite (atau kosong + perintah eksplisit di bawah).
- Build Command: `bun run build`.
- Output Directory: `dist`.
- Install Command: `bun install --frozen-lockfile`.
- Deploy otomatis dari `main` setelah gerbang CI lulus; pratinjau per PR
  bila didukung paket hosting.

Seluruh header keamanan dan aturan cache hidup di `vercel.json` root
(berversi bersama kode — bukan klik dashboard yang tak terlacak):

- Header: CSP definitif (`security-requirements.md` §1), HSTS, nosniff,
  Referrer-Policy, Permissions-Policy.
- Cache: `/assets/*` immutable setahun (nama berkas ber-hash);
  `/sw.js`, `/manifest.webmanifest`, `/favicon.svg`, dan `/` wajib
  revalidasi — SW basi mem-pin shell lama (AB-8).

## 3. Deploy

- [x] Salin `dist/` ke hosting statis (ditangani Vercel dari `main`)
- [x] Wajib HTTPS (Vercel bawaan; HSTS dipasang via `vercel.json`)
- [ ] Berfungsi dari subdirektori — **tidak didukung**: Vite `base` adalah
      `/`, sehingga deploy subpath butuh konfigurasi `base` + pengujian
      ulang. Aplikasi didukung di root domain (termasuk domain sendiri §7).

## 4. Header wajib

→ `vercel.json` (terpasang). Verifikasi pasca-deploy:

```bash
curl -sI https://cv4e1.vercel.app | Select-String -Pattern 'content-security-policy|strict-transport|x-content-type|referrer-policy'
curl -sI https://cv4e1.vercel.app/sw.js | Select-String -Pattern 'cache-control'
```

## 5. Aturan caching

→ `vercel.json` (terpasang, dengan alasan per berkas).
**Salah konfigurasi di sini menyebabkan AB-8.**

## 6. Hosting mandiri

- Tanpa backend berarti ini hanya penyajian berkas statis: salin `dist/`
  ke hosting statis mana pun + terapkan header dan cache yang sama dengan
  `vercel.json` sebagai acuan.
- Penyedia AI kustom (`baseUrl` sendiri): lebarkan `connect-src` di level
  host, atau panggilan AI-nya akan diblokir CSP.

## 7. Domain sendiri dan verifikasi

- Domain sudah dimiliki maintainer; aplikasi masih di `cv4e1.vercel.app`.
  Penyambungan = tindakan DNS + pengaturan domain di dashboard Vercel
  (manual, oleh maintainer — tidak bisa dieksekusi dari repo ini).
- Setelah tersambung: ulangi verifikasi §4 di domain sendiri + uji asap
  `release-process.md` §4 di sana.

## 8. Verifikasi

- [ ] Uji asap → `release-process.md` §4
