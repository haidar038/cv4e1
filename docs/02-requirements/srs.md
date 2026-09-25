# Software Requirements Specification — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — ID sudah ditetapkan, isi perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> **Kontrak requirement yang dapat diuji.** Hindari kalimat seperti "aplikasi harus mudah digunakan" tanpa indikator terukur.
> ID di bawah bersifat stabil dan dirujuk oleh test, isu, PR, dan acceptance criteria. **Jangan pernah mendaur ulang ID.**

Format tiap requirement: ID · Pernyataan · Prioritas · Sumber · Dapat diverifikasi lewat · Catatan

---

## 1. Ruang lingkup
- [ ] Ringkas produk, rujuk `../01-product/prd.md`
- [ ] Apa yang dicakup versi ini

## 2. Definisi
- [ ] Rujuk `../00-project-context/glossary.md`
- [ ] "harus" = wajib, "sebaiknya" = dianjurkan, "boleh" = opsional

---

## 3. Functional Requirements

### FR-0xx — Model data dan rendering

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-001 | Sistem harus menyediakan satu resume data model yang dapat dirender ke mode ATS dan mode Creative | P0 |
| FR-002 | Sistem harus menyembunyikan foto profil pada renderer ATS | P0 |
| FR-003 | Berpindah mode tidak boleh mengubah atau menghapus data sumber | P0 |
| FR-004 | Renderer ATS harus memakai tata letak satu kolom | P0 |
| FR-005 | Renderer ATS tidak boleh memakai tabel untuk struktur inti | P0 |
| FR-006 | Kedua renderer harus mengabaikan field kosong tanpa menyisakan heading kosong | P0 |
| FR-007 | Kedua renderer harus mempertahankan urutan data sumber | P0 |
| FR-008 | Template tidak boleh mengesampingkan aturan mode | P0 |

### FR-1xx — Persistence dan portabilitas

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-101 | Sistem harus menyimpan draft secara lokal tanpa akun | P0 |
| FR-102 | Sistem harus menyimpan otomatis tanpa tindakan eksplisit pengguna | P0 |
| FR-103 | Sistem harus mendukung beberapa draft | P0 |
| FR-104 | Sistem harus dapat mengekspor draft dalam format JSON | P0 |
| FR-105 | Sistem harus dapat mengimpor JSON yang valid | P0 |
| FR-106 | Sistem harus menampilkan pesan error yang dapat dipahami ketika struktur impor tidak valid | P0 |
| FR-107 | Sistem harus memigrasi `ResumeDocument` versi lama tanpa kehilangan data | P0 |
| FR-108 | Sistem harus menyediakan penghapusan seluruh data lokal | P0 |
| FR-109 | Sistem harus memberi tahu pengguna bahwa data hanya tersimpan di perangkat ini | P0 |
| FR-110 | Sistem tidak boleh menyertakan API key dalam ekspor apa pun | P0 |
| FR-111 | Sistem harus tetap dapat dipakai ketika storage diblokir, dengan pemberitahuan yang jelas | P1 |

### FR-2xx — Panduan dan lokalisasi

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-201 | Sistem harus menyarankan format IPK Indonesia beserta skalanya | P0 |
| FR-202 | Sistem harus menyediakan pilihan status pendidikan yang sesuai konteks Indonesia | P0 |
| FR-203 | Sistem harus menjelaskan alasan foto disembunyikan saat mode ATS aktif | P0 |
| FR-204 | Micro-copy khusus Indonesia harus nonaktif ketika locale bukan `id` | P1 |
| FR-205 | Sistem harus menyediakan saran kata kerja aksi sesuai konteks section | P0 |
| FR-206 | Saran kata kerja aksi harus berfungsi tanpa koneksi jaringan | P0 |

### FR-3xx — Keluaran

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-301 | Sistem harus mengekspor PDF dari mode yang sedang aktif | P0 |
| FR-302 | PDF mode ATS harus berisi teks yang dapat diseleksi dan diekstraksi | P0 |
| FR-303 | PDF mode Creative harus berisi teks yang dapat diseleksi dan diekstraksi | P0 |
| FR-304 | Ekspor PDF tidak boleh membutuhkan API eksternal | P0 |

