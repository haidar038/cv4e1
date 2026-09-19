# Dokumentasi cv4every1

Ditulis sebelum implementasi agar manusia dan agen AI membangun di atas kontrak yang stabil dan eksplisit.

**Bahasa:** Bahasa Indonesia. Identifier teknis, ID requirement, dan potongan kode tetap dalam Bahasa Inggris.

---

## Mulai dari sini

Jika Anda baru, baca berurutan:

1. [`00-project-context/vision.md`](00-project-context/vision.md) — **sumber kebenaran tertinggi**
2. [`00-project-context/problem-statement.md`](00-project-context/problem-statement.md)
3. [`00-project-context/competitor-research.md`](00-project-context/competitor-research.md)
4. [`00-project-context/assumptions-and-constraints.md`](00-project-context/assumptions-and-constraints.md)
5. [`../AGENTS.md`](../AGENTS.md) — aturan operasional

Untuk pertanyaan spesifik, pakai [`context-map.md`](context-map.md).

## Struktur

| Folder | Isi | Status |
| :-- | :-- | :-- |
| `00-project-context/` | Visi, masalah, pengguna, kompetitor, glosarium, batasan | ✅ Lengkap |
| `01-product/` | PRD, roadmap, persona, journey, katalog fitur, lokalisasi | 📝 Outline |
| `02-requirements/` | SRS, use case, acceptance criteria, traceability | 📝 Outline |
| `03-architecture/` | PDD, C4, data flow, state, rendering, deployment | 📝 Outline |
| `04-data/` | Domain model, schema, storage, impor/ekspor, migrasi | 📝 Outline + JSON Schema |
| `05-ai/` | Spec AI, provider, prompt, grounding, fallback, evaluasi | 📝 Outline |
| `06-security/` | Threat model, privasi, requirement keamanan, abuse case | 📝 Outline |
| `07-quality/` | Strategi test, test ATS, aksesibilitas, performa, matriks | 📝 Outline |
| `08-delivery/` | CI/CD, rilis, deployment, rollback, runbook | 📝 Outline |
| `adr/` | Architecture decision records | ✅ Tujuh ADR |

## Hierarki dokumen

Ketika dokumen bertentangan, urutan kewenangan:

```text
1. vision.md                    ← prinsip, non-goals
2. assumptions-and-constraints  ← batasan HARD
3. adr/                         ← keputusan dan alasannya
4. srs.md                       ← requirement yang dapat diuji
5. sisanya
```

Kontradiksi adalah bug. Laporkan, jangan tebak.

## Urutan pengerjaan yang disarankan

**Tahap 1 — sebelum coding**
`vision.md` · `problem-statement.md` · `competitor-research.md` · `prd.md` · `srs.md` · `architecture-overview.md` · `resume-schema.md` · `json-schema.json` · `local-storage-strategy.md` · ADR-0001 · ADR-0002 · `AGENTS.md`

**Tahap 2 — sebelum MVP**
`rendering-architecture.md` · `import-export-spec.md` · `ats-test-plan.md` · `test-strategy.md` · `accessibility-plan.md` · `threat-model.md` · `privacy-and-data-handling.md` · `production-checklist.md`

**Tahap 3 — sebelum AI**
`ai-product-spec.md` · `ai-provider-strategy.md` · `prompt-specification.md` · `structured-output-spec.md` · `hallucination-policy.md` · `ai-fallback-strategy.md` · `evaluation-dataset.md` · ADR-0006

**Tahap 4 — sebelum produksi**
Seluruh `08-delivery/` · `browser-device-matrix.md` · `dependency-policy.md` · traceability matrix final · test migrasi

## Konvensi

- **Status** di kepala tiap dokumen menunjukkan seberapa lengkap isinya
- `- [ ]` menandai yang belum ditulis
- `TODO:` menandai keputusan yang belum diambil
- ID requirement (`FR-001`, `NFR-001`) bersifat stabil dan tidak pernah didaur ulang
- ADR bersifat append-only
