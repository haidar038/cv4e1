# Threat Model — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> **"Tanpa server" tidak berarti "tanpa risiko".** Data resume adalah PII, dan ia berada di peramban pengguna.
> Tinjau ulang pada setiap perubahan desain, bukan sekali di awal proyek.

---

## 1. Aset yang dilindungi
| Aset | Mengapa berharga |
| :-- | :-- |
| Data resume | PII: nama, kontak, riwayat pendidikan dan kerja |
| Foto profil | Data biometrik ringan; PII |
| API key pengguna | Nilai finansial langsung bagi penyerang |
| Draft lokal | Hasil kerja pengguna; kehilangannya adalah kerusakan nyata |
| Integritas aplikasi | Bundle yang dikompromikan dapat mengeksfiltrasi semua yang di atas |

## 2. Batas kepercayaan
- [ ] **Perangkat dan peramban pengguna** — batas kepercayaan utama. Kami tidak bisa melindungi dari perangkat yang sudah dikompromikan; katakan itu dengan jujur.
- [ ] **Berkas yang diimpor** — tidak tepercaya sampai divalidasi
- [ ] **Teks yang ditempel pengguna** (deskripsi lowongan) — tidak tepercaya
- [ ] **Penyedia AI** — eksternal, opsional
- [ ] **Hosting dan CDN** — menyajikan kode kami; kompromi di sini berarti kompromi total

## 3. Matriks ancaman

| Aset | Ancaman | Mitigasi | Status |
| :-- | :-- | :-- | :-- |
| Data resume | Dibaca skrip berbahaya | CSP ketat, audit dependensi, minimalkan skrip pihak ketiga | ⬜ |
| Data resume | Bocor lewat cache peramban | Dokumentasikan; batasi cache; sediakan wipe | ⬜ |
| API key pengguna | Dicuri lewat XSS | Jangan simpan sebagai bawaan; peringatan BYO-key; memori sesi | ⬜ |
| API key pengguna | Ikut terbawa ekspor | **Dilarang secara schema**; diuji | ⬜ |
| Foto profil | Bocor lewat ekspor atau cache | Dokumentasikan perilaku ekspor; sediakan wipe | ⬜ |
| Draft lokal | Terhapus pembersihan peramban | Dorongan ekspor, storage persisten, peringatan jujur | ⬜ |
| Permintaan AI | PII terkirim ke penyedia | Persetujuan, minimisasi data, pemberitahuan privasi | ⬜ |
| PDF | Tata letak salah menghasilkan berkas tidak terpakai | Regresi visual + uji ekstraksi teks | ⬜ |
| Impor JSON | Payload berbahaya atau cacat | Validasi schema, batas ukuran, sanitasi | ⬜ |
| Impor JSON | Bom dekompresi / berkas raksasa | Batas ukuran sebelum parsing | ⬜ |
| Impor gambar | Bom dekompresi | Batas dimensi dan ukuran sebelum decoding | ⬜ |
| Service worker | Menyajikan bundle basi | Cache berversi, alur pembaruan eksplisit | ⬜ |
| Rantai pasok | Dependensi yang dikompromikan | Lockfile, audit, jumlah dependensi minimal | ⬜ |
| Teks lowongan | Prompt injection | Sanitasi, perlakukan sebagai data bukan instruksi, uji | ⬜ |
| XSS lewat field CV | Skrip di summary atau link | Sanitasi saat render, jangan pernah `dangerouslySetInnerHTML` | ⬜ |

## 4. Di luar cakupan
- [ ] Perangkat yang sudah dikompromikan (malware, keylogger)
- [ ] Ekstensi peramban berbahaya
- [ ] Akses fisik ke perangkat tidak terkunci
- [ ] Kebijakan penyimpanan data penyedia AI

**Katakan hal ini secara jujur kepada pengguna. Jangan menyiratkan perlindungan yang tidak kami berikan.**

## 5. Kapan ditinjau ulang
- [ ] Menambah penyedia AI apa pun
- [ ] Menambah dependensi runtime
- [ ] Mengubah lapisan penyimpanan
- [ ] Menambah kemampuan impor apa pun
- [ ] Sebelum setiap rilis mayor
