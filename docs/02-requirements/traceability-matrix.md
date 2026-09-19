# Traceability Matrix — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1 — diisi seiring implementasi** |
| Terakhir diperbarui | 2026-09-15 |

> Memetakan Requirement → Acceptance Criteria → Test → Status.
> **Setiap FR dan NFR wajib memiliki minimal satu test.** Baris tanpa test adalah celah, bukan sekadar catatan.

---

## Cara memakai
- Perbarui saat menutup task, bukan di akhir fase
- Jika sebuah requirement tidak bisa dipetakan ke test, requirement-nya kurang spesifik
- CI sebaiknya gagal jika ada FR/NFR tanpa test terkait (TODO: tulis script pemeriksanya)

## Matriks

| Requirement | Acceptance Criteria | Test | Status |
| :-- | :-- | :-- | :-- |
| FR-001 | AC-001-a | `dual-renderer.spec.ts` | ⬜ |
| FR-002 | AC-002-a | `ats-photo-hidden.spec.ts` | ⬜ |
| FR-003 | AC-003-a | `mode-switch-lossless.spec.ts` | ⬜ |
| FR-101 | AC-101-a | `offline-persistence.spec.ts` | ⬜ |
| FR-104 | AC-104-a | `export-import-roundtrip.spec.ts` | ⬜ |
| FR-105 | AC-105-a | `import-validation.spec.ts` | ⬜ |
| FR-107 | AC-107-a | `migration.spec.ts` | ⬜ |
| FR-108 | AC-108-a | `wipe-all-data.spec.ts` | ⬜ |
| FR-201 | AC-201-a | `gpa-guidance.spec.ts` | ⬜ |
| FR-206 | AC-206-a | `action-verbs-offline.spec.ts` | ⬜ |
| FR-302 | AC-302-a | `pdf-text-extraction.spec.ts` | ⬜ |
| FR-401 | AC-401-a | `ai-approval-flow.spec.ts` | ⬜ |
| FR-405 | AC-405-a | `ai-grounding-invariants.spec.ts` | ⬜ |
| FR-406 | AC-406-a | `ai-failure-preserves-draft.spec.ts` | ⬜ |
| NFR-001 | AC-N001-a | `offline-e2e.spec.ts` | ⬜ |
| NFR-002 | AC-N002-a | `no-network-egress.spec.ts` | ⬜ |
| NFR-005 | AC-N005-a | `keyboard-navigation.spec.ts` | ⬜ |
| NFR-007 | AC-N007-a | `a11y-audit.spec.ts` | ⬜ |
| NFR-008 | AC-N008-a | gerbang CI `bundle-size` | ⬜ |

**Legenda:** ⬜ belum · 🟡 sebagian · ✅ tercakup

## Celah yang harus ditutup
- [ ] Sisa FR/NFR yang belum ada barisnya
- [ ] Pemetaan ADR → requirement yang terdampak
- [ ] Pemetaan abuse case → test keamanan