### FR-4xx — AI opsional

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-401 | Fitur AI tidak boleh mengubah data resume secara otomatis tanpa persetujuan pengguna | P0 |
| FR-402 | Sistem harus meminta persetujuan eksplisit sebelum mengirim data ke penyedia AI | P0 |
| FR-403 | Setiap kapabilitas AI harus memiliki fallback non-AI yang berfungsi | P0 |
| FR-404 | Sistem harus memvalidasi keluaran AI terhadap schema dan menolak yang tidak sesuai | P0 |
| FR-405 | Keluaran AI tidak boleh memuat angka atau entitas yang tidak ada pada input | P0 |
| FR-406 | Kegagalan penyedia AI tidak boleh merusak atau menghapus draft | P0 |
| FR-407 | API key pengguna tidak boleh dikirim ke mana pun selain penyedia yang dipilih | P0 |
| FR-408 | Sistem harus menampilkan status fitur AI yang tidak tersedia beserta alasannya | P1 |

### FR-5xx — Impor CV (Fase 3)

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-501 | Hasil ekstraksi CV harus ditampilkan untuk ditinjau sebelum disimpan | P2 |
| FR-502 | Hasil ekstraksi tidak boleh langsung masuk ke resume final | P2 |

### FR-6xx — Penyesuaian lowongan (Fase 3, ADR-0011)

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| FR-601 | Hasil penyesuaian (kata kunci didukung/belum, section yang perlu diperkuat, pertanyaan klarifikasi) harus ditampilkan untuk ditinjau sebelum ada perubahan | P2 |
| FR-602 | Hasil penyesuaian tidak boleh menambah skill atau fakta baru dan tidak boleh langsung masuk ke resume final | P0 |
| FR-603 | Deskripsi lowongan bersifat transien: tidak disimpan, tidak di-log, dan pemotongan panjang harus disertai nota jujur | P1 |
| FR-604 | Jalur pencocokan statis offline harus selalu tersedia sebagai fallback jalur LLM | P1 |

---

## 4. Non-Functional Requirements

| ID | Pernyataan | Prio |
| :-- | :-- | :-- |
| NFR-001 | Fitur inti harus dapat digunakan tanpa internet setelah app shell terpasang | P0 |
| NFR-002 | Tidak ada data resume yang dikirim ke server pada mode offline | P0 |
| NFR-003 | Ekspor PDF harus dapat dilakukan tanpa API eksternal | P0 |
| NFR-004 | Setiap fitur AI harus memiliki fallback non-AI | P0 |
| NFR-005 | Aplikasi harus dapat dioperasikan sepenuhnya dengan keyboard | P0 |
| NFR-006 | Build produksi tidak boleh menyertakan API key rahasia | P0 |
| NFR-007 | Aplikasi harus memenuhi WCAG 2.2 AA | P0 |
| NFR-008 | App shell harus berada di bawah anggaran performa — lihat `../07-quality/performance-budget.md` | P0 |
| NFR-009 | Aplikasi tidak boleh memuat skrip pihak ketiga saat runtime | P0 |
| NFR-010 | Aplikasi harus berfungsi pada peramban dalam matriks dukungan | P0 |
| NFR-011 | Data resume tidak boleh ditulis ke log dalam build apa pun | P0 |
| NFR-012 | Aplikasi harus dapat disajikan sebagai aset statis tanpa runtime server | P0 |
| NFR-013 | Kehilangan data akibat crash tidak boleh melebihi interval autosave terakhir | P0 |
| NFR-014 | Aplikasi harus berfungsi pada pembesaran teks peramban hingga 200% | P1 |
| NFR-015 | Font harus dibundel, tidak diambil dari CDN saat runtime | P0 |

---

## 5. Requirement yang perlu dilengkapi
- [ ] Batas ukuran berkas impor
- [ ] Batas ukuran dan dimensi foto profil
- [ ] Jumlah maksimum draft
- [ ] Interval autosave (nilai konkret)
- [ ] Perilaku ketika kuota storage terlampaui
- [ ] Perilaku beberapa tab terbuka bersamaan
- [ ] Requirement paginasi PDF
- [ ] Requirement pesan error yang dapat ditindaklanjuti
