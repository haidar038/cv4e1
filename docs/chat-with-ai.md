<!-- Sesi chat dengan AI untuk CV4EVERY1 -->

# Question 1
---
Aku butuh riset data tools internet yang worth it untuk kebutuhan semua orang khususnya fresh graduate. Soalnya aku mau bikin platform cv/resume maker atau generator dengan 2 versi, yaitu creative dan ATS dengan konsep dan pendekatan yang proper dan ramah untuk tim HR. Tapi aku mau bikin platform yang gratisan, namanya cv4every1, tidak perlu login, datanya kesimpan di local, support offline dan PWA, kalo mau dijadiin draft tinggal simpan filenya di local terus diimport lagi kalo perlu. Poinnya, sebelum memulai membangun, aku butuh riset dulu, supaya jangan sampai ketika aku udah bangun nanti, padahal udah ada yang buat di luar sana. Aku udah coba cari tau dan sedikit riset lewat google, dan dapat 3 platform utama yang open-source dan public use. Yaitu:
1. OpenResume: [https://www.open-resume.com/](https://www.open-resume.com/)
2. Oh My CV!: [https://github.com/Renovamen/oh-my-cv](https://github.com/Renovamen/oh-my-cv) or [https://ohmycv.app/](https://ohmycv.app/)
3. Resumify: [https://resumify-by-afif.netlify.app/](https://resumify-by-afif.netlify.app/) or [https://github.com/Afif718/Resumify](https://github.com/Afif718/Resumify)

Konsepnya sudah sangat mirip, tapi setelah aku telusuri lebih jauh, ternyata ada celah, yaitu masalah optimasi switcher engine "Dual-Engine Switcher (ATS & Creative dalam Satu Data)", edukasi bahasa, dan fitur tambahan untuk Built-in "Action-Verbs" Generator (Offline & Tanpa API Berbayar).

A. Dual-Engine Switcher (ATS & Creative dalam Satu Data)
Kondisi Kompetitor: Aplikasi lain biasanya memaksa pengguna memilih satu templat dari awal. Jika ingin ganti dari ATS ke Creative, mereka harus mendesain ulang atau mengetik ulang.
Peluang cv4every1: Pengguna cukup mengisi satu form data yang sama. Cukup dengan satu klik tombol toggle, data tersebut langsung otomatis diubah ke Layout ATS (1 kolom, teks murni) ATAU ke Layout Creative (dengan foto, aksen warna, dan kolom ganda).

B. Edukasi Berbahasa Indonesia & Lokalisasi Kampus
Kondisi Kompetitor:Semua platform local-first di atas menggunakan bahasa Inggris dan tidak ramah terhadap kebiasaan pelamar Indonesia.
Peluang cv4every1: Berikan panduan mikro (micro-copy) berbahasa Indonesia saat form diisi. Misalnya:
- Saat mengisi bagian Education, beri saran otomatis format IPK Indonesia (misal: 3.50 / 4.00).
- Beri peringatan langsung di layar: "Peringatan: Versi ATS dilarang memakai foto profile. Foto Anda otomatis disembunyikan di versi ini agar ramah HR."

C. Built-in "Action Verbs" Generator (Offline & Tanpa API Berbayar)
- Kondisi Kompetitor: Generator CV lain mulai mengintegrasikan AI (seperti ChatGPT API) yang mewajibkan pengguna membayar atau memasukkan API Key.
- Peluang cv4every1: Karena berjalan offline, Anda bisa menanamkan pustaka kata kerja aksi lokal (kamus data statis) di dalam kode Anda. Ketika fresh graduate kebingungan menulis deskripsi kerja, mereka bisa mengeklik rekomendasi kata operasional yang disukai HR Indonesia, seperti: "Meningkatkan", "Mengkoordinasikan", "Mendesain", atau "Mengoptimalkan".
---

# Answer 1
---
Riset kamu sudah sangat solid—dan memang ada celah nyata yang bisa kamu isi dengan **cv4every1**. Berikut rangkuman ekosistem tools open-source/global, posisi kompetitor utama, dan validasi peluang unik kamu (dual-engine, lokalisasi Indonesia, action-verbs offline). [github](https://github.com/Afif718/Resumify)

## Peta kompetitor open-source & public-use (2025–2026)

Berikut tools yang paling relevan dengan konsep “local-first, no login, PWA, offline” yang kamu targetkan:

- **OpenResume** (open-resume.com) — builder + parser ATS, fokus best practice US, single-column, tanpa foto profil, data lokal di browser, no sign-up. [dev](https://dev.to/srbhr/5-open-source-resume-builders-thatll-help-get-you-hired-in-2026-1b92)
- **Oh My CV!** (ohmycv.app) — editor Markdown + CSS, multi-resume, real-time preview, export PDF, data lokal, no login, open-source. [relocateme.substack](https://relocateme.substack.com/p/free-and-open-source-resume-tools)
- **Resumify** (resumify-by-afif.netlify.app) — 6 template, full customization, JSON import/export, offline setelah load pertama, zero backend. [github](https://github.com/Afif718/Resumify)
- **Reactive Resume** (rxresu.me) — 18+ template, unlimited resumes, drag-and-drop, multi-bahasa, PDF export, self-hostable via Docker, privacy-first. [hireflow](https://hireflow.net/blog/open-source-ats-checker-do-free-self-hosted-options-exist)
- **easycv** (easycv.vedwix.com) — 12 template (7 profesional, 5 kreatif), PWA, localStorage, AI opsional (BYO key), JD matcher, polish panel, export PDF/PNG/JSON. [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **StackResume / Persona / Local-first generators** — beberapa mengarah ke AI lokal (Ollama) atau self-hosted, tapi banyak yang tetap butuh konfigurasi server/API. [hub.docker](https://hub.docker.com/r/sathvikrao/stackresume)

Secara fitur inti (no login, local storage, PWA, offline), konsep kamu **sudah ada presedennya**. Namun, detail diferensiasi kamu (dual-engine ATS↔Creative dari satu data, lokalisasi Indonesia, action-verbs statis offline) masih jarang—bahkan hampir tidak ada yang menggabungkan ketiganya. [github](https://github.com/Afif718/Resumify)

## Validasi celah unik cv4every1

### A. Dual-Engine Switcher (ATS & Creative dalam Satu Data)
- **Kondisi pasar:** Mayoritas builder meminta kamu memilih template di awal; ganti template = ubah layout, kadang harus edit ulang bagian tertentu. Beberapa (mis. easycv, Reactive Resume) memang bisa ganti template tanpa kehilangan data, tapi tidak ada yang secara eksplisit menawarkan **toggle “ATS vs Creative”** dengan aturan HR yang berbeda (mis. foto otomatis disembunyikan di mode ATS). [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **Peluang kamu:** Satu form data → satu klik toggle → render dua “engine” layout:
  - **ATS:** 1 kolom, teks murni, no foto, font standar, heading konsisten, urutan section sesuai best-practice ATS. [dev](https://dev.to/srbhr/5-open-source-resume-builders-thatll-help-get-you-hired-in-2026-1b92)
  - **Creative:** 2 kolom/aksen warna/foto profil/ikon, tetap terstruktur tapi lebih visual. [vitaekit](https://vitaekit.com/resume-templates/creative)
- **Kenapa ini penting:** HR Indonesia sering menerima CV kreatif dari pelamar, tapi banyak ATS (Workday, Greenhouse, Lever) lebih aman dengan single-column. Dengan toggle, pengguna tidak perlu “milih sisi”; mereka cukup siapkan satu data, lalu sesuaikan output sesuai channel lamaran. [dev](https://dev.to/srbhr/5-open-source-resume-builders-thatll-help-get-you-hired-in-2026-1b92)

### B. Edukasi Berbahasa Indonesia & Lokalisasi Kampus
- **Kondisi pasar:** Tools global (OpenResume, Reactive Resume) menargetkan pasar US/global dan menggunakan bahasa Inggris. Bahkan builder “gratis” yang populer jarang menyediakan micro-copy berbahasa Indonesia atau panduan format pendidikan Indonesia (IPK, predikat, status “on progress”). [edenai](https://www.edenai.co/post/top-free-resume-parser-tools-apis-and-open-source-models)
- **Peluang kamu:** Micro-copy kontekstual di form:
  - **Education:** Saran format IPK Indonesia (mis. `IPK: 3.50 / 4.00`), peringatan jika lupa menyertakan skala, contoh penulisan “Lulus (menunggu wisuda)” atau “On progress – skripsi selesai”. [masoemuniversity.ac](https://masoemuniversity.ac.id/artikel/cara-cantumkan-ipk-di-cv-kapan-harus-ditulis-dan-kapan-lebih-baik-tidak-dicantumkan/)
  - **ATS warning:** “Peringatan: Versi ATS dilarang memakai foto profil. Foto Anda otomatis disembunyikan di versi ini agar ramah HR.” Ini sangat berguna karena banyak pelamar Indonesia terbiasa mencantumkan foto. [open-resume](https://www.open-resume.com/)
  - **Bahasa:** Pilihan bahasa Indonesia/Inggris dengan contoh kalimat ringkas yang disukai HR lokal (mis. “Bertanggung jawab atas…”, “Berhasil meningkatkan…”). [apps.apple](https://apps.apple.com/id/app/cv-maker-lamaran-kerja-pdf/id6740196922?l=id&platform=watch)
- **Kenapa ini penting:** Fresh graduate Indonesia sering bingung format IPK, cara menulis status pendidikan, dan apakah foto boleh dipakai. Panduan mikro mengurangi kesalahan format yang berujung pada reject ATS atau kesan kurang profesional. [masoemuniversity.ac](https://masoemuniversity.ac.id/artikel/cara-cantumkan-ipk-di-cv-kapan-harus-ditulis-dan-kapan-lebih-baik-tidak-dicantumkan/)

### C. Built-in “Action Verbs” Generator (Offline & Tanpa API Berbayar)
- **Kondisi pasar:** Banyak builder mulai integrasi AI (ChatGPT, Claude, dll.) untuk “polish bullet points”, tapi ini biasanya memerlukan API key/berbayar atau koneksi internet. Beberapa tool menawarkan “polish panel” atau saran kata kerja, tapi jarang yang benar-benar offline dengan kamus statis. [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **Peluang kamu:** Tanamkan pustaka kata kerja aksi lokal (JSON statis) di dalam kode:
  - Kategori: **Meningkatkan, Mengkoordinasikan, Mendesain, Mengoptimalkan, Memimpin, Menganalisis**, dll.
  - Konteks: saran kata kerja per section (Experience vs Projects vs Organisasi), plus contoh frasa singkat yang HR Indonesia kenal. [jobshinobi](https://www.jobshinobi.com/blog/ats-optimized-resume-for-career-switch-example)
  - Offline: karena data statis, tidak perlu API, cocok untuk PWA yang berjalan tanpa internet setelah load pertama. [github](https://github.com/Afif718/Resumify)
- **Kenapa ini penting:** Fresh graduate sering menulis deskripsi tugas (“Bertugas membuat…”) tanpa dampak. Generator action-verbs membantu mereka menulis bullet berorientasi hasil, yang lebih disukai HR dan ATS. [relocateme.substack](https://relocateme.substack.com/p/free-and-open-source-resume-tools)

## Apakah sudah ada yang membuat “dual-engine + lokal + action verbs offline”?

- **Dual template dari satu data:** Ada (Reactive Resume, easycv, beberapa builder komersial), tapi **tidak ada** yang secara eksplisit memposisikan “ATS vs Creative” sebagai dua mode dengan aturan HR berbeda (mis. auto-hide foto di ATS). [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **Lokalisasi Indonesia:** Hampir tidak ada di tools open-source utama. OpenResume justru sengaja fokus ke best practice US (tanpa foto, single-column). [open-resume](https://www.open-resume.com/)
- **Action verbs generator offline:** Ada fitur “AI polish” di beberapa tool, tapi kebanyakan butuh API/online. Konsep kamus statis offline untuk bahasa Indonesia masih jarang. [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)

Jadi, **cv4every1 punya ruang diferensiasi yang jelas**, terutama untuk segmen fresh graduate Indonesia yang butuh panduan format, kepatuhan ATS, dan bantuan kata kerja tanpa bayar. [github](https://github.com/Afif718/Resumify)

## Rekomendasi arsitektur fitur (supaya tidak “terbangun tapi sudah ada”)

Agar tidak tumpang tindih dengan kompetitor, pertahankan inti “local-first” kamu, tapi tekankan tiga pilar ini:

- **Dual-Engine Switcher:** Implementasikan sebagai dua “renderer” berbeda yang membaca satu state data. Mode ATS mengikuti aturan ketat (single-column, no foto, heading konsisten). Mode Creative bebas visual tapi tetap terstruktur. [dev](https://dev.to/srbhr/5-open-source-resume-builders-thatll-help-get-you-hired-in-2026-1b92)
- **Micro-copy Indonesia:** Tambahkan tooltip/panduan di form (Education, Experience, Skills) dengan contoh format IPK (`3.50 / 4.00`), status pendidikan, dan peringatan ATS (foto). Ini akan jadi pembeda kuat vs tools global. [masoemuniversity.ac](https://masoemuniversity.ac.id/artikel/cara-cantumkan-ipk-di-cv-kapan-harus-ditulis-dan-kapan-lebih-baik-tidak-dicantumkan/)
- **Action Verbs Statis Offline:** Buat file JSON lokal berisi kata kerja aksi + contoh frasa, dikategorikan per konteks. Tampilkan sebagai saran saat pengguna mengetik bullet. Pastikan tidak butuh API. [github](https://github.com/Afif718/Resumify)

## Risiko & cara mitigasi

- **Fitur “ganti template tanpa kehilangan data” sudah ada:** Mitigasi dengan menekankan **mode ATS vs Creative** (bukan sekadar ganti tema), plus aturan HR (auto-hide foto, peringatan format). [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **AI resume builder makin murah:** Mitigasi dengan tetap **offline-first** dan fokus pada **panduan mikro + kamus statis**, bukan AI generatif. Ini lebih ringan, privasi terjaga, dan cocok untuk pengguna dengan koneksi terbatas. [hub.docker](https://hub.docker.com/r/sathvikrao/stackresume)
- **Kompetitor bisa menambah bahasa:** Mitigasi dengan mendalam pada **konteks Indonesia** (IPK, predikat, status pendidikan, budaya CV berfoto), bukan sekadar terjemahan UI. [masoemuniversity.ac](https://masoemuniversity.ac.id/artikel/cara-cantumkan-ipk-di-cv-kapan-harus-ditulis-dan-kapan-lebih-baik-tidak-dicantumkan/)

## Langkah riset lanjutan (sebelum coding)

- **Uji parser ATS:** Coba upload CV hasil export dari OpenResume/Reactive Resume ke parser mereka, lihat apa yang terdeteksi (heading, skills, experience). Ini membantu kamu merancang mode ATS yang benar-benar ramah parser. [dev](https://dev.to/srbhr/5-open-source-resume-builders-thatll-help-get-you-hired-in-2026-1b92)
- **Kumpulkan contoh CV Indonesia:** Ambil 10–20 CV fresh graduate (dari LinkedIn, job board, atau komunitas) untuk memetakan variasi format IPK, penulisan pendidikan, dan penggunaan foto. Ini jadi dasar micro-copy kamu. [masoemuniversity.ac](https://masoemuniversity.ac.id/artikel/cara-cantumkan-ipk-di-cv-kapan-harus-ditulis-dan-kapan-lebih-baik-tidak-dicantumkan/)
- **Buat daftar action verbs lokal:** Mulai dari 50–100 kata kerja aksi yang sering muncul di CV Indonesia, lalu kategorikan (teknis, manajerial, kreatif, analitis). Uji ke 5–10 fresh graduate: apakah saran ini membantu mereka menulis bullet lebih kuat? [relocateme.substack](https://relocateme.substack.com/p/free-and-open-source-resume-tools)

Jika kamu ingin, saya bisa bantu menyusun **spesifikasi fitur detail** (termasuk skema data JSON resume, aturan render ATS vs Creative, dan struktur JSON action-verbs) agar tim engineer bisa langsung implement tanpa ambigu.
---

# Question 2
---
Nah, aku juga pengen nambahin fitur yang terintegrasi langsung dengan AI "gratis", misalnya dari GROQ. Tapi aku belum tau arahnya bakal kemana, entah potensinya bakalan jadi OCR doang, atau AI builder ramah berdasarkan data diri yang kita punya saat ini (yang seadanya). Gimana menurut kamu? Rekomendasi skema seperti apa yang paling tepat untuk pengadaan fitur dengan AI Integration ini?
---

# Answer 2
---
Ide bagus—tapi supaya cv4every1 tetap “gratis, lokal, tanpa login”, integrasi AI harus dirancang dengan **prinsip: AI sebagai pelengkap opsional, bukan syarat utama**. Berikut skema paling tepat berdasarkan kondisi 2026 (Groq free tier ada, tapi ada limit; OCR & parser gratis terbatas; banyak tool AI resume yang akhirnya berbayar). [github](https://github.com/mdruhulkuddus/awesome-free-ai-tools)

## Prinsip desain AI untuk cv4every1

- **Offline-first tetap jadi default.** Semua fitur inti (form, dual-engine, action-verbs statis) harus jalan tanpa internet. AI hanya muncul sebagai “boost” saat pengguna online. 
- **BYO-key (Bring Your Own Key).** Jangan embed API key di frontend. Biarkan pengguna tempel API key Groq mereka sendiri (atau provider lain) jika mau pakai fitur AI. Ini menjaga privasi, menghindari biaya server, dan mencegah abuse. [github](https://github.com/Afif718/Resumify)
- **Fallback statis.** Setiap fitur AI harus punya fallback non-AI (kamus statis, template kalimat, rule-based). Jadi kalau pengguna tidak punya key/key habis/limit tercapai, mereka tetap dapat nilai. 

## Opsi use-case AI yang paling “worth it” untuk fresh graduate

Berdasarkan tren 2026, tiga use-case ini paling relevan dan realistis:

### 1) AI Bullet Points Generator (berdasarkan data yang “seadanya”)
- **Masalah pengguna:** Fresh graduate sering hanya punya daftar tugas (“Bertugas membuat laporan”, “Menginput data”), tanpa dampak/angka.
- **Solusi AI:** Pengguna masukkan 1–2 kalimat tugas → AI kembalikan 2–3 bullet berorientasi hasil dengan action verb + placeholder metrik. Contoh: “Meningkatkan akurasi laporan bulanan dari X% menjadi Y%” (tanpa mengarang angka). [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
- **Kenapa Groq cocok:** Latensi rendah, free tier cukup untuk tugas pendek (30 RPM, limit harian bervariasi per model). Cocok untuk generate 3–5 bullet per sesi. [klymentiev](https://klymentiev.com/blog/groq-pricing)
- **Fallback:** Jika tidak ada key, tampilkan saran dari kamus action-verbs statis + template kalimat (“[Action verb] [tugas] sehingga [dampak], contoh: Meningkatkan akurasi laporan bulanan…”). 

### 2) AI “Polish & Localize” (Bahasa Indonesia ↔ Inggris, gaya HR)
- **Masalah pengguna:** Banyak fresh graduate bingung menulis dalam Bahasa Indonesia yang formal vs Inggris yang ATS-friendly.
- **Solusi AI:** Satu klik “Polish (ID)” atau “Translate to English (ATS)” → AI menyesuaikan gaya kalimat, menghindari kata pasif berlebihan, dan memastikan konsistensi istilah (mis. “IPK” vs “GPA”). 
- **Kenapa ini bernilai:** Tools global jarang paham konteks Indonesia (IPK, predikat, status “on progress”). AI bisa membantu menstandarkan tanpa menghapus data asli. 
- **Fallback:** Berikan panduan mikro statis (contoh kalimat, daftar frasa yang disarankan/dihindari) tanpa AI. 

### 3) OCR / Import dari CV Lama (opsional, bukan inti)
- **Masalah pengguna:** Sebagian pengguna sudah punya CV PDF/gambar dan ingin migrasi ke cv4every1 tanpa ketik ulang.
- **Solusi AI:** Upload PDF/image → OCR + LLM ekstrak ke JSON resume (nama, pendidikan, pengalaman, skills). [relocateme.substack](https://relocateme.substack.com/p/free-and-open-source-resume-tools)
- **Catatan penting:** OCR + parsing akurat itu sulit (terutama CV kreatif). Free tier API parser biasanya terbatas (50–100 dokumen/bulan) dan banyak yang berbayar untuk produksi. [kickresume](https://www.kickresume.com/en/ai-resume-bullet-point-generator/)
- **Rekomendasi:** Jadikan **opsional** dan **eksperimental**. Fokus utama tetap form manual + import JSON. Jika mau OCR, arahkan pengguna ke tool eksternal (mis. Affinda free tier, ParserBee) lalu import JSON hasilnya ke cv4every1. [weekday](https://www.weekday.works/resume-bullet-rewriter)

## Skema integrasi Groq yang aman & scalable

Agar tidak jebol di limit dan tetap privat:

- **Frontend-only call (no backend).** Simpan API key di localStorage pengguna (terenkripsi sederhana), panggil Groq langsung dari browser. Data tidak lewat server kamu. [github](https://github.com/Afif718/Resumify)
- **Model choice berdasarkan tugas:**
  - **Bullet points & polish:** Gunakan model kecil/cepat (mis. `llama-3.1-8b-instant`) untuk hemat token & latensi rendah. [klymentiev](https://klymentiev.com/blog/groq-pricing)
  - **Dokumen panjang (opsional):** Jika nanti ada fitur “tailor ke JD”, gunakan model lebih besar (`llama-3.3-70b` atau `llama-4-scout`) tapi batasi panjang input/output. [klymentiev](https://klymentiev.com/blog/groq-pricing)
- **Rate limit awareness:** Tampilkan indikator “Sisa kuota AI hari ini” berdasarkan estimasi request (mis. 5 generate bullet = 5 request). Jika limit tercapai, tawarkan fallback statis. [klymentiev](https://klymentiev.com/blog/groq-pricing)
- **Prompt template terkontrol:** Jangan biarkan prompt terlalu bebas. Buat template internal yang:
  - Meminta output dalam format terstruktur (mis. JSON array bullet).
  - Melarang mengarang angka (gunakan placeholder `[X%]`, `[jumlah]`).
  - Menjaga gaya bahasa Indonesia formal/ATS-friendly. [github](https://github.com/Afif718/Resumify)

## Contoh flow UX yang ramah fresh graduate

1. **Default (tanpa AI):** Pengguna isi form → lihat preview ATS/Creative → download PDF. 
2. **Opsional (dengan Groq key):**
   - Klik “✨ Perbaiki dengan AI” di section Experience.
   - Tempel 1–2 kalimat tugas → pilih “Generate 3 bullet”.
   - AI kembalikan 3 opsi bullet → pengguna pilih/edit → simpan. [linkedin](https://www.linkedin.com/posts/theanishpandey_opensource-nextjs-typescript-activity-7461053197638352896-cdhT)
3. **Fallback:** Jika tidak ada key/limit habis → tampilkan 5–10 saran bullet dari kamus statis (action verbs + template). 

## Apa yang sebaiknya dihindari

- **AI sebagai syarat fitur inti.** Jangan paksakan pengguna pakai AI untuk bisa download PDF atau ganti template. Ini akan mengurangi aksesibilitas dan bertentangan dengan misi “cv4every1”. 
- **OCR sebagai fitur utama.** Akurasi OCR untuk CV kreatif rendah, dan free tier API terbatas. Lebih baik fokus ke form + import JSON. [kickresume](https://www.kickresume.com/en/ai-resume-bullet-point-generator/)
- **Embed API key di repo.** Risiko disalahgunakan, kuota habis, dan biaya tak terduga. Gunakan BYO-key. [github](https://github.com/Afif718/Resumify)

## Rekomendasi akhir: skema paling tepat

- **Fase 1 (MVP):** Dual-engine + lokalisasi Indonesia + action-verbs statis (tanpa AI). Ini sudah jadi diferensiasi kuat vs kompetitor. 
- **Fase 2 (AI opsional):** Tambahkan “AI Bullet Points Generator” & “AI Polish (ID/EN)” dengan Groq BYO-key, model kecil, prompt terkontrol, fallback statis. [klymentiev](https://klymentiev.com/blog/groq-pricing)
- **Fase 3 (Eksperimen):** OCR/import dari CV lama sebagai fitur opsional, mungkin via integrasi tool eksternal + import JSON, bukan parser built-in. [relocateme.substack](https://relocateme.substack.com/p/free-and-open-source-resume-tools)

Dengan skema ini, cv4every1 tetap **gratis, lokal, dan inklusif**, sambil memberi opsi “boost AI” bagi yang mau—tanpa mengorbankan privasi atau keberlanjutan proyek. [klymentiev](https://klymentiev.com/blog/groq-pricing)
---