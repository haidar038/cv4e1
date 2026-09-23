# Protokol Evaluasi Manual AI — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Aktif v0.1** |
| Terakhir diperbarui | 2026-09-23 |

> Evaluasi berkunci **tidak berjalan di CI** — ia butuh kunci API asli dan
> secret dilarang di repo/bundle (C-T2). Protokol ini dijalankan maintainer
> secara manual, memakai kunci pribadi yang tidak pernah di-commit.

---

## 1. Kapan dijalankan

- Setiap versi prompt baru (`v1`, `v2`, …) sebelum hasilnya diklaim.
- Evaluasi kualitas bahasa (naturalitas, redundansi) dijadwalkan di akhir
  project — pengembangan berjalan fokus pada alur dan mekanisme sistem.
- Rujukan kasus: `evaluation-dataset.md`. Rujukan versi: `prompt-specification.md` §4.

## 2. Prasyarat

- Kunci API milik maintainer, dimasukkan lewat Bantuan AI di tab uji saja.
- Catat konteks tiap run: versi prompt, model, temperatur, timeout.
  Tanpa konteks, hasil tidak dapat dibandingkan antar versi.
- Jangan memakai data pribadi asli sebagai input — pakai fixture fiktif.

## 3. Prosedur per kasus

1. Masukkan input kasus ke operasi yang diuji (mis. generator bullet).
2. Setujui consent, tunggu hasil (atau timeout → fallback).
3. Periksa invariant `evaluation-dataset.md` §1 — **uji invariant, bukan
   string persis**: JSON valid, tanpa angka/entitas/tanggal baru, kata
   kerja aksi ada, bahasa sesuai, draft tak berubah sebelum Apply.
4. Catat lulus/gagal per kasus per versi prompt (§5).

## 4. Ambang kelulusan

**Nol pelanggaran grounding** pada seluruh set. Satu pelanggaran = versi
prompt gagal — perbaiki sebagai versi baru (append-only), jangan edit di
tempat, lalu ulangi protokol penuh.

## 5. Pencatatan

- Simpan hasil per versi prompt (tanggal, konteks §2, tabel kasus).
- Setiap pelanggaran grounding yang ditemukan menjadi **fixture permanen**
  di `fixtures/ai-eval/` — set hanya bertambah, tidak pernah menyusut.

## 6. Keterbatasan yang diketahui (ditunda ke eval akhir)

- **Redundansi awalan (temuan 2026-09-23):** input `Mengelola Membuat
  spec-document untuk project` dapat menghasilkan saran yang mengulang
  kata input secara tidak natural. Grounding check tidak menangkap ini
  (bukan fakta karangan) — perlu aturan dedup di prompt v2 + provider
  statis. Kasus ini wajib masuk set eval kualitas akhir, bukan diperbaiki
  sekarang.
- **translate-en tak bisa lolos containment (temuan Task 22, 2026-09-24):**
  terjemahan sejati memakai kosakata bahasa lain sehingga selalu gagal
  `checkGrounding` terhadap teks sumber — mode ini terdegradasi ke panduan
  statis secara graceful (bukan bug karangan). Perbaikan sejati butuh desain
  grounding dwibahasa — didiskusikan sebelum Fase 3, bukan di sini.
- **Slot kurasi statis di luar gate (batasan Task 22, 2026-09-24):** prefix
  kata kerja katalog + template rationale adalah tambahan kurasi (tujuan
  FR-403 itu sendiri), bukan output model — runner terima meng-allowlist
  keduanya secara eksplisit, angka/entitas-fakta tak pernah allowlist.
  Rationale tetap dijaga sapu frasa terlarang.
