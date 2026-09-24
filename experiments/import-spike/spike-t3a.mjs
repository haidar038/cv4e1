/**
 * Spike T3a — bukti pipeline impor (bukan kode produksi).
 * 1. Chromium mencetak cv-sample.html ke PDF digital (lapisan teks).
 * 2. pdfjs-dist mengekstrak teks → cek string wajib pulih.
 * 3. Chromium memotret halaman yang sama sebagai PNG (simulasi pindaian).
 * 4. tesseract.js OCR atas PNG → cek string wajib pulih + catat akurasi.
 * Data 100% fiktif. Aset traineddata diunduh sekali dari CDN (spike saja,
 * bukan perilaku shipped — ADR-0008: shipped memakai host yang sama).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const DIR = dirname(fileURLToPath(import.meta.url));
const REQUIRED = [
  'Contoh Nama Fiktif',
  'contoh.fiktif@example.com',
  'PENDIDIKAN',
  'Universitas Contoh Bangsa',
  '3.52 / 4.00',
  'PENGALAMAN KERJA',
  'PT Maju Bersama Fiktif',
  'Januari 2023',
  '40 staf gudang',
  'PROYEK',
  'Sistem Survey Digital',
  'KEAHLIAN',
  'TypeScript',
];

const norm = (s) => s.replace(/\s+/g, ' ').trim();
function report(label, text) {
  const t = norm(text);
  const missing = REQUIRED.filter((s) => !t.includes(s));
  console.log(`--- ${label} ---`);
  console.log(`panjang teks: ${t.length} char · hilang ${missing.length}/${REQUIRED.length}`);
  for (const m of missing) console.log(`  HILANG: ${m}`);
  return missing;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(join(DIR, 'cv-sample.html')).href);
await page.pdf({ path: join(DIR, 'sample-digital.pdf'), format: 'A4' });
await page.screenshot({ path: join(DIR, 'sample-scan.png'), fullPage: true });
await browser.close();
console.log('PDF + PNG tertulis.');

// Jalur 1: lapisan teks via pdfjs-dist.
let pdfjs;
try {
  pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
} catch {
  pdfjs = await import('pdfjs-dist');
}
const pdfData = new Uint8Array(readFileSync(join(DIR, 'sample-digital.pdf')));
const doc = await pdfjs.getDocument({ data: pdfData, disableWorker: true }).promise;
let pdfText = '';
for (let i = 1; i <= doc.numPages; i++) {
  const pg = await doc.getPage(i);
  const tc = await pg.getTextContent();
  pdfText += tc.items.map((it) => it.str).join(' ') + '\n';
}
const pdfMissing = report('lapisan-teks pdf.js', pdfText);

// Jalur 2: OCR via tesseract.js (ind + eng, sesuai ADR-0008).
const { createWorker } = await import('tesseract.js');
for (const lang of ['ind', 'eng']) {
  const t0 = Date.now();
  try {
    const worker = await createWorker(lang);
    const { data } = await worker.recognize(join(DIR, 'sample-scan.png'));
    await worker.terminate();
    console.log(`(ocr ${lang}: ${((Date.now() - t0) / 1000).toFixed(1)} dtk)`);
    report(`ocr tesseract (${lang})`, data.text);
  } catch (err) {
    console.log(`ocr ${lang} GAGAL: ${String(err && err.message ? err.message : err).slice(0, 200)}`);
  }
}

writeFileSync(join(DIR, 'spike-result.txt'), `pdf-missing=${pdfMissing.length}\n`);
process.exit(pdfMissing.length === 0 ? 0 : 1);
