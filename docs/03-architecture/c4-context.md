# C4 Level 1 — System Context

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Menunjukkan cv4every1 sebagai satu kotak, dengan siapa dan apa yang berinteraksi dengannya.

---

## Diagram

```text
                    ┌──────────────────┐
                    │     Pengguna     │
                    │ (fresh graduate) │
                    └────────┬─────────┘
                             │ mengisi, mengekspor
                    ┌────────▼─────────────────────┐
                    │        cv4every1 PWA         │
                    │   (berjalan di peramban)     │
                    └──┬────────┬─────────┬────────┘
                       │        │         │
        ┌──────────────▼──┐  ┌──▼──────┐  └──────────────┐
        │ Browser storage │  │  Local  │        (opsional, │
        │   IndexedDB     │  │   PDF   │         eksplisit)│
        │  localStorage   │  │renderer │                   │
        └─────────────────┘  └─────────┘         ┌─────────▼────────┐
                                                 │ Penyedia AI      │
        ┌─────────────────┐                      │ (Groq / lainnya) │
        │ Static hosting  │  ← pemuatan awal     └──────────────────┘
        │    / CDN        │
        └─────────────────┘
```

## Aktor dan sistem eksternal

| Entitas | Jenis | Interaksi | Data yang mengalir |
| :-- | :-- | :-- | :-- |
| Pengguna | Person | Mengisi form, berpindah mode, mengekspor | Seluruh data resume |
| Browser storage | Sistem internal | Menyimpan draft dan aset | Seluruh data resume — **tidak pernah keluar perangkat** |
| Local PDF renderer | Sistem internal | Menghasilkan PDF | Data resume → berkas |
| Static hosting / CDN | Eksternal | Menyajikan app shell | **Tanpa data resume** |
| Penyedia AI | Eksternal, **opsional** | Menerima potongan teks terpilih | **Sebagian data resume — hanya dengan persetujuan** |

## Batas kepercayaan

- [ ] **Batas 1 — perangkat pengguna:** semua di dalamnya dianggap milik pengguna
- [ ] **Batas 2 — berkas impor:** tidak tepercaya sampai divalidasi
- [ ] **Batas 3 — penyedia AI:** eksternal, opsional, memerlukan persetujuan
- [ ] Rujuk `../06-security/threat-model.md`

## Yang harus terlihat jelas dari diagram ini
Satu-satunya panah yang membawa data resume ke luar perangkat adalah panah AI, dan panah itu opsional serta memerlukan persetujuan eksplisit.

## Catatan
- [ ] Render ulang sebagai Mermaid atau Structurizr bila perlu
- [ ] Perbarui jika proxy server pernah ditambahkan (ADR-0006)
