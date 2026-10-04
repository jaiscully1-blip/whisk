'use client';
import { CUISINES } from '@/lib/game';

// One small drawing per cuisine (static, hand-made SVG — no user content).
const ART = {
  American: '<path d="M10 30a22 16 0 0 1 44 0z" fill="#F2A541"/><circle cx="24" cy="22" r="1.4" fill="#FFF3D6"/><circle cx="34" cy="19" r="1.4" fill="#FFF3D6"/><circle cx="42" cy="24" r="1.4" fill="#FFF3D6"/><rect x="7" y="30" width="50" height="5" rx="2.5" fill="#6DBE45"/><path d="M10 35h44l-5 5-5-3-5 3-5-3-5 3-5-3-5 3-4-3z" fill="#FFD23F"/><rect x="9" y="37" width="46" height="8" rx="4" fill="#7A3E1D"/><path d="M10 46h44a6 6 0 0 1-6 7H16a6 6 0 0 1-6-7z" fill="#E8913A"/>',
  Mexican: '<path d="M14 30c3-7 10-11 18-11s15 4 18 11" stroke="#6DBE45" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="22" cy="25" r="3" fill="#E53935"/><circle cx="40" cy="23" r="3" fill="#E53935"/><circle cx="31" cy="21" r="2.5" fill="#FFD23F"/><path d="M6 48a26 26 0 0 1 52 0z" fill="#F5C04A"/><path d="M12 48a20 20 0 0 1 40 0" fill="none" stroke="#E0A030" stroke-width="2"/>',
  Italian: '<path d="M32 58 9 16q23-10 46 0z" fill="#F7D774"/><path d="M9 16q23-10 46 0l-3 7q-20-8-40 0z" fill="#D98B3A"/><circle cx="26" cy="30" r="4.5" fill="#D9412B"/><circle cx="38" cy="34" r="4.5" fill="#D9412B"/><circle cx="31" cy="45" r="3.5" fill="#D9412B"/><circle cx="34" cy="26" r="1.6" fill="#3E8E41"/>',
  Chinese: '<path d="M22 14c0-6 20-6 20 0" stroke="#9AA3A8" stroke-width="2.5" fill="none"/><path d="M12 22h40l-5 34H17z" fill="#FFFFFF" stroke="#2D2D2D" stroke-width="2"/><path d="M12 22l6-8h28l6 8" fill="#F1F1EE" stroke="#2D2D2D" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="38" r="8" fill="#D32F2F"/><path d="M29 35h6M32 35v7M29 42h6" stroke="#fff" stroke-width="1.6"/>',
  Japanese: '<rect x="8" y="22" width="48" height="28" rx="14" fill="#1F3A2B"/><circle cx="20" cy="36" r="10" fill="#FFF"/><circle cx="20" cy="36" r="4.5" fill="#FF7A59"/><circle cx="44" cy="36" r="10" fill="#FFF"/><circle cx="44" cy="36" r="4.5" fill="#7BC67E"/>',
  Korean: '<path d="M8 32h48a24 21 0 0 1-48 0z" fill="#3D6CB3"/><path d="M10 32c2-7 8-10 22-10s20 3 22 10z" fill="#FFF6E5"/><path d="M14 31l8-7 6 7z" fill="#E53935"/><path d="M36 31l6-8 7 8z" fill="#6DBE45"/><path d="M27 31l4-8 5 8z" fill="#F57C00"/><ellipse cx="32" cy="27" rx="7" ry="5" fill="#fff"/><circle cx="32" cy="27" r="3" fill="#FFB300"/>',
  Thai: '<ellipse cx="32" cy="40" rx="27" ry="15" fill="#FFFFFF" stroke="#1E63B5" stroke-width="2"/><ellipse cx="32" cy="38" rx="20" ry="10" fill="#E8A25A"/><path d="M15 36q5-5 10 0t10 0 10 0 6-1M14 40q6-5 11 0t11 0 11 0 4-1M17 44q5-4 10 0t10 0 9-1" stroke="#F6C27A" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M20 31a5 5 0 1 1 7 3" stroke="#FF7A59" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M36 30a5 5 0 1 1 7 3" stroke="#FF7A59" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M28 40l3-2 2 2-3 2zM39 41l3-1 1 2-3 1zM24 44l2-1 1 2-2 1z" fill="#B5651D"/><path d="M44 46l10-8a8 8 0 0 1-10 8z" fill="#8BC34A" stroke="#558B2F" stroke-width="1.2"/><path d="M18 34l-6-10M22 33l-3-11" stroke="#F3EBC8" stroke-width="2" stroke-linecap="round"/><circle cx="33" cy="36" r="2" fill="#43A047"/><circle cx="26" cy="38" r="1.6" fill="#66BB6A"/>',
  Indian: '<path d="M20 14c-3 4 3 6 0 10M32 12c-3 4 3 6 0 10M44 14c-3 4 3 6 0 10" stroke="#B0BEC5" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M8 30h48a24 22 0 0 1-48 0z" fill="#B87333"/><ellipse cx="32" cy="30" rx="24" ry="5" fill="#F57C00"/><circle cx="25" cy="30" r="2.4" fill="#FFE0B2"/><circle cx="38" cy="29" r="2.4" fill="#FFE0B2"/><path d="M4 32h6M54 32h6" stroke="#8D5524" stroke-width="4" stroke-linecap="round"/>',
  Vietnamese: '<path d="M40 6 26 30M48 8 32 30" stroke="#8D6E63" stroke-width="3" stroke-linecap="round"/><path d="M8 32h48a24 21 0 0 1-48 0z" fill="#FAFAFA" stroke="#2E7D32" stroke-width="2"/><path d="M14 34q6 4 12 0t12 0 12 0" stroke="#F3E5AB" stroke-width="3" fill="none"/><circle cx="22" cy="31" r="3" fill="#66BB6A"/><circle cx="40" cy="31" r="3" fill="#EF5350"/>',
  Mediterranean: '<path d="M10 52C24 40 36 28 54 12" stroke="#6D4C41" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="38" rx="9" ry="4" transform="rotate(-50 20 38)" fill="#7CB342"/><ellipse cx="36" cy="27" rx="9" ry="4" transform="rotate(40 36 27)" fill="#7CB342"/><ellipse cx="46" cy="16" rx="8" ry="3.5" transform="rotate(-40 46 16)" fill="#9CCC65"/><ellipse cx="28" cy="40" rx="5" ry="6.5" fill="#4A2C5E"/><ellipse cx="42" cy="34" rx="5" ry="6.5" fill="#556B2F"/>',
  'Middle Eastern': '<path d="M6 40a26 22 0 0 1 52 0z" fill="#E9C58A"/><path d="M12 40c2-10 10-16 20-16s18 6 20 16" fill="#6DBE45"/><circle cx="22" cy="30" r="6" fill="#8D5A2B"/><circle cx="34" cy="27" r="6" fill="#A0652F"/><circle cx="44" cy="33" r="5.5" fill="#8D5A2B"/><path d="M6 40h52v4a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#D9AE6C"/>',
  French: '<path d="M8 40c2-12 12-20 24-20s22 8 24 20c-4 2-8 0-10-3l-4 6-4-8-6 8-6-8-4 8-4-6c-2 3-6 5-10 3z" fill="#E9A846"/><path d="M22 23l2 15M32 20v16M42 23l-2 15" stroke="#C47F22" stroke-width="2.5"/>',
  Greek: '<path d="M8 20 32 8l24 12z" fill="#FFFFFF" stroke="#1E63B5" stroke-width="2.5" stroke-linejoin="round"/><rect x="10" y="20" width="44" height="4" fill="#1E63B5"/><rect x="13" y="26" width="6" height="22" fill="#fff" stroke="#1E63B5" stroke-width="2"/><rect x="29" y="26" width="6" height="22" fill="#fff" stroke="#1E63B5" stroke-width="2"/><rect x="45" y="26" width="6" height="22" fill="#fff" stroke="#1E63B5" stroke-width="2"/><rect x="8" y="48" width="48" height="5" fill="#1E63B5"/>',
  Spanish: '<path d="M2 34h8M54 34h8" stroke="#263238" stroke-width="4" stroke-linecap="round"/><ellipse cx="32" cy="34" rx="24" ry="17" fill="#263238"/><ellipse cx="32" cy="33" rx="20" ry="13.5" fill="#FBC02D"/><path d="M20 30q4-6 8 0" stroke="#FF7043" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M36 37q4-6 8 0" stroke="#FF7043" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="31" cy="38" r="2.4" fill="#43A047"/><circle cx="40" cy="27" r="2.4" fill="#E53935"/><path d="M24 40l5-3 1 5z" fill="#FFF59D"/>',
  Caribbean: '<path d="M32 22c-6-8-4-14 0-18 4 4 6 10 0 18zM32 22c-9-4-12-10-10-15 6 1 11 6 10 15zM32 22c9-4 12-10 10-15-6 1-11 6-10 15z" fill="#43A047"/><ellipse cx="32" cy="40" rx="13" ry="17" fill="#FBC02D"/><path d="M22 32l20 16M22 44l18-14M26 52l14-24M38 52 24 28" stroke="#E0A800" stroke-width="1.6"/>',
  Cajun: '<rect x="27" y="6" width="10" height="8" rx="2" fill="#2E7D32"/><path d="M28 14h8v6c6 3 9 8 9 14v18a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4V34c0-6 3-11 9-14z" fill="#D32F2F"/><rect x="21" y="34" width="22" height="12" rx="2" fill="#FFF3E0"/><path d="M26 42c4-6 8-6 12-2" stroke="#D32F2F" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  Southern: '<path d="M26 40c-10-2-16-10-14-19 2-9 12-13 21-10 9 3 13 12 10 20-2 6-8 9-12 9z" fill="#C8782A"/><path d="M18 22c3-4 8-5 12-3M24 30c3-3 7-3 10-1" stroke="#9C5A1A" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 40l12 12" stroke="#FFF3E0" stroke-width="6" stroke-linecap="round"/><circle cx="44" cy="51" r="4" fill="#FFF3E0"/><circle cx="47" cy="47" r="4" fill="#FFF3E0"/>',
  Brazilian: '<circle cx="20" cy="40" r="11" fill="#F4C55C"/><circle cx="42" cy="40" r="11" fill="#EDB846"/><circle cx="31" cy="24" r="11" fill="#F7D37A"/><circle cx="17" cy="37" r="2" fill="#FFF2C7"/><circle cx="28" cy="21" r="2" fill="#FFF2C7"/><circle cx="39" cy="37" r="2" fill="#FFF2C7"/><path d="M10 54h44" stroke="#009C3B" stroke-width="4" stroke-linecap="round"/>',
  Ethiopian: '<path d="M30 24V10h6v14" fill="#6D4C41"/><path d="M36 14c8-2 14 2 16 8" stroke="#6D4C41" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="33" cy="40" r="16" fill="#3E2723"/><path d="M22 34q11 6 22 0" stroke="#FBC02D" stroke-width="2.5" fill="none"/><path d="M22 42q11 6 22 0" stroke="#43A047" stroke-width="2.5" fill="none"/><path d="M26 8h14" stroke="#4E342E" stroke-width="3" stroke-linecap="round"/>',
  British: '<path d="M14 26h32v12a16 16 0 0 1-32 0z" fill="#FFFFFF" stroke="#1E3A8A" stroke-width="2.5"/><path d="M46 30c8 0 8 10 0 10" stroke="#1E3A8A" stroke-width="3" fill="none"/><path d="M18 31h24" stroke="#C62828" stroke-width="3"/><ellipse cx="30" cy="54" rx="22" ry="4" fill="#E3E8F4" stroke="#1E3A8A" stroke-width="2"/><path d="M24 20c-2-3 2-5 0-8M32 20c-2-3 2-5 0-8" stroke="#B0BEC5" stroke-width="2" fill="none" stroke-linecap="round"/>'
};
const INK = { American: ['#2F6AE6', '#E53935'], Mexican: ['#2E9E44', '#E53935'], Italian: ['#2E9E44', '#E53935'], Chinese: ['#D32F2F', '#F4A100'], Japanese: ['#D32F2F', '#1F3A2B'], Korean: ['#1E63B5', '#D32F2F'], Thai: ['#1E63B5', '#D32F2F'], Indian: ['#F57C00', '#2E9E44'], Vietnamese: ['#D32F2F', '#E0A800'],
  Mediterranean: ['#1E63B5', '#6B8E23'], 'Middle Eastern': ['#B5651D', '#2E9E44'], French: ['#1E63B5', '#D32F2F'], Greek: ['#1E63B5', '#2F6AE6'], Spanish: ['#D32F2F', '#E0A800'], Caribbean: ['#00897B', '#F57C00'], Cajun: ['#7B1FA2', '#2E9E44'], Southern: ['#B5651D', '#D32F2F'], Brazilian: ['#009C3B', '#E0A800'], Ethiopian: ['#2E9E44', '#D32F2F'], British: ['#1E3A8A', '#C62828'] };

