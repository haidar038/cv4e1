# AI Provider Strategy — cv4every1

| Field | Value |
| :-- | :-- |
| Status | **Outline v0.1** |
| Terakhir diperbarui | 2026-09-15 |

> Jangan mengikat aplikasi ke satu penyedia. Aplikasi inti tidak pernah memanggil API penyedia secara langsung.

---

## 1. Antarmuka

```typescript
interface AIProvider {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  generateBullets(input: BulletGenerationInput): Promise<BulletSuggestion[]>;
  polishText(input: PolishInput): Promise<PolishSuggestion>;
  tailorToJob(input: JobTailoringInput): Promise<TailoringResult>;
}
```
- [x] Finalkan tipe input dan output (Task 16, Fase 2: `src/ai/types.ts` — bullets + polish penuh, tailoring sketsa C3 untuk Fase 3)
- [x] Penanganan error: timeout, rate limit, keluaran cacat, gagal auth (Task 16: `src/ai/errors.ts` — taksonomi `AIErrorCode` + `AIProviderError` + flag retryable)

## 2. Implementasi

| Provider | Fase | Jaringan | Catatan |
| :-- | :-- | :-- | :-- |
| `StaticSuggestionProvider` | 1 | Tidak | **Bawaan.** Action Verbs Catalog. Selalu tersedia. |
| `NoopProvider` | 1 | Tidak | Untuk pengujian |
| `GroqProvider` | 2 | Ya | BYO-key |
| `OpenAICompatibleProvider` | 2 | Ya | Endpoint kustom |
| `OllamaProvider` | 3+ | Lokal | Model lokal, menjaga data di perangkat |

## 3. Manfaat abstraksi ini
- [ ] Aplikasi inti tetap offline
- [ ] Penyedia dapat diganti tanpa menyentuh business logic
- [ ] Test berjalan tanpa jaringan
- [ ] Agen tidak perlu mengubah logika saat penyedia berubah

## 4. Penanganan API key
- [ ] Kunci dimasukkan pengguna, tidak pernah dibundel (C-T2)
- [ ] Penyimpanan bawaan: **hanya memori sesi** — usulan, konfirmasi
- [ ] Opsional "ingat di perangkat ini" → IndexedDB dengan peringatan jelas
- [ ] Kunci tidak pernah masuk ekspor (FR-110)
- [ ] Kunci tidak pernah dikirim ke mana pun selain penyedia yang dipilih (FR-407)
- [ ] Kunci tidak pernah dicatat di log
- [ ] Cara menghapus kunci, mudah ditemukan

## 5. Pemilihan model
- [ ] Utamakan model kecil dan cepat — tugasnya pendek
- [ ] Model dapat dikonfigurasi, tidak dipaku
- [ ] TODO: model bawaan yang disarankan per penyedia

## 6. Rate limit dan kuota
- [ ] Tangani 429 dengan baik: pesan yang jelas, fallback ke statis
- [ ] **Jangan pernah memperlakukan kuota tertentu sebagai requirement produk** — free tier berubah dan sumber publik saling bertentangan
- [ ] Batasi permintaan di sisi klien untuk melindungi kuota pengguna

## 7. Aturan CSP
- [ ] `connect-src` harus menyebutkan domain penyedia secara eksplisit
- [ ] Menambah penyedia berarti mengubah CSP — perlakukan sebagai keputusan sadar

## 8. Keputusan terbuka
- [ ] **Q3:** BYO-key saja, atau sediakan proxy server opsional? → ADR-0006
- [ ] Penyedia apa saja yang dikirim pada Fase 2 (usulan: Groq saja, plus OpenAI-compatible)
