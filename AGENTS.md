# AGENTS.md — cv4every1

> Operating instructions for AI agents working on this repository.
> **Read this file completely before making any change.**
> Written in English for agent reliability. Product-facing copy is written in Bahasa Indonesia — see §12.

| Field | Value |
| :-- | :-- |
| Status | Draft v0.2 |
| Last updated | 2026-09-23 |
| Applies to | All AI agents and all contributors |
| Authority | This file is subordinate to `docs/00-project-context/vision.md`. If they conflict, vision.md wins and this file is a bug. |

---

## 1. Mission

Build **cv4every1**: a free, open-source, local-first, offline-capable, no-account CV builder that lets anyone — especially Indonesian fresh graduates — produce both an **ATS** and a **Creative** version of their CV from a single source of data.

Full context: `docs/00-project-context/vision.md`.

---

## 2. Non-negotiable constraints

**These are hard rules. Violating any of them is a defect regardless of how well the feature works.**

### Architecture

1. **No backend database.** No server is required for the app to function.
2. **No mandatory account, login, or email gate** for any feature.
3. **Core features must work offline** once the app shell is installed.
4. **No secrets, API keys, or tokens** in the repository, the bundle, or any committed file.
5. **No runtime third-party scripts** — no analytics, no CDN fonts, no tag managers — unless approved via an ADR.
6. **Deployable as static assets.** If it needs a running server, it is out of scope.

### Data

7. **One canonical model.** `ResumeDocument` is the single source of truth. Both renderers read from it. Nothing else is persisted as truth.
8. **Never send resume data over the network** unless the user has explicitly enabled AI for that specific operation.
9. **CV data lives in IndexedDB.** `localStorage` is for small UI preferences only — never resume content.
10. **Never change the JSON schema without an ADR and a migration path.** Migrations must be deterministic and must never drop user data.
11. **Export and full wipe must always work.** No feature may break either.

### Product integrity

12. **Never invent facts about the user** — no numbers, companies, job titles, certifications, skills, or dates that the user did not provide. Not even if asked.
13. **Suggestion, not mutation.** AI output is always a candidate. `ResumeDocument` does not change until the user clicks Apply.
14. **Every AI capability needs a working non-AI fallback.**
15. **ATS mode enforces rules** — it hides the photo, forces a single column, restricts decoration. A template may never override a mode rule.
16. **Switching modes never alters source data.** The photo stays stored when ATS mode is active; it is simply not rendered.
17. **No ATS guarantees, no CV scores.** Forbidden phrases are listed in `docs/00-project-context/glossary.md` §6.

### If a task asks you to break one of these

**Stop. Do not implement it. Do not find a clever workaround.** Report which constraint the task conflicts with and ask for a decision. A task that requires breaking a hard constraint is either wrong or requires an ADR first.

---

## 3. Context map — read this before you read anything else

Do **not** read the whole `docs/` tree. Read what the task actually needs.

| If the task is about… | Read |
| :-- | :-- |
| **Anything at all (always)** | `docs/00-project-context/vision.md`, this file |
| Why a thing exists, or whether to build it | `docs/00-project-context/problem-statement.md`, `docs/01-product/prd.md` |
| Who it's for, tone, copy | `docs/00-project-context/target-users.md`, `docs/01-product/localization-guide.md` |
| Terminology, naming, identifiers | `docs/00-project-context/glossary.md` |
| What is allowed / forbidden | `docs/00-project-context/assumptions-and-constraints.md` |
| Testable behaviour | `docs/02-requirements/srs.md`, `docs/02-requirements/acceptance-criteria.md` |
| System structure | `docs/03-architecture/architecture-overview.md`, `docs/03-architecture/c4-*.md` |
| State, stores, data flow | `docs/03-architecture/state-management.md`, `docs/03-architecture/data-flow.md` |
| Renderers, templates, PDF | `docs/03-architecture/rendering-architecture.md` |
| Data shape, schema, migration | `docs/04-data/resume-schema.md`, `docs/04-data/json-schema.json`, `docs/04-data/migration-policy.md` |
| Saving, loading, storage limits | `docs/04-data/local-storage-strategy.md` |
| File format, import/export | `docs/04-data/import-export-spec.md` |
| Anything AI | `docs/05-ai/ai-product-spec.md`, `docs/05-ai/hallucination-policy.md`, `docs/05-ai/prompt-specification.md` |
| Security, privacy, abuse | `docs/06-security/threat-model.md`, `docs/06-security/privacy-and-data-handling.md` |
| Adding a dependency | `docs/06-security/dependency-policy.md` |
| Tests | `docs/07-quality/test-strategy.md`, `docs/07-quality/ats-test-plan.md` |
| Accessibility | `docs/07-quality/accessibility-plan.md` |
| Build, release, deploy | `docs/08-delivery/` |
| Why a past decision was made | `docs/adr/` |

