# Security Requirements — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Content Security Policy
- [ ] Ketat; tanpa `unsafe-inline`, tanpa `unsafe-eval`
- [ ] `default-src 'self'`
- [ ] `connect-src` hanya domain penyedia AI yang disetujui
- [ ] `img-src 'self' blob: data:`
- [ ] TODO: tulis kebijakan lengkap dan uji terhadap seluruh fitur

## 2. Penanganan input
- [ ] Seluruh teks pengguna disanitasi sebelum render
- [ ] **Tidak pernah memakai `dangerouslySetInnerHTML`**
- [ ] URL divalidasi; blokir skema `javascript:`
- [ ] Berkas impor: cek ukuran sebelum parsing, validasi schema sebelum menyentuh state
- [ ] Gambar: cek dimensi dan ukuran sebelum decoding

## 3. Batas
| Hal | Batas | Catatan |
| :-- | :-- | :-- |
| Ukuran berkas impor | TODO | Cegah bom dekompresi |
| Ukuran foto | TODO | Kuota dan memori |
| Dimensi foto | TODO | Cegah bom dekompresi |
| Panjang teks per field | Lihat schema | Sudah ada di JSON Schema |
| Jumlah draft | TODO | Kuota |

## 4. Secret
- [ ] Tanpa secret di repositori, bundel, atau riwayat git
- [ ] Pemindaian secret di CI
- [ ] API key pengguna: memori sesi sebagai bawaan
- [ ] Tanpa secret di log, di build mana pun

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
- [ ] Payload XSS di setiap field teks
- [ ] Payload impor cacat
- [ ] Berkas terlalu besar
- [ ] Prompt injection di deskripsi lowongan
- [ ] Test yang gagal jika ada permintaan jaringan tak terduga saat alur inti