const TILT = [-6, 4, -2, 7, -4, 3];

export const STICKER_GOAL = 10;

// counts: Map of cuisine -> meals cooked. A sticker turns to full color after 10 of that cuisine.
export default function Passport({ counts }) {
  const done = CUISINES.filter((c) => (counts.get(c) || 0) >= STICKER_GOAL).length;
  return (
    <section className="notebook" aria-labelledby="pp-h">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 id="pp-h" style={{ fontSize: 26 }}>Cuisine passport</h2>
        <span className="count">{done}/20</span>
      </div>
      <div className="stickers">
        {CUISINES.map((c, i) => {
          const n = Math.min(counts.get(c) || 0, STICKER_GOAL); const on = n >= STICKER_GOAL; const [a, b] = INK[c];
          return (
            <div key={c} className={`sticker ${on ? '' : 'off'}`} style={{ transform: `rotate(${on ? TILT[i % 6] : 0}deg)` }} aria-label={`${c}, ${n} of ${STICKER_GOAL} cooked`}>
              <span className="art">
                <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[c] }} />
                <span className="word" style={{ fontSize: c.length > 12 ? 10.5 : c.length > 9 ? 12 : 15, letterSpacing: c.length > 12 ? '-.02em' : undefined }}>
                  {c.split('').map((ch, k) => <span key={k} style={{ color: k % 2 ? b : a }}>{ch}</span>)}
                </span>
                <span className="tally">{n}/{STICKER_GOAL}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="desc" style={{ margin: '12px 0 0' }}>Cook a cuisine 10 times to bring its sticker to full color.</p>
    </section>
  );
}