A machine-readable version lives at `docs/context-map.md`.

---

## 4. Before you write code

1. **Identify the requirement ID** (`FR-xxx` / `NFR-xxx`) the task serves. If there isn't one, say so and ask — do not invent requirements.
2. **Read the relevant docs** from §3. Only those.
3. **Check `docs/adr/`** for a decision that already covers this ground.
4. **Inspect existing tests and fixtures** before adding new ones. Prefer extending a fixture over creating a near-duplicate.
5. **For any change beyond a small, local edit, propose a plan first** and wait for approval. A plan is: files to touch, approach, risks, tests to add.
6. **Verify Definition of Ready** (§7). If unmet, ask instead of guessing.

---

## 5. While you work

### Scope

- Keep changes small and focused on one requirement.
- Do not refactor unrelated code in the same change.
- Do not reformat files you did not otherwise modify.
- Do not rename things across the codebase without an explicit instruction.
- When a task or milestone completes, tick its acceptance-criteria checkboxes and update its tracking status (`plans/*.md` todos, `roadmap.md`) **in the same change** — completed work must be visible in the checklists, not only in the changelog.

### Code

- TypeScript strict mode. No `any` without a comment explaining why.
- Use identifiers exactly as defined in `docs/00-project-context/glossary.md`. Do not invent synonyms.
- Pure functions for anything data-related — normalization, migration, validation, view-model derivation. These must be testable without a DOM.
- Do not put business rules inside React components. Mode rules (photo hiding, column count) belong in the view-model layer, not in JSX.
- Handle failure paths explicitly. Storage can be full, blocked, or evicted. AI providers time out. Imported files are malformed. None of these may lose a draft.

### Dependencies

- **Do not add a dependency without justification.** Follow `docs/06-security/dependency-policy.md`.
- A new dependency requires: what it does, why it can't be hand-written in reasonable effort, bundle size impact, license, maintenance status, and what happens if it's abandoned.
- Anything that phones home at runtime is rejected by default.

### Data and schema

- Never edit generated files by hand.
- Any change to `ResumeDocument` requires: schema version bump, migration function, migration test, fixture for the old version, ADR.
- Additive optional fields are the preferred change. Renames and removals need strong justification.

### Privacy

- Before writing any network call, ask: does this carry resume data? If yes, is it behind an explicit user-consented AI action? If not, do not write it.
- Never log resume content, even in development builds.
- Never include resume data, real names, or real contact details in fixtures. Use obviously fake data.

---

## 6. Testing requirements

Every change must ship with tests appropriate to what changed.

| Change type | Required tests |
| :-- | :-- |
| Data model or schema | Unit tests for validation; migration test from every supported prior version; round-trip export/import test |
| Renderer or template | Visual regression on all fixtures; ATS mode additionally requires a PDF text-extraction test |
| Form / UI | Component test; keyboard navigation test |
| Storage | Test for quota exceeded, storage blocked, and concurrent tab behaviour |
| Import / export | Malformed input, oversized input, unknown fields, wrong schema version |
| AI feature | Contract test with a mocked provider; malformed-output test; timeout test; **grounding invariant test** (no numbers or entities absent from input); fallback-path test |
| Offline behaviour | End-to-end test with the network disabled |
| Accessibility | Automated audit plus keyboard-only walkthrough of the changed flow |

