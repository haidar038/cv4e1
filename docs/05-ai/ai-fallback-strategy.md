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
- [ ] Tidak ada API key terpasang
- [ ] Offline
- [ ] Rate limit tercapai
- [ ] Permintaan timeout
- [ ] Keluaran gagal validasi
- [ ] Keluaran gagal pemeriksaan grounding
- [ ] Pengguna menolak persetujuan
- [ ] Penyedia tidak terjangkau

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
- [ ] Test untuk setiap pemicu fallback di §2
- [ ] Test: draft tetap utuh setelah setiap jenis kegagalan
