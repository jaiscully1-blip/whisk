'use client';
import { useEffect, useRef, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { readLines, prepareRecipePage, warmReceipts, closeReader } from '@/lib/scan/engine';
import { parseRecipeText } from '@/lib/recipes/parseText';

// Add your own recipe: photograph a recipe card or page (printed or neat handwriting), or type it in. The photo is read on
// your phone (nothing is uploaded and nothing costs anything). Reading is never perfect, so you always get to check and
// fix it first: lines the reader was unsure about are marked in amber.
const blank = () => ({ title: { text: '', low: false }, servings: '', minutes: '', ingredients: [{ text: '', low: false }], steps: [{ text: '', low: false }] });

async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { return await new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { ok(im); }; im.onerror = no; im.src = u; }); }
}

export default function RecipeImport({ edit = null, prefill = '', typed = false, draft = null, onClose, onSaved }) {
  const { supabase, say, ui, getUi } = useWhisk();
  const [nameDd, setNameDd] = useState(false);
  const [phase, setPhase] = useState(edit || typed || draft ? 'review' : 'start');   // start → reading → review
  const [pct, setPct] = useState(0);
  const [page, setPage] = useState([0, 0]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(() => (edit
    ? { title: { text: edit.title, low: false }, servings: edit.servings || '', minutes: edit.minutes || '', ingredients: edit.ingredients.map((g) => ({ text: typeof g === 'string' ? g : g.item, low: false })), steps: edit.steps.map((t) => ({ text: t, low: false })) }
    : draft ? { ...blank(), title: { text: prefill, low: false }, ingredients: (draft.ings || []).length ? draft.ings.map((text) => ({ text, low: false })) : [{ text: '', low: false }], steps: (draft.steps || []).length ? draft.steps.map((text) => ({ text, low: false })) : [{ text: '', low: false }] }
    : prefill ? { ...blank(), title: { text: prefill, low: false } } : blank()));
  const cam = useRef(null), pick = useRef(null);
  useEffect(() => { if (!edit) warmReceipts(); return () => { closeReader(); }; }, [edit]);

  async function read(files) {
    const list = [...files].slice(0, 6); if (!list.length) return;
    setPhase('reading'); setErr(''); setPct(0);
    try {
      const all = [];
      for (let i = 0; i < list.length; i++) {
        setPage([i + 1, list.length]);
        const src = await decode(list[i]);
        const lines = await readLines(prepareRecipePage(src), (p) => setPct(Math.round(((i + p) / list.length) * 100)));
        all.push(...lines);
      }
      if (!all.some((l) => /[A-Za-z]{3}/.test(l.text))) { setErr('I couldn’t find any text in that photo. Try again in good light, with the page flat and filling the picture.'); setPhase('start'); return; }
      const r = parseRecipeText(all);
      setF({ title: r.title?.text ? r.title : prefill ? { text: prefill, low: false } : r.title, servings: r.servings || '', minutes: r.minutes || '', ingredients: r.ingredients.length ? r.ingredients : [{ text: '', low: false }], steps: r.steps.length ? r.steps : [{ text: '', low: false }] });
      setPhase('review');
    } catch { setErr('Couldn’t read that photo. Try again, or type the recipe in.'); setPhase('start'); }
  }
  const setLine = (key, i, text) => setF((x) => ({ ...x, [key]: x[key].map((l, k) => (k === i ? { text, low: false } : l)) }));
  const delLine = (key, i) => setF((x) => ({ ...x, [key]: x[key].length > 1 ? x[key].filter((_, k) => k !== i) : [{ text: '', low: false }] }));
  const addLine = (key) => setF((x) => ({ ...x, [key]: [...x[key], { text: '', low: false }] }));
  const lowCount = [...f.ingredients, ...f.steps, f.title].filter((l) => l.low).length;

  async function save() {
    const ing = f.ingredients.map((l) => l.text.trim()).filter(Boolean), steps = f.steps.map((l) => l.text.trim()).filter(Boolean), title = f.title.text.trim();
    if (!title) { setErr('Give the recipe a name.'); return; }
    if (!ing.length) { setErr('Add at least one ingredient.'); return; }
    if (!steps.length) { setErr('Add at least one step.'); return; }
    setBusy(true); setErr('');
    const row = { title: title.slice(0, 120), servings: +f.servings > 0 ? Math.min(100, Math.round(+f.servings)) : null, minutes: +f.minutes > 0 ? Math.min(1440, Math.round(+f.minutes)) : null, ingredients: ing.map((t) => t.slice(0, 200)), steps: steps.map((t) => t.slice(0, 1000)) };
    const q = edit ? supabase.from('my_recipes').update(row).eq('id', edit.id).select('id').single() : supabase.from('my_recipes').insert(row).select('id').single();
    const { data, error } = await q; setBusy(false);
    if (error) { setErr(/100 of your own/.test(error.message) ? 'You can keep up to 100 of your own recipes. Delete one to add another.' : /my_recipes|42P01|PGRST205/.test(`${error.code} ${error.message}`) ? 'Saving your own recipes isn’t switched on yet. It needs the latest database update.' : 'Couldn’t save it. Try again.'); return; }
    say(edit ? 'Recipe updated' : `Saved ${row.title}`); onSaved?.(data?.id);
  }

  return (
    <div className="scrim" role="presentation" style={{ zIndex: 80 }} onClick={(e) => { if (e.target === e.currentTarget && phase !== 'reading') onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={edit ? 'Edit recipe' : 'Add a recipe'} data-testid="import-sheet">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <h2 style={{ fontSize: 26 }}>{edit ? 'Edit recipe' : phase === 'review' ? 'Check your recipe' : 'Add a recipe'}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        {phase === 'start' && (
          <>
            <p className="muted" style={{ margin: 0 }}>Photograph a recipe card, a cookbook page or a handwritten note.</p>
            <input ref={cam} type="file" accept="image/*" capture="environment" hidden data-testid="import-cam" onChange={(e) => { read(e.target.files); e.target.value = ''; }} />
            <input ref={pick} type="file" accept="image/*" multiple hidden data-testid="import-file" onChange={(e) => { read(e.target.files); e.target.value = ''; }} />
            <button type="button" className="btn wide" onClick={() => cam.current?.click()}><Icon name="camera" size={18} />Take a photo</button>
            <button type="button" className="btn ghost wide" onClick={() => pick.current?.click()} data-testid="import-pick"><Icon name="plus" size={18} />Choose photos</button>
            <button type="button" className="btn ghost wide" onClick={() => setPhase('review')} data-testid="import-type"><Icon name="pencil" size={18} />Type it</button>
          </>
        )}

        {phase === 'reading' && (
          <div className="stack" style={{ gap: 10 }} role="status" aria-live="polite" data-testid="import-reading">
            <b>Reading{page[1] > 1 ? ` page ${page[0]} of ${page[1]}` : ' your photo'}…</b>
            <div className="quiz-bar"><i style={{ width: `${pct}%` }} /></div>
            <span className="desc">This happens on your phone and can take up to a minute the first time.</span>
          </div>
        )}

        {phase === 'review' && (
          <>
            {lowCount > 0 && <p className="import-note" role="status" data-testid="import-low">{lowCount} {lowCount === 1 ? 'line is' : 'lines are'} marked in amber: the reader wasn’t sure of {lowCount === 1 ? 'it' : 'them'}. Please check {lowCount === 1 ? 'it' : 'them'}.</p>}
            <div style={{ position: 'relative' }}><label className="lbl" htmlFor="ri-title">Name</label><input id="ri-title" className={`input ${f.title.low ? 'low' : ''}`} maxLength={120} value={f.title.text} onChange={(e) => setF((x) => ({ ...x, title: { text: e.target.value, low: false } }))} onFocus={() => setNameDd(true)} onBlur={() => setTimeout(() => setNameDd(false), 150)} data-testid="ri-title" />
              {nameDd && !f.title.text.trim() && ((getUi?.() || ui)?.recentRecipes || []).length > 0 && (
                <div className="lm-dd" role="listbox" data-testid="ri-dd">
                  <span className="eyebrow" style={{ padding: '2px 4px' }}>Last opened</span>
                  {((getUi?.() || ui)?.recentRecipes || []).slice(0, 3).map((x) => <button key={x.id} type="button" role="option" className="lm-dd-item" data-testid="ri-dd-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { setF((y) => ({ ...y, title: { text: x.title, low: false } })); setNameDd(false); }}>{x.title}</button>)}
                </div>
              )}</div>
            <div className="grid2">
              <div><label className="lbl" htmlFor="ri-serv">Servings</label><input id="ri-serv" className="input" inputMode="numeric" maxLength={3} value={f.servings} onChange={(e) => setF((x) => ({ ...x, servings: e.target.value.replace(/\D/g, '') }))} placeholder="4" /></div>
              <div><label className="lbl" htmlFor="ri-min">Minutes</label><input id="ri-min" className="input" inputMode="numeric" maxLength={4} value={f.minutes} onChange={(e) => setF((x) => ({ ...x, minutes: e.target.value.replace(/\D/g, '') }))} placeholder="30" /></div>
            </div>
            <span className="lbl">Ingredients (one per line)</span>
            <div className="stack" style={{ gap: 6 }}>
              {f.ingredients.map((l, i) => (
                <div key={i} className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                  <input className={`input ${l.low ? 'low' : ''}`} aria-label={`Ingredient ${i + 1}`} maxLength={200} value={l.text} onChange={(e) => setLine('ingredients', i, e.target.value)} data-testid="ri-ing" />
                  <button type="button" className="btn ghost sm" aria-label={`Remove ingredient ${i + 1}`} onClick={() => delLine('ingredients', i)}><Icon name="x" size={16} /></button>
                </div>
              ))}
              <button type="button" className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => addLine('ingredients')}><Icon name="plus" size={16} />Add ingredient</button>
            </div>
            <span className="lbl">Steps (one per line)</span>
            <div className="stack" style={{ gap: 6 }}>
              {f.steps.map((l, i) => (
                <div key={i} className="row" style={{ flexWrap: 'nowrap', gap: 6, alignItems: 'flex-start' }}>
                  <b style={{ minWidth: 22, paddingTop: 10 }}>{i + 1}</b>
                  <textarea className={`input ${l.low ? 'low' : ''}`} rows={2} aria-label={`Step ${i + 1}`} maxLength={1000} value={l.text} onChange={(e) => setLine('steps', i, e.target.value)} data-testid="ri-step" />
                  <button type="button" className="btn ghost sm" aria-label={`Remove step ${i + 1}`} onClick={() => delLine('steps', i)}><Icon name="x" size={16} /></button>
                </div>
              ))}
              <button type="button" className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => addLine('steps')}><Icon name="plus" size={16} />Add step</button>
            </div>
            <button type="button" className="btn wide" onClick={save} disabled={busy} data-testid="ri-save">{busy ? 'Saving…' : edit ? 'Save changes' : 'Save recipe'}</button>
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    </div>
  );
}