**Never test AI output against exact strings.** Test invariants. See `docs/07-quality/test-strategy.md`.

---

## 7. Definition of Ready

A task is ready to start when all of these hold:

- [ ] Goal stated in one sentence
- [ ] Linked to a requirement ID
- [ ] Acceptance criteria written and testable
- [ ] Impact on `ResumeDocument` known (none / additive / breaking)
- [ ] Offline impact known
- [ ] Accessibility impact known
- [ ] Privacy impact known — does any data leave the device?
- [ ] Main edge cases listed
- [ ] New dependencies identified, if any

If a criterion is unmet, **ask rather than assume**.

---

## 8. Definition of Done

A task is done when all of these hold:

- [ ] Acceptance criteria met
- [ ] Tests added and passing
- [ ] Lint and type-check pass
- [ ] Production build passes
- [ ] Performance budget still met (`docs/07-quality/performance-budget.md`)
- [ ] Offline behaviour verified, if relevant
- [ ] Import/export round-trip verified, if the schema was touched
- [ ] Migration tested from all supported prior versions, if the schema was touched
- [ ] Accessibility checked on changed surfaces
- [ ] Privacy reviewed — no unintended data egress, nothing logged
- [ ] Docs updated (schema, spec, requirement, whichever applies)
- [ ] Tracking checklists updated — plan todos/AC ticked, `roadmap.md` items marked done
- [ ] ADR added if an architectural decision was made
- [ ] No secrets, PII, or real personal data anywhere in the diff
- [ ] Forbidden phrases (glossary §6) absent from any new user-facing copy

---

## 9. When an ADR is required

Write an ADR in `docs/adr/` before implementing, if the change:

- alters `ResumeDocument` in a breaking way;
- changes where or how data is persisted;
- changes the PDF or rendering pipeline;
- adds or replaces an AI provider, or changes the key-handling model;
- introduces a backend component of any kind;
- adds a runtime third-party dependency or remote asset;
- introduces analytics or telemetry;
- changes the license, or a dependency's license class.

Use the format shown in existing ADRs: Status, Date, Context, Options, Decision, Consequences (positive **and** negative), Rejected alternatives.

**ADRs are append-only.** Never edit an accepted ADR to change its meaning. Supersede it with a new one and mark the old one `Superseded by ADR-XXXX`.

---

## 10. Things you must never do

| Never | Why |
| :-- | :-- |
| Add a backend, database, or required server | C-T1 |
| Commit an API key, token, or `.env` with real values | C-T2 |
| Send resume data anywhere without explicit per-operation consent | C-T3 |
| Generate numbers, employers, titles, or skills the user didn't provide | C-P5 |
| Apply AI output directly to `ResumeDocument` | §2.13 |
| Let a template override an ATS mode rule | §2.15 |
| Store resume content in `localStorage` | C-T7 |
| Add analytics or telemetry | C-T10 |
| Load fonts or scripts from a CDN at runtime | C-T10, C-T11 |
| Rasterize the ATS PDF (html2canvas, screenshot-to-PDF, or similar) | C-T5 — destroys text extraction |
| Write "ATS-compliant", "guaranteed to pass ATS", or any CV score | Glossary §6 |
| Silently drop user data during migration | C-T9 |
| Put real personal data in fixtures or tests | Privacy |
| Edit an accepted ADR to change its meaning | §9 |
| Mark a task done with failing or skipped tests | §8 |

---

## 11. Task specification template

Tasks given to agents should use this shape. If you receive a task that doesn't, reconstruct it and confirm before starting.

```markdown
# Task: <short imperative title>

## Requirement
FR-xxx / NFR-xxx

## Context
<what already exists that this builds on>

## Goal
<one sentence, user-visible outcome>

## Requirements
- <specific, checkable behaviours>

## Non-goals
- <what this task explicitly does not do>

## Acceptance criteria
- [ ] <testable condition>
- [ ] <testable condition>

## Edge cases to handle
- <e.g. storage full, empty section, offline, malformed input>

## Files likely affected
- <paths>

## Docs to read first
- <paths from the context map>
```

---

## 12. Language rules

