# Security Requirements — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Content Security Policy

Kebijakan definitif F4c (2026-09-26), diturunkan dari inspeksi build
`dist/` + ADR-0010. Kompatibilitas terverifikasi: tanpa skrip/style inline
di `dist/index.html`, tanpa `eval`/`new Function` di JS terkirim, font
hanya lokal.

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval';
  worker-src 'self' https://cdn.jsdelivr.net blob:;
  connect-src 'self' https://cdn.jsdelivr.net https://api.groq.com;
  img-src 'self' blob: data:;
  font-src 'self';
  style-src 'self' 'unsafe-inline';
  object-src 'none';
  base-uri 'self';
  form-action 'none';
  frame-ancestors 'none';
  upgrade-insecure-requests
```

Alasan tiap baris: `cdn.jsdelivr.net` = runtime OCR berversi yang di-pin
(ADR-0010: worker + inti WASM + traineddata); `'wasm-unsafe-eval'` untuk
inti WASM Tesseract (tanpa itu WASM tidak dikompilasi; `'unsafe-eval'`
penuh tidak dibutuhkan); `api.groq.com` = provider bawaan; `blob:`/`data:`
untuk pratinjau foto; `'unsafe-inline'` pada style saja karena komponen
memakai atribut `style` React (bukan vektor ekfiltrasi kelas skrip);
`frame-ancestors 'none'` karena aplikasi memegang PII.

- [x] Ketat; tanpa `unsafe-inline` (skrip), tanpa `unsafe-eval`
- [x] `default-src 'self'`
- [x] `connect-src` hanya domain yang disetujui (Groq + CDN OCR)
- [x] `img-src 'self' blob: data:`
- [x] Kebijakan lengkap tertulis di atas; kompatibilitas build terverifikasi
- [ ] Pemasangan header per hosting — menunggu keputusan hosting (Q2);
      penyedia AI kustom (`baseUrl` sendiri) wajib melebarkan `connect-src`
      di level host (`deployment-guide.md` §6). Header lebih diutamakan
      daripada `<meta>` (`frame-ancestors` diabaikan di meta).

## 2. Penanganan input
- [x] Seluruh teks pengguna disanitasi sebelum render — React escaping +
      gerbang skema link `SafeLink` (`src/render/SafeLink.tsx`, F4c)
- [x] **Tidak pernah memakai `dangerouslySetInnerHTML`** (dipindai, nol temuan)
- [x] URL divalidasi; skema non-http(s) tidak pernah menjadi klik
      (`src/core/safe-url.ts`, diuji `safe-url.test.ts` + `xss-payload.test.tsx`)
- [x] Berkas impor: cek ukuran sebelum parsing, validasi schema sebelum menyentuh state
- [x] Gambar: cek dimensi dan ukuran sebelum decoding

## 3. Batas
| Hal | Batas | Catatan |
| :-- | :-- | :-- |
| Ukuran berkas impor | TODO | Cegah bom dekompresi |
| Ukuran foto | TODO | Kuota dan memori |
| Dimensi foto | TODO | Cegah bom dekompresi |
| Panjang teks per field | Lihat schema | Sudah ada di JSON Schema |
| Jumlah draft | TODO | Kuota |

## 4. Secret
- [x] Tanpa secret di repositori, bundel, atau riwayat git (F4c: pindai riwayat
      9,4 MB — hanya nilai fiktif `gsk-test-key` di test; `check:privacy` hijau)
- [x] Pemindaian secret di CI (`check:privacy` di job `verify`)
- [x] API key pengguna: memori sesi sebagai bawaan (`session-keys.ts`,
      tanpa API persistensi; test membuktikan absen dari ekspor)
- [x] Tanpa secret di log, di build mana pun (NFR-011 allowlist console)

## 5. Ketergantungan
→ `dependency-policy.md`

## 6. Transport
- [ ] Hanya HTTPS
- [ ] HSTS
- [ ] Subresource integrity jika ada aset eksternal (seharusnya tidak ada)

## 7. Service worker
- [ ] Cache berversi
- [ ] Alur pembaruan eksplisit
- [ ] Jangan pernah meng-cache respons penyedia AI

## 8. Pengujian
- [x] Payload XSS di setiap field teks (`src/render/xss-payload.test.tsx`, F4c)
- [x] Payload impor cacat (round-trip + malformed + oversize + unknown-fields)
- [x] Berkas terlalu besar
- [x] Prompt injection di deskripsi lowongan (set tolak tailoring + probe AB-3/AB-4)
- [x] Test yang gagal jika ada permintaan jaringan tak terduga saat alur inti (`no-egress.spec.ts` + sebaran off-origin per spec)
