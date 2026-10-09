'use client';
// Whisk's scanners, on the phone itself: the camera, a barcode reader and a receipt reader. Free, no AI, and
// nothing is uploaded (a barcode's digits are looked up on Open Food Facts; photos never leave the phone).
//
// In the browser this uses ZXing (barcodes) and Tesseract (receipt text), both WebAssembly, served from Whisk's own
// /zxing and /ocr folders and loaded the first time they're needed.
//
// When Whisk ships as a phone app (Capacitor), these three functions are the only place that changes: swap
// `decodeBarcode` and `readText` for the phone's built-in scanners (Apple Vision / VisionKit on iPhone, Google ML Kit
// on Android), which are free and more accurate. The screens in components/ScanSheet.js stay the same.

// ---------- camera ----------
// The back camera, as sharp as the phone gives us. Throws a readable Error if there's no camera or it's blocked.
export async function openCamera(video, { hd = false } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser can’t use the camera. Try Safari or Chrome.');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: hd ? 2560 : 1920 }, height: { ideal: hd ? 1440 : 1080 }, focusMode: 'continuous' }
    });
  } catch (e) {
    if (e?.name === 'NotAllowedError') throw new Error('Camera access is off. Allow it for Whisk in your browser settings, then try again.');
    if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') throw new Error('No camera found on this device.');
    throw new Error('Couldn’t start the camera.');
  }
  video.srcObject = stream; video.muted = true; video.playsInline = true;
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
  await video.play().catch(() => {});
  const track = stream.getVideoTracks()[0];
  const caps = track?.getCapabilities?.() || {};
  return {
    stream, track,
    torch: !!caps.torch,
    setTorch: (on) => track.applyConstraints({ advanced: [{ torch: on }] }).catch(() => {}),
    stop: () => { stream.getTracks().forEach((t) => t.stop()); if (video.srcObject === stream) video.srcObject = null; }
  };
}

// The part of the video inside an on-screen window (the window's box, in the video element's coordinates), as
// pixels at the camera's full resolution. Accounts for object-fit: cover cropping.
export function grabRegion(video, box, canvas, maxW = 1280) {
  const vw = video.videoWidth, vh = video.videoHeight; if (!vw || !vh) return null;
  const ew = video.clientWidth, eh = video.clientHeight;
  const s = Math.max(ew / vw, eh / vh), ox = (vw * s - ew) / 2, oy = (vh * s - eh) / 2;
  const sx = Math.max(0, (box.x + ox) / s), sy = Math.max(0, (box.y + oy) / s);
  const sw = Math.min(vw - sx, box.w / s), sh = Math.min(vh - sy, box.h / s);
  const k = Math.min(1, maxW / sw);
  canvas.width = Math.round(sw * k); canvas.height = Math.round(sh * k);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return ctx;
}

// ---------- barcodes ----------
let zx = null;
async function zxing() {
  if (!zx) zx = import('zxing-wasm/reader').then(async (m) => {
    await m.prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? `/zxing/${path}` : prefix + path) }, fireImmediately: true });
    return m;
  }).catch((e) => { zx = null; throw e; });
  return zx;
}
export const warmBarcodes = () => zxing().catch(() => {});
// Grocery barcodes only (UPC-A, UPC-E, EAN-13, EAN-8). Returns the digits or null.
export async function decodeBarcode(imageData) {
  const { readBarcodes } = await zxing();
  const [hit] = await readBarcodes(imageData, { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], tryHarder: true, tryRotate: false, maxNumberOfSymbols: 1 });
  return hit?.isValid && /^\d{8,14}$/.test(hit.text) ? hit.text : null;
}

// ---------- receipt text ----------
let ocr = null;
async function tesseract(onProgress) {
  if (!ocr) ocr = import('tesseract.js').then(async ({ createWorker, PSM }) => {
    const w = await createWorker('eng', 1, {   // 1 = the LSTM engine (best on printed text)
      workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', workerBlobURL: false, gzip: true, cacheMethod: 'write',
      logger: (m) => ocr.progress?.(m)
    });
    await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN, preserve_interword_spaces: '1', debug_file: '/dev/null' });   // no engine chatter in the console
    return w;
  });
  ocr.progress = onProgress;
  return ocr;
}
export const warmReceipts = () => tesseract().catch(() => {});
// Reads the text on a receipt photo (a canvas). Calls onProgress(0–1) while it works.
export async function readText(canvas, onProgress) {
  const w = await tesseract((m) => { if (m.status === 'recognizing text') onProgress?.(0.15 + m.progress * 0.85); else if (m.progress != null) onProgress?.(m.progress * 0.15); });
  const { data } = await w.recognize(canvas);
  return data.text || '';
}
export async function closeReader() { if (ocr) { const p = ocr; ocr = null; try { (await p).terminate(); } catch { /* fine */ } } }

// Receipt photo clean-up before reading: grey, stretched contrast, at a size Tesseract likes (text ~30 px tall).
export function prepareReceipt(src, maxW = 1700) {
  const k = Math.min(1, maxW / src.width), c = document.createElement('canvas');
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(src, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
  let lo = 255, hi = 0; const g = new Uint8ClampedArray(d.length / 4);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000; g[j] = v; }
  // ignore the darkest and brightest 2% so one shadow or glare spot doesn't flatten everything
  const hist = new Uint32Array(256); g.forEach((v) => hist[v]++);
  const cut = g.length * 0.02; let acc = 0; for (lo = 0; lo < 255 && (acc += hist[lo]) < cut; lo++); acc = 0; for (hi = 255; hi > 0 && (acc += hist[hi]) < cut; hi--);
  const span = Math.max(30, hi - lo);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = Math.max(0, Math.min(255, ((g[j] - lo) * 255) / span)); d[i] = d[i + 1] = d[i + 2] = v; }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ---------- feedback ----------
let audio = null;
export function unlockSound() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch { /* no sound */ } }
// the checkout "beep"
export function beep(ok = true) {
  try {
    unlockSound(); if (!audio) return;
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
    o.type = 'square'; o.frequency.value = ok ? 1760 : 330;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.11 : 0.25));
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.3);
  } catch { /* no sound */ }
  try { navigator.vibrate?.(ok ? 30 : [40, 60, 40]); } catch { /* no buzz */ }
}