| Surface | Language |
| :-- | :-- |
| Code, identifiers, types, file names | English |
| Commit messages, PR descriptions | English |
| `docs/**` | Bahasa Indonesia, with English technical terms and IDs kept as-is |
| `AGENTS.md`, `README.md` | English (README has an Indonesian section) |
| **User-facing UI copy** | **Bahasa Indonesia first**, then English. Never machine-translate. |
| Micro-copy, warnings, guidance | Bahasa Indonesia, written to the rules in `docs/01-product/localization-guide.md` |

**Tone for user-facing copy:** guiding, never condescending. The user is likely anxious about job hunting. Warnings are framed as help, not failure.

- Bad: `Error: Foto tidak diperbolehkan.`
- Good: `Versi ATS menyembunyikan foto agar aman dibaca sistem pelacak lamaran. Foto Anda tetap tersimpan dan muncul di versi Creative.`

---

## 13. Commits and pull requests

**Commits:** Conventional Commits.

```
feat(renderer): enforce single column in ATS mode
fix(storage): keep draft intact when quota is exceeded
docs(adr): add ADR-0007 on the PDF pipeline
```

**Pull request description must include:**

- Requirement ID
- What changed and why
- Screenshots or extracted-text output for renderer changes
- Schema impact: none / additive / breaking
- Privacy impact: does any data leave the device?
- Definition of Done checklist, filled honestly

---

## 14. When to stop and ask

Stop and ask rather than proceeding when:

- the task conflicts with a hard constraint in §2;
- the requirement is ambiguous and two readings produce different data shapes;
- the change would need a new dependency you can't justify;
- the change would alter `ResumeDocument` and no migration plan exists;
- an existing ADR appears wrong or outdated;
- you cannot write a test for the behaviour requested;
- the task asks for anything that would make the system state something the user did not;
- docs contradict each other.

**Asking is cheap. A wrong architectural decision propagated across sixty files is not.**

---

## 15. Repository map

```
cv4every1/
├── README.md
├── AGENTS.md              ← you are here
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
├── docs/                  ← see §3
├── schemas/               ← generated JSON Schema; do not hand-edit
├── prompts/               ← versioned AI prompts; never inline in components
├── fixtures/              ← test ResumeDocuments; fake data only
├── e2e/                   ← end-to-end tests
├── scripts/               ← build and validation scripts
└── src/
    ├── core/              ← ResumeDocument, validation, migration (no React)
    ├── storage/           ← IndexedDB adapter, import/export
    ├── render/            ← view models, ATS renderer, Creative renderer
    ├── ai/                ← provider interface and implementations
    ├── content/           ← action verbs catalog, micro-copy, locales
    ├── features/          ← UI grouped by feature
    └── ui/                ← shared primitives
```

> The `src/` layout is proposed, not yet fixed. Confirm against `docs/03-architecture/architecture-overview.md` before relying on it.

---

## 16. Agent response and report format

When responding to the user after completing, attempting, or investigating a task, optimize the response for **human understanding first and technical precision second**.

The reader may be the project maintainer, not the original implementer. Assume they understand software development, but do not assume they know the exact implementation details, internal abstractions, or reasoning used in this task.

The response must be written in **clear Bahasa Indonesia**. English may be used for code symbols, file paths, commands, API names, requirement IDs, and established technical terms.

### 16.1 Explain the result before the implementation

The first explanation must answer:

1. **Apa yang terjadi?**
2. **Apa yang berubah?**
3. **Apa dampaknya bagi project atau user?**
4. **Apakah semuanya sudah berhasil?**

Do not begin with internal implementation details.

Prefer:

> Fitur import sekarang tetap mempertahankan draft ketika file JSON yang dimasukkan tidak valid. Sebelumnya, proses import dapat menghapus draft aktif sebelum validasi selesai.

Over:

> Refactored the import pipeline to validate the payload before committing state mutations.

The second statement may be technically accurate, but it is too implementation-focused for the main explanation.

### 16.2 Use concrete language

Prefer concrete descriptions of behaviour, actions, and outcomes.

Avoid vague phrases such as:

