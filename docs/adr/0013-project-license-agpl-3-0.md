# ADR-0013: Lisensi proyek — AGPL-3.0

- **Status:** Accepted (2026-09-26 — diputus maintainer; audit lisensi + pembaruan referensi Q1 dikerjakan sebagai F4f)
- **Date:** 2026-09-26
- **Decision owner:** Maintainer proyek
- **Related:** Q1 (`docs/00-project-context/vision.md` §12), `README.md` (§License EN/ID), `docs/06-security/dependency-policy.md` §3, `LICENSE`, P10

## Context

Sejak awal, lisensi adalah pertanyaan terbuka Q1: MIT (adopsi maksimal) atau
AGPL-3.0 (mencegah SaaS tertutup tanpa kontribusi) — dibutuhkan sebelum rilis
publik pertama. Selama belum diputus, `README.md` menyatakan belum ada lisensi
yang diberikan dan belum ada berkas `LICENSE`. `AGENTS.md` §9 mewajibkan ADR
untuk perubahan lisensi.

Pada 2026-09-26 maintainer memutuskan **AGPL-3.0** dan menambahkan berkas
`LICENSE` (teks AGPL-3.0 utuh). ADR ini mendokumentasikan keputusan itu,
mencatat konsekuensi jujurnya, dan merekam hasil audit lisensi dependensi.

## Options

1. **MIT.** Adopsi maksimal: siapa pun boleh memakai, memodifikasi, dan
   menutup turunannya — termasuk menjalankan layanan SaaS tertutup dari kode
   ini tanpa mengembalikan apa pun. Keuntungannya adalah hambatan kontribusi
   dan adopsi paling rendah (termasuk oleh career center kampus dan perusahaan).
2. **AGPL-3.0 (dipilih).** Copyleft kuat + klausa jaringan (§13): siapa pun
   yang menjalankan versi modifikasi di server yang bisa diakses publik wajib
   menawarkan Corresponding Source ke penggunanya. Ini menjawab kekhawatiran
   Q1 secara langsung — turunan SaaS tertutup tanpa kontribusi tidak
   dimungkinkan — dengan harga gesekan adopsi oleh pihak yang ingin menutup
   kodenya.
3. **Tetap tanpa lisensi sampai rilis.** Ditolak: tanpa lisensi berarti
   default hak cipta penuh (tidak ada yang boleh memakai), yang bertentangan
   dengan misi open-source di `vision.md` dan memblokir rilis publik pertama.

## Decision

**Opsi 2: AGPL-3.0-only.**

- Berkas `LICENSE` di root adalah teks AGPL-3.0 verbatim (tidak diubah).
- Field `license` di `package.json` = `AGPL-3.0-only` (identifier SPDX).
- Referensi Q1 ditutup: `vision.md` §12, `README.md` (EN + ID), dan daftar
  kandidat ADR tidak lagi mencantumkan lisensi sebagai pertanyaan terbuka.
- `dependency-policy.md` §3 dibaca dengan kacamata baru: lisensi inbound
  harus kompatibel dengan AGPL-3.0 — permisif (MIT/Apache-2.0/BSD/ISC,
  OFL-1.1 untuk font) atau copyleft yang kompatibel-GPL (mis. MPL-2.0).

## Consequences

**Positif**

- Jaminan Q1 terpenuhi: turunan yang dijalankan sebagai layanan publik wajib
  membuka source-nya (§13) — model SaaS tertutup tanpa kontribusi di atas
  kode ini tidak dimungkinkan.
- Cocok dengan arsitektur local-first: distribusi utama adalah aset statis +
  source publik, sehingga kewajiban Corresponding Source dipenuhi secara
  alami (tautan source di aplikasi + halaman pendaratan, kait F4e).
- Seluruh 758 paket terpasang diaudit 2026-09-26: **nol konflik** (rincian di
  bawah). Tidak ada dependensi yang harus diganti karena lisensi.

**Negatif**

- Copyleft dapat menggentarkan sebagian kontributor/perusahaan yang ingin
  menanam kode ini di produk tertutup — adopsi potensial lebih sempit
  dibanding MIT. Ini harga sadar dari Q1, bukan kejutan.
- Setiap distribusi/deploy publik harus menjaga ketersediaan Corresponding
  Source (§6d/§13): rilis yang lupa menautkan source adalah pelanggaran
  lisensi. Prosedur rilis (F4d) dan landing (F4e) wajib mencantumkan tautan
  source sebagai item checklist, bukan kebiasaan.
- Baris pemegang hak cipta/tahun program belum ditempel di `LICENSE`
  (butuh nama + tahun dari maintainer — tidak dikarang di ADR ini).
- Dependensi ber-copyleft kuat (GPL/AGPL) di masa depan harus dinilai satu
  per satu: kompatibel bukan berarti tanpa kewajiban tambahan.

**Mitigasi negatif**

- Checklist rilis memuat "tautan source tersedia" sebelum setiap rilis publik.
- `dependency-policy.md` §3 kini eksplisit; penolakan otomatis untuk
  "lisensi tidak kompatibel" tetap berlaku.

## Rejected alternatives

**MIT (Opsi 1):** ditolak karena mengizinkan SaaS tertutup tanpa kontribusi —
persis risiko yang ingin dicegah Q1. Adopsi maksimal bukan tujuan di atas
keberlanjutan keterbukaan proyek.

**Tanpa lisensi (Opsi 3):** ditolak karena memblokir rilis publik pertama dan
bertentangan dengan klaim open-source di visi.

## Lampiran: hasil audit lisensi dependensi (2026-09-26)

Metode: baca field `license` `package.json` seluruh 758 paket di
`node_modules` (0 tidak terbaca), plus verifikasi bahwa paket yang ditandai
tidak diimpor oleh `src/` (tidak masuk bundle produksi).

**Dependensi runtime langsung (17):** MIT (`@base-ui/react`,
`@phosphor-icons/react`, `@tailwindcss/vite`, `cn`, `react`, `react-dom`,
`shadcn`, `tailwindcss`, `tw-animate-css`, `zod`, `zustand`), Apache-2.0
(`class-variance-authority`, `dexie`, `pdfjs-dist`, `tesseract.js`),
OFL-1.1 (kedua font `@fontsource-variable/*` — karya terpisah yang
dibundel, praktik standar yang diizinkan OFL). Semua kompatibel.

**Dev/test-time:** mayoritas MIT/ISC/Apache-2.0/BSD; MPL-2.0 (`axe-core`,
`@axe-core/playwright` + 2 transitif — kompatibel-GPL eksplisit, dan hanya
dipakai testing); BlueOak-1.0.0 (9 paket rantai `glob`, tooling build —
permisif); Python-2.0 (`argparse` via `js-yaml`, tooling — permisif);
CC0-1.0/0BSD/MIT-0 (domain publik); CC-BY-4.0 (1 paket, atribusi saja).

**Tiga temuan yang diperiksa lalu dinyatakan bersih:**

1. `png-js@2.0.0`: field `license` kosong, tetapi berkas `LICENSE` di
   paketnya adalah teks MIT (Devon Govett). Rantai dev-only
   (`@react-pdf/*`, artefak spike). Bersih.
2. Rantai `glob` BlueOak-1.0.0: tooling build, tidak diimpor `src/`. Bersih.
3. `argparse` (Python-2.0): tooling via `js-yaml`, tidak diimpor `src/`. Bersih.

Kesimpulan: tidak ada penggantian dependensi yang dibutuhkan karena lisensi.
