// Open a recipe the moment it's tapped. A world dish only arrives as a light row (title, picture, time); its full recipe is
// fetched from the server. If that's already here (warmed up early) the sheet opens complete; otherwise it opens at once
// with the picture and title and a placeholder body, and the real recipe drops in when it lands (never a blank wait).
export function openRecipe(r, { setOpen, ensureRecipes, peekRecipe, say }) {
  if (!r) return;
  if (r.steps || !/^w-/.test(r.id)) { setOpen(r); return; }
  const have = peekRecipe?.(r.id);
  if (have) { setOpen(have); return; }
  setOpen({ ...r, pending: true });
  // one quiet retry: a request that stalled (phone slept, network switched) gets a second go before we give up
  ensureRecipes([r.id]).then((list) => (list[0] ? list : ensureRecipes([r.id]))).then((list) => {
    const full = list[0];
    setOpen((cur) => (cur && cur.id === r.id ? (full || null) : cur));
    if (!full) say?.('That recipe isn’t ready yet. Try again in a moment.');
  });
}
// Start fetching ahead of the tap (touch-down, or a card scrolling into view).
export const warmRecipes = (ids, ensureRecipes) => { const w = (ids || []).filter((id) => /^w-[a-z]{2}-/.test(id)); if (w.length) ensureRecipes(w); };