* "improved the architecture"
* "enhanced the flow"
* "refined the implementation"
* "optimized the handling"
* "strengthened the logic"
* "updated the abstraction"
* "improved state management"
* "made the system more robust"

Unless the response immediately explains **what specifically changed**.

Instead, describe the observable result:

* "Validasi sekarang dijalankan sebelum data disimpan."
* "Draft tidak lagi dihapus ketika file import gagal."
* "Mode ATS sekarang selalu menggunakan satu kolom."
* "Foto tetap tersimpan di data CV, tetapi tidak dirender pada template ATS."

### 16.3 Translate technical changes into developer-understandable language

Technical terms are allowed, but the agent must explain their meaning when they are important to understanding the change.

Prefer:

> Mengubah `ResumeDocument` menjadi schema version 3. Artinya, data CV lama masih bisa dibuka karena tersedia migration dari version 2 ke version 3.

Over:

> Bumped `ResumeDocument` schema to v3 and added a backward migration path.

Do not unnecessarily translate common developer terms such as `component`, `function`, `hook`, `test`, `build`, `migration`, or `API` when their meaning is already clear from context.

### 16.4 Do not assume the reader knows why a change matters

When describing an internal change, state its practical consequence.

Use this pattern when relevant:

> **Perubahan:** <what changed>
> **Alasan:** <why it was needed>
> **Dampak:** <what this changes for the user/system>

Example:

> **Perubahan:** Validasi schema dipindahkan sebelum proses penyimpanan.
> **Alasan:** File import yang rusak sebelumnya berpotensi memengaruhi draft yang sedang aktif.
> **Dampak:** Draft aktif tetap aman ketika import gagal.

Do not explain implementation details that have no meaningful consequence for the maintainer.

### 16.5 One sentence must communicate one main idea

Avoid dense sentences containing multiple implementation details, assumptions, and consequences.

Bad:

> Updated the storage adapter to normalize IndexedDB errors, preserve transaction boundaries, and prevent mutation during quota handling, ensuring draft integrity across fallback paths.

Better:

> Adapter storage sekarang menangani error IndexedDB secara eksplisit.
> Ketika storage penuh, draft tidak diubah atau dihapus.
> Perubahan ini menjaga draft tetap utuh ketika proses penyimpanan gagal.

### 16.6 Avoid unexplained abstractions

Do not use internal terminology, acronyms, design-pattern names, or architectural labels as the main explanation unless they are necessary.

For example, do not say only:

> Added a view-model boundary.

Explain it:

> Aturan khusus mode ATS sekarang diproses sebelum data diberikan ke renderer. Dengan begitu, aturan seperti "tanpa foto" dan "satu kolom" tidak perlu ditentukan ulang di setiap komponen UI.

Technical terminology can follow the explanation when useful:

> Lapisan tersebut digunakan sebagai `view-model`.

### 16.7 Distinguish facts from interpretation

Clearly separate:

* **What was changed**
* **What was tested**
* **What was observed**
* **What is still uncertain**

Never use confident wording for something that was not verified.

Use:

> Build berhasil dijalankan.

Not:

> Perubahan ini sudah aman untuk production.

unless production readiness was actually verified according to the project requirements.

When verification is incomplete, state it directly:

> Unit test berhasil, tetapi E2E offline belum dijalankan. Karena itu, perilaku offline belum dapat dianggap terverifikasi.

### 16.8 Report failures in plain language

When something fails, explain the failure before showing technical output.

Use this order:

1. What failed.
2. What the failure means.
3. What is affected.
4. Relevant technical detail.
5. What decision or action is required, if any.

Example:

> **Status: Selesai sebagian.**
> Implementasi sudah selesai, tetapi 2 E2E test masih gagal. Keduanya terkait import file dengan schema version lama. Fitur utama tetap dapat digunakan, tetapi backward compatibility belum dapat dianggap selesai.

Then, if needed:

```text
Command: npm run test:e2e

2 failed, 18 passed
```

Do not start with the raw error and expect the reader to interpret it.

### 16.9 Do not over-compress important information

A short response is good. An overly compressed response is not.

The agent must not remove important context merely to keep the response short.

Bad:

> Fixed import validation. Tests pass.

