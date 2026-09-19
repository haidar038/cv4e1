# core/

Pure data layer for cv4every1. Contains ResumeDocument types, validation, normalization, and migration logic.

## Dependency rules (from architecture-overview.md §5)

- **May depend on:** nothing
- **Must NOT depend on:** React, DOM, storage, network

All functions in this module must be pure and testable without a DOM environment.