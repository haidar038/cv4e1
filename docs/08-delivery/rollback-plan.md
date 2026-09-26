# Rollback Plan — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **v1.0 — prosedur F4d (2026-09-26)** |
| Terakhir diperbarui | 2026-09-26 |

> Tanpa server berarti rollback itu mudah **kecuali** untuk satu hal: data yang sudah dimigrasi ada di perangkat pengguna dan tidak bisa di-rollback.

---

## 1. Rollback aset statis (kasus umum)

SW memakai `skipWaiting` + `clientsClaim`: worker baru mengklaim klien
segera dan memangkas cache lama (`src/pwa/sw.ts`). Artinya rollback cukup
mengganti apa yang disajikan host:

```bash
# Opsi A — dashboard Vercel: Deployments → pilih deploy sehat terakhir → Promote to Production.
# Opsi B — git (bila deploy tersambung ke main):
git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z   # cabut tag rusak bila perlu
git revert <commit-rusak> && git push origin main         # deploy ulang dari main sehat
```

Verifikasi setelah rollback (prosedur sama seperti rilis):

1. `curl -sI <URL>/sw.js` → `must-revalidate`, isi = build sehat.
2. Buka aplikasi → uji asap `release-process.md` §4 (minimal: termuat,
   draft lama terbuka, ekspor PDF).
3. Bila pengguna masih melihat versi rusak: instruksikan hard-refresh
   (`Ctrl+Shift+R`) — tercatat di runbook S2.

## 2. Masalah migrasi — risiko utama (putusan F4d)

Setelah `ResumeDocument` pengguna dimigrasi ke versi baru, me-rollback
aplikasi berarti versi lama mungkin tidak bisa membaca data mereka.

**Putusan: tanpa salinan pra-migrasi otomatis.** Alasannya:

- Migrasi bersifat maju-saja, deterministik, teruji dari setiap versi
  (`migration-policy.md`), dan tidak pernah membuang data (field tak dikenal
  → `_unknownFields`, ADR-0009).
- Salinan ganda permanen membebani kuota IndexedDB di perangkat kelas bawah
  — kelompok pengguna yang justru paling dilindungi proyek ini.
- Jaring pengaman yang dipakai sebagai gantinya:
  1. Aturan rilis: migrasi schema tidak pernah dicampur perubahan besar
     (`release-process.md` §3).
  2. Budaya ekspor: pemberitahuan penyimpanan + dorongan ekspor (FR-108/109)
     membuat berkas pemulihan ada di tangan pengguna.
  3. Impor versi lama selalu teruji sebelum rilis (uji asap §4).

Putusan ini bisa dikaji ulang lewat ADR bila bukti baru muncul — bukan lewat
perubahan diam-diam.

## 3. Kriteria rollback

Rollback jika:

- [ ] Data pengguna hilang atau rusak
- [ ] Ekspor PDF rusak
- [ ] Aplikasi gagal dimuat di peramban Tier 1
- [ ] Kerentanan keamanan terkirim ke produksi

## 4. Komunikasi

- Tanpa daftar email pengguna. Saluran: GitHub Release (catatan jujur),
  banner dalam aplikasi, README.
- **Jujur tentang apa yang terjadi dan apa yang tidak bisa diperbaiki.**

## 5. Pemulihan pengguna

- Jika ada pengguna kehilangan data: berkas ekspor mereka adalah satu-satunya
  pemulihan. Pandu mereka mengimpor ulang dari `.cv4e.json` terakhir.
- **Ini alasan mengapa dorongan ekspor itu penting** — jangan pernah
  melemahkan FR-108/109 demi estetika.
