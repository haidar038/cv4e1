# Localization Guide — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — perlu dilengkapi** |
| Terakhir diperbarui | 2026-09-15 |

> **Ini bukan panduan i18n.** Ini adalah pengetahuan domain tentang perekrutan Indonesia yang ditanamkan sebagai konten produk.
> Menerjemahkan antarmuka itu mudah dan mudah ditiru. Yang ada di dokumen ini adalah parit pertahanan sesungguhnya (Pilar 2).

---

## 1. Filosofi
- [ ] Bahasa Indonesia ditulis lebih dulu, Inggris menyusul — bukan sebaliknya
- [ ] Micro-copy muncul **di titik pengisian**, bukan di halaman bantuan
- [ ] Nada: memandu, tidak menggurui. Pengguna sedang cemas mencari kerja.
- [ ] Peringatan dibingkai sebagai bantuan, bukan kegagalan

## 2. Aturan nada
- [ ] Sapaan: "Anda" (formal) — TODO konfirmasi, pertimbangkan "kamu" untuk terasa lebih dekat
- [ ] Hindari jargon HR tanpa penjelasan
- [ ] Jangan pernah menyiratkan pengguna bodoh karena tidak tahu
- [ ] Contoh baik/buruk untuk setiap kategori pesan

## 3. Aturan konten domain

### 3.1 IPK
- [ ] Format kanonik: `3.50 / 4.00` — dua desimal, skala selalu ditulis
- [ ] Peringatkan jika skala kosong
- [ ] Panduan kapan sebaiknya tidak menampilkan IPK — sebagai saran, tidak memaksa
- [ ] TODO: validasi ambang dengan riset R3/R4

### 3.2 Status pendidikan
- [ ] `graduated` → "Lulus"
- [ ] `awaiting-ceremony` → "Lulus (menunggu wisuda)"
- [ ] `in-progress` → "Sedang menempuh"
- [ ] `discontinued` → TODO: bagaimana menuliskannya tanpa merugikan pengguna
- [ ] Contoh penulisan lengkap untuk masing-masing

### 3.3 Foto profil
- [ ] Teks peringatan mode ATS — **wajib menjelaskan alasan, bukan sekadar melarang**
- [ ] Panduan pasfoto: latar polos, pakaian formal, wajah jelas
- [ ] Hormati bahwa foto adalah norma kuat; jangan menghakimi

### 3.4 Pengalaman organisasi
- [ ] BEM, HMJ, UKM, kepanitiaan, KKN, asisten praktikum diperlakukan sebagai pengalaman sah
- [ ] Contoh penulisan berorientasi hasil untuk masing-masing
- [ ] TODO: kumpulkan contoh nyata dari riset R3

### 3.5 Kontak
- [ ] Format nomor telepon Indonesia: `+62` versus `08`
- [ ] Peringatan alamat email tidak profesional
- [ ] Kota tanpa alamat lengkap
- [ ] LinkedIn opsional, bukan wajib

### 3.6 Panjang dan struktur CV
- [ ] Panduan 1–2 halaman untuk fresh graduate
- [ ] Urutan section yang disarankan, dan kapan boleh diubah

## 4. Action Verbs Catalog
Struktur berkas: `src/content/locales/id/action-verbs.json`

- [ ] Kategori: teknis, manajerial, analitis, kreatif, komunikasi, layanan
- [ ] Konteks section: Experience, Projects, Organisasi, Volunteer
- [ ] Tiap entri: kata kerja, kategori, konteks, pola kalimat contoh
- [ ] **Target: 50–100 kata kerja** yang divalidasi dari CV Indonesia nyata (riset R3)
- [ ] TODO: apakah kata kerja Bahasa Inggris memakai katalog terpisah atau dipetakan?

## 5. Struktur berkas locale

```text
src/content/locales/
├── id/
│   ├── ui.json                    # label antarmuka
│   ├── education-guidance.json    # micro-copy IPK dan status
│   ├── ats-warnings.json          # pesan penegakan aturan mode
│   ├── action-verbs.json          # Pilar 3
│   ├── examples.json              # contoh penulisan
│   └── validation-messages.json
└── en/
    └── ...
```

- [ ] Perilaku fallback ketika kunci hilang
- [ ] Aturan pluralisasi
- [ ] Format tanggal per locale
- [ ] **Aturan:** micro-copy khas Indonesia otomatis nonaktif saat locale = `en`

## 6. Kata dan frasa yang dilarang
- [ ] Rujuk `../00-project-context/glossary.md` §6
- [ ] Tambahkan pemeriksaan lint untuk frasa terlarang di berkas locale

## 7. Proses menambah bahasa baru
- [ ] Yang wajib diterjemahkan versus yang khusus locale
- [ ] Siapa yang meninjau
- [ ] Cara menangani locale yang belum lengkap
