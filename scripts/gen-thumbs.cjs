// Pre-renders every closet item's picture (and the free chef coat) to public/thumbs/<id>.webp, so phones show
// plain images instead of drawing 100+ 3D models on the fly. Re-run after changing items in lib/whisk3d/engine.js:
//   NODE_PATH=/path/to/playwright node scripts/gen-thumbs.cjs
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const R = path.join(__dirname, '..');
  const three = fs.readFileSync(path.join(R, 'node_modules/three/build/three.min.js'), 'utf8');
  const eng = fs.readFileSync(path.join(R, 'lib/whisk3d/engine.js'), 'utf8').replace(/^import .*$/m, '').replace(/^export \{[^}]*\};?$/m, '').replace(/^export /gm, '');
  const html = `<!doctype html><html><body><script>${three}</script><script>(function(THREE){${eng}\nwindow.W3D={renderThumb,ITEMS_BY_ID,CHEF_COAT};})(window.THREE);</script></body></html>`;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); await p.setContent(html);
  const out = await p.evaluate(async () => {
    const all = { ...window.W3D.ITEMS_BY_ID, [window.W3D.CHEF_COAT.id]: window.W3D.CHEF_COAT }; const res = {};
    for (const [id, it] of Object.entries(all)) {
      const png = window.W3D.renderThumb(it); const img = new Image(); img.src = png; await img.decode();
      const c = document.createElement('canvas'); c.width = 184; c.height = 184; c.getContext('2d').drawImage(img, 0, 0, 184, 184);
      res[id] = c.toDataURL('image/webp', 0.86);
    }
    return res;
  });
  const dir = path.join(R, 'public/thumbs'); fs.mkdirSync(dir, { recursive: true });
  let total = 0; for (const [id, url] of Object.entries(out)) { if (!/^[a-z0-9-]+$/.test(id)) continue; const buf = Buffer.from(url.split(',')[1], 'base64'); total += buf.length; fs.writeFileSync(path.join(dir, id + '.webp'), buf); }
  console.log('wrote', Object.keys(out).length, 'thumbs,', Math.round(total / 1024), 'KB');
  await b.close();
})();
