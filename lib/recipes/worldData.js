import 'server-only';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';
import dishes from '@/lib/dishes/data.json';
import { expandWorld, worldIds } from './worldExpand';
import { adapt } from './never';

// Server side of Yoke's world recipes: loads one country's file the first time it's needed and keeps it.
const cache = new Map();
export async function worldCountry(iso) {
  iso = String(iso || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso) || !dishes[iso]) return null;
  if (cache.has(iso)) return cache.get(iso);
  let records;
  try { records = (await import(`./world/${iso}.json`)).default; } catch { return null; }
  const name = COUNTRY_BY_ISO[iso]?.[1] || iso;
  const ids = worldIds(iso, records);
  const out = records.map((r, i) => ({ ...expandWorld(iso, name, r, ids[i]), type: dishes[iso][i]?.[1] || null }));
  cache.set(iso, out);
  return out;
}
export async function worldRecipe(id) {
  const m = /^w-([a-z]{2})-/.exec(String(id || ''));
  if (!m) return null;
  const list = await worldCountry(m[1]);
  return list?.find((r) => r.id === id) || null;
}
// Every dish of one type (dessert, drink, ...) across the world as light rows, for Cook's picks. `never` = the
// player's Never show me list: dishes they can't have are left out, ones that need a swap say so (sw).
const typeCache = new Map();
export async function worldByType(type, never) {
  type = String(type || '').toLowerCase(); if (!/^[a-z ]{3,12}$/.test(type)) return [];
  if (!typeCache.has(type)) {
    const isos = Object.keys(dishes).filter((iso) => dishes[iso].some((d) => d[1] === type));
    const lists = await Promise.all(isos.map((iso) => worldCountry(iso)));
    typeCache.set(type, lists.flat().filter((r) => r && r.type === type));
  }
  return fitLite(typeCache.get(type), never);
}
/** Full recipes → light rows the player can have (with how many swaps each needs). */
export function fitLite(list, never) {
  if (!never || !never.length) return list.map(lite);
  const out = [];
  for (const r of list) { const a = adapt(r, never); if (a.ok) out.push(a.swaps.length ? { ...lite(r), sw: a.swaps.length } : lite(r)); }
  return out;
}
// Light rows for lists: no steps or ingredient amounts.
export const lite = (r) => ({ id: r.id, title: r.title, cuisine: r.cuisine, country: r.country, minutes: r.minutes, servings: r.servings, key: r.key, type: r.type });

// A varied handful for Home's Discover a Dish: one random dish from each of n random countries (seeded, so a new seed gives a new mix).
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export async function worldSample(n, seed, never) {
  const rand = rng(seed); const isos = Object.keys(dishes);
  for (let i = isos.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [isos[i], isos[j]] = [isos[j], isos[i]]; }
  const lists = await Promise.all(isos.slice(0, Math.max(1, Math.min(n, 120))).map((iso) => worldCountry(iso)));
  // one dish from each country, picked among the ones the player can have
  return lists.map((l) => fitLite(l || [], never)).filter((l) => l.length).map((l) => l[Math.floor(rand() * l.length)]);
}
