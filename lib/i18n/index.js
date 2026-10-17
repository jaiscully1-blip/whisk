import { D, ORDER } from './dict';

export const LANGS = [['en', 'English'], ['es', 'Español'], ['de', 'Deutsch'], ['pt', 'Português'], ['fr', 'Français'], ['zh', '中文']];
export const LANG_CODES = LANGS.map((l) => l[0]);

// the best starting language from the phone's own setting (only used until the player picks one)
export function guessLang(nav = '') {
  const c = String(nav || '').toLowerCase().slice(0, 2);
  return LANG_CODES.includes(c) ? c : 'en';
}

// t('Add friend') -> the text in the chosen language, or the English itself when there is no translation.
// {n}-style slots are filled from vars: t('Added {n}', { n: 3 })
export function translate(lang, text, vars) {
  let out = text;
  const row = lang && lang !== 'en' ? D[text] : null;
  const i = ORDER.indexOf(lang);
  if (row && i >= 0 && row[i]) out = row[i];
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return out;
}
