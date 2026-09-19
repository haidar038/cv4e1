// spike-test.mjs — Generate & extract text from Candidate B (@react-pdf/renderer)
// and compare against the HTML source of Candidate A as a baseline.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

// Key strings that must appear in extracted text (from the fixture)
const REQUIRED_STRINGS = [
  'Rania Putri Maharani',
  'Fresh Graduate Teknik Informatika',
  'rania.contoh@example.com',
  'Universitas Contoh Nusantara',
  'Agustus 2021',
  'Juli 2025',
  '3.52',
  'IPK',
  'CV Contoh Digital',
  'Magang Pengembang Web',
  'Himpunan Mahasiswa Teknik Informatika',
  'Koordinator Divisi Acara',
  'Sistem Pendataan UMKM',
  'JavaScript',
  'React',
  'HTML',
  'CSS',
  'Git',
  'MySQL',
  'Bahasa Indonesia',
  'Belajar Dasar Pemrograman Web',
  'Platform Pelatihan Contoh',
];

function checkStrings(text, label) {
  const normalized = text.replace(/\s+/g, ' ').toLowerCase();
  const missing = [];
  for (const s of REQUIRED_STRINGS) {
    if (!normalized.includes(s.toLowerCase())) {
      missing.push(s);
    }
  }
  console.log(`\n[${label}]`);
  console.log(`  Total chars: ${text.length}`);
  console.log(`  Missing strings: ${missing.length === 0 ? 'NONE — all present ✓' : missing.join(', ')}`);
  return missing;
}

async function extractFromPdf(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  const allText = result.pages.map((p) => p.text).join('\n');
  return { text: allText, pages: result.total ?? result.pages.length };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // --- Candidate A: Extract visible text directly from HTML (baseline) ---
  console.log('=== CANDIDATE A: HTML source → text extraction (baseline) ===');
  const htmlPath = path.join(__dirname, 'candidate-a-print-css', 'ats-cv.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  // Strip tags to get plain text
  const htmlText = htmlContent
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/·/g, '|')
    .replace(/\s+/g, ' ')
    .trim();

  const missingA = checkStrings(htmlText, 'Candidate A — HTML text (no PDF yet)');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'candidate-a-html-text.txt'), htmlText, 'utf-8');
  console.log(`  Saved baseline text to output/candidate-a-html-text.txt`);

  // --- Candidate B: @react-pdf/renderer ---
  console.log('\n=== CANDIDATE B: @react-pdf/renderer → PDF → text extraction ===');
  const candB = path.join(OUTPUT_DIR, 'candidate-b.pdf');

  try {
    // Use dynamic import with tsx support via bun
    const mod = await import('./candidate-b-react-pdf/ATSResume.tsx');
    const ATSResume = mod.default;

    const { renderToBuffer } = await import('@react-pdf/renderer');
    const React = await import('react');

    const element = React.createElement(ATSResume);
    const buffer = await renderToBuffer(element);
    fs.writeFileSync(candB, buffer);
    console.log(`  PDF generated: ${candB} (${buffer.length} bytes)`);

    const { text, pages } = await extractFromPdf(candB);
    console.log(`  Pages: ${pages}, Size: ${fs.statSync(candB).size} bytes`);
    const missingB = checkStrings(text, 'Candidate B — @react-pdf/renderer PDF');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'candidate-b-text.txt'), text, 'utf-8');
    console.log(`  Saved extracted text to output/candidate-b-text.txt`);

    // Compare
    console.log('\n=== COMPARISON ===');
    console.log(`  Candidate A missing: ${missingA.length} items`);
    console.log(`  Candidate B missing: ${missingB.length} items`);
    if (missingA.length === 0 && missingB.length === 0) {
      console.log('  ✓ Both candidates preserve all required text.');
    } else {
      console.log('  ✗ Discrepancy detected — review missing items above.');
    }
  } catch (err) {
    console.error('  FAILED:', err.message);
    console.error(err.stack);
  }

  console.log('\n=== SPIKE TEST COMPLETE ===');
  console.log('Results saved to:', OUTPUT_DIR);
}

main().catch(console.error);