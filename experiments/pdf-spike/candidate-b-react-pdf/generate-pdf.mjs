// generate-pdf.mjs — Server-side PDF generation for Candidate B (@react-pdf/renderer)
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Dynamic import of the TSX component via tsx loader
  const { default: ATSResume } = await import('./ATSResume.tsx');
  
  const buffer = await renderToBuffer(createElement(ATSResume));
  
  const outputPath = path.join(__dirname, '..', 'output', 'candidate-b.pdf');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`PDF generated: ${outputPath} (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});