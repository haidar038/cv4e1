# State Management — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

---

## 1. Prinsip
- [ ] Satu `ResumeDocument` kanonik adalah satu-satunya kebenaran
- [ ] View model bersifat turunan, tidak pernah disimpan
- [ ] Mutasi hanya lewat action yang terdefinisi, tidak pernah langsung
- [ ] State UI (mode aktif, panel terbuka) terpisah dari state dokumen

## 2. Bentuk store
```text
DocumentStore   → ResumeDocument aktif, draftId, status dirty
DraftStore      → daftar draft, metadata
UIStore         → mode, template, panel, locale, tema
AIStore         → status provider, saran tertunda, status persetujuan
```
- [ ] Apa yang disimpan di mana
- [ ] Apa yang bertahan antarsesi versus hanya dalam memori

## 3. Mutasi
- [ ] Daftar action
- [ ] Undo/redo: masuk MVP atau tidak? (TODO)
- [ ] Update optimistik: tidak berlaku, tanpa server

## 4. Autosave
- [ ] Debounce (TODO: nilai)
- [ ] Penanganan kegagalan — **jangan pernah kehilangan state dalam memori jika penulisan gagal**
- [ ] Indikator "tersimpan" untuk pengguna

## 5. Turunan view model
- [ ] `normalize()` murni, memoized
- [ ] **Aturan mode diberlakukan di sini, bukan di renderer**
- [ ] Alasan: menjaga renderer bodoh dan aturan dapat diuji tanpa DOM

## 6. Beberapa tab
- [ ] Apa yang terjadi jika dua tab mengedit draft yang sama? (TODO — putuskan)
- [ ] Opsi: last-write-wins, BroadcastChannel, atau kunci per draft
- [ ] Minimum: jangan diam-diam menghancurkan pekerjaan di tab lain

## 7. Batas AI
- [ ] Saran hidup di `AIStore`, **tidak pernah** di `DocumentStore`
- [ ] Apply menyalin dari `AIStore` → action → `DocumentStore`
- [ ] Ini adalah penegakan struktural "suggestion, not mutation"

## 8. Pengujian
- [ ] Logika store dapat diuji tanpa React
- [ ] Skenario: autosave saat gagal, mode switch, apply saran
