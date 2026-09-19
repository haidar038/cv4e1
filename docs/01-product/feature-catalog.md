# Feature Catalog — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> Daftar tunggal setiap fitur, prioritasnya, fasenya, dan requirement terkaitnya.
> Prioritas: P0 wajib MVP · P1 penting · P2 diinginkan · P3 nanti

Kolom yang harus dilengkapi tiap baris: Deskripsi · Prioritas · Fase · FR terkait · Perilaku offline · Dampak privasi · Catatan

---

## A. Manajemen data

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-A1 | Membuat, mengganti nama, menduplikasi, menghapus draft | P0 | 0 |
| F-A2 | Autosave ke IndexedDB | P0 | 0 |
| F-A3 | Ekspor draft `.cv4e.json` | P0 | 0 |
| F-A4 | Impor draft dengan validasi | P0 | 0 |
| F-A5 | Ekspor cadangan penuh | P1 | 1 |
| F-A6 | Hapus semua data | P0 | 1 |
| F-A7 | Migrasi schema | P0 | 0 |
| F-A8 | Peringatan penyimpanan + dorongan ekspor | P0 | 1 |

## B. Pengisian konten

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-B1 | Section identitas dasar | P0 | 1 |
| F-B2 | Pendidikan dengan IPK dan status | P0 | 1 |
| F-B3 | Pengalaman kerja dan magang | P0 | 1 |
| F-B4 | Organisasi dan kepanitiaan | P0 | 1 |
| F-B5 | Proyek | P0 | 1 |
| F-B6 | Keahlian | P0 | 1 |
| F-B7 | Sertifikat dan pelatihan | P1 | 1 |
| F-B8 | Unggah dan pangkas foto profil | P0 | 1 |
| F-B9 | Susun ulang urutan section | P1 | 1 |
| F-B10 | Section kustom | P3 | — |

## C. Panduan Bahasa Indonesia *(Pilar 2)*

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-C1 | Panduan format IPK | P0 | 1 |
| F-C2 | Pemilih status pendidikan dengan contoh | P0 | 1 |
| F-C3 | Peringatan foto pada mode ATS | P0 | 1 |
| F-C4 | Panduan format kontak | P1 | 1 |
| F-C5 | Panduan penulisan pengalaman organisasi | P1 | 1 |
| F-C6 | Peringatan panjang CV | P2 | 1 |

## D. Dual-engine *(Pilar 1)*

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-D1 | Toggle mode ATS ↔ Creative | P0 | 1 |
| F-D2 | Penegakan aturan mode ATS | P0 | 1 |
| F-D3 | Template Creative (1–2) | P0 | 1 |
| F-D4 | Pratinjau langsung | P0 | 1 |
| F-D5 | Pembanding mode berdampingan | P2 | — |
| F-D6 | Pemilihan tema per mode | P2 | — |

## E. Bantuan penulisan *(Pilar 3)*

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-E1 | Action Verbs Catalog (statis, offline) | P0 | 1 |
| F-E2 | Saran kata kerja sadar konteks section | P0 | 1 |
| F-E3 | Pola kalimat berorientasi dampak | P0 | 1 |
| F-E4 | Generator bullet AI | P1 | 2 |
| F-E5 | Polish AI (ID/EN) | P1 | 2 |
| F-E6 | Pencocokan deskripsi lowongan | P2 | 3 |

## F. Keluaran

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-F1 | Ekspor PDF | P0 | 1 |
| F-F2 | Kontrol paginasi | P1 | 1 |
| F-F3 | Uji ekstraksi teks (internal) | P0 | 1 |
| F-F4 | Ekspor DOCX | P3 | — |

## G. Platform

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-G1 | Service worker PWA | P0 | 1 |
| F-G2 | Dapat dipasang | P1 | 1 |
| F-G3 | Indikator status offline | P0 | 1 |
| F-G4 | Permintaan storage persisten | P1 | 1 |
| F-G5 | Pengalih bahasa ID/EN | P1 | 3 |
| F-G6 | Mode gelap | P2 | — |

## H. AI opsional

| ID | Fitur | Prio | Fase |
| :-- | :-- | :-- | :-- |
| F-H1 | Antarmuka provider + provider statis | P1 | 2 |
| F-H2 | Pengaturan BYO-key | P1 | 2 |
| F-H3 | Layar persetujuan | P1 | 2 |
| F-H4 | Pratinjau saran + Apply | P1 | 2 |
| F-H5 | Impor OCR | P2 | 3 |
| F-H6 | Provider model lokal (Ollama) | P3 | — |

## Fitur yang ditolak
Dicatat agar tidak muncul kembali diam-diam. Lihat `../00-project-context/vision.md` §8.

| Fitur | Alasan penolakan |
| :-- | :-- |
| Skor ATS | Angkanya dikarang |
| Akun pengguna | Melanggar P2 |
| Sinkronisasi cloud | Melanggar P1 |
| Auto-apply saran AI | Melanggar "suggestion, not mutation" |
| Analytics | Melanggar C-T10 |
