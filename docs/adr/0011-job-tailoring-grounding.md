# ADR-0011: Penyesuaian lowongan T3b — celah kata kunci, grounding, sanitasi injection

- **Status:** Accepted (2026-09-25 — prasyarat implementasi T3b terpenuhi)
- **Date:** 2026-09-25
- **Decision owner:** Maintainer proyek
- **Related:** C3 (`docs/05-ai/ai-product-spec.md`), AB-3 (`docs/06-security/abuse-cases.md`), threat-model §3–4, hallucination-policy, ADR-0005, ADR-0006, ADR-0008 (preseden: tanpa-LLM default, heuristik deterministik dulu)

## Context

C3 menjanjikan bantuan penyesuaian CV terhadap deskripsi lowongan (JD): kata
kunci yang ditemukan, kata kunci yang belum didukung data, section yang perlu
diperkuat, dan pertanyaan klarifikasi — dengan dua pagar: **tidak pernah
mengklaim skill baru** dan **teks lowongan yang ditempel adalah input tak
tepercaya** (AB-3, threat-model).

Tiga fakta yang membatasi desain:

1. **Tidak ada FR-xxx untuk tailoring di SRS** (FR-5xx hanya mencakup impor).
   Basis requirement saat ini adalah C3 di `ai-product-spec.md`. Penomoran
   FR-601–FR-604 di bawah diputuskan bersamaan dengan penerimaan ADR ini.
2. Pola Fase 2 yang terbukti (C1/C2/C1b): orkestrator berkontrak, prompt
   berversi append-only di `prompts/`, saran hidup di `AIStore` dan masuk
   `ResumeDocument` hanya lewat Apply per-item, nota jujur FR-408, retry
   terbatas, dan set evaluasi grounding per versi prompt.
3. Preseden T3a/ADR-0008: jalur deterministik tanpa LLM adalah default;
   LLM eksplisit di luar scope bila nilai intinya bisa dicapai tanpa
   mengirim data keluar perangkat.

## Options

1. **LLM penuh sebagai satu-satunya jalur.** Kualitas bahasa terbaik untuk
   pertanyaan klarifikasi dan saran section, tetapi: butuh internet + key
   untuk nilai inti, melanggar P4 (AI pelengkap, bukan syarat), dan
   memperbesar permukaan injection. Ditolak sebagai default.
2. **Pencocokan statis saja, tanpa LLM.** Aman dan offline-penuh, tetapi
   pertanyaan klarifikasi dan saran section yang bernuansa tidak tercapai —
   C3 hanya terpenuhi sebagian. Ditolak sebagai akhir, diterima sebagai
   fondasi.
3. **Hibrida berlapis (dipilih).** Jalur statis deterministik adalah
   **default yang selalu tersedia** (nilai inti C3: daftar celah kata kunci
   bekerja offline tanpa key); jalur LLM **opsional** di belakang gate
   persetujuan ADR-0006 menambah pertanyaan klarifikasi dan saran section.
   JD selalu diperlakukan sebagai data, tidak pernah sebagai instruksi,
   di kedua jalur.

## Decision

**Opsi 3, dengan pagar eksplisit:**

- **Scope keluaran (menutup non-goals C3):** daftar kata kunci JD yang
  didukung data, daftar yang belum didukung, petunjuk section, pertanyaan
  klarifikasi. Dilarang: penulisan ulang otomatis, skor/penilaian CV,
  rekomendasi lowongan, dan perubahan apa pun tanpa Apply.
- **JD bersifat transien.** JD tidak masuk `ResumeDocument`, tidak disimpan
  di IndexedDB/localStorage, tidak di-log, dan tidak ikut dalam
  ekspor/backup. Batas provisional: JD ≤ 10.000 karakter (titik mulai
  beralasan untuk biaya prompt; dikonfirmasi saat implementasi).
- **Jalur statis (default):** normalisasi + pencocokan kata kunci
  deterministik antara teks JD dan korpus teks `ResumeDocument`; keluaran
  berbentuk sama dengan jalur LLM (minus pertanyaan klarifikasi) sehingga
  UI tidak bercabang.
- **Jalur LLM (opsional):** di belakang gate persetujuan per-operasi
  pola Task 18 + minimisasi payload pola Task 18 (allowlist DF-6);
  prompt berversi append-only; nota FR-408 bahwa ini saran AI.
- **Aturan grounding T3b (diuji sebagai invariant, bukan sekadar prompt):**
  setiap kata kunci yang dikutip harus substring-match JD
  (case-insensitive); setiap klaim "didukung data" harus substring-match
  teks `ResumeDocument`; pertanyaan klarifikasi dilarang menegaskan fakta;
  angka/entitas baru = pelanggaran severity tinggi (hallucination-policy §5).
- **Sanitasi injection:** JD dibungkus sebagai data dengan pemisah eksplisit
  + pernyataan hierarki instruksi di prompt; pemeriksa grounding lokal
  menolak keluaran yang melanggar; set evaluasi wajib memuat probe
  injection (preseden: keinertan AB-4 di `field-mapper` T3a).
- **Dampak schema: nihil.** Saran hidup di `AIStore`; kandidat Apply
  mengikuti kontrak yang sudah ada. Kandidat tabel ADR ("schema") diartikan
  sebagai schema keluaran terstruktur, bukan perubahan `ResumeDocument`.

## Consequences

**Positif**

- Nilai inti C3 (daftar celah kata kunci) bekerja offline, tanpa key,
  tanpa data keluar perangkat — P4 terpenuhi di level kemampuan.
- Aturan grounding yang dapat diuji, bukan janji prompt: invariant
  substring + set evaluasi + probe injection.
- Jejak Fase 2 dipakai ulang (kontrak, prompt berversi, Apply per-item,
  FR-408) — tidak ada pola baru yang dipelihara.
- JD transien = permukaan privasi minimal; tidak ada retensi yang perlu
  dijelaskan atau dihapus.

**Negatif**

- Dua jalur = dua implementasi yang dipelihara (matcher statis + path LLM);
  perilaku keduanya harus dijaga konsisten lewat kontrak keluaran yang sama.
- Kualitas pertanyaan klarifikasi jalur statis terbatas (degradasi jujur:
  daftar celah tetap penuh, nuansa bahasa berkurang).
- Batas 10.000 karakter bisa memotong JD panjang — wajib nota jujur saat
  pemotongan terjadi (FR-408), bukan diam.
- Evaluasi grounding dwibahasa (ID/EN) menambah beban set evaluasi.

**Mitigasi negatif**

- Kontrak keluaran tunggal + test kontrak untuk kedua jalur.
- Nota pemotongan + degradasi eksplisit di UI.
- Probe injection masuk set evaluasi sejak implementasi, bukan susulan.

## Rejected alternatives

**LLM penuh (Opsi 1):** mengorbankan P4 dan memperluas egress + injection
untuk nilai yang sebagian besar dapat dihitung lokal. Bisa hidup kembali
hanya bila matcher statis terbukti tak memadai di evaluasi — dengan ADR
baru, bukan pelebaran diam-diam.

**Statis saja (Opsi 2):** cadangan bila jalur LLM gagal terbukti aman di
evaluasi; C3 dinyatakan terpenuhi sebagian secara sadar.
