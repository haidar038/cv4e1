# AI Fallback Strategy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Setiap kapabilitas AI wajib punya fallback yang berfungsi (P4, FR-403). Fallback bukan pesan error — ia harus tetap memberi nilai.

---

## 1. Matriks fallback

| Kapabilitas | Fallback | Nilai yang tetap diberikan |
| :-- | :-- | :-- |
| Generator bullet | Action Verbs Catalog + pola kalimat | Pengguna tetap mendapat struktur untuk menulis |
| Polish | Panduan statis, contoh frasa yang disarankan/dihindari | Pengguna tetap tahu apa yang perlu diperbaiki |
| Penyesuaian lowongan | Pencocokan kata kunci sederhana | Pengguna tetap melihat celah |
| Impor OCR | Entri manual | Jalur utama tetap berfungsi |

## 2. Kapan fallback aktif
- [x] Tidak ada API key terpasang
- [x] Offline
- [x] Rate limit tercapai (Task 21: 3 attempt dengan hormat `Retry-After` dulu, baru statis + nota kuota)
- [x] Permintaan timeout (Task 21: 3 attempt dengan backoff dulu, baru statis + nota tunggu)
- [x] Keluaran gagal validasi
- [x] Keluaran gagal pemeriksaan grounding
- [x] Pengguna menolak persetujuan
- [x] Penyedia tidak terjangkau

## 3. Aturan UX
- [ ] Fallback harus terasa seperti fitur, bukan hukuman
- [ ] Jelaskan mengapa AI tidak tersedia (FR-408)
- [ ] Jangan sembunyikan tombol AI — tampilkan nonaktif dengan alasan
- [ ] Jangan pernah membiarkan pengguna menunggu tanpa umpan balik

## 4. Aturan yang tidak bisa ditawar
- [ ] **Kegagalan AI tidak boleh pernah merusak atau menghapus draft** (FR-406)
- [ ] Kegagalan AI tidak boleh memblokir ekspor PDF
- [ ] Kegagalan AI tidak boleh mengunci UI

## 5. Pengujian
- [x] Test untuk setiap pemicu fallback di §2 (Task 21 melengkapi pemicu terakhir: retry 429/timeout + nota per-kode; e2e `ai-retry.spec.ts`)
- [x] Test: draft tetap utuh setelah setiap jenis kegagalan
