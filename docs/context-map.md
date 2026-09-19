# Context Map

Peta dokumen untuk agen AI dan manusia. **Baca yang dibutuhkan task, bukan seluruh pohon `docs/`.**

Membaca segalanya membuang konteks dan meningkatkan risiko agen memakai dokumen usang.

---

## Selalu dibaca

```text
docs/00-project-context/vision.md
AGENTS.md
```

## Menurut jenis pertanyaan

### Pertanyaan produk
*Mengapa fitur ini ada? Haruskah kita membangunnya?*
```text
docs/00-project-context/problem-statement.md
docs/01-product/prd.md
docs/01-product/feature-catalog.md
```

### Pertanyaan pengguna dan copy
*Untuk siapa ini? Bagaimana menulisnya?*
```text
docs/00-project-context/target-users.md
docs/01-product/user-personas.md
docs/01-product/localization-guide.md
docs/00-project-context/glossary.md     (§6 frasa terlarang)
```

### Pertanyaan requirement
*Apa perilaku yang benar? Kapan ini selesai?*
```text
docs/02-requirements/srs.md
docs/02-requirements/acceptance-criteria.md
docs/02-requirements/use-cases.md
```

### Pertanyaan data
*Bentuk datanya bagaimana? Bagaimana menyimpannya?*
```text
docs/04-data/resume-schema.md
docs/04-data/json-schema.json
docs/04-data/local-storage-strategy.md
docs/04-data/import-export-spec.md
docs/04-data/migration-policy.md
```

### Pertanyaan arsitektur
*Di mana kode ini semestinya berada?*
```text
docs/03-architecture/architecture-overview.md
docs/03-architecture/state-management.md
docs/03-architecture/data-flow.md
docs/adr/
```

### Pertanyaan rendering dan PDF
```text
docs/03-architecture/rendering-architecture.md
docs/07-quality/ats-test-plan.md
docs/07-quality/visual-regression-plan.md
```

### Pertanyaan AI
```text
docs/05-ai/ai-product-spec.md
docs/05-ai/hallucination-policy.md
docs/05-ai/prompt-specification.md
docs/05-ai/structured-output-spec.md
docs/05-ai/ai-fallback-strategy.md
```

### Pertanyaan keamanan dan privasi
```text
docs/06-security/threat-model.md
docs/06-security/privacy-and-data-handling.md
docs/06-security/abuse-cases.md
docs/06-security/security-requirements.md
```

### Pertanyaan dependensi
```text
docs/06-security/dependency-policy.md
docs/07-quality/performance-budget.md
```

### Pertanyaan testing
```text
docs/07-quality/test-strategy.md
docs/02-requirements/traceability-matrix.md
docs/04-data/sample-resumes/
```

### Pertanyaan rilis dan deployment
```text
docs/08-delivery/
docs/03-architecture/deployment-architecture.md
```

---

## Paket konteks minimal untuk agen

Ketika konteks terbatas, lima berkas ini memberi cakupan paling luas:

```text
1. AGENTS.md
2. docs/00-project-context/vision.md
3. docs/02-requirements/srs.md
4. docs/04-data/resume-schema.md
5. docs/03-architecture/architecture-overview.md
```

Lalu tambahkan yang khusus dibutuhkan task dari daftar di atas.

---

## Hierarki kewenangan

Ketika dokumen bertentangan:

```text
vision.md  >  assumptions-and-constraints.md  >  adr/  >  srs.md  >  sisanya
```

Kontradiksi adalah bug. Laporkan, jangan tebak mana yang benar.
