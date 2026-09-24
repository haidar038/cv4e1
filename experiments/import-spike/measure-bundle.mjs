/**
 * Spike T3a — ukur dampak bundle dua kandidat dependensi (bukan kode produksi).
 * Metode: Bun.build (esbuild) minify per entry probe + gzip via zlib.
 * Ordo-nya yang dipakai untuk keputusan ADR-0008; angka final diukur ulang
 * dengan chunk Vite saat implementasi T3a.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

const { fileURLToPath: futp } = await import('node:url');
const OUT = futp(new URL('./dist-probe/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function probe(name, code) {
  const entry = futp(new URL(`./dist-probe/_${name}.entry.mjs`, import.meta.url));
  const { writeFileSync } = await import('node:fs');
  writeFileSync(entry, code);
  const res = await Bun.build({ entrypoints: [entry], outdir: OUT, minify: true, naming: `${name}.[ext]` });
  if (!res.success) {
    console.log(`${name}: BUILD GAGAL`);
    for (const log of res.logs) console.log(`  ${log}`);
    return;
  }
  for (const out of res.outputs) {
    const buf = Buffer.from(await out.arrayBuffer());
    console.log(`${name}: raw ${kb(buf.length)} · gzip ${kb(gzipSync(buf).length)} (${out.path.split('/').pop()})`);
  }
}

await probe('pdfjs-core', `import 'pdfjs-dist';`);
await probe('tesseract', `import 'tesseract.js';`);

// Worker pdf.js yang dipakai di browser (di-load lazy sebagai file statis).
for (const p of ['node_modules/pdfjs-dist/build/pdf.worker.mjs', 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs']) {
  if (existsSync(p)) {
    const buf = readFileSync(p);
    console.log(`pdf-worker (${p.split('/')[2]}): raw ${kb(buf.length)} · gzip ${kb(gzipSync(buf).length)}`);
  } else {
    console.log(`pdf-worker: TIDAK ADA ${p}`);
  }
}

// Dependensi transitif langsung (klaim pohon).
for (const pkg of ['pdfjs-dist', 'tesseract.js']) {
  const pj = JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8'));
  const deps = Object.keys(pj.dependencies ?? {});
  console.log(`${pkg}@${pj.version}: lisensi ${pj.license} · deps langsung [${deps.join(', ') || 'nol'}]`);
}
