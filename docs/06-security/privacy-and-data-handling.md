# Privacy and Data Handling — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Dokumen ini harus dapat dipahami **tanpa latar belakang teknis**. Ia menjadi dasar pemberitahuan privasi yang dilihat pengguna.

---

## 1. Pertanyaan yang harus dijawab, dalam bahasa pengguna
- [ ] Di mana data saya tersimpan secara bawaan?
- [ ] Bisakah pengembang melihat data saya?
- [ ] Kapan data saya keluar dari peramban?
- [ ] Apa yang terjadi ketika saya memakai AI?
- [ ] Apa yang disimpan penyedia AI?
- [ ] Apakah ada analytics?
- [ ] Bagaimana saya menghapus data saya?
- [ ] Apa risikonya jika saya memakai komputer bersama?
- [ ] Apa yang terjadi jika peramban menghapus data saya?

## 2. Tiga mode privasi
→ `../05-ai/ai-privacy-policy.md` §1. Konsisten antarkedua dokumen.

## 3. Klasifikasi data

| Data | Klasifikasi | Tersimpan di | Pernah keluar perangkat? |
| :-- | :-- | :-- | :-- |
| Nama, kontak | PII | IndexedDB | Hanya lewat ekspor atau PDF pengguna |
| Riwayat pendidikan dan kerja | PII | IndexedDB | Sebagian, hanya dengan persetujuan AI |
| Foto profil | PII | IndexedDB (Blob) | Hanya lewat ekspor atau PDF pengguna |
| Preferensi UI | Bukan PII | localStorage | Tidak |
| API key | Rahasia | Memori sesi (usulan) | Hanya ke penyedia yang dipilih |

## 4. Yang tidak kami lakukan
- [ ] Tanpa akun, tanpa pengumpulan email
- [ ] Tanpa analytics, tanpa telemetri
- [ ] Tanpa cookie pihak ketiga
- [ ] Tanpa pelacakan lintas situs
- [ ] Tanpa penjualan data — tidak ada data untuk dijual
- [ ] Tanpa pencatatan isi resume

## 5. Peringatan jujur yang wajib kami sampaikan
- [ ] Penyimpanan peramban bisa dihapus peramban
- [ ] Komputer bersama berarti orang lain bisa melihat draft Anda
- [ ] Kami tidak bisa memulihkan data yang hilang — tidak ada salinannya
- [ ] Memakai AI mengirim sebagian data ke pihak ketiga
- [ ] **Jangan pernah mengatakan "data Anda sepenuhnya aman"**

## 6. Hak pengguna
- [ ] Ekspor: selalu tersedia, format terbuka
- [ ] Hapus: selalu tersedia, satu klik, menyeluruh
- [ ] Portabilitas: JSON terdokumentasi
- [ ] Tanpa akun berarti tanpa proses permintaan data — pengguna sudah memegang semuanya

## 7. Kepatuhan
- [ ] TODO: telaah UU PDP Indonesia dan implikasinya bagi aplikasi tanpa server
- [ ] Posisi GDPR: kami tidak memproses data di sisi kami; dokumentasikan alasannya
