// After a proofreading pass: only TEXT may have changed. Compares lib/recipes/world/<ISO>.json against the committed version.
// Usage: node scripts/check-proof.mjs IT FR ...
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const bad = []; let changed = 0;
const toks = (s) => (String(s).match(/\[\[.*?\]\]/g) || []).join('|');
for (const iso of process.argv.slice(2)) {
  const now = JSON.parse(fs.readFileSync(`lib/recipes/world/${iso}.json`, 'utf8'));
  const old = JSON.parse(execSync(`git show HEAD:lib/recipes/world/${iso}.json`, { maxBuffer: 1e8 }).toString());
  if (now.length !== old.length) { bad.push(`${iso}: recipe count changed`); continue; }
  now.forEach((r, i) => {
    const o = old[i], at = `${iso} #${i} ${o.dish}`;
    if (r.dish !== o.dish) bad.push(`${at}: dish name changed`);
    for (const k of ['min', 'sv', 'tc', 'pp', 'pr']) if (r[k] !== o[k]) bad.push(`${at}: ${k} changed`);
    if (r.ing.length !== o.ing.length) bad.push(`${at}: ingredient count changed`);
    else r.ing.forEach((g, j) => { for (const k of [0, 1, 2, 4]) if (g[k] !== o.ing[j][k]) bad.push(`${at}: ingredient ${j} field ${k} changed`); if (g[3] !== o.ing[j][3]) changed++; });
    if (r.st.length !== o.st.length) bad.push(`${at}: step count changed`);
    else r.st.forEach((s, j) => { if (s[1] !== o.st[j][1]) bad.push(`${at} step ${j}: timer changed`); if (toks(s[0]) !== toks(o.st[j][0])) bad.push(`${at} step ${j}: [[amounts]] changed`); if (s[0] !== o.st[j][0]) changed++; });
    if (JSON.stringify(r.nt) !== JSON.stringify(o.nt)) { changed++; if (o.nt && (!r.nt || r.nt.length !== 2)) bad.push(`${at}: nt must stay two strings`); }
  });
}
console.log(bad.length ? bad.slice(0, 40).join('\n') : `ok: text-only changes (${changed} texts edited)`);
process.exit(bad.length ? 1 : 0);
