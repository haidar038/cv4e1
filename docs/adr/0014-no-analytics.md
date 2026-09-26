# ADR-0014: Tanpa analytics, tanpa telemetri

- **Status:** Accepted (2026-09-26 — usulan Q5 + F4c disetujui maintainer; membuka gerbang rilis)
- **Date:** 2026-09-26
- **Decision owner:** Maintainer proyek
- **Related:** Q5 (`docs/00-project-context/vision.md` §12), P1/P3, C-T10 (`AGENTS.md` §2.5), `docs/06-security/threat-model.md`, `e2e/no-egress.spec.ts`, F4e (landing tunduk pada aturan yang sama)

## Context

Q5 bertanya apakah ada analytics sama sekali, dengan usulan "tidak ada pada
MVP". Arsitektur local-first tanpa backend berarti tidak ada tempat alami
untuk menerima telemetri — pengiriman apa pun harus dibangun sengaja. Di sisi
lain, tanpa angka penggunaan, keputusan produk harus bersandar pada proksi
yang bisa diuji (`vision.md` §7: waktu-ke-PDF, integritas data, dst.).

## Options

1. **Nol analytics, nol telemetri (dipilih).** Tidak ada kode pengukuran,
   tidak ada beacon, tidak ada panggilan keluar origin untuk alasan apa pun
   di luar operasi AI yang disetujui pengguna. Dibuktikan `no-egress.spec.ts`
   (.Definisi "off-origin" = di luar origin aplikasi).
2. **Hitungan agregat self-hosted.** Tetap butuh backend penerima — melanggar
   C-T1 (tanpa backend) dan menambah permukaan keamanan pada proyek satu
   orang. Ditolak.
3. **Layanan pihak ketiga (analytics SaaS).** Skrip runtime pihak ketiga
   (melanggar C-T10), data perilaku keluar perangkat (melanggar P1), dan
   ketergantungan pada kebijakan privasi pihak ketiga. Ditolak.

## Decision

**Opsi 1.** cv4every1 tidak mengumpulkan, mengirim, atau menyimpan telemetri
dalam bentuk apa pun — termasuk pada halaman pendaratan (F4e terikat aturan
yang sama). Satu-satunya lalu lintas jaringan yang diizinkan: operasi AI
eksplisit yang disetujui per operasi (C-T3), aset runtime OCR dari CDN
berversi yang di-pin (ADR-0010), dan apa pun yang diambil dari origin
sendiri.

## Consequences

**Positif**

- Klaim privasi menjadi struktural, bukan janji: tidak ada kode yang *bisa*
  mengirim telemetri, sehingga tidak ada yang perlu diaudit setiap rilis
  selain `no-egress` yang sudah ada di CI.
- Nol biaya, nol akun layanan, nol DPA/DPIA pihak ketiga untuk dikelola
  satu orang.
- Konsisten dengan metrik keberhasilan vision §7 yang memang dirancang tanpa
  pelacakan pengguna.

**Negatif**

- Tidak ada data adopsi, retensi, atau funnel — keputusan prioritas fitur
  bersandar pada laporan isu, umpan balik langsung, dan proksi teruji.
  Ini harga sadar dari P1.
- Bila suatu hari dibutuhkan (mis. hitungan unduhan rilis), penghitung
  sisi-server pada host unduhan tetap dimungkinkan tanpa menyentuh aplikasi
  — di luar scope ADR ini.

**Mitigasi negatif**

- Keputusan ini mengikat hingga ADR baru: analytics di masa depan butuh ADR
  (AGENTS.md §9: analytics/telemetri selalu butuh ADR) — tidak bisa
  diselipkan diam-diam.

## Rejected alternatives

**Agregat self-hosted (Opsi 2):** membutuhkan backend hanya untuk angka —
bertentangan dengan C-T1 dan P10 (beban satu orang).

**SaaS pihak ketiga (Opsi 3):** melanggar C-T10 dan P1 sekaligus; tidak ada
varian "privacy-friendly" yang mengubah fakta data keluar perangkat.
