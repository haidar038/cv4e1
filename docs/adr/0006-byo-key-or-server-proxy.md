# ADR-0006: BYO-key versus proxy server

- **Status:** **Proposed** — belum diputuskan
- **Date:** 2026-09-15
- **Decision owner:** Maintainer proyek
- **Depends on:** ADR-0005
- **Needed by:** Awal Fase 2

## Context

ADR-0005 menetapkan AI sebagai opsional. Yang belum diputuskan adalah bagaimana permintaan AI sampai ke penyedia.

Ketegangannya nyata. BYO-key menjaga biaya nol dan privasi maksimal, tetapi mengharuskan pengguna mendaftar ke penyedia AI dan menyalin API key — hambatan yang hampir pasti akan menghentikan sebagian besar pengguna sasaran kami. Proxy yang dihosting membuat fitur terasa mulus, tetapi memperkenalkan server, yang bertentangan dengan ADR-0001.

Batasan yang mengikat apa pun pilihannya: tanpa kunci di bundel (C-T2), tanpa kunci di ekspor (FR-110), persetujuan eksplisit sebelum data dikirim (FR-402).

## Options

### 1. Hanya BYO-key
Pengguna memasukkan API key mereka sendiri.

- Biaya nol, tanpa server, privasi maksimal, tanpa risiko penyalahgunaan bagi kami
- Hambatan tinggi; sebagian besar pengguna sasaran tidak akan melakukannya
- Pengguna harus mengelola kunci dan memahami risikonya

### 2. Proxy yang dihosting maintainer
Kami menjalankan endpoint tipis yang menyimpan kunci.

- Mulus bagi pengguna; fitur benar-benar terpakai
- Memperkenalkan server — bertentangan dengan ADR-0001
- Biaya, rate limiting, dan pencegahan penyalahgunaan menjadi tanggung jawab kami
- Data resume melewati infrastruktur kami, melemahkan klaim privasi yang dapat diverifikasi

### 3. Proxy opsional yang dihosting sendiri
Kami menyediakan kodenya; siapa pun (misalnya career center kampus) dapat menghostingnya untuk penggunanya.

- Aplikasi inti tetap tanpa server
- Kampus atau komunitas dapat menyediakan akses bagi mahasiswanya
- Kompleksitas lebih tinggi; beban dukungan bagi penghost
- Sedikit yang akan benar-benar menghostingnya

### 4. BYO-key sekarang, tinjau ulang nanti
Kirim BYO-key pada Fase 2. Amati apakah hambatannya benar-benar menghentikan orang. Tinjau ulang dengan bukti.

## Decision

**Belum diputuskan.** Usulan condong ke **Opsi 4**.

Alasan usulan: opsi ini mempertahankan seluruh batasan yang ada, dapat dikirim paling cepat, dan menunda keputusan yang tidak punya cukup bukti hingga ada bukti. Jika hambatan BYO-key terbukti fatal, Opsi 3 menjadi jalur berikutnya yang paling masuk akal karena tidak memaksa kami mengoperasikan server.

## Consequences

**Jika Opsi 4 diambil**
- Positif: tanpa server, tanpa biaya, seluruh batasan terjaga, dapat dikirim cepat
- Negatif: adopsi fitur AI kemungkinan besar rendah; kami tidak akan tahu apakah fitur ini bernilai
- Negatif: tanpa analytics, "amati apakah hambatannya menghentikan orang" sulit diukur — **ini kelemahan nyata usulan ini dan perlu diselesaikan sebelum keputusan difinalkan**

**Apa pun pilihannya**
- Kunci tidak pernah masuk bundel, repositori, atau ekspor
- Persetujuan eksplisit sebelum pengiriman pertama
- Fallback statis tetap wajib

## Open questions

- [ ] Bagaimana mengukur adopsi fitur AI tanpa analytics?
- [ ] Apakah ada career center kampus yang benar-benar bersedia menghosting proxy?
- [ ] Apakah penyedia model lokal (Ollama) membuat masalah ini kurang relevan untuk sebagian pengguna?
- [ ] Jika proxy pernah ada, apakah ADR-0001 perlu diperbarui atau digantikan?
