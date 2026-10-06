// Copies the barcode reader (ZXing, WebAssembly) into public/ so the app serves it itself:
// no third-party CDN at runtime, and the Content Security Policy can stay 'self'. Runs before every build.
const fs = require('fs'); const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm');
const dir = path.join(__dirname, '..', 'public', 'zxing'); fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(src, path.join(dir, 'zxing_reader.wasm'));
console.log('zxing_reader.wasm →', path.relative(process.cwd(), dir), fs.statSync(src).size, 'bytes');
