# Deployment Guide — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Prasyarat
- [ ] Versi Node
- [ ] Manajer paket
- [ ] Tanpa variabel lingkungan yang dibutuhkan saat runtime (aturan)

## 2. Build
```bash
npm ci
npm run build   # menghasilkan dist/ — aset statis
```

## 3. Deploy
- [ ] Salin `dist/` ke hosting statis mana pun
- [ ] Harus berfungsi dari root domain maupun subdirektori
- [ ] Wajib HTTPS

## 4. Header wajib
- [ ] Content-Security-Policy → `../06-security/security-requirements.md`
- [ ] Strict-Transport-Security
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy
- [ ] TODO: berkas konfigurasi per penyedia hosting

## 5. Aturan caching
- [ ] Aset dengan hash: cache lama
- [ ] `index.html`: jangan pernah di-cache lama
- [ ] Service worker: jangan pernah di-cache lama
- [ ] **Salah konfigurasi di sini menyebabkan AB-8**

## 6. Hosting mandiri
- [ ] Instruksi bagi siapa pun yang ingin menjalankan sendiri
- [ ] Tanpa backend berarti ini hanya penyajian berkas statis
- [ ] Dokumentasikan penyesuaian CSP jika memakai penyedia AI berbeda

## 7. Verifikasi
- [ ] Uji asap → `release-process.md` §4
