# Deployment Architecture — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Model deployment
Aset statis. Tanpa runtime server. Dapat disajikan dari penyimpanan objek, CDN, atau hosting statis mana pun.

```text
Git push → CI → build → aset statis → hosting statis + CDN
                                            ↓
                                    Peramban pengguna
                                            ↓
                            Service worker meng-cache app shell
```

## 2. Pilihan hosting
- [ ] Kandidat: GitHub Pages, Cloudflare Pages, Netlify, Vercel
- [ ] Syarat: HTTPS, header kustom (CSP), biaya nol, mudah dipindahkan
- [ ] **Syarat mengikat:** harus dapat dipindahkan. Tanpa kunci vendor.
- [ ] TODO: pilih

## 3. Header
- [ ] Content-Security-Policy — ketat; tanpa `unsafe-inline`; `connect-src` hanya untuk penyedia AI yang disetujui
- [ ] Strict-Transport-Security
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy
- [ ] Permissions-Policy
- [ ] TODO: tulis kebijakan lengkap, uji terhadap fitur AI

## 4. Service worker
- [ ] Penamaan cache dan versioning
- [ ] Alur pembaruan: bagaimana pengguna mendapat versi baru
- [ ] **Risiko:** menyajikan bundle basi — lihat `../06-security/threat-model.md`
- [ ] Prompt "Versi baru tersedia"

## 5. Hosting mandiri
- [ ] Instruksi: build, salin `dist/`, sajikan
- [ ] Harus berfungsi dari subdirektori
- [ ] Tanpa variabel lingkungan yang dibutuhkan saat runtime

## 6. Lingkungan
- [ ] Hanya production. Tanpa staging kecuali terbukti dibutuhkan.
- [ ] Pratinjau PR jika hosting mendukung

## 7. Domain
- [ ] TODO: tentukan domain (pertanyaan terbuka Q2)

## 8. Rollback
→ `../08-delivery/rollback-plan.md`
