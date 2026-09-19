# Data Flow — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Setiap alur harus dapat dijawab: di mana data berada, ke mana ia bergerak, dan apakah ia meninggalkan perangkat.

---

## DF-1 — Input pengguna → state → penyimpanan
```text
Input form → validasi → ResumeDocument → autosave (debounce) → IndexedDB
```
- [ ] Interval debounce (TODO)
- [ ] Perilaku kegagalan
- [ ] **Meninggalkan perangkat: tidak**

## DF-2 — State → renderer → PDF
```text
ResumeDocument → normalize() → ViewModel → Renderer → PDF
```
- [ ] Dua cabang: ATS dan Creative
- [ ] Di mana aturan mode diberlakukan (jawaban: di `normalize()`, bukan di renderer)
- [ ] **Meninggalkan perangkat: tidak**

## DF-3 — Impor berkas
```text
Berkas → cek ukuran → parse → validasi schema → migrasi → normalisasi → state → IndexedDB
```
- [ ] Penanganan kegagalan di setiap tahap
- [ ] Field tak dikenal: simpan atau buang? (TODO — putuskan, pengaruhi kompatibilitas maju)
- [ ] **Meninggalkan perangkat: tidak**

## DF-4 — Ekspor berkas
```text
ResumeDocument → serialisasi → (sertakan aset?) → Blob → unduh
```
- [ ] **Wajib: jangan pernah menyertakan API key**
- [ ] **Meninggalkan perangkat: ya — atas tindakan pengguna**

## DF-5 — Aset foto
```text
Unggah → validasi tipe/ukuran → pangkas → kompres → Blob → IndexedDB → assetRef
```
- [ ] Batas ukuran (TODO)
- [ ] Dirujuk, bukan disematkan, di dalam `ResumeDocument`

## DF-6 — Alur AI *(satu-satunya jalur keluar perangkat)*
```text
ResumeDocument
   ↓
Minimisasi data  ← hanya field yang dipilih, bukan seluruh CV
   ↓
Prompt builder
   ↓
Persetujuan pengguna  ← BERHENTI di sini jika belum disetujui
   ↓
Penyedia AI (jaringan) ═══► DATA MENINGGALKAN PERANGKAT
   ↓
Validasi schema
   ↓
Pemeriksaan grounding  ← tolak keluaran dengan fakta yang dikarang
   ↓
Pratinjau saran
   ↓
Pengguna menekan Apply  ← BERHENTI di sini jika tidak diterapkan
   ↓
ResumeDocument
```
- [ ] Field apa saja yang termasuk minimisasi data (TODO — definisikan tepat)
- [ ] Apa yang terjadi pada tiap tahap gagal
- [ ] **Diagram ini harus muncul di pemberitahuan privasi dengan bahasa awam**

## DF-7 — Impor CV / OCR (Fase 3)
```text
Unggah → ekstraksi lapisan teks PDF → fallback OCR → ekstraksi field kandidat
  → validasi schema → tampilan keyakinan → tinjauan manusia → simpan
```
- [ ] OCR lokal (Tesseract WASM) versus penyedia AI — konsekuensi privasi berbeda
- [ ] **Tidak pernah melewati tinjauan manusia**

## DF-8 — Hapus semua data
```text
Konfirmasi → tawarkan ekspor → hapus IndexedDB → hapus localStorage → bersihkan cache → muat ulang
```
- [ ] Harus benar-benar bersih, dapat diverifikasi lewat test