Better:

> Validasi import sekarang dijalankan sebelum data menggantikan draft aktif. Jika file tidak valid, draft lama tetap dipertahankan. Unit test untuk kasus tersebut sudah ditambahkan dan seluruh test terkait berhasil.

### 16.10 Do not narrate every action

Do not report every command, file inspection, search, or intermediate step unless it is relevant to the result.

Avoid:

> I opened `storage.ts`, then checked `schema.ts`, then searched for `saveDraft`, then inspected the test fixture...

Instead, summarize the outcome:

> Perubahan mencakup adapter storage dan test fixture untuk skenario storage penuh.

The report describes **what was accomplished**, not a transcript of the agent's thought process.

### 16.11 Standard response structure

Unless the task is trivial, use the following structure:

```markdown
## Ringkasan

<Selesai / Selesai sebagian / Gagal> — <jelaskan hasil dengan bahasa sederhana>

## Apa yang berubah

<jelaskan perubahan utama dan dampaknya>

## Verifikasi

| Pemeriksaan | Status | Hasil |
| :-- | :-- | :-- |
| Unit test | PASS | 24 test berhasil |
| Type-check | PASS | Tidak ada error |
| Build | PASS | Production build berhasil |
| E2E | NOT RUN | Belum dijalankan karena <alasan> |

## Catatan

<risiko, keterbatasan, atau hal yang masih belum terverifikasi>

## Keputusan Diperlukan

<hanya tampilkan jika memang membutuhkan keputusan dari maintainer>
```

For very small tasks, the response may be shorter. Do not force all sections when they add no useful information.

### 16.12 Technical detail is secondary

Technical details should support understanding, not replace it.

Use this priority:

**Outcome → Change → Reason → Impact → Verification → Technical detail**

Not:

**Implementation → Internal abstraction → Commands → Logs → Outcome**

The maintainer should be able to understand the result without reading the raw logs.

### 16.13 Final self-check before responding

Before sending the response, verify:

* Could a developer understand what changed without opening the diff?
* Did the response explain why the change matters?
* Did it distinguish verified results from assumptions?
* Did it explain important technical terms instead of hiding behind them?
* Did it avoid vague phrases such as "improved", "refined", or "optimized" without concrete explanation?
* Did it clearly state anything that remains unverified?
* Could the response be understood by someone who did not perform the implementation?

If any answer is "no", rewrite the explanation before responding.

```

### Kenapa ini lebih cocok untuk kasus Muse Spark

Menurut saya, ini justru lebih efektif daripada sekadar menyuruh model **"gunakan bahasa yang sederhana"**. Instruksi seperti itu terlalu subjektif dan model masih bisa merasa kalimat seperti *"implemented a resilient state reconciliation flow"* adalah bahasa sederhana.

Di versi di atas, kita memberi model **aturan translasi** yang lebih operasional:

**Technical implementation**  
→ **what actually happens**  
→ **why it matters**  
→ **what the maintainer needs to know**

Contohnya, daripada agent mengatakan:

> `Implemented fallback handling for IndexedDB persistence failures.`

dia diarahkan untuk menghasilkan:

> **Storage sekarang punya penanganan ketika penyimpanan IndexedDB gagal.**  
> Draft tidak langsung hilang ketika penyimpanan gagal.  
> Kasus storage penuh juga sudah dimasukkan ke test.

Itu masih teknis, tetapi tidak lagi abstrak.

### Satu perubahan yang menurut saya paling penting

Saya juga akan **mengubah nama §16** dari:

> `Agent report format`

menjadi:

> `Agent response and report format`

Karena problem kamu ternyata terjadi **di response secara keseluruhan**, bukan hanya completion report. Agent bisa saja menyelesaikan task dengan benar, tetapi tetap memberi penjelasan yang buruk.

Jadi §16 harus mengatur **communication contract**, bukan cuma **report template**.

Dan ini cocok dengan AGENTS kamu yang memang sudah cukup ketat di sisi architecture, testing, schema, privacy, dan DoD. Yang masih kurang adalah *human-readable communication layer* setelah agent selesai bekerja.
```
