# ADR-0005: AI sebagai kapabilitas opsional

- **Status:** Accepted
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek

## Context

Bantuan penulisan bernilai nyata bagi pengguna sasaran kami: fresh graduate secara konsisten menulis deskripsi tugas, bukan pencapaian.

Namun pasar bergerak ke arah yang bermasalah. Builder CV semakin mensyaratkan langganan atau API key untuk bantuan penulisan — tepat pada kelompok yang paling tidak mampu membayarnya. Sebagian juga menghasilkan metrik yang dikarang, yang mendorong pengguna berbohong di CV mereka sendiri tanpa menyadarinya.

Sementara itu, batasan kami mengikat: offline harus tetap berfungsi (P3), tidak boleh ada biaya (C-R2), tidak boleh ada API key yang dibundel (C-T2).

## Options

1. **AI sebagai fitur inti** — terintegrasi di seluruh alur
2. **Tanpa AI sama sekali** — hanya bantuan statis
3. **AI sebagai lapisan opsional dengan fallback statis wajib**
4. **Hanya model lokal** — WebLLM atau sejenisnya

## Decision

**Opsi 3.** AI adalah peningkatan opsional di balik antarmuka `AIProvider`. `StaticSuggestionProvider` yang didukung Action Verbs Catalog adalah implementasi bawaan dan berjalan offline.

Setiap kapabilitas AI wajib memiliki fallback non-AI yang tetap memberi nilai. Keluaran AI adalah saran, bukan mutasi: `ResumeDocument` tidak berubah sampai pengguna menekan Apply.

## Consequences

**Positif**
- Aplikasi inti tetap berfungsi penuh secara offline, gratis, dan tanpa akun
- Pengguna tanpa kunci, tanpa kuota, atau tanpa internet tetap mendapat bantuan penulisan yang berguna
- Perubahan kebijakan penyedia tidak dapat merusak produk
- Penyedia dapat diganti tanpa menyentuh business logic
- Test berjalan tanpa jaringan
- Batas privasi menjadi jelas dan dapat dijelaskan: tepat satu jalur mengirim data keluar perangkat

**Negatif**
- Dua jalur bantuan penulisan yang harus dipelihara
- Fallback statis kurang bertenaga dibanding AI, dan pengguna bisa merasa jalur gratis sebagai versi kelas dua
- Katalog kata kerja aksi memerlukan kerja kurasi manual yang nyata (50–100 entri tervalidasi)
- BYO-key adalah beban bagi pengguna non-teknis
- Uji grounding diperlukan karena kami tidak bisa memercayai keluaran penyedia

**Kewajiban yang ditimbulkan**
- Pemeriksaan grounding di dalam kode, bukan hanya di prompt
- Set evaluasi dengan ambang nol pelanggaran
- Setiap pemicu fallback harus diuji

## Rejected alternatives

**AI sebagai fitur inti** melanggar P3 dan P4, dan akan mengecualikan pengguna yang paling membutuhkan produk ini. Ia juga membuat proyek bergantung pada kebijakan pihak ketiga yang tidak kami kendalikan.

**Tanpa AI sama sekali** menyerahkan nilai nyata tanpa alasan yang cukup. Fallback statis baik untuk memulai, tetapi AI memang membantu ketika pengguna benar-benar buntu.

**Hanya model lokal** menarik secara privasi, tetapi ukuran unduhan model saat ini tidak sesuai dengan pengguna berkuota terbatas — persis kelompok yang paling kami pedulikan. Dipertahankan sebagai opsi masa depan lewat `OllamaProvider` bagi pengguna yang sudah menjalankan model lokal.
