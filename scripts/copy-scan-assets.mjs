// Copies the on-device scanners into public/ before each build, so they're served from Whisk itself (no CDN,
// works with the strict CSP, cached by the service worker after the first use):
//   public/ocr/    — receipt reader (Tesseract.js worker, its WebAssembly engine, English text model)
//   public/zxing/  — barcode reader (ZXing WebAssembly)
import { cpSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = (pkg) => join(process.cwd(), 'node_modules', pkg);
const out = (p) => { mkdirSync(p, { recursive: true }); return p; };
const ocr = out('public/ocr'), zx = out('public/zxing');
cpSync(join(dir('tesseract.js'), 'dist/worker.min.js'), join(ocr, 'worker.min.js'));
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) cpSync(join(dir('tesseract.js-core'), f), join(ocr, f));
cpSync(join(dir('@tesseract.js-data/eng'), '4.0.0_best_int/eng.traineddata.gz'), join(ocr, 'eng.traineddata.gz'));
cpSync(join(dir('zxing-wasm'), 'dist/reader/zxing_reader.wasm'), join(zx, 'zxing_reader.wasm'));
console.log('scanner assets copied to public/ocr and public/zxing');
