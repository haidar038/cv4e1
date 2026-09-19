# ADR-0003: JSON sebagai format portabel

- **Status:** Accepted
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek
- **Depends on:** ADR-0001

## Context

Tanpa backend dan tanpa sinkronisasi (ADR-0001), berkas ekspor adalah satu-satunya cara pengguna memindahkan CV antarperangkat dan satu-satunya cadangan yang mereka miliki.

Ini membuat format ekspor menjadi lebih penting daripada di aplikasi biasa: ia adalah mekanisme pemulihan, bukan fitur kenyamanan.

Format ini juga menggantikan sebagian fungsi database — ia mendefinisikan bentuk data, menjaga kompatibilitas, dan menjadi kontrak antar-renderer.

## Options

1. **JSON dengan versi schema**
2. **Format biner kepemilikan**
3. **Markdown atau YAML**
4. **Arsip zip berisi JSON dan aset**

## Decision

**JSON** dengan `schemaVersion` eksplisit, ekstensi `.cv4e.json`, dan JSON Schema yang terdokumentasi publik.

Dua jenis ekspor: dokumen resume tunggal, dan cadangan penuh. **Tidak satu pun pernah memuat API key.**

## Consequences

**Positif**
- Dapat dibaca manusia; pengguna dapat memeriksa apa yang mereka simpan
- Dapat dibaca alat lain; mendukung interoperabilitas
- Sepele untuk divalidasi lewat JSON Schema
- Mudah diuji: round-trip, migrasi, fixture
- Dapat dibuka kembali sebagian bahkan jika aplikasi kami hilang — ini penting secara etis untuk alat yang memegang hasil kerja orang
- Dukungan bawaan di seluruh peramban tanpa dependensi

**Negatif**
- Lebih besar daripada format biner (tidak bermasalah pada skala ini)
- Menyematkan foto sebagai base64 menggembungkan berkas secara signifikan
- Format menjadi kontrak publik; mengubahnya berarti mengubah API publik
- Pengguna dapat mengedit berkas secara manual dan merusaknya — validasi harus ramah

**Kewajiban yang ditimbulkan**
- Kebijakan migrasi wajib ada (`migration-policy.md`)
- Uji round-trip pada setiap fixture, setiap rilis
- Aturan field tak dikenal harus diputuskan sebelum format dianggap stabil

## Rejected alternatives

**Format biner kepemilikan** bertentangan langsung dengan prinsip portabilitas (P6). Ia mengunci pengguna pada aplikasi kami, dan pada aplikasi yang memegang satu-satunya salinan CV seseorang, itu tidak dapat diterima.

**Markdown atau YAML** ambigu untuk data terstruktur berlapis. YAML khususnya punya sejarah kejutan parsing yang buruk untuk input yang tidak tepercaya.

**Arsip zip** menyelesaikan masalah penyematan aset dengan rapi, tetapi menambah dependensi, menghilangkan keterbacaan manusia, dan mempersulit inspeksi. Dapat ditinjau ulang bila penanganan aset terbukti bermasalah — lihat pertanyaan terbuka di `import-export-spec.md` §4.
