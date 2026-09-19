# AGENTS.md — cv4every1

> Operating instructions for AI agents working on this repository.
> **Read this file completely before making any change.**
> Written in English for agent reliability. Product-facing copy is written in Bahasa Indonesia — see §12.

| Field | Value |
| :-- | :-- |
| Status | Draft v0.1 |
| Last updated | 2026-09-15 |
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
