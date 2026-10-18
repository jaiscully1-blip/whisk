'use client';
import { memo } from 'react';

// Pick a cuisine by tapping a passport stamp. Each cuisine has its own city, colour and stamp shape; the chosen one is inked in full.
const CITY = { American: 'CHICAGO', Southern: 'NASHVILLE', 'Middle Eastern': 'BEIRUT', Mexican: 'MEXICO CITY', Italian: 'ROME', Indian: 'DELHI', Chinese: 'BEIJING', 'Soul Food': 'ATLANTA', Korean: 'SEOUL', Japanese: 'TOKYO', Thai: 'BANGKOK', Greek: 'ATHENS', French: 'PARIS', Ethiopian: 'ADDIS ABABA', Vietnamese: 'HANOI', Mediterranean: 'MALTA', Caribbean: 'KINGSTON', Cajun: 'NEW ORLEANS', British: 'LONDON', Brazilian: 'SAO PAULO', Spanish: 'MADRID', Nigerian: 'LAGOS', Congolese: 'KINSHASA', 'South African': 'CAPE TOWN', Slovak: 'BRATISLAVA', Senegalese: 'DAKAR', Peruvian: 'LIMA', Pakistani: 'KARACHI', 'Mexican-American': 'EL PASO', 'Korean-American': 'LOS ANGELES', Kenyan: 'NAIROBI', 'Italian-American': 'NEW YORK', Irish: 'DUBLIN', Hawaiian: 'HONOLULU', Haitian: 'PORT-AU-PRINCE', Ghanaian: 'ACCRA', Filipino: 'MANILA', Dominican: 'SANTO DOMINGO', Afghan: 'KABUL' };
const COLORS = ['#3fc1e0', '#ff5fb0', '#9b85ff', '#6fd15a', '#ff8a45', '#ff6b5f', '#5aa0ff', '#f2c14e', '#3fd1b0', '#e47a9a', '#c070e8', '#9fb0bd'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const plane = (x, y, k, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path d="M0-12c1.5 0 2.4 1.1 2.4 2.6V-3l11 6.4v2.6L2.4 2.8V9.2l3.2 2.4v1.8L0 11.8l-5.6 1.6v-1.8l3.2-2.4V2.8L-13.4 6V3.4L-2.4-3v-6.4C-2.4-10.9-1.5-12 0-12z"/></g>`;
const T = (x, y, t, sz, w = 800, ls = 1) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${sz}" font-weight="${w}" letter-spacing="${ls}" font-family="Arial Narrow,Arial,sans-serif">${esc(t)}</text>`;

// 8 shapes; a city name is sized to fit.
function art(i, kind, city) {
  const big = Math.min(23, Math.round(300 / Math.max(city.length, 5)));
  const k = esc(kind.toUpperCase());
  switch (i % 8) {
    case 0: return `<ellipse cx="100" cy="60" rx="92" ry="52" fill="none" stroke-width="4"/><ellipse cx="100" cy="60" rx="84" ry="44" fill="none" stroke-width="1.5"/>${T(100, 32, k, 11)}${plane(100, 54, .8)}${T(100, 82, city, big, 900, 1)}${T(100, 98, 'ARRIVAL · 20 AUG', 9)}`;
    case 1: return `<rect x="10" y="12" width="180" height="96" rx="10" fill="none" stroke-width="5"/>${plane(100, 36, 1)}${T(100, 64, k, 12)}<rect x="30" y="70" width="140" height="22"/><text x="100" y="87" text-anchor="middle" font-size="${Math.min(17, big)}" font-weight="900" letter-spacing="1" fill="#efe9d6" font-family="Arial Narrow,Arial">${esc(city)}</text>${T(100, 103, 'IMMIGRATION', 8)}`;
    case 2: return `<circle cx="100" cy="60" r="54" fill="none" stroke-width="5"/><circle cx="100" cy="60" r="46" fill="none" stroke-width="1.5"/>${plane(100, 30, .8)}${T(100, 54, k, 10)}${T(100, 76, city, Math.min(20, big), 900, 1)}${T(100, 92, 'DEPARTED', 9)}${T(100, 102, '20 AUG', 8)}`;
    case 3: return `<rect x="10" y="12" width="180" height="96" rx="8" fill="none" stroke-width="4" stroke-dasharray="7 4"/>${T(100, 36, k, 12)}${plane(26, 62, .7, -90)}${plane(174, 62, .7, 90)}${T(100, 66, city, Math.min(16, big), 900, 0)}<rect x="52" y="76" width="96" height="22" fill="none" stroke="currentColor" stroke-width="2"/>${T(100, 92, '20 AUG 2026', 12)}`;
    case 4: return `<path d="M100 8L192 108H8Z" fill="none" stroke-width="5" stroke-linejoin="round"/>${plane(100, 48, .9)}${T(100, 76, k, 10)}${T(100, 92, city, Math.min(17, big), 900, 1)}${T(100, 104, 'ARRIVED', 8)}`;
    case 5: return `<path d="M100 6L196 60L100 114L4 60Z" fill="none" stroke-width="4" stroke-dasharray="6 4"/>${plane(100, 34, .8)}${T(100, 56, k, 10)}${T(100, 75, city, Math.min(16, big), 900, 0)}${T(100, 91, 'ARRIVED · 20 AUG', 8)}`;
    case 6: return `<rect x="8" y="14" width="184" height="92" rx="6" fill="none" stroke-width="4"/><rect x="8" y="14" width="52" height="92"/><text x="34" y="70" text-anchor="middle" font-size="24" font-weight="900" fill="#efe9d6" font-family="Arial Narrow,Arial">${esc(kind.slice(0, 2).toUpperCase())}</text>${T(126, 46, k, 11)}${T(126, 72, city, Math.min(17, Math.round(big * .85)), 900, 0)}${T(126, 92, 'ARRIVAL · 20 AUG', 8)}`;
    default: return `<ellipse cx="100" cy="60" rx="92" ry="52" fill="none" stroke-width="2" stroke-dasharray="5 4"/><ellipse cx="100" cy="60" rx="84" ry="44" fill="none" stroke-width="4"/>${T(100, 34, k, 11)}${T(100, 62, city, big, 900, 1)}${plane(100, 80, .6)}${T(100, 100, '20 AUG 2026', 9)}`;
  }
}
const Stamp = memo(function Stamp({ kind, on, onPick }) {
  const h = hash(kind), city = kind === '' ? 'ALL' : (CITY[kind] || kind.toUpperCase());
  const color = kind === '' ? '#ff9f43' : COLORS[h % COLORS.length], rot = [-3, 2, -2, 3, -1, 1][h % 6];
  const inner = kind === ''
    ? `<circle cx="100" cy="60" r="52" fill="none" stroke-width="5"/><circle cx="100" cy="60" r="44" fill="none" stroke-width="1.5" stroke-dasharray="4 3"/>${plane(100, 34, .8)}${T(100, 70, 'ANY', 24, 900, 3)}${T(100, 90, 'CUISINE', 10)}`
    : art(h >> 3, kind, city);
  return (
    <button type="button" role="radio" aria-checked={on} aria-label={kind || 'All cuisines'} className={`stamp ${on ? 'on' : ''}`} onClick={onPick} data-testid={`stamp-${kind || 'any'}`} style={{ color }}>
      <svg viewBox="0 0 200 120" aria-hidden="true"><g filter="url(#stamp-ink)" stroke={color} fill={color} transform={`rotate(${rot} 100 60)`} dangerouslySetInnerHTML={{ __html: inner }} /></svg>
    </button>
  );
});

export default function CuisineStamps({ cuisines, value, onChange }) {
  return (
    <div className="stamps" role="radiogroup" aria-label="Cuisine">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><defs>
        <filter id="stamp-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="w" /><feDisplacementMap in="SourceGraphic" in2="w" scale="2" result="d" /><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="8" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -5 0 0 3.7" result="m" /><feComposite in="d" in2="m" operator="in" /></filter>
      </defs></svg>
      {['', ...cuisines].map((c) => <Stamp key={c || 'any'} kind={c} on={value === c} onPick={() => onChange(c)} />)}
    </div>
  );
}
