# ai/

AI provider interface and implementations for cv4every1.

## Dependency rules (from architecture-overview.md §5)

- **May depend on:** `core/` (type-only imports preferred — erased at compile)
- **Must NOT depend on:** storage, render, content, or any bare package
  (not even `zod`). This keeps the module dependency-free so the future
  network-provider chunk stays minimal. Response validation uses
  hand-written pure guards for the same reason (Task 17).

## Layout

| File | Role |
| :-- | :-- |
| `types.ts` | `AIProvider` contract + capability input/output types (FR-403 foundation) |
| `errors.ts` | Failure taxonomy + `AIProviderError` (codes only, never wording) |
| `validation.ts` | Structured-output pipeline: extract JSON → shape guard → grounding check (FR-404/405) |
| `noop-provider.ts` | Test double: never available, rejects everything |
| `index.ts` | Barrel |

`StaticSuggestionProvider` lives in `src/features/ai/`, not here: it composes
the Action Verbs Catalog from `content/`, which this module may not import.
User-facing wording for providers lives in `src/content/microcopy` and is
mapped in `features/`, never here (NFR-011: nothing resume-shaped is logged;
nothing worded lives in the contract layer either).
